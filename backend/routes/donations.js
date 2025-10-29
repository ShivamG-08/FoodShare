const express = require("express");
const Donation = require("../models/Donation");
const Notification = require("../models/Notification");
const User = require("../models/User");

const router = express.Router();

// Test route
router.get('/test', (req, res) => {
  res.json({ message: 'Donations router is working!' });
});

router.post("/", async (req, res) => {
  try {
    const { userId, food, quantity, location, notes } = req.body;
    if (!userId || !food || !quantity || !location) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const donation = await Donation.create({ userId, food, quantity, location, notes });
    return res.status(201).json(donation);
  } catch (err) {
    console.error("Create donation error:", err);
    return res.status(500).json({ message: "Error creating donation" });
  }
});

// Get donations for a user
router.get("/", async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ message: "userId is required" });

    const donations = await Donation.find({ userId }).sort({ createdAt: -1 });
    return res.json(donations);
  } catch (err) {
    console.error("List donations error:", err);
    return res.status(500).json({ message: "Error fetching donations" });
  }
});

// Get available donations for receivers (pending status)
// Get all donations (admin only)
router.get("/all", async (req, res) => {
  try {
    const donations = await Donation.find()
      .sort({ createdAt: -1 })
      .populate({ path: "userId", select: "name email" })
      .populate({ path: "assignedTo", select: "name email" });
    return res.json(donations);
  } catch (err) {
    console.error("Get all donations error:", err);
    return res.status(500).json({ message: "Error fetching all donations" });
  }
});

// Get available donations for receivers (pending status)
router.get("/available", async (_req, res) => {
  try {
    const donations = await Donation.find({ status: "pending" })
      .sort({ createdAt: -1 })
      .populate({ path: "userId", select: "name email" });
    return res.json(
      donations.map((d) => ({
        _id: d._id,
        food: d.food,
        quantity: d.quantity,
        location: d.location,
        status: d.status,
        createdAt: d.createdAt,
        donor: d.userId ? { name: d.userId.name, email: d.userId.email, id: d.userId._id } : null,
      }))
    );
  } catch (err) {
    console.error("Available donations error:", err);
    return res.status(500).json({ message: "Error fetching available donations" });
  }
});

// Get donations assigned to a receiver (Connections)
router.get("/for-receiver", async (req, res) => {
  try {
    const { receiverId } = req.query;
    if (!receiverId) return res.status(400).json({ message: "receiverId is required" });
    const donations = await Donation.find({ assignedTo: receiverId })
      .sort({ updatedAt: -1 })
      .populate({ path: "userId", select: "name email" });
    return res.json(
      donations.map((d) => ({
        _id: d._id,
        food: d.food,
        quantity: d.quantity,
        location: d.location,
        status: d.status,
        createdAt: d.createdAt,
        updatedAt: d.updatedAt,
        receiverLocation: d.receiverLocation || null,
        receiverLocationUpdatedAt: d.receiverLocationUpdatedAt || null,
        donor: d.userId ? { name: d.userId.name, email: d.userId.email, id: d.userId._id } : null,
      }))
    );
  } catch (err) {
    console.error("Receiver donations error:", err);
    return res.status(500).json({ message: "Error fetching receiver donations" });
  }
});

// Accept a donation (assign to a receiver)
router.patch("/:id/accept", async (req, res) => {
  try {
    const { id } = req.params;
    const { receiverId, receiverLocation } = req.body;
    if (!receiverId) return res.status(400).json({ message: "receiverId is required" });

    const updateSet = { status: "assigned", assignedTo: receiverId };
    if (receiverLocation) {
      updateSet.receiverLocation = receiverLocation;
      updateSet.receiverLocationUpdatedAt = new Date();
    }
    const updated = await Donation.findOneAndUpdate(
      { _id: id, status: "pending" },
      { $set: updateSet },
      { new: true }
    );

    if (!updated) {
      return res.status(409).json({ message: "Donation not available or already assigned" });
    }

    // Create notification for donor (include receiver details)
    try {
      const receiver = await User.findById(receiverId).select("name email");
      await Notification.create({
        toUserId: updated.userId,
        type: "donation_accepted",
        title: "Donation accepted",
        message: `Your donation '${updated.food}' has been accepted by ${receiver?.name || 'a receiver'}.`,
        meta: {
          donationId: updated._id,
          receiverId,
          receiver: receiver
            ? { id: receiver._id, name: receiver.name, email: receiver.email, location: receiverLocation || undefined }
            : { id: receiverId, location: receiverLocation || undefined }
        },
      });
    } catch (e) {
      console.error("Create notification (accept) error:", e);
    }

    return res.json(updated);
  } catch (err) {
    console.error("Accept donation error:", err);
    return res.status(500).json({ message: "Error accepting donation" });
  }
});

// Update receiver live location for a specific donation
router.patch("/:id/location", async (req, res) => {
  try {
    const { id } = req.params;
    const { receiverId, receiverLocation } = req.body;
    if (!receiverId || !receiverLocation) return res.status(400).json({ message: "receiverId and receiverLocation are required" });

    // Only allow update if this receiver is assigned on this donation
    const updated = await Donation.findOneAndUpdate(
      { _id: id, assignedTo: receiverId },
      { $set: { receiverLocation, receiverLocationUpdatedAt: new Date() } },
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: "Donation not found or not assigned to this receiver" });
    return res.json({ ok: true });
  } catch (err) {
    console.error("Update receiver location error:", err);
    return res.status(500).json({ message: "Error updating receiver location" });
  }
});

// Mark a donation as received/completed by receiver
router.patch("/:id/received", async (req, res) => {
  try {
    const { id } = req.params;
    const { receiverId } = req.body;
    if (!receiverId) return res.status(400).json({ message: "receiverId is required" });

    const updated = await Donation.findOneAndUpdate(
      { _id: id, status: { $in: ["assigned", "picked_up"] } },
      { $set: { status: "completed" } },
      { new: true }
    );

    if (!updated) {
      return res.status(409).json({ message: "Donation not in a receivable state" });
    }

    // Create notification for donor (userId is donor) with receiver details
    try {
      const receiver = await User.findById(receiverId).select("name email");
      await Notification.create({
        toUserId: updated.userId,
        type: "donation_received",
        title: "Donation received",
        message: `Your donation '${updated.food}' has been received by ${receiver?.name || 'the receiver'}. Thank you!`,
        meta: { donationId: updated._id, receiverId, receiver: receiver ? { id: receiver._id, name: receiver.name, email: receiver.email } : { id: receiverId } },
      });
    } catch (e) {
      console.error("Create notification error:", e);
      // do not fail the main request due to notification error
    }

    return res.json(updated);
  } catch (err) {
    console.error("Mark received error:", err);
    return res.status(500).json({ message: "Error marking donation as received" });
  }
});

module.exports = router;

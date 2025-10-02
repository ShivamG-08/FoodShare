const express = require("express");
const Donation = require("../models/Donation");
const Notification = require("../models/Notification");
const User = require("../models/User");

const router = express.Router();

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

// Accept a donation (assign to a receiver)
router.patch("/:id/accept", async (req, res) => {
  try {
    const { id } = req.params;
    const { receiverId } = req.body;
    if (!receiverId) return res.status(400).json({ message: "receiverId is required" });

    const updated = await Donation.findOneAndUpdate(
      { _id: id, status: "pending" },
      { $set: { status: "assigned", assignedTo: receiverId } },
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
        meta: { donationId: updated._id, receiverId, receiver: receiver ? { id: receiver._id, name: receiver.name, email: receiver.email } : { id: receiverId } },
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

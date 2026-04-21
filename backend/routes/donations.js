const express = require("express");
const Donation = require("../models/Donation");
const Notification = require("../models/Notification");
const User = require("../models/User");
const Task = require("../models/Task");

const router = express.Router();

// Test route
router.get('/test', (req, res) => {
  res.json({ message: 'Donations router is working!' });
});

router.post("/", async (req, res) => {
  try {
    const { userId, food, quantity, location, notes, latitude, longitude } = req.body;
    if (!userId || !food || !quantity || !location) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const donation = await Donation.create({ 
      userId, 
      food, 
      quantity, 
      location, 
      notes,
      latitude: latitude || null,
      longitude: longitude || null
    });
    
    // Send email notifications to receivers and volunteers
    try {
      // Get donor details
      const donor = await User.findById(userId).select('name email');
      
      // Get all receivers and volunteers to notify
      const usersToNotify = await User.find({
        role: { $in: ['receiver', 'volunteer'] },
        status: 'approved'
      }).select('email');
      
      if (usersToNotify.length > 0 && donor) {
        const { sendEmail } = require("../utils/sendEmail");
        const recipientEmails = usersToNotify.map(user => user.email);
        
        const emailData = {
          foodType: food,
          quantity: quantity,
          location: location,
          donorName: donor.name,
          donorEmail: donor.email,
          timestamp: new Date().toLocaleString(),
          loginUrl: 'http://localhost:3000/login'
        };
        
        // Send email to all recipients (non-blocking)
        sendEmail(recipientEmails, 'newDonation', emailData).catch(emailError => {
          console.error('Failed to send donation notification emails:', emailError);
        });
        
        console.log(`📧 Donation notification sent to ${recipientEmails.length} users`);
      }
    } catch (emailError) {
      console.error('Error sending donation notifications:', emailError);
      // Continue with response even if email fails
    }
    
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

// Get available donations (pending, not assigned to any receiver)
router.get("/available", async (req, res) => {
  try {
    const donations = await Donation.find({ status: "pending", assignedTo: { $eq: null } })
      .sort({ createdAt: -1 })
      .populate("userId", "name email");

    return res.json(
      donations.map((d) => ({
        _id: d._id,
        food: d.food,
        quantity: d.quantity,
        location: d.location,
        latitude: d.latitude,
        longitude: d.longitude,
        notes: d.notes,
        status: d.status,
        assignedTo: d.assignedTo,
        createdAt: d.createdAt,
        donor: d.userId ? { name: d.userId.name, email: d.userId.email, id: d.userId._id } : null,
      }))
    );
  } catch (err) {
    console.error("Get available donations error:", err);
    return res.status(500).json({ message: "Error fetching available donations" });
  }
});

// Accept a donation (assign to a receiver)
router.patch("/:id/accept", async (req, res) => {
  try {
    const { id } = req.params;
    const { receiverId, receiverLocation } = req.body;
    if (!receiverId) return res.status(400).json({ message: "receiverId is required" });

    const updated = await Donation.findOneAndUpdate(
      { _id: id, status: "pending", assignedTo: { $eq: null } },
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

    // Auto-create a delivery task for volunteers
    try {
      const existingTask = await Task.findOne({ donation: updated._id });
      if (!existingTask) {
        const receiver = await User.findById(receiverId).select("name email address latitude longitude");
        const task = new Task({
          donor: updated.userId,
          receiver: receiverId,
          donation: updated._id,
          pickupAddress: updated.location,
          deliveryAddress: receiverLocation || receiver?.address || 'Address not provided',
          pickupCoordinates: {
            latitude: updated.latitude || null,
            longitude: updated.longitude || null,
          },
          deliveryCoordinates: {
            latitude: receiver?.latitude || null,
            longitude: receiver?.longitude || null,
          },
          priority: 'medium',
          status: 'pending',
        });
        await task.save();
        console.log(`Auto-created task ${task._id} for donation ${updated._id}`);
      }
    } catch (e) {
      console.error("Auto-create task error:", e);
      // do not fail the main request
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

    // Also mark the associated task as delivered
    try {
      await Task.findOneAndUpdate(
        { donation: updated._id },
        { $set: { status: "delivered", deliveredAt: new Date(), actualDeliveryTime: new Date() } }
      );
    } catch (e) {
      console.error("Update task on received error:", e);
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

// Volunteer accepts a donation task
router.post("/:id/accept", async (req, res) => {
  try {
    const { id } = req.params;
    const { volunteerId } = req.body;
    console.log("Accept donation request:", { id, volunteerId });
    
    if (!volunteerId) {
      console.log("Missing volunteerId");
      return res.status(400).json({ message: "volunteerId is required" });
    }

    // Verify user is a volunteer
    const volunteer = await User.findById(volunteerId);
    console.log("Volunteer found:", volunteer);
    
    if (!volunteer || volunteer.role !== "volunteer") {
      console.log("User is not a volunteer or not found");
      return res.status(403).json({ message: "Only volunteers can accept donation tasks" });
    }

    // Check if donation exists and is pending
    const donation = await Donation.findById(id);
    console.log("Donation found:", donation);
    
    if (!donation) {
      console.log("Donation not found");
      return res.status(404).json({ message: "Donation not found" });
    }
    
    if (donation.status !== "pending") {
      console.log("Donation not pending, current status:", donation.status);
      return res.status(409).json({ message: "Donation not available or already assigned" });
    }

    const updated = await Donation.findOneAndUpdate(
      { _id: id, status: "pending" },
      { $set: { status: "assigned", assignedTo: volunteerId } },
      { new: true }
    ).populate("userId", "name email");

    console.log("Updated donation:", updated);

    if (!updated) {
      console.log("Failed to update donation");
      return res.status(409).json({ message: "Donation not available or already assigned" });
    }

    // Create notification for donor
    try {
      await Notification.create({
        toUserId: updated.userId,
        type: "donation_assigned",
        title: "Donation assigned to volunteer",
        message: `Your donation '${updated.food}' has been assigned to volunteer ${volunteer.name}.`,
        meta: {
          donationId: updated._id,
          volunteerId,
          volunteer: { id: volunteer._id, name: volunteer.name, email: volunteer.email }
        },
      });
    } catch (e) {
      console.error("Create notification (volunteer accept) error:", e);
    }

    return res.json(updated);
  } catch (err) {
    console.error("Volunteer accept donation error:", err);
    return res.status(500).json({ message: "Error accepting donation task" });
  }
});

// Volunteer updates delivery status
router.put("/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { volunteerId, status } = req.body;
    
    if (!volunteerId) return res.status(400).json({ message: "volunteerId is required" });
    if (!status || !["picked_up", "in_transit", "delivered"].includes(status)) {
      return res.status(400).json({ message: "Invalid status. Must be: picked_up, in_transit, or delivered" });
    }

    // Verify user is a volunteer
    const volunteer = await User.findById(volunteerId);
    if (!volunteer || volunteer.role !== "volunteer") {
      return res.status(403).json({ message: "Only volunteers can update delivery status" });
    }

    // Map frontend status to backend status
    const statusMap = {
      "picked_up": "picked_up",
      "in_transit": "picked_up", // Keep as picked_up in backend, but track in_transit in notification
      "delivered": "completed"
    };

    const backendStatus = statusMap[status];

    const updated = await Donation.findOneAndUpdate(
      { _id: id, assignedTo: volunteerId },
      { $set: { status: backendStatus } },
      { new: true }
    ).populate("userId", "name email");

    if (!updated) {
      return res.status(409).json({ message: "Donation not found or not assigned to this volunteer" });
    }

    // Create notification for donor
    try {
      let message = "";
      if (status === "picked_up") {
        message = `Volunteer ${volunteer.name} has picked up your donation '${updated.food}'.`;
      } else if (status === "in_transit") {
        message = `Volunteer ${volunteer.name} is in transit with your donation '${updated.food}'.`;
      } else if (status === "delivered") {
        message = `Volunteer ${volunteer.name} has delivered your donation '${updated.food}'. Thank you!`;
      }

      await Notification.create({
        toUserId: updated.userId,
        type: "delivery_update",
        title: `Delivery ${status.replace("_", " ")}`,
        message,
        meta: {
          donationId: updated._id,
          volunteerId,
          volunteer: { id: volunteer._id, name: volunteer.name, email: volunteer.email },
          status
        },
      });
    } catch (e) {
      console.error("Create notification (status update) error:", e);
    }

    return res.json(updated);
  } catch (err) {
    console.error("Update delivery status error:", err);
    return res.status(500).json({ message: "Error updating delivery status" });
  }
});

// Get donations assigned to a specific volunteer
router.get("/volunteer/:volunteerId", async (req, res) => {
  try {
    const { volunteerId } = req.params;
    
    // Verify user is a volunteer
    const volunteer = await User.findById(volunteerId);
    if (!volunteer || volunteer.role !== "volunteer") {
      return res.status(403).json({ message: "Access denied" });
    }

    const donations = await Donation.find({ assignedTo: volunteerId })
      .sort({ createdAt: -1 })
      .populate("userId", "name email");
    
    return res.json(
      donations.map((d) => ({
        _id: d._id,
        food: d.food,
        quantity: d.quantity,
        location: d.location,
        latitude: d.latitude,
        longitude: d.longitude,
        status: d.status,
        createdAt: d.createdAt,
        notes: d.notes,
        assignedTo: d.assignedTo,
        donor: d.userId ? { name: d.userId.name, email: d.userId.email, id: d.userId._id } : null,
      }))
    );
  } catch (err) {
    console.error("Get volunteer donations error:", err);
    return res.status(500).json({ message: "Error fetching volunteer donations" });
  }
});

// Get donations assigned to a specific receiver (with task status)
router.get("/receiver/:receiverId", async (req, res) => {
  try {
    const { receiverId } = req.params;

    const donations = await Donation.find({ assignedTo: receiverId })
      .sort({ createdAt: -1 })
      .populate("userId", "name email");

    // Enrich with task status
    const enriched = await Promise.all(
      donations.map(async (d) => {
        const task = await Task.findOne({ donation: d._id }).select("status volunteer").populate("volunteer", "name email");
        return {
          _id: d._id,
          food: d.food,
          quantity: d.quantity,
          location: d.location,
          latitude: d.latitude,
          longitude: d.longitude,
          status: d.status,
          createdAt: d.createdAt,
          notes: d.notes,
          assignedTo: d.assignedTo,
          donor: d.userId ? { name: d.userId.name, email: d.userId.email, id: d.userId._id } : null,
          taskStatus: task ? task.status : null,
          volunteer: task?.volunteer ? { name: task.volunteer.name, email: task.volunteer.email, id: task.volunteer._id } : null,
        };
      })
    );

    return res.json(enriched);
  } catch (err) {
    console.error("Get receiver donations error:", err);
    return res.status(500).json({ message: "Error fetching receiver donations" });
  }
});

module.exports = router;

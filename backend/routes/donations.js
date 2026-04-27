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
        latitude: d.latitude,
        longitude: d.longitude,
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
    const { receiverId, receiverLocation } = req.body;
    if (!receiverId) return res.status(400).json({ message: "receiverId is required" });

    const updated = await Donation.findOneAndUpdate(
      { _id: id, status: "pending" },
      { $set: { status: "accepted", assignedTo: receiverId } },
      { new: true }
    );

    if (!updated) {
      return res.status(409).json({ message: "Donation not available or already assigned" });
    }

    // Create a task for volunteer assignment
    try {
      const Task = require('../models/Task');
      const { sendTaskNotification } = require('../services/socketService');
      const { sendTaskEmail } = require('../utils/emailService');
      
      // Get receiver details
      const receiver = await User.findById(receiverId).select("name email latitude longitude location");
      
      // Create task
      const task = new Task({
        donor: updated.userId,
        receiver: receiverId,
        donation: updated._id,
        status: "pending",
        pickupAddress: updated.location || "Donor location",
        deliveryAddress: receiverLocation || receiver.location || "Receiver location",
        pickupCoordinates: {
          latitude: updated.latitude,
          longitude: updated.longitude
        },
        deliveryCoordinates: {
          latitude: receiver.latitude,
          longitude: receiver.longitude
        },
        priority: determineTaskPriority(updated),
        estimatedDeliveryTime: new Date(Date.now() + 2 * 60 * 60 * 1000) // 2 hours from now
      });

      await task.save();
      console.log("Task created successfully:", task._id);

      // Emit real-time event to all volunteers
      sendTaskNotification(task);

      // Send email notifications to volunteers
      await sendTaskEmail(task);

      // Create notification for donor
      await Notification.create({
        toUserId: updated.userId,
        type: "donation_accepted",
        title: "Donation accepted",
        message: `Your donation '${updated.food}' has been accepted by ${receiver?.name || 'a receiver'}. A delivery task has been created for volunteers.`,
        meta: {
          donationId: updated._id,
          receiverId,
          taskId: task._id,
          receiver: receiver
            ? { id: receiver._id, name: receiver.name, email: receiver.email, location: receiverLocation || undefined }
            : { id: receiverId, location: receiverLocation || undefined }
        },
      });

      // Create notification for receiver
      await Notification.create({
        toUserId: receiverId,
        type: "task_created",
        title: "Delivery Task Created",
        message: `A delivery task has been created for: ${updated.food}. A volunteer will be assigned to deliver it to you.`,
        meta: {
          donationId: updated._id,
          taskId: task._id,
          donorId: updated.userId
        }
      });

      // Return updated donation with task info
      const result = {
        ...updated.toObject(),
        task: {
          id: task._id,
          status: task.status,
          priority: task.priority,
          estimatedDeliveryTime: task.estimatedDeliveryTime
        }
      };

      return res.json(result);

    } catch (taskError) {
      console.error("Error creating task:", taskError);
      // Still return donation update, but log task error
      return res.json(updated);
    }

  } catch (err) {
    console.error("Accept donation error:", err);
    return res.status(500).json({ message: "Error accepting donation" });
  }
});

// Helper function to determine task priority
function determineTaskPriority(donation) {
  const highPriorityFoods = ['milk', 'dairy', 'meat', 'fish', 'cooked', 'perishable'];
  const foodLower = donation.food?.toLowerCase() || '';
  
  if (highPriorityFoods.some(food => foodLower.includes(food))) {
    return 'high';
  }
  
  if (foodLower.includes('vegetable') || foodLower.includes('fruit')) {
    return 'medium';
  }
  
  return 'low';
}

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

// Volunteer accepts a task (updated to work with task system)
router.post("/:id/accept", async (req, res) => {
  try {
    const { id } = req.params;
    const { volunteerId } = req.body;
    console.log("Accept task request:", { id, volunteerId });
    
    if (!volunteerId) {
      console.log("Missing volunteerId");
      return res.status(400).json({ message: "volunteerId is required" });
    }

    // Verify user is a volunteer
    const volunteer = await User.findById(volunteerId);
    console.log("Volunteer found:", volunteer);
    
    if (!volunteer || volunteer.role !== "volunteer") {
      console.log("User is not a volunteer or not found");
      return res.status(403).json({ message: "Only volunteers can accept tasks" });
    }

    // Find and accept the task
    const Task = require('../models/Task');
    const { sendTaskStatusUpdate } = require('../services/socketService');
    
    const task = await Task.findOneAndUpdate(
      { _id: id, status: "pending" },
      { 
        $set: { 
          status: "accepted", 
          volunteer: volunteerId,
          acceptedAt: new Date()
        }
      },
      { new: true }
    ).populate('donor receiver donation');

    if (!task) {
      console.log("Task not found or not pending");
      return res.status(409).json({ message: "Task not available or already assigned" });
    }

    console.log("Task accepted successfully:", task._id);

    // Update donation status
    await Donation.findByIdAndUpdate(task.donation._id, { 
      status: "assigned",
      assignedTo: volunteerId 
    });

    // Create notifications for donor and receiver
    try {
      // Donor notification
      await Notification.create({
        toUserId: task.donor._id,
        type: "task_volunteer_assigned",
        title: "Volunteer Assigned",
        message: `${volunteer.name} has been assigned to deliver your donation: ${task.donation.food}.`,
        meta: {
          taskId: task._id,
          volunteerId: volunteerId,
          volunteer: {
            id: volunteer._id,
            name: volunteer.name,
            email: volunteer.email,
            phone: volunteer.phone,
            profileImageUrl: volunteer.profileImageUrl
          }
        },
      });

      // Receiver notification
      await Notification.create({
        toUserId: task.receiver._id,
        type: "task_volunteer_assigned",
        title: "Volunteer Assigned",
        message: `${volunteer.name} has been assigned to deliver your items.`,
        meta: {
          taskId: task._id,
          volunteerId: volunteerId,
          volunteer: {
            id: volunteer._id,
            name: volunteer.name,
            email: volunteer.email,
            phone: volunteer.phone,
            profileImageUrl: volunteer.profileImageUrl
          }
        },
      });

      // Emit real-time events
      await sendTaskStatusUpdate(task._id, 'accepted', [task.donor._id, task.receiver._id]);

    } catch (notificationError) {
      console.error("Error creating notifications:", notificationError);
    }

    // Return updated task with volunteer details
    const result = {
      task: {
        ...task.toObject(),
        volunteer: {
          id: volunteer._id,
          name: volunteer.name,
          email: volunteer.email,
          phone: volunteer.phone,
          profileImageUrl: volunteer.profileImageUrl
        }
      },
      donation: task.donation
    };

    return res.json(result);

  } catch (err) {
    console.error("Accept task error:", err);
    return res.status(500).json({ message: "Error accepting task" });
  }
});

// Volunteer updates delivery status (updated to work with task system)
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

    // Find and update the task
    const Task = require('../models/Task');
    const { sendTaskStatusUpdate } = require('../services/socketService');
    
    const task = await Task.findOneAndUpdate(
      { _id: id, volunteer: volunteerId },
      { 
        $set: { 
          status: status === "delivered" ? "delivered" : status,
          ...(status === "picked_up" && { pickedUpAt: new Date() }),
          ...(status === "delivered" && { deliveredAt: new Date() })
        }
      },
      { new: true }
    ).populate('donor receiver donation');

    if (!task) {
      return res.status(409).json({ message: "Task not found or not assigned to this volunteer" });
    }

    // Update donation status accordingly
    const donationStatusMap = {
      "picked_up": "picked_up",
      "in_transit": "picked_up",
      "delivered": "completed"
    };

    await Donation.findByIdAndUpdate(task.donation._id, { 
      status: donationStatusMap[status] 
    });

    // Create notifications for donor and receiver
    try {
      let message = "";
      if (status === "picked_up") {
        message = `Volunteer ${volunteer.name} has picked up your donation '${task.donation.food}'.`;
      } else if (status === "in_transit") {
        message = `Volunteer ${volunteer.name} is in transit with your donation '${task.donation.food}'.`;
      } else if (status === "delivered") {
        message = `Volunteer ${volunteer.name} has delivered your donation '${task.donation.food}'. Thank you!`;
      }

      // Donor notification
      await Notification.create({
        toUserId: task.donor._id,
        type: "delivery_update",
        title: `Delivery ${status.replace("_", " ")}`,
        message,
        meta: {
          taskId: task._id,
          donationId: task.donation._id,
          volunteerId,
          volunteer: { id: volunteer._id, name: volunteer.name, email: volunteer.email },
          status
        },
      });

      // Receiver notification
      await Notification.create({
        toUserId: task.receiver._id,
        type: "delivery_update",
        title: `Delivery ${status.replace("_", " ")}`,
        message,
        meta: {
          taskId: task._id,
          donationId: task.donation._id,
          volunteerId,
          volunteer: { id: volunteer._id, name: volunteer.name, email: volunteer.email },
          status
        },
      });

      // Emit real-time events
      await sendTaskStatusUpdate(task._id, status, [task.donor._id, task.receiver._id]);

    } catch (notificationError) {
      console.error("Create notification error:", notificationError);
    }

    return res.json({
      task: {
        ...task.toObject(),
        volunteer: {
          id: volunteer._id,
          name: volunteer.name,
          email: volunteer.email,
          phone: volunteer.phone,
          profileImageUrl: volunteer.profileImageUrl
        }
      },
      donation: task.donation,
      status
    });

  } catch (err) {
    console.error("Update delivery status error:", err);
    return res.status(500).json({ message: "Error updating delivery status" });
  }
});

// Receiver confirms food received (completes the task)
router.patch("/:id/receive-food", async (req, res) => {
  try {
    const { id } = req.params;
    const { receiverId, rating, feedback } = req.body;
    
    if (!receiverId) return res.status(400).json({ message: "receiverId is required" });

    // Find and update the task
    const Task = require('../models/Task');
    const { sendTaskStatusUpdate } = require('../services/socketService');
    const { updateVolunteerPerformance } = require('../services/volunteerAssignmentService');
    
    const task = await Task.findOneAndUpdate(
      { _id: id, receiver: receiverId, status: "delivered" },
      { 
        $set: { 
          status: "completed",
          completedAt: new Date(),
          ...(rating && { volunteerRating: rating }),
          ...(feedback && { receiverFeedback: feedback })
        }
      },
      { new: true }
    ).populate('donor receiver donation volunteer');

    if (!task) {
      return res.status(409).json({ message: "Task not found or not ready for completion" });
    }

    console.log("Task completed successfully:", task._id);

    // Update donation status to completed
    await Donation.findByIdAndUpdate(task.donation._id, { 
      status: "completed" 
    });

    // Update volunteer performance
    if (task.volunteer) {
      const responseTime = task.acceptedAt ? 
        Math.round((task.pickedUpAt || new Date() - task.acceptedAt) / (1000 * 60)) : 0;
      
      const deliveryTime = task.acceptedAt ? 
        Math.round((new Date() - task.acceptedAt) / (1000 * 60)) : 0;
      
      await updateVolunteerPerformance(task.volunteer._id, task, responseTime, deliveryTime);
    }

    // Create notifications for all parties
    try {
      // Donor notification
      await Notification.create({
        toUserId: task.donor._id,
        type: "task_completed",
        title: "Delivery Completed",
        message: `Your donation '${task.donation.food}' has been successfully delivered to ${task.receiver.name}. Thank you for your contribution!`,
        meta: {
          taskId: task._id,
          donationId: task.donation._id,
          receiverId: task.receiver._id,
          volunteerId: task.volunteer?._id
        },
      });

      // Receiver notification
      await Notification.create({
        toUserId: task.receiver._id,
        type: "task_completed",
        title: "Delivery Completed",
        message: `You have successfully received your items. Thank you for using FoodShare!`,
        meta: {
          taskId: task._id,
          donationId: task.donation._id,
          donorId: task.donor._id,
          volunteerId: task.volunteer?._id
        },
      });

      // Volunteer notification
      if (task.volunteer) {
        await Notification.create({
          toUserId: task.volunteer._id,
          type: "task_completed",
          title: "Delivery Completed",
          message: `Great job! You have successfully completed the delivery for ${task.donation.food}.`,
          meta: {
            taskId: task._id,
            donationId: task.donation._id,
            rating: rating || null,
            feedback: feedback || null
          },
        });
      }

      // Emit real-time events
      const notificationTargets = [task.donor._id, task.receiver._id];
      if (task.volunteer) {
        notificationTargets.push(task.volunteer._id);
      }
      
      await sendTaskStatusUpdate(task._id, 'completed', notificationTargets);

    } catch (notificationError) {
      console.error("Error creating completion notifications:", notificationError);
    }

    return res.json({
      task: {
        ...task.toObject(),
        volunteer: task.volunteer ? {
          id: task.volunteer._id,
          name: task.volunteer.name,
          email: task.volunteer.email,
          rating: task.volunteer.volunteerPerformance?.rating || 5.0
        } : null
      },
      donation: task.donation,
      message: "Food received successfully. Task completed!"
    });

  } catch (err) {
    console.error("Receive food error:", err);
    return res.status(500).json({ message: "Error confirming food receipt" });
  }
});

// Get receiver's connections (accepted donations with task details)
router.get("/receiver/:receiverId/connections", async (req, res) => {
  try {
    const { receiverId } = req.params;
    
    if (!receiverId) {
      return res.status(400).json({ message: "receiverId is required" });
    }

    // Find all donations where receiverId matches and status is accepted or higher
    const donations = await Donation.find({ 
      assignedTo: receiverId,
      status: { $in: ["accepted", "assigned", "picked_up", "completed"] }
    })
    .populate('userId', 'name email phone profileImageUrl')
    .sort({ createdAt: -1 });

    // Get task details for each donation
    const Task = require('../models/Task');
    const connections = await Promise.all(
      donations.map(async (donation) => {
        const task = await Task.findOne({ donation: donation._id })
          .populate('donor', 'name email phone profileImageUrl')
          .populate('receiver', 'name email phone profileImageUrl')
          .populate('volunteer', 'name email phone profileImageUrl');

        return {
          _id: donation._id,
          donation: {
            _id: donation._id,
            food: donation.food,
            quantity: donation.quantity,
            location: donation.location,
            createdAt: donation.createdAt,
            status: donation.status
          },
          task: task ? {
            _id: task._id,
            status: task.status,
            priority: task.priority,
            pickupAddress: task.pickupAddress,
            deliveryAddress: task.deliveryAddress,
            acceptedAt: task.acceptedAt,
            pickedUpAt: task.pickedUpAt,
            deliveredAt: task.deliveredAt,
            completedAt: task.completedAt,
            volunteer: task.volunteer,
            donor: task.donor,
            receiver: task.receiver
          } : null
        };
      })
    );

    return res.json(connections);

  } catch (err) {
    console.error("Get receiver connections error:", err);
    return res.status(500).json({ message: "Error fetching receiver connections" });
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

module.exports = router;

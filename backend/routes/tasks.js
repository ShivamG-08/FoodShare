const express = require('express');
const Task = require('../models/Task');
const User = require('../models/User');
const Donation = require('../models/Donation');
const Notification = require('../models/Notification');
const { sendTaskNotification, sendTaskStatusUpdate } = require('../services/socketService');
const { sendTaskEmail } = require('../utils/emailService');
const { autoAssignTask } = require('../services/volunteerAssignmentService');

const router = express.Router();

// Create a new task (when receiver accepts donation)
router.post('/create', async (req, res) => {
  try {
    const { donationId, receiverId } = req.body;
    
    if (!donationId || !receiverId) {
      return res.status(400).json({ message: 'Donation ID and Receiver ID are required' });
    }

    // Get donation details
    const donation = await Donation.findById(donationId).populate('userId', 'name email');
    if (!donation) {
      return res.status(404).json({ message: 'Donation not found' });
    }

    // Get receiver details
    const receiver = await User.findById(receiverId);
    if (!receiver || receiver.role !== 'receiver') {
      return res.status(404).json({ message: 'Receiver not found' });
    }

    // Check if task already exists for this donation
    const existingTask = await Task.findOne({ donation: donationId });
    if (existingTask) {
      return res.status(409).json({ message: 'Task already exists for this donation' });
    }

    // Create new task
    const task = new Task({
      donor: donation.userId._id,
      receiver: receiverId,
      donation: donationId,
      pickupAddress: donation.location,
      deliveryAddress: receiver.address || 'Address not provided',
      pickupCoordinates: {
        latitude: donation.latitude,
        longitude: donation.longitude
      },
      deliveryCoordinates: {
        latitude: receiver.latitude,
        longitude: receiver.longitude
      },
      priority: determinePriority(donation)
    });

    await task.save();

    // Auto-assign task to best volunteer
    console.log('Starting auto-assignment for task:', task._id);
    const assignmentResult = await autoAssignTask(task);

    if (assignmentResult.success) {
      // Task was successfully assigned
      console.log('Task auto-assigned to volunteer:', assignmentResult.assignedVolunteer.name);
      
      // Update donation status to assigned
      await Donation.findByIdAndUpdate(donationId, { 
        status: 'assigned',
        assignedTo: assignmentResult.assignedVolunteer._id
      });

      res.status(201).json({
        message: 'Task created and auto-assigned successfully',
        task: assignmentResult.task,
        assignedVolunteer: assignmentResult.assignedVolunteer,
        assignmentScore: assignmentResult.score,
        autoAssigned: true
      });
    } else {
      // No volunteers available, fall back to manual assignment
      console.log('Auto-assignment failed, falling back to manual assignment');
      
      // Send real-time notification to all volunteers
      sendTaskNotification(task);

      // Send email notifications to volunteers
      await sendTaskEmail(task);

      // Update donation status to assigned
      await Donation.findByIdAndUpdate(donationId, { 
        status: 'assigned',
        assignedTo: receiverId 
      });

      // Create notification for donor
      await Notification.create({
        toUserId: donation.userId._id,
        type: 'task_created',
        title: 'Delivery Task Created',
        message: `A delivery task has been created for your donation: ${donation.food}. A volunteer will be assigned shortly.`,
        meta: {
          taskId: task._id,
          donationId: donationId,
          receiverId: receiverId
        }
      });

      // Create notification for receiver
      await Notification.create({
        toUserId: receiverId,
        type: 'task_created',
        title: 'Delivery Task Created',
        message: `A delivery task has been created for: ${donation.food}. A volunteer will be assigned to deliver it to you.`,
        meta: {
          taskId: task._id,
          donationId: donationId,
          donorId: donation.userId._id
        }
      });

      res.status(201).json({
        message: 'Task created successfully (manual assignment)',
        task: await Task.findById(task._id)
          .populate('donor', 'name email phone')
          .populate('receiver', 'name email phone address')
          .populate('donation', 'food quantity location'),
        autoAssigned: false
      });
    }

  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ message: 'Error creating task' });
  }
});

// Get available tasks for volunteers
router.get('/available', async (req, res) => {
  try {
    const { limit = 50, priority } = req.query;
    
    let filter = { status: 'pending' };
    if (priority) {
      filter.priority = priority;
    }

    const tasks = await Task.find(filter)
      .populate('donor', 'name email phone')
      .populate('receiver', 'name email phone address')
      .populate('donation', 'food quantity location')
      .sort({ priority: -1, createdAt: 1 })
      .limit(parseInt(limit));

    res.json(tasks);
  } catch (error) {
    console.error('Get available tasks error:', error);
    res.status(500).json({ message: 'Error fetching available tasks' });
  }
});

// Accept a task (volunteer accepts)
router.post('/:taskId/accept', async (req, res) => {
  try {
    const { taskId } = req.params;
    const { volunteerId } = req.body;

    if (!volunteerId) {
      return res.status(400).json({ message: 'Volunteer ID is required' });
    }

    // Verify volunteer
    const volunteer = await User.findById(volunteerId);
    if (!volunteer || volunteer.role !== 'volunteer') {
      return res.status(403).json({ message: 'Only volunteers can accept tasks' });
    }

    // Find and update task
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    if (task.status !== 'pending') {
      return res.status(409).json({ message: 'Task is no longer available' });
    }

    // Update task
    task.volunteer = volunteerId;
    task.status = 'accepted';
    task.acceptedAt = new Date();
    await task.save();

    // Send notifications
    await sendTaskStatusUpdate(taskId, 'accepted', [task.donor, task.receiver, volunteerId]);

    // Create notifications
    await Notification.create({
      toUserId: task.donor,
      type: 'task_accepted',
      title: 'Volunteer Assigned',
      message: `${volunteer.name} has accepted the delivery task for your donation.`,
      meta: { taskId, volunteerId }
    });

    await Notification.create({
      toUserId: task.receiver,
      type: 'task_accepted',
      title: 'Volunteer Assigned',
      message: `${volunteer.name} has accepted the delivery task and will deliver your items.`,
      meta: { taskId, volunteerId }
    });

    await Notification.create({
      toUserId: volunteerId,
      type: 'task_accepted',
      title: 'Task Accepted',
      message: `You have successfully accepted the delivery task. Please pick up the items from ${task.pickupAddress}.`,
      meta: { taskId }
    });

    const populatedTask = await Task.findById(taskId)
      .populate('donor', 'name email phone')
      .populate('receiver', 'name email phone address')
      .populate('volunteer', 'name email phone')
      .populate('donation', 'food quantity location');

    res.json({
      message: 'Task accepted successfully',
      task: populatedTask
    });

  } catch (error) {
    console.error('Accept task error:', error);
    res.status(500).json({ message: 'Error accepting task' });
  }
});

// Update task status (delivery progress)
router.put('/:taskId/status', async (req, res) => {
  try {
    const { taskId } = req.params;
    const { status, volunteerId, notes } = req.body;

    if (!volunteerId) {
      return res.status(400).json({ message: 'Volunteer ID is required' });
    }

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    if (task.volunteer.toString() !== volunteerId) {
      return res.status(403).json({ message: 'You can only update your assigned tasks' });
    }

    const previousStatus = task.status;
    
    // Update status
    await task.updateStatus(status);
    
    if (notes) {
      task.volunteerNotes = notes;
    }

    await task.save();

    // Update volunteer performance when task is completed
    if (status === 'delivered' && previousStatus !== 'delivered') {
      const { updateVolunteerPerformance } = require('../services/volunteerAssignmentService');
      
      // Calculate response time (from task creation to first status update)
      const responseTime = task.acceptedAt ? 
        Math.round((task.pickedUpAt || new Date() - task.acceptedAt) / (1000 * 60)) : 0;
      
      // Calculate delivery time (from acceptance to delivery)
      const deliveryTime = task.acceptedAt ? 
        Math.round((new Date() - task.acceptedAt) / (1000 * 60)) : 0;
      
      await updateVolunteerPerformance(volunteerId, task, responseTime, deliveryTime);
      
      console.log(`Updated performance for volunteer ${volunteerId} on task completion`);
    }

    // Send notifications
    await sendTaskStatusUpdate(taskId, status, [task.donor, task.receiver]);

    // Create notification for donor and receiver
    const statusMessages = {
      picked_up: 'Volunteer has picked up the items',
      in_transit: 'Volunteer is on the way to deliver',
      delivered: 'Items have been delivered successfully'
    };

    if (statusMessages[status]) {
      await Notification.create({
        toUserId: task.donor,
        type: 'task_status_update',
        title: 'Delivery Status Update',
        message: statusMessages[status],
        meta: { taskId, status }
      });

      await Notification.create({
        toUserId: task.receiver,
        type: 'task_status_update',
        title: 'Delivery Status Update',
        message: statusMessages[status],
        meta: { taskId, status }
      });
    }

    const populatedTask = await Task.findById(taskId)
      .populate('donor', 'name email')
      .populate('receiver', 'name email')
      .populate('volunteer', 'name email')
      .populate('donation', 'food quantity');

    res.json({
      message: 'Task status updated successfully',
      task: populatedTask
    });

  } catch (error) {
    console.error('Update task status error:', error);
    res.status(500).json({ message: 'Error updating task status' });
  }
});

// Get volunteer's tasks
router.get('/volunteer/:volunteerId', async (req, res) => {
  try {
    const { volunteerId } = req.params;
    const { status } = req.query;

    let filter = { volunteer: volunteerId };
    if (status) {
      filter.status = status;
    }

    const tasks = await Task.find(filter)
      .populate('donor', 'name email phone')
      .populate('receiver', 'name email phone address')
      .populate('donation', 'food quantity location')
      .sort({ createdAt: -1 });

    res.json(tasks);
  } catch (error) {
    console.error('Get volunteer tasks error:', error);
    res.status(500).json({ message: 'Error fetching volunteer tasks' });
  }
});

// Get task statistics
router.get('/stats', async (req, res) => {
  try {
    const stats = await Task.getTaskStats();
    const totalTasks = await Task.countDocuments();
    const pendingTasks = await Task.countDocuments({ status: 'pending' });
    const acceptedTasks = await Task.countDocuments({ status: 'accepted' });
    const completedTasks = await Task.countDocuments({ status: 'delivered' });

    res.json({
      total: totalTasks,
      pending: pendingTasks,
      accepted: acceptedTasks,
      completed: completedTasks,
      byStatus: stats
    });
  } catch (error) {
    console.error('Get task stats error:', error);
    res.status(500).json({ message: 'Error fetching task statistics' });
  }
});

// Get volunteer performance analytics
router.get('/analytics/volunteers', async (req, res) => {
  try {
    const { volunteerId } = req.query;
    const { getVolunteerAnalytics } = require('../services/volunteerAssignmentService');
    
    const analytics = await getVolunteerAnalytics(volunteerId);
    
    res.json({
      success: true,
      analytics,
      count: analytics.length
    });
  } catch (error) {
    console.error('Get volunteer analytics error:', error);
    res.status(500).json({ message: 'Error fetching volunteer analytics' });
  }
});

// Update volunteer availability
router.put('/volunteer/:volunteerId/availability', async (req, res) => {
  try {
    const { volunteerId } = req.params;
    const { isAvailable } = req.body;

    const volunteer = await User.findByIdAndUpdate(
      volunteerId,
      { isAvailable },
      { new: true }
    ).select('name email isAvailable volunteerPerformance');

    if (!volunteer || volunteer.role !== 'volunteer') {
      return res.status(404).json({ message: 'Volunteer not found' });
    }

    res.json({
      message: 'Availability updated successfully',
      volunteer
    });
  } catch (error) {
    console.error('Update volunteer availability error:', error);
    res.status(500).json({ message: 'Error updating availability' });
  }
});

// Helper function to determine task priority
function determinePriority(donation) {
  // Priority logic based on food type and other factors
  const highPriorityFoods = ['milk', 'dairy', 'meat', 'fish', 'cooked'];
  const foodLower = donation.food?.toLowerCase() || '';
  
  if (highPriorityFoods.some(food => foodLower.includes(food))) {
    return 'high';
  }
  
  // Check if donation is recent (within last 2 hours)
  const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
  if (donation.createdAt > twoHoursAgo) {
    return 'medium';
  }
  
  return 'low';
}

module.exports = router;

const { Server } = require('socket.io');

let io;

// Initialize Socket.IO
const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: "http://localhost:3000",
      methods: ["GET", "POST"]
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    // Join user to their personal room based on user ID
    socket.on('join-user-room', (userId) => {
      socket.join(`user-${userId}`);
      console.log(`User ${userId} joined their personal room`);
    });

    // Join volunteers to volunteer room for task notifications
    socket.on('join-volunteer-room', (userId) => {
      socket.join('volunteers');
      socket.join(`user-${userId}`);
      console.log(`Volunteer ${userId} joined volunteer room`);
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.id}`);
    });
  });

  return io;
};

// Get Socket.IO instance
const getIO = () => {
  if (!io) {
    throw new Error('Socket.IO not initialized!');
  }
  return io;
};

// Send real-time notification to specific user
const sendUserNotification = (userId, notification) => {
  try {
    const io = getIO();
    io.to(`user-${userId}`).emit('status-update', notification);
    console.log(`Notification sent to user ${userId}:`, notification);
  } catch (error) {
    console.error('Error sending socket notification:', error);
  }
};

// Broadcast to all connected clients
const broadcastNotification = (notification) => {
  try {
    const io = getIO();
    io.emit('broadcast', notification);
    console.log('Broadcast notification sent:', notification);
  } catch (error) {
    console.error('Error sending broadcast notification:', error);
  }
};

// Send task notification to all volunteers
const sendTaskNotification = (task) => {
  try {
    const io = getIO();
    io.to('volunteers').emit('new-task', {
      type: 'new-task',
      task: {
        _id: task._id,
        donor: task.donor,
        receiver: task.receiver,
        donation: task.donation,
        pickupAddress: task.pickupAddress,
        deliveryAddress: task.deliveryAddress,
        priority: task.priority,
        createdAt: task.createdAt
      },
      message: `New delivery task available: ${task.donation?.food || 'Food items'} from ${task.donor?.name || 'Donor'} to ${task.receiver?.name || 'Receiver'}`,
      timestamp: new Date()
    });
    console.log('Task notification sent to all volunteers');
  } catch (error) {
    console.error('Error sending task notification:', error);
  }
};

// Send task status update to specific users
const sendTaskStatusUpdate = (taskId, status, userIds = []) => {
  try {
    const io = getIO();
    const notification = {
      type: 'task-status-update',
      taskId,
      status,
      message: `Task status updated to: ${status}`,
      timestamp: new Date()
    };
    
    // Send to specific users
    userIds.forEach(userId => {
      io.to(`user-${userId}`).emit('task-update', notification);
    });
    
    console.log(`Task status update sent for task ${taskId}: ${status}`);
  } catch (error) {
    console.error('Error sending task status update:', error);
  }
};

// Notification templates
const notificationTemplates = {
  approved: (userName) => ({
    type: 'success',
    title: 'Account Approved!',
    message: `Congratulations ${userName}! Your FoodShare account has been approved. You can now log in.`,
    icon: 'success',
    duration: 5000
  }),
  rejected: (userName) => ({
    type: 'error',
    title: 'Account Status Update',
    message: `Hi ${userName}, your account registration could not be approved. Please contact support.`,
    icon: 'error',
    duration: 7000
  }),
  pending: (userName) => ({
    type: 'info',
    title: 'Account Under Review',
    message: `Hi ${userName}, your account is currently under review by our admin team.`,
    icon: 'info',
    duration: 4000
  })
};

// Handle location tracking events
const handleLocationTracking = (io) => {
  io.on('connection', (socket) => {
    console.log('Socket connected for location tracking:', socket.id);

    // User connects with location tracking
    socket.on('user-connect', (data) => {
      const { userId, role, timestamp } = data;
      socket.userId = userId;
      socket.userRole = role;
      
      // Join user-specific room
      socket.join(`user-${userId}`);
      
      // Join role-specific room if volunteer
      if (role === 'volunteer') {
        socket.join('volunteers');
      }
      
      console.log(`User ${userId} (${role}) connected for location tracking`);
      
      // Broadcast user online status
      socket.broadcast.emit('user-status', {
        userId,
        status: 'online',
        timestamp
      });
    });

    // Location update from volunteer
    socket.on('location-update', (data) => {
      const { taskId, volunteerId, latitude, longitude, accuracy, timestamp, speed, heading } = data;
      
      console.log(`Location update for task ${taskId} from volunteer ${volunteerId}:`, { latitude, longitude });
      
      // Broadcast to task-specific room
      socket.to(`task-${taskId}`).emit('location-update', {
        taskId,
        volunteerId,
        latitude,
        longitude,
        accuracy,
        timestamp,
        speed,
        heading
      });
      
      // Also broadcast to donor and receiver
      const Task = require('../models/Task');
      Task.findById(taskId).populate('donor receiver').then(task => {
        if (task) {
          socket.to(`user-${task.donor}`).emit('location-update', {
            taskId,
            volunteerId,
            latitude,
            longitude,
            accuracy,
            timestamp,
            speed,
            heading
          });
          
          socket.to(`user-${task.receiver}`).emit('location-update', {
            taskId,
            volunteerId,
            latitude,
            longitude,
            accuracy,
            timestamp,
            speed,
            heading
          });
        }
      });
    });

    // Join task location room
    socket.on('join-task-location', (data) => {
      const { taskId } = data;
      socket.join(`task-${taskId}`);
      console.log(`User ${socket.userId} joined location room for task ${taskId}`);
    });

    // Leave task location room
    socket.on('leave-task-location', (data) => {
      const { taskId } = data;
      socket.leave(`task-${taskId}`);
      console.log(`User ${socket.userId} left location room for task ${taskId}`);
    });

    // Volunteer status updates
    socket.on('volunteer-status', (data) => {
      const { taskId, status, volunteerId } = data;
      
      // Broadcast to task room
      socket.to(`task-${taskId}`).emit('volunteer-status', {
        taskId,
        volunteerId,
        status,
        timestamp: new Date()
      });
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`User ${socket.userId} disconnected from location tracking`);
      
      // Broadcast user offline status
      if (socket.userId) {
        socket.broadcast.emit('user-status', {
          userId: socket.userId,
          status: 'offline',
          timestamp: new Date()
        });
      }
    });
  });
};

module.exports = {
  initializeSocket,
  getIO,
  sendUserNotification,
  broadcastNotification,
  sendTaskNotification,
  sendTaskStatusUpdate,
  handleLocationTracking,
  notificationTemplates
};

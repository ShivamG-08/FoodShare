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

module.exports = {
  initializeSocket,
  getIO,
  sendUserNotification,
  broadcastNotification,
  sendTaskNotification,
  sendTaskStatusUpdate,
  notificationTemplates
};

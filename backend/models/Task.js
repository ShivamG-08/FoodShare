const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
  donor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  donation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Donation',
    required: true
  },
  volunteer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'picked_up', 'in_transit', 'delivered', 'cancelled'],
    default: 'pending'
  },
  deliveryStatus: {
    type: String,
    enum: ['pending', 'picked', 'in_transit', 'delivered'],
    default: 'pending'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  estimatedDeliveryTime: {
    type: Date,
    default: null
  },
  actualDeliveryTime: {
    type: Date,
    default: null
  },
  notes: {
    type: String,
    default: ''
  },
  volunteerNotes: {
    type: String,
    default: ''
  },
  pickupAddress: {
    type: String,
    required: true
  },
  deliveryAddress: {
    type: String,
    required: true
  },
  pickupCoordinates: {
    latitude: Number,
    longitude: Number
  },
  deliveryCoordinates: {
    latitude: Number,
    longitude: Number
  },
  notificationsSent: {
    email: {
      type: Boolean,
      default: false
    },
    socket: {
      type: Boolean,
      default: false
    }
  },
  acceptedAt: {
    type: Date,
    default: null
  },
  pickedUpAt: {
    type: Date,
    default: null
  },
  deliveredAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Index for better query performance
TaskSchema.index({ status: 1, createdAt: -1 });
TaskSchema.index({ volunteer: 1, status: 1 });
TaskSchema.index({ donor: 1 });
TaskSchema.index({ receiver: 1 });
TaskSchema.index({ donation: 1 });

// Virtual for task duration
TaskSchema.virtual('duration').get(function() {
  if (this.acceptedAt && this.deliveredAt) {
    return this.deliveredAt - this.acceptedAt;
  }
  return null;
});

// Virtual for time elapsed
TaskSchema.virtual('timeElapsed').get(function() {
  const now = new Date();
  if (this.status === 'pending') {
    return now - this.createdAt;
  } else if (this.status === 'accepted' && this.acceptedAt) {
    return now - this.acceptedAt;
  }
  return null;
});

// Method to update status and timestamps
TaskSchema.methods.updateStatus = function(newStatus) {
  this.status = newStatus;
  
  switch (newStatus) {
    case 'accepted':
      this.acceptedAt = new Date();
      break;
    case 'picked_up':
      this.pickedUpAt = new Date();
      this.deliveryStatus = 'picked';
      break;
    case 'in_transit':
      this.deliveryStatus = 'in_transit';
      break;
    case 'delivered':
      this.deliveredAt = new Date();
      this.actualDeliveryTime = new Date();
      this.deliveryStatus = 'delivered';
      break;
    case 'cancelled':
      // Keep existing timestamps
      break;
  }
  
  return this.save();
};

// Static method to find available tasks for volunteers
TaskSchema.statics.findAvailableTasks = function(limit = 50) {
  return this.find({ status: 'pending' })
    .populate('donor', 'name email phone')
    .populate('receiver', 'name email phone address')
    .populate('donation', 'food quantity location')
    .sort({ priority: -1, createdAt: 1 })
    .limit(limit);
};

// Static method to find volunteer's assigned tasks
TaskSchema.statics.findVolunteerTasks = function(volunteerId) {
  return this.find({ 
    $or: [
      { volunteer: volunteerId },
      { volunteer: volunteerId, status: { $in: ['accepted', 'picked_up', 'in_transit', 'delivered'] } }
    ]
  })
    .populate('donor', 'name email phone')
    .populate('receiver', 'name email phone address')
    .populate('donation', 'food quantity location')
    .sort({ createdAt: -1 });
};

// Static method to get task statistics
TaskSchema.statics.getTaskStats = function() {
  return this.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);
};

module.exports = mongoose.model('Task', TaskSchema);

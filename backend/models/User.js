const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["donor", "receiver", "volunteer", "admin"], required: true },
  status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
  documentUrl: { type: String, default: "" },
  documents: [{
    url: String,
    documentType: { type: String, enum: ["id", "certificate", "other"] },
    filename: String,
    uploadDate: { type: Date, default: Date.now }
  }],
  customId: { type: String, unique: true },
  profileImageUrl: { type: String, default: "" },
  profilePic: { type: String, default: "" },
  latitude: { type: Number, default: null },
  longitude: { type: Number, default: null },
  location: { type: String, default: "" },
  phone: { type: String, default: "" },
  // Volunteer-specific fields
  isAvailable: { type: Boolean, default: true },
  volunteerPerformance: {
    completedDeliveries: { type: Number, default: 0 },
    totalDeliveries: { type: Number, default: 0 },
    averageResponseTime: { type: Number, default: 0 }, // in minutes
    averageDeliveryTime: { type: Number, default: 0 }, // in minutes
    rating: { type: Number, default: 5.0, min: 0, max: 5 },
    onTimeDeliveryRate: { type: Number, default: 100 }, // percentage
    lastActive: { type: Date, default: Date.now },
    currentTask: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', default: null },
    totalDistance: { type: Number, default: 0 }, // total distance traveled in km
    preferredAreas: [String], // areas volunteer prefers to work in
    maxDistance: { type: Number, default: 50 } // maximum distance willing to travel in km
  },
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date }
}, { timestamps: true });

// Function to generate the next custom ID
UserSchema.statics.generateCustomId = async function(role) {
  const prefix = role === 'donor' ? 'FSD' : role === 'receiver' ? 'FSR' : role === 'volunteer' ? 'FSV' : 'FSA';
  
  // Find the highest existing number for this role
  const result = await this.aggregate([
    { $match: { customId: { $regex: `^${prefix}` } } },
    { 
      $addFields: {
        number: { $toInt: { $substr: ["$customId", 3, -1] } }
      }
    },
    { $sort: { number: -1 } },
    { $limit: 1 }
  ]);

  const nextNumber = result.length > 0 ? result[0].number + 1 : 1;
  return `${prefix}${nextNumber}`;
};

// Pre-save hook to generate custom ID
UserSchema.pre('save', async function(next) {
  if (this.isNew && !this.customId) {
    this.customId = await this.constructor.generateCustomId(this.role);
  }
  next();
});

module.exports = mongoose.model("User", UserSchema);

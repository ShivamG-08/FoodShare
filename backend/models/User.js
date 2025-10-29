const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["donor", "receiver"], required: true },
  customId: { type: String, unique: true },
  profileImageUrl: { type: String, default: "" },
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date }
}, { timestamps: true });

// Function to generate the next custom ID
UserSchema.statics.generateCustomId = async function(role) {
  const prefix = role === 'donor' ? 'FSD' : 'FSR';
  
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

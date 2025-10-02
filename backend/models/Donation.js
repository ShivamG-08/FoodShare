const mongoose = require("mongoose");

const DonationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    food: { type: String, required: true },
    quantity: { type: String, required: true },
    location: { type: String, required: true },
    notes: { type: String },
    status: { type: String, enum: ["pending", "assigned", "picked_up", "completed"], default: "pending" },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Donation", DonationSchema);

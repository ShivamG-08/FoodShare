const mongoose = require("mongoose");

const NotificationSchema = new mongoose.Schema(
  {
    toUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, default: "info" },
    title: { type: String, required: true },
    message: { type: String, required: true },
    meta: { type: Object },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Notification", NotificationSchema);

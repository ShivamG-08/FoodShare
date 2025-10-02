const express = require("express");
const mongoose = require("mongoose");
const Notification = require("../models/Notification");

const router = express.Router();

// List notifications for a user (most recent first)
router.get("/", async (req, res) => {
  try {
    const { userId, unread } = req.query;
    if (!userId) return res.json([]);
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.json([]);
    }

    const filter = { toUserId: new mongoose.Types.ObjectId(userId) };
    if (unread === "true") filter.read = false;

    const list = await Notification.find(filter).sort({ createdAt: -1 }).limit(50);
    res.json(list);
  } catch (err) {
    console.error("List notifications error:", err);
    res.status(500).json({ message: "Error fetching notifications" });
  }
});

// Mark one notification as read
router.patch("/:id/read", async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await Notification.findByIdAndUpdate(
      id,
      { $set: { read: true } },
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: "Not found" });
    res.json(updated);
  } catch (err) {
    console.error("Read notification error:", err);
    res.status(500).json({ message: "Error updating notification" });
  }
});

module.exports = router;

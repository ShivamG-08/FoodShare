const express = require("express");
const path = require("path");
const multer = require("multer");
const fs = require("fs");
const User = require("../models/User");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const { role } = req.query;
    const filter = role ? { role } : {};
    const users = await User.find(filter).select("name email role customId");
    res.status(200).json({ users });
  } catch (err) {
    res.status(500).json({ message: "Error fetching users" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("name email role profileImageUrl");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ message: "Error fetching user" });
  }
});

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = path.join(__dirname, "..", "uploads", "avatars");
    try { fs.mkdirSync(dir, { recursive: true }); } catch (_) {}
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname) || ".png";
    const safe = `${req.params.id}-${Date.now()}${ext}`;
    cb(null, safe);
  }
});

const upload = multer({ storage });

router.post("/:id/avatar", upload.single("avatar"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });
    const rel = path.posix.join("uploads", "avatars", req.file.filename);
    const url = `${req.protocol}://${req.get("host")}/${rel}`;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { profileImageUrl: url },
      { new: true, select: "name email role profileImageUrl" }
    );
    if (!user) return res.status(404).json({ message: "User not found" });
    res.status(200).json({ profileImageUrl: user.profileImageUrl });
  } catch (err) {
    res.status(500).json({ message: "Error uploading avatar" });
  }
});

module.exports = router;

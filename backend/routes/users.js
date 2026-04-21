const express = require("express");
const path = require("path");
const multer = require("multer");
const fs = require("fs");
const User = require("../models/User");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const { role } = req.query;
    const filter = role ? { role } : {};
    const users = await User.find(filter).select("name email role customId latitude longitude location");
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

// Profile picture upload endpoint
router.put("/upload-profile", authenticateToken, upload.single("profilePic"), async (req, res) => {
  try {
    // Get user ID from authenticated user
    const userId = req.user.id;
    
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }
    
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(req.file.mimetype)) {
      return res.status(400).json({ message: "Only image files are allowed" });
    }
    
    // Get old profile picture for deletion
    const oldUser = await User.findById(userId);
    const oldProfilePic = oldUser?.profilePic;
    
    // Create file URL
    const rel = path.posix.join("uploads", "avatars", req.file.filename);
    const url = `${req.protocol}://${req.get("host")}/${rel}`;
    
    // Update user profile picture
    const user = await User.findByIdAndUpdate(
      userId,
      { 
        profilePic: req.file.filename,
        profileImageUrl: url 
      },
      { new: true, select: "name email role profilePic profileImageUrl" }
    );
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Delete old profile picture if it exists
    if (oldProfilePic) {
      const oldFilePath = path.join(__dirname, "..", "uploads", "avatars", oldProfilePic);
      try {
        fs.unlinkSync(oldFilePath);
        console.log("Old profile picture deleted:", oldProfilePic);
      } catch (err) {
        console.log("Failed to delete old profile picture:", err.message);
      }
    }
    
    res.status(200).json({ 
      message: "Profile picture uploaded successfully",
      profilePic: user.profilePic,
      profileImageUrl: user.profileImageUrl 
    });
    
  } catch (err) {
    console.error("Profile picture upload error:", err);
    res.status(500).json({ message: "Error uploading profile picture" });
  }
});

// PUT /user/update-profile-pic endpoint (alternative endpoint name)
router.put("/update-profile-pic", authenticateToken, upload.single("profilePic"), async (req, res) => {
  try {
    // Get user ID from authenticated user
    const userId = req.user.id;
    
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }
    
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(req.file.mimetype)) {
      return res.status(400).json({ message: "Only image files are allowed" });
    }
    
    // Get old profile picture for deletion
    const oldUser = await User.findById(userId);
    const oldProfilePic = oldUser?.profilePic;
    
    // Create file URL
    const rel = path.posix.join("uploads", "avatars", req.file.filename);
    const url = `${req.protocol}://${req.get("host")}/${rel}`;
    
    // Update user profile picture
    const user = await User.findByIdAndUpdate(
      userId,
      { 
        profilePic: req.file.filename,
        profileImageUrl: url 
      },
      { new: true, select: "name email role profilePic profileImageUrl" }
    );
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Delete old profile picture if it exists
    if (oldProfilePic) {
      const oldFilePath = path.join(__dirname, "..", "uploads", "avatars", oldProfilePic);
      try {
        fs.unlinkSync(oldFilePath);
        console.log("Old profile picture deleted:", oldProfilePic);
      } catch (err) {
        console.log("Failed to delete old profile picture:", err.message);
      }
    }
    
    res.status(200).json({ 
      message: "Profile picture updated successfully",
      profilePic: user.profilePic,
      profileImageUrl: user.profileImageUrl 
    });
    
  } catch (err) {
    console.error("Profile picture update error:", err);
    res.status(500).json({ message: "Error updating profile picture" });
  }
});

// Document upload endpoint
router.post("/:id/documents", upload.array("documents", 5), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "No documents uploaded" });
    }

    const documents = req.files.map(file => {
      const rel = path.posix.join("uploads", "avatars", file.filename);
      const url = `${req.protocol}://${req.get("host")}/${rel}`;
      return {
        url: url,
        filename: file.filename,
        documentType: 'other',
        uploadDate: new Date()
      };
    });

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { 
        $push: { documents: { $each: documents } },
        documentUrl: documents[0]?.url || ''
      },
      { new: true, select: "name email role documents documentUrl" }
    );

    if (!user) return res.status(404).json({ message: "User not found" });
    res.status(200).json({ documents: user.documents });
  } catch (err) {
    res.status(500).json({ message: "Error uploading documents" });
  }
});

// Admin verification endpoints
router.get("/admin/new-users", async (req, res) => {
  try {
    const pendingUsers = await User.find({ status: "pending" })
      .select("name email role customId documents createdAt")
      .sort({ createdAt: -1 });
    res.status(200).json(pendingUsers);
  } catch (err) {
    res.status(500).json({ message: "Error fetching pending users" });
  }
});

router.put("/admin/approve/:id", async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { status: "approved" },
      { new: true, select: "name email role status customId" }
    );
    if (!user) return res.status(404).json({ message: "User not found" });

    // Send email notification
    const { sendEmail } = require("../utils/sendEmail");
    const emailResult = await sendEmail(user.email, 'approved', {
      name: user.name,
      loginUrl: 'http://localhost:3000/login'
    });
    
    // Send real-time notification via Socket.IO
    const { sendUserNotification, notificationTemplates } = require("../services/socketService");
    const notification = notificationTemplates.approved(user.name);
    sendUserNotification(user._id.toString(), notification);

    console.log(`User ${user.name} approved - Email: ${emailResult.success ? 'Sent' : 'Failed'}, Socket: Sent`);
    
    res.status(200).json({ 
      message: "User approved successfully", 
      user,
      emailSent: emailResult.success
    });
  } catch (err) {
    console.error("Error approving user:", err);
    res.status(500).json({ message: "Error approving user" });
  }
});

router.put("/admin/reject/:id", async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { status: "rejected" },
      { new: true, select: "name email role status customId" }
    );
    if (!user) return res.status(404).json({ message: "User not found" });

    // Send email notification
    const { sendEmail } = require("../utils/sendEmail");
    const emailResult = await sendEmail(user.email, 'rejected', {
      name: user.name,
      supportUrl: 'http://localhost:3000/login'
    });
    
    // Send real-time notification via Socket.IO
    const { sendUserNotification, notificationTemplates } = require("../services/socketService");
    const notification = notificationTemplates.rejected(user.name);
    sendUserNotification(user._id.toString(), notification);

    console.log(`User ${user.name} rejected - Email: ${emailResult.success ? 'Sent' : 'Failed'}, Socket: Sent`);
    
    res.status(200).json({ 
      message: "User rejected successfully", 
      user,
      emailSent: emailResult.success
    });
  } catch (err) {
    console.error("Error rejecting user:", err);
    res.status(500).json({ message: "Error rejecting user" });
  }
});

module.exports = router;

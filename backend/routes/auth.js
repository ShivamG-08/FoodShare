const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const crypto = require("crypto");

const router = express.Router();

// Signup Route
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Validate role
    if (!['donor', 'receiver'].includes(role)) {
      return res.status(400).json({ message: "Invalid role. Must be either 'donor' or 'receiver'" });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: "User already exists" });

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create and save new user with role
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      role: role || 'donor' // Default to 'donor' if role is not provided
    });
    
    const savedUser = await newUser.save();
    
    // Log the saved user for debugging
    console.log('New user created:', savedUser);

    res.status(201).json({ 
      message: "User registered successfully", 
      user: {
        id: savedUser._id,
        customId: savedUser.customId,
        name: savedUser.name,
        email: savedUser.email,
        role: savedUser.role,
        profileImageUrl: savedUser.profileImageUrl || ""
      }
    });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ 
      message: "Error registering user",
      error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
  }
});

// Login Route
// Login
router.post("/login", async (req, res) => {
    try {
      const { email, password } = req.body;
  
      const user = await User.findOne({ email });
      if (!user) return res.status(400).json({ message: "Invalid email or password" });
  
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) return res.status(400).json({ message: "Invalid email or password" });
  
      res.status(200).json({
        message: "Login successful",
        role: user.role,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          profileImageUrl: user.profileImageUrl || ""
        },
      });
    } catch (error) {
      res.status(500).json({ message: "Error logging in", error });
    }
  });

// Forgot Password - request reset token
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    const user = await User.findOne({ email });
    if (!user) {
      // Do not reveal whether email exists
      return res.status(200).json({ message: "If an account exists, a reset link has been sent." });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expires = Date.now() + 1000 * 60 * 15; // 15 minutes

    user.resetPasswordToken = token;
    user.resetPasswordExpires = new Date(expires);
    await user.save();

    // In production, send email with this link. For dev, return token.
    const resetLink = `http://localhost:3000/reset-password?token=${token}`;
    console.log("Password reset link:", resetLink);
    return res.status(200).json({ message: "Reset link generated", token, resetLink });
  } catch (error) {
    console.error("Forgot password error:", error);
    return res.status(500).json({ message: "Error generating reset link" });
  }
});

// Reset Password - set new password by token
router.post("/reset-password", async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) return res.status(400).json({ message: "Token and new password are required" });

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!user) return res.status(400).json({ message: "Invalid or expired token" });

    const hashed = await bcrypt.hash(password, 12);
    user.password = hashed;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    return res.status(200).json({ message: "Password has been reset successfully" });
  } catch (error) {
    console.error("Reset password error:", error);
    return res.status(500).json({ message: "Error resetting password" });
  }
});

module.exports = router;

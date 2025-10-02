const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

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
        name: savedUser.name,
        email: savedUser.email,
        role: savedUser.role
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
        },
      });
    } catch (error) {
      res.status(500).json({ message: "Error logging in", error });
    }
  });
  

module.exports = router;

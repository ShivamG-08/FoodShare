const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const http = require("http");
require("dotenv").config();

// Import routes
const authRoutes = require("./routes/auth");
const donationRoutes = require("./routes/donations");
const notificationRoutes = require("./routes/notifications");
const predictionRoutes = require("./routes/prediction");
const usersRoutes = require("./routes/users");
const taskRoutes = require("./routes/tasks");

// Import services
const { initializeSocket } = require("./services/socketService");
const { testEmailConfig } = require("./utils/sendEmail");

// Initialize express app
const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Ensure uploads directories exist and serve statically
const uploadsDir = path.join(__dirname, "uploads");
const avatarsDir = path.join(uploadsDir, "avatars");
try {
  fs.mkdirSync(avatarsDir, { recursive: true });
} catch (_) {}
app.use("/uploads", express.static(uploadsDir));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/donations", donationRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/prediction", predictionRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/tasks", taskRoutes);

// Debug: Log registered routes
donationRoutes.stack.forEach((r) => {
  if (r.route && r.route.path) {
    console.log(`Registered route: ${r.route.path} (${Object.keys(r.route.methods).join(', ')})`);
  }
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", message: "Server is running" });
});

// Connect to MongoDB
if (!process.env.MONGODB_URI) {
  console.error("❌ MONGODB_URI not set in .env file. Add your Atlas connection string to FoodShare/backend/.env and restart.");
  process.exit(1);
}
const MONGODB_URI = process.env.MONGODB_URI;

mongoose
  .connect(MONGODB_URI)
  .then(async () => {
    console.log("✅ Connected to MongoDB Atlas");
    
    // Create hardcoded admin account
    const User = require("./models/User");
    const bcrypt = require("bcryptjs");
    
    try {
      const existingAdmin = await User.findOne({ email: "tripathiayush746@gmail.com" });
      
      if (!existingAdmin) {
        const hashedPassword = await bcrypt.hash("Dhanapur@2024", 12);
        const adminUser = new User({
          name: "System Administrator",
          email: "tripathiayush746@gmail.com",
          password: hashedPassword,
          role: "admin",
          status: "approved",
          customId: "FSA1"
        });
        
        await adminUser.save();
        console.log(" Admin account created successfully!");
      } else {
        console.log(" Admin account already exists");
      }
    } catch (error) {
      console.error(" Error creating admin account:", error);
    }
  })
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// Start server with Socket.IO
const PORT = process.env.PORT || 5000;
const server = http.createServer(app);
const io = initializeSocket(server);

// Initialize location tracking handlers
const { handleLocationTracking } = require('./services/socketService');
handleLocationTracking(io);

server.listen(PORT, async () => {
  console.log(` Server running on http://localhost:${PORT}`);
  console.log(` Socket.IO enabled for real-time communication`);
  
  // Test email configuration
  const emailReady = await testEmailConfig();
  if (emailReady) {
    console.log(` Email service ready`);
  } else {
    console.log(` Email service not configured - notifications will be logged only`);
  }
});

// Error handling for unhandled promise rejections
process.on("unhandledRejection", (err) => {
  console.error("Unhandled Rejection:", err);
  // Close server & exit process
  server.close(() => process.exit(1));
});

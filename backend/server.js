const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

// Import routes
const authRoutes = require("./routes/auth");
const donationRoutes = require("./routes/donations");
const notificationRoutes = require("./routes/notifications");
const predictionRoutes = require("./routes/prediction");
const usersRoutes = require("./routes/users");

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
app.use("/auth", authRoutes);
app.use("/api/donations", donationRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/prediction", predictionRoutes);
app.use("/api/users", usersRoutes);

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
const MONGODB_URI = process.env.MONGODB_URI || 
  "mongodb+srv://moretaniya27_db_user:b93iZ9cexTIto1MB@cluster0.t1zzrdi.mongodb.net/?appName=Cluster0";

mongoose
  .connect(MONGODB_URI)
  .then(() => console.log("✅ Connected to MongoDB Atlas"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});

// Error handling for unhandled promise rejections
process.on("unhandledRejection", (err) => {
  console.error("Unhandled Rejection:", err);
  // Close server & exit process
  server.close(() => process.exit(1));
});

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./routes/auth");
const donationRoutes = require("./routes/donations");
const notificationRoutes = require("./routes/notifications");
const { spawn } = require("child_process");
const path = require("path");

const app = express();
app.use(express.json());
app.use(cors());

// ✅ Use auth routes
app.use("/auth", authRoutes);
// ✅ Donation routes
app.use("/api/donations", donationRoutes);
// ✅ Notification routes
app.use("/api/notifications", notificationRoutes);

// ✅ Prediction Route (Donor Dashboard will call this)
app.post("/predict", (req, res) => {
  const data = JSON.stringify(req.body);

  // Spawn python to run the AI model script
  const pythonProcess = spawn("python", [
    path.join(__dirname, "../ai-model/predict.py"),
    data,
  ]);

  let result = "";
  let errBuf = "";
  pythonProcess.stdout.on("data", (chunk) => {
    result += chunk.toString();
  });

  pythonProcess.stderr.on("data", (err) => {
    const msg = err.toString();
    errBuf += msg;
    console.error("Python error:", msg);
  });

  pythonProcess.on("close", (code) => {
    const trimmed = result.trim();
    if (code !== 0) {
      return res.status(500).json({ error: "Prediction process exited with error", details: errBuf || trimmed });
    }
    if (!trimmed) {
      return res.status(500).json({ error: "Empty prediction response from model", details: errBuf });
    }
    res.json({ prediction: trimmed });
  });
});

// ✅ Connect DB
mongoose
  .connect(
    process.env.MONGODB_URI ||
      "mongodb+srv://shuklaayaan27_db_user:mBY7qlD6r7oEOsxm@cluster0.3r9u0e9.mongodb.net/FoodShareDB?retryWrites=true&w=majority&appName=Cluster0"
  )
  .then(() => console.log("✅ Connected to MongoDB Atlas"))
  .catch((err) => console.error("❌ DB connection error:", err));

app.listen(5000, () => {
  console.log("✅ Backend running on http://localhost:5000");
});

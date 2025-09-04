const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const authRoutes = require("./routes/auth");
const { spawn } = require("child_process");
const path = require("path");

const app = express();
app.use(express.json());
app.use(cors());

// ✅ Use auth routes
app.use("/auth", authRoutes);

// ✅ Prediction Route (Donor Dashboard will call this)
app.post("/predict", (req, res) => {
  const data = JSON.stringify(req.body);

  const pythonProcess = spawn("python", [
    path.join(__dirname, "../ai-model/predict.py"),
    data,
  ]);

  let result = "";
  pythonProcess.stdout.on("data", (chunk) => {
    result += chunk.toString();
  });

  pythonProcess.stderr.on("data", (err) => {
    console.error("Python error:", err.toString());
  });

  pythonProcess.on("close", () => {
    res.json({ prediction: result.trim() });
  });
});

// ✅ Connect DB
mongoose
  .connect("mongodb+srv://shuklaayaan27_db_user:mBY7qlD6r7oEOsxm@cluster0.3r9u0e9.mongodb.net/FoodShareDB?retryWrites=true&w=majority&appName=Cluster0")
  .then(() => console.log("✅ Connected to MongoDB Atlas"))
  .catch((err) => console.error("❌ DB connection error:", err));

app.listen(5000, () => {
  console.log("✅ Backend running on http://localhost:5000");
});

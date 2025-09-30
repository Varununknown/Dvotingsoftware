const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();

// Middleware
app.use(express.json());
app.use(cors({
  origin: ["http://localhost:5173", "http://localhost:5174"], // Allow both potential origins
  credentials: true
}));

// Routes
const voterRoutes = require("./routes/voterRoutes");
const electionRoutes = require("./routes/electionRoutes");
const votingRoutes = require("./routes/votingRoutes");
const candidateRoutes = require("./routes/candidateRoutes");
const webauthnRoutes = require("./routes/webauthnRoutes");

app.use("/api/voters", voterRoutes);
app.use("/api/elections", electionRoutes);
app.use("/api/voting", votingRoutes);
app.use("/api/candidates", candidateRoutes);
app.use("/api/webauthn", webauthnRoutes);

// Test route
app.get("/", (req, res) => {
  res.send("Backend API is running 🚀");
});

// MongoDB connection - use local MongoDB for development
const MONGO_URI = process.env.USE_LOCAL_DB === "true" 
  ? "mongodb://localhost:27017/votingdb" 
  : process.env.MONGO_URI;

console.log(`Connecting to MongoDB: ${MONGO_URI.substring(0, MONGO_URI.indexOf('@') > 0 ? MONGO_URI.indexOf('@') : 30)}...`);

mongoose.connect(MONGO_URI)
.then(() => console.log("✅ MongoDB connected"))
.catch(err => {
  console.error("❌ MongoDB error:", err);
  
  if (err.message && err.message.includes("IP that isn't whitelisted")) {
    console.log("\n⚠️ IP WHITELIST ISSUE DETECTED");
    console.log("----------------------------------------");
    console.log("To fix this issue, you need to:");
    console.log("1. Log in to MongoDB Atlas at https://cloud.mongodb.com");
    console.log("2. Select your cluster");
    console.log("3. Go to Network Access");
    console.log("4. Add your current IP address");
    console.log("   OR add 0.0.0.0/0 to allow access from anywhere (not secure for production)");
    console.log("----------------------------------------");
    console.log("Alternatively, use a local MongoDB for development:");
    console.log("1. Install MongoDB locally");
    console.log("2. Add USE_LOCAL_DB=true to your .env file");
    console.log("----------------------------------------");
  }
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
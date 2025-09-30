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

// Test route
app.get("/", (req, res) => {
  res.send("Backend API is running 🚀");
});

// MongoDB connection with better error handling
console.log("Starting MongoDB connection...");
console.log("MongoDB URI exists:", !!process.env.MONGO_URI);

try {
  mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("✅ MongoDB connected successfully!");
    
    // Only set up routes after DB connection is established
    setupRoutes();
    
    // Start server after DB connection
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`Test the API at http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error("❌ MongoDB connection error:", err.message);
    console.error("Error code:", err.code);
    console.error("Error name:", err.name);
    
    if (err.message && err.message.includes("IP that isn't whitelisted")) {
      console.log("\n🔐 MONGODB ATLAS IP WHITELIST ERROR");
      console.log("---------------------------------------");
      console.log("To fix this issue:");
      console.log("1. Go to MongoDB Atlas: https://cloud.mongodb.com");
      console.log("2. Select your cluster");
      console.log("3. Click 'Network Access' in the sidebar");
      console.log("4. Click 'Add IP Address'");
      console.log("5. Add your current IP or use '0.0.0.0/0' for development");
      console.log("6. Wait a few minutes for the changes to take effect");
      console.log("---------------------------------------");
    }
  });
} catch (err) {
  console.error("❌ Unexpected error during MongoDB connection setup:", err);
}

function setupRoutes() {
  // Import routes
  const voterRoutes = require("./routes/voterRoutes");
  const electionRoutes = require("./routes/electionRoutes");
  const votingRoutes = require("./routes/votingRoutes");
  const candidateRoutes = require("./routes/candidateRoutes");
  const webauthnRoutes = require("./routes/webauthnRoutes");

  // Use routes
  app.use("/api/voters", voterRoutes);
  app.use("/api/elections", electionRoutes);
  app.use("/api/voting", votingRoutes);
  app.use("/api/candidates", candidateRoutes);
  app.use("/api/webauthn", webauthnRoutes);
  
  console.log("✅ API routes configured successfully");
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Promise Rejection:', err.message);
  console.error(err);
});
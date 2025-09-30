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

// Test route to check if backend is responsive
app.get("/", (req, res) => {
  res.send("Backend API is running 🚀");
});

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

// MongoDB connection with detailed error logging
console.log("Attempting to connect to MongoDB...");
console.log(`MONGO_URI is defined: ${Boolean(process.env.MONGO_URI)}`);

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log("✅ MongoDB connected successfully");
})
.catch(err => {
  console.error("❌ MongoDB connection error details:");
  console.error(err);
  process.exit(1); // Exit with error code
});

// Add global error handler
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`Test API at http://localhost:${PORT}/`);
});
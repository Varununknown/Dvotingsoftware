const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const crypto = require("crypto");
require("dotenv").config();

// Create Express app
const app = express();

// Middleware
app.use(express.json());
app.use(cors({
  origin: ["http://localhost:5173", "http://localhost:5174"],
  credentials: true
}));

// Mock data - In-memory storage for development
const mockDB = {
  voters: [],
  elections: [],
  candidates: []
};

// Setup mock data
const setupMockData = () => {
  console.log("Setting up mock data...");
  
  // Sample voters
  mockDB.voters.push({
    id: "voter1",
    aadhaarId: "123456789012",
    name: "Test User",
    email: "test@example.com",
    isVerified: true,
    hasVoted: {}
  });
  
  // Sample elections
  mockDB.elections.push({
    id: "election1",
    title: "Student Council President Election",
    description: "Vote for the next Student Council President",
    logo: "🎓",
    status: "active",
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    candidates: ["candidate1", "candidate2"]
  });
  
  // Sample candidates
  mockDB.candidates.push({
    id: "candidate1",
    name: "Alex Johnson",
    party: "Progress Party",
    bio: "3rd year Computer Science student with leadership experience",
    logo: "🚀",
    photo: "https://randomuser.me/api/portraits/men/32.jpg",
    electionId: "election1",
    voteCount: 24
  });
  
  mockDB.candidates.push({
    id: "candidate2",
    name: "Maria Garcia",
    party: "Student Voice Alliance",
    bio: "4th year Psychology major, student council secretary",
    logo: "🗣️",
    photo: "https://randomuser.me/api/portraits/women/44.jpg",
    electionId: "election1",
    voteCount: 18
  });
  
  console.log("Mock data setup complete!");
};

// Set up the mock data
setupMockData();

// Route for voter registration
app.post("/api/voters/register", (req, res) => {
  const { aadhaarId } = req.body;
  
  // Check if voter already exists
  const existingVoter = mockDB.voters.find(v => v.aadhaarId === aadhaarId);
  if (existingVoter) {
    return res.status(400).json({ message: "Voter already registered" });
  }
  
  // Generate mock OTP
  const otp = crypto.randomInt(100000, 999999).toString();
  
  // Create new voter
  const newVoter = {
    id: `voter_${mockDB.voters.length + 1}`,
    aadhaarId,
    name: "New Voter",
    otp,
    isVerified: false,
    hasVoted: {}
  };
  
  mockDB.voters.push(newVoter);
  
  return res.json({ 
    message: "Voter registered successfully", 
    otp: otp // In a real app, OTP would be sent via SMS
  });
});

// Route to check if voter exists
app.post("/api/voters/check", (req, res) => {
  const { aadhaarId } = req.body;
  
  // Find voter
  const voter = mockDB.voters.find(v => v.aadhaarId === aadhaarId);
  
  return res.json({
    exists: !!voter,
    isVerified: voter?.isVerified || false
  });
});

// Route to verify OTP
app.post("/api/voters/verify-otp", (req, res) => {
  const { aadhaarId, otp } = req.body;
  
  // Find voter
  const voterIndex = mockDB.voters.findIndex(v => v.aadhaarId === aadhaarId);
  
  if (voterIndex === -1) {
    return res.status(404).json({ message: "Voter not found" });
  }
  
  const voter = mockDB.voters[voterIndex];
  
  // Check OTP (in mock, accept any 6 digit OTP)
  if (otp.length === 6) {
    // Update voter verification status
    mockDB.voters[voterIndex] = {
      ...voter,
      isVerified: true,
      otp: undefined // Clear OTP after verification
    };
    
    return res.json({
      message: "OTP verified successfully",
      voter: {
        id: voter.id,
        aadhaarId: voter.aadhaarId,
        isVerified: true,
        hasVoted: voter.hasVoted || {}
      }
    });
  } else {
    return res.status(400).json({ message: "Invalid OTP" });
  }
});

// Route to login
app.post("/api/voters/login", (req, res) => {
  const { aadhaarId } = req.body;
  
  // Find voter
  const voter = mockDB.voters.find(v => v.aadhaarId === aadhaarId);
  
  if (!voter) {
    return res.status(404).json({ message: "Voter not found" });
  }
  
  // Generate OTP
  const otp = crypto.randomInt(100000, 999999).toString();
  voter.otp = otp;
  
  return res.json({
    message: "OTP sent for login",
    otp: otp // In a real app, OTP would be sent via SMS
  });
});

// Route to login with OTP
app.post("/api/voters/login/verify", (req, res) => {
  const { aadhaarId, otp } = req.body;
  
  // Find voter
  const voter = mockDB.voters.find(v => v.aadhaarId === aadhaarId);
  
  if (!voter) {
    return res.status(404).json({ message: "Voter not found" });
  }
  
  // Check OTP (in mock, accept any 6 digit OTP)
  if (otp.length === 6) {
    return res.json({
      message: "Login successful",
      voter: {
        id: voter.id,
        aadhaarId: voter.aadhaarId,
        isVerified: voter.isVerified,
        hasVoted: voter.hasVoted || {}
      }
    });
  } else {
    return res.status(400).json({ message: "Invalid OTP" });
  }
});

// Route to get elections
app.get("/api/elections", (req, res) => {
  res.json(mockDB.elections);
});

// Route to get election by ID
app.get("/api/elections/:id", (req, res) => {
  const election = mockDB.elections.find(e => e.id === req.params.id);
  
  if (!election) {
    return res.status(404).json({ message: "Election not found" });
  }
  
  // Get candidates for this election
  const candidates = mockDB.candidates.filter(c => c.electionId === election.id);
  
  // Return election with candidates
  res.json({
    ...election,
    candidates
  });
});

// Route to cast a vote
app.post("/api/voting/:electionId/vote", (req, res) => {
  const { voterId, candidateId } = req.body;
  const { electionId } = req.params;
  
  // Find voter
  const voter = mockDB.voters.find(v => v.id === voterId);
  if (!voter) {
    return res.status(404).json({ message: "Voter not found" });
  }
  
  // Find election
  const election = mockDB.elections.find(e => e.id === electionId);
  if (!election) {
    return res.status(404).json({ message: "Election not found" });
  }
  
  // Check if election is active
  if (election.status !== "active") {
    return res.status(400).json({ message: "Election is not active" });
  }
  
  // Check if voter has already voted
  if (voter.hasVoted[electionId]) {
    return res.status(400).json({ message: "Voter has already cast their vote" });
  }
  
  // Find candidate
  const candidate = mockDB.candidates.find(c => c.id === candidateId && c.electionId === electionId);
  if (!candidate) {
    return res.status(404).json({ message: "Candidate not found" });
  }
  
  // Record vote
  candidate.voteCount += 1;
  voter.hasVoted[electionId] = true;
  
  res.json({ message: "Vote cast successfully ✅" });
});

// Catch-all route for testing
app.get("/", (req, res) => {
  res.send("Mock backend API is running 🚀");
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Mock server running on port ${PORT}`);
  console.log(`⚠️ DEVELOPMENT MODE: Using in-memory mock data`);
});
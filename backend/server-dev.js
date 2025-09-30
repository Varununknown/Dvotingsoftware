const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

// Create Express app
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

// Setup routes
app.use("/api/voters", voterRoutes);
app.use("/api/elections", electionRoutes);
app.use("/api/voting", votingRoutes);
app.use("/api/candidates", candidateRoutes);
app.use("/api/webauthn", webauthnRoutes);

// Test route
app.get("/", (req, res) => {
  res.send("Backend API is running 🚀");
});

// Create MongoDB connection using Mock Data
const setupMockData = async () => {
  console.log("🔄 Setting up mock data for development...");
  
  // Use the database models to create sample data
  const Election = require('./models/Election');
  const Voter = require('./models/Voter2'); // Using Voter2 to match the routes
  const Candidate = require('./models/Candidate');
  
  // Sample elections
  const elections = [
    {
      id: "election1",
      title: "Student Council President Election",
      description: "Vote for the next Student Council President",
      logo: "🎓",
      status: "active",
      category: "student",
      startDate: new Date(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      candidates: []
    },
    {
      id: "election2",
      title: "Faculty Representative Election",
      description: "Select your department representative",
      logo: "👨‍🏫",
      status: "upcoming",
      category: "faculty",
      startDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
      endDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
      candidates: []
    },
    {
      id: "election3",
      title: "Campus Improvement Committee",
      description: "Select members for the Campus Improvement Committee",
      logo: "🏫",
      status: "closed",
      category: "campus",
      startDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 14 days ago
      endDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      candidates: []
    }
  ];

  // Sample candidates
  const candidates = [
    {
      id: "candidate1",
      name: "Alex Johnson",
      party: "Progress Party",
      bio: "3rd year Computer Science student with leadership experience",
      logo: "🚀",
      photo: "https://randomuser.me/api/portraits/men/32.jpg",
      electionId: "election1",
      voteCount: 24
    },
    {
      id: "candidate2",
      name: "Maria Garcia",
      party: "Student Voice Alliance",
      bio: "4th year Psychology major, student council secretary",
      logo: "🗣️",
      photo: "https://randomuser.me/api/portraits/women/44.jpg",
      electionId: "election1",
      voteCount: 18
    },
    {
      id: "candidate3",
      name: "Dr. James Wilson",
      party: "Faculty Forward",
      bio: "Associate Professor of Computer Science, 10 years experience",
      logo: "💻",
      photo: "https://randomuser.me/api/portraits/men/46.jpg",
      electionId: "election2",
      voteCount: 0
    },
    {
      id: "candidate4",
      name: "Dr. Sarah Ahmed",
      party: "Innovation Group",
      bio: "Assistant Professor of Engineering, department chair",
      logo: "🔬",
      photo: "https://randomuser.me/api/portraits/women/26.jpg",
      electionId: "election2",
      voteCount: 0
    },
    {
      id: "candidate5",
      name: "Thomas Lee",
      party: "Student Progress Initiative",
      bio: "Graduate student in Urban Planning",
      logo: "🏙️",
      photo: "https://randomuser.me/api/portraits/men/22.jpg",
      electionId: "election3",
      voteCount: 42
    },
    {
      id: "candidate6",
      name: "Emma Rodriguez",
      party: "Campus Revitalization Team",
      bio: "Architecture student, former intern with city planning",
      logo: "🏛️",
      photo: "https://randomuser.me/api/portraits/women/29.jpg",
      electionId: "election3",
      voteCount: 37
    }
  ];

  // Sample voters
  const voters = [
    {
      id: "voter1",
      name: "Test User",
      email: "test@example.com",
      aadhaarId: "123456789012",
      password: "password123",
      photo: "https://randomuser.me/api/portraits/men/75.jpg",
      hasVoted: { election1: false, election2: false, election3: true }
    }
  ];

  // Clear existing collections
  await Election.deleteMany({});
  await Candidate.deleteMany({});
  await Voter.deleteMany({});

  // Insert sample data
  await Election.insertMany(elections);
  await Candidate.insertMany(candidates);
  await Voter.insertMany(voters);

  console.log("✅ Mock data setup complete!");
};

// Connect to MongoDB (with fallback to mock data for development)
console.log("🔄 Attempting MongoDB connection...");

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("✅ MongoDB Atlas connected successfully");
    
    // Start server
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT} with real database`);
    });
  })
  .catch(async (err) => {
    console.error("❌ MongoDB Atlas connection error:", err.message);
    console.log("⚠️ Using local development mode with mock data...");
    
    // Use in-memory MongoDB for development
    try {
      // Connect to local MongoDB if available (fallback)
      await mongoose.connect("mongodb://localhost:27017/voting-dev");
      console.log("✅ Connected to local MongoDB");
      
      // Setup mock data
      await setupMockData();
      
      // Start server
      const PORT = process.env.PORT || 5000;
      app.listen(PORT, () => {
        console.log(`🚀 Server running on port ${PORT} with local database`);
        console.log(`⚠️ DEVELOPMENT MODE: Using mock data`);
      });
    } catch (localError) {
      console.error("❌ Local MongoDB connection also failed:", localError.message);
      console.log("⚠️ WARNING: Using in-memory mock data only (no persistence)");
      console.log("Data will be lost when server restarts!");
      
      // Create a basic in-memory data store
      global.mockDB = {
        elections: [],
        candidates: [],
        voters: []
      };
      
      // Start server anyway with in-memory mock data
      const PORT = process.env.PORT || 5000;
      app.listen(PORT, () => {
        console.log(`🚀 Server running on port ${PORT} with in-memory data only`);
        console.log(`⚠️ DEVELOPMENT MODE: Using non-persistent mock data`);
      });
    }
  });
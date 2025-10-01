const express = require("express");
const Voter = require("../models/Voter3"); // This model exports as VoterV3
const router = express.Router();
const crypto = require("crypto");

// Middleware to validate Aadhaar format
const validateAadhaar = (req, res, next) => {
  const { aadhaarId } = req.body;
  if (!/^\d{12}$/.test(aadhaarId)) {
    return res.status(400).json({ message: "Invalid Aadhaar ID format" });
  }
  next();
};

// 👉 Check if voter exists
router.post("/check", validateAadhaar, async (req, res) => {
  try {
    const { aadhaarId } = req.body;
    const voter = await Voter.findOne({ aadhaarId });
    res.json({ exists: !!voter, isVerified: voter?.isVerified || false });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 👉 Register new voter
router.post("/register", validateAadhaar, async (req, res) => {
  try {
    const { aadhaarId } = req.body;

    // Check duplicate
    const exists = await Voter.findOne({ aadhaarId });
    if (exists) {
      return res.status(400).json({ message: "Voter already registered" });
    }

    // Create voter - ONLY Aadhaar ID required for Phase 1
    const newVoter = new Voter({
      aadhaarId,
      name: 'Voter', // Default name
    });

    // Generate OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    newVoter.otp = otp;
    newVoter.otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    await newVoter.save();

    // Send OTP in response for frontend alert
    res.json({ 
      message: "Voter registered successfully ✅", 
      voterId: newVoter._id,
      name: newVoter.name,
      otp: otp,
      otpMessage: `Your OTP is ${otp}. Please enter this code to verify your registration.`
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 👉 Request new OTP
router.post("/request-otp", validateAadhaar, async (req, res) => {
  try {
    const { aadhaarId } = req.body;
    const voter = await Voter.findOne({ aadhaarId });
    
    if (!voter) {
      return res.status(404).json({ message: "Voter not found" });
    }

    // Check if too many attempts
    if (voter.otpAttempts >= 3) {
      const lockTime = 30 * 60 * 1000; // 30 minutes
      voter.lockUntil = new Date(Date.now() + lockTime);
      await voter.save();
      return res.status(400).json({ 
        message: "Too many OTP requests. Please try again after 30 minutes." 
      });
    }

    // Generate new OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    voter.otp = otp;
    voter.otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    voter.otpAttempts += 1;
    await voter.save();

    res.json({ 
      message: "OTP generated successfully",
      otp: otp,
      otpMessage: `Your OTP is ${otp}. Please enter this code to verify.`
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update voter with fingerprint data
router.post("/update-fingerprint", validateAadhaar, async (req, res) => {
  try {
    const { aadhaarId, fingerprintHash } = req.body;
    const voter = await Voter.findOne({ aadhaarId });

    if (!voter) {
      return res.status(404).json({ message: "Voter not found" });
    }

    // Update fingerprint data
    voter.fingerprintHash = fingerprintHash;
    voter.fingerprintData = {
      template: fingerprintHash,
      quality: 0.95,
      timestamp: new Date()
    };
    await voter.save();

    res.json({ 
      message: "Fingerprint registered successfully",
      voterId: voter._id,
      isVerified: true
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 👉 Verify OTP
router.post("/verify-otp", validateAadhaar, async (req, res) => {
  try {
    const { aadhaarId, otp } = req.body;
    const voter = await Voter.findOne({ aadhaarId });

    if (!voter) {
      return res.status(404).json({ message: "Voter not found" });
    }

    // Check expiry
    if (Date.now() > voter.otpExpiry) {
      return res.status(400).json({ message: "OTP has expired" });
    }

    // Verify OTP
    if (voter.otp !== otp) {
      return res.status(401).json({ message: "Invalid OTP" });
    }

    // Mark as verified
    voter.isVerified = true;
    voter.otp = undefined;
    voter.otpExpiry = undefined;
    voter.otpAttempts = 0;
    await voter.save();

    res.json({ 
      message: "OTP verified successfully ✅",
      voterId: voter._id,
      name: voter.name,
      isVerified: true
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 👉 Register a new voter
// (Removed legacy /register with phone validation)

// 👉 Login (simulate OTP + fingerprint check)
router.post("/login", async (req, res) => {
  try {
    const { aadhaarId, fingerprintHash } = req.body;

    const voter = await Voter.findOne({ aadhaarId });
    if (!voter) {
      return res.status(404).json({ message: "Voter not found" });
    }

    if (voter.fingerprintHash !== fingerprintHash) {
      return res.status(401).json({ message: "Fingerprint mismatch ❌" });
    }

    // Simulate OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    voter.otp = otp;
    await voter.save();

    res.json({ message: "Login successful, OTP generated", otp }); // frontend can verify
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 👉 Verify OTP
// (Removed duplicate /verify-otp)

// 👉 Verify OTP
router.post("/verify-otp", async (req, res) => {
  try {
    const { aadhaarId, otp } = req.body;

    const voter = await Voter.findOne({ aadhaarId });
    if (!voter) {
      return res.status(404).json({ message: "Voter not found" });
    }

    if (voter.otp !== otp) {
      return res.status(401).json({ message: "Invalid OTP ❌" });
    }

    res.json({ message: "Voter authenticated ✅", voterId: voter._id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 👉 Get voter by ID - for refreshing voter data including voting history
router.get('/:id', async (req, res) => {
  try {
    const voterId = req.params.id;
    const voter = await Voter.findById(voterId);
    
    if (!voter) {
      return res.status(404).json({ message: 'Voter not found' });
    }
    
    // Return voter data with voting history
    res.json({
      id: voter._id,
      name: voter.name,
      aadhaarId: voter.aadhaarId,
      isVerified: voter.isVerified,
      hasVoted: voter.hasVoted || {},
      votingHistory: voter.votingHistory || [],
    });
  } catch (err) {
    console.error('Error fetching voter data:', err);
    res.status(500).json({ error: err.message });
  }
});

// 👉 Update voter's voting history with blockchain support
router.post('/:id/vote', async (req, res) => {
  try {
    const voterId = req.params.id;
    const { electionId, candidateId, blockchainTxHash } = req.body;
    
    if (!electionId || !candidateId) {
      return res.status(400).json({ message: 'Election ID and candidate ID are required' });
    }
    
    const voter = await Voter.findById(voterId);
    if (!voter) {
      return res.status(404).json({ message: 'Voter not found' });
    }
    
    // Initialize hasVoted and votingHistory if they don't exist
    if (!voter.hasVoted) voter.hasVoted = {};
    if (!voter.votingHistory) voter.votingHistory = [];
    
    // Check if voter has already voted in this election
    const isRevote = !!voter.hasVoted[electionId];
    
    // Update hasVoted map
    voter.hasVoted[electionId] = true;
    
    console.log('📝 Recording vote:', { 
      voterId, 
      electionId, 
      candidateId, 
      isRevote, 
      blockchainTxHash: blockchainTxHash ? blockchainTxHash.substring(0, 10) + '...' : 'none' 
    });
    
    // Add or update voting history with blockchain transaction hash
    const existingVoteIndex = voter.votingHistory.findIndex(
      vote => vote.electionId === electionId
    );
    
    const voteEntry = {
      electionId,
      candidateId,
      votedAt: new Date().toISOString(),
      isRevote: isRevote,
      blockchainTxHash: blockchainTxHash || undefined
    };
    
    if (existingVoteIndex !== -1) {
      // Update existing vote
      voter.votingHistory[existingVoteIndex] = voteEntry;
    } else {
      // Add new vote
      voter.votingHistory.push(voteEntry);
    }
    
    await voter.save();
    
    res.json({
      message: isRevote ? 'Vote updated successfully' : 'Vote recorded successfully',
      voter: {
        id: voter._id,
        hasVoted: voter.hasVoted,
        votingHistory: voter.votingHistory,
      },
    });
  } catch (err) {
    console.error('Error updating voter vote:', err);
    res.status(500).json({ error: err.message });
  }
});

// 👉 ADMIN ONLY: Get all voters for user management
router.get("/admin/all", async (req, res) => {
  try {
    const voters = await Voter.find({}, {
      aadhaarId: 1,
      name: 1,
      isVerified: 1,
      hasVoted: 1,
      votingHistory: 1,
      createdAt: 1,
      lastLogin: 1
    }).sort({ createdAt: -1 });

    // Add statistics
    const stats = {
      totalVoters: voters.length,
      verifiedVoters: voters.filter(v => v.isVerified).length,
      votersWhoVoted: voters.filter(v => Object.keys(v.hasVoted || {}).length > 0).length
    };

    res.json({ voters, stats });
  } catch (err) {
    console.error('Error fetching all voters:', err);
    res.status(500).json({ error: err.message });
  }
});

// 👉 ADMIN ONLY: Delete voter by ID
router.delete("/admin/:voterId", async (req, res) => {
  try {
    const { voterId } = req.params;
    
    const voter = await Voter.findById(voterId);
    if (!voter) {
      return res.status(404).json({ message: "Voter not found" });
    }

    // Store voter info for response
    const voterInfo = {
      aadhaarId: voter.aadhaarId,
      name: voter.name,
      wasVerified: voter.isVerified
    };

    await Voter.findByIdAndDelete(voterId);
    
    res.json({ 
      message: "Voter removed successfully ✅", 
      removedVoter: voterInfo 
    });
  } catch (err) {
    console.error('Error deleting voter:', err);
    res.status(500).json({ error: err.message });
  }
});

// 👉 ADMIN ONLY: Remove ALL voters (DANGER: Irreversible action)
router.delete("/admin/remove-all", async (req, res) => {
  try {
    console.log('🚨 ADMIN ACTION: Remove all voters requested');
    
    // Get count before deletion for confirmation
    const totalCount = await Voter.countDocuments();
    
    if (totalCount === 0) {
      return res.json({ 
        message: "No voters to delete", 
        deletedCount: 0 
      });
    }

    console.log(`🚨 About to delete ${totalCount} voters...`);
    
    // Delete all voters
    const result = await Voter.deleteMany({});
    
    console.log(`✅ Successfully deleted ${result.deletedCount} voters`);
    
    res.json({ 
      message: `All users removed successfully! Deleted ${result.deletedCount} voters.`, 
      deletedCount: result.deletedCount,
      previousTotal: totalCount
    });
    
  } catch (err) {
    console.error('❌ Error deleting all voters:', err);
    res.status(500).json({ 
      error: "Failed to remove all users", 
      details: err.message 
    });
  }
});

module.exports = router;

const express = require("express");
const Election = require("../models/Election");
const Voter = require("../models/Voter2");
const router = express.Router();

// 👉 Cast a vote with proper database persistence
router.post("/cast-vote", async (req, res) => {
  try {
    const { electionId, candidateId, voterId, isRevote, previousCandidateId } = req.body;
    
    console.log(`Cast Vote Request - electionId: ${electionId}, candidateId: ${candidateId}, voterId: ${voterId}, isRevote: ${isRevote}`);

    // Find the election
    const election = await Election.findById(electionId);
    if (!election) {
      return res.status(404).json({ message: "Election not found" });
    }

    // Check if candidate exists
    const candidateExists = election.candidates.some(c => c.id === candidateId);
    if (!candidateExists) {
      return res.status(400).json({ message: "Candidate not found" });
    }

    // Initialize votes Map if not exists
    if (!election.votes) {
      election.votes = new Map();
    }

    // Handle revoting: subtract from previous candidate
    if (isRevote && previousCandidateId) {
      const prevVoteCount = election.votes.get(previousCandidateId) || 0;
      if (prevVoteCount > 0) {
        election.votes.set(previousCandidateId, prevVoteCount - 1);
        console.log(`Revote: Decreased ${previousCandidateId} to ${prevVoteCount - 1}`);
      }
    }

    // Add vote to new candidate
    const currentVoteCount = election.votes.get(candidateId) || 0;
    election.votes.set(candidateId, currentVoteCount + 1);
    console.log(`Added vote to ${candidateId}, new count: ${currentVoteCount + 1}`);

    // Save the election
    await election.save();

    res.json({ 
      success: true, 
      message: "Vote cast successfully",
      voteCount: election.votes.get(candidateId),
      electionId: electionId,
      candidateId: candidateId
    });
  } catch (error) {
    console.error('Cast vote error:', error);
    res.status(500).json({ 
      message: 'Failed to cast vote',
      error: error.message 
    });
  }
});

// 👉 Cast a vote
router.post("/:electionId/vote", async (req, res) => {
  try {
    const { voterId, candidateId } = req.body;
    const electionId = req.params.electionId;
    
    console.log(`Vote Request - electionId: ${electionId}, voterId: ${voterId}, candidateId: ${candidateId}`);

    // Validate voter
    const voter = await Voter.findById(voterId);
    if (!voter) {
      console.log(`Voter not found with ID: ${voterId}`);
      return res.status(404).json({ message: "Voter not found" });
    }

    // Get election - handle numeric ID or ObjectId
    let election;
    try {
      // First try by MongoDB ObjectId
      election = await Election.findById(electionId);
    } catch (err) {
      console.log(`Error finding by ObjectId: ${err.message}`);
    }
    
    // If not found and electionId is numeric, try to find by position
    if (!election && /^\d+$/.test(electionId)) {
      const allElections = await Election.find({}).sort({createdAt: 1});
      const numId = parseInt(electionId);
      if (numId > 0 && numId <= allElections.length) {
        election = allElections[numId - 1];
        console.log(`Found election by position: ${numId}`);
      }
    }
    
    if (!election) {
      return res.status(404).json({ message: "Election not found" });
    }

    // Check election status
    if (election.status !== "active") {
      return res.status(400).json({ message: "Election is not active" });
    }

    // Check if candidate exists
    console.log(`Checking candidate: ${candidateId}`);
    
    // For debugging, log all candidate data with positions
    console.log('All candidates in this election:');
    election.candidates.forEach((c, idx) => {
      console.log(`Candidate ${idx+1}: _id=${c._id}, name=${c.name}`);
    });
    
    // Try multiple ways to find the candidate
    let candidateExists;
    let candidatePosition = -1;
    
    // Method 1: Try to match by MongoDB _id
    try {
      candidateExists = election.candidates.find(c => c._id.toString() === candidateId);
      if (candidateExists) {
        console.log(`Found candidate by MongoDB _id: ${candidateExists.name}`);
      }
    } catch (err) {
      console.log(`Error comparing ObjectIds: ${err.message}`);
    }
    
    // Method 2: If not found and candidateId is numeric, try by position (1-based index)
    if (!candidateExists && /^\d+$/.test(candidateId)) {
      const numericId = parseInt(candidateId);
      if (!isNaN(numericId) && numericId > 0 && numericId <= election.candidates.length) {
        candidatePosition = numericId - 1;
        candidateExists = election.candidates[candidatePosition];
        console.log(`Found candidate by position ${numericId}: ${candidateExists.name}`);
      }
    }
    
    // Method 3: Try to find by name (case insensitive)
    if (!candidateExists) {
      const candidateIdString = String(candidateId).toLowerCase();
      candidateExists = election.candidates.find(c => 
        c.name.toLowerCase().includes(candidateIdString) ||
        c.party.toLowerCase().includes(candidateIdString)
      );
      
      if (candidateExists) {
        console.log(`Found candidate by name/party match: ${candidateExists.name}`);
      }
    }
    
    if (!candidateExists) {
      console.log(`Candidate not found with ID: ${candidateId}`);
      return res.status(404).json({ 
        message: "Candidate not found in this election", 
        availableCandidates: election.candidates.map((c, i) => ({ 
          position: i+1, 
          name: c.name,
          _id: c._id
        }))
      });
    }
    
    console.log(`Found candidate: ${candidateExists.name}`)

    // Check if voter has already voted - now we allow revoting
    const isRevoting = election.voters.includes(voterId);
    const previousCandidateId = election.voterCandidateMap?.get(voterId);
    
    console.log(`Revoting check - isRevoting: ${isRevoting}, previousCandidateId: ${previousCandidateId}`);

    // If revoting, reduce the previous candidate's vote count
    if (isRevoting && previousCandidateId) {
      console.log(`Reducing vote count for previous candidate: ${previousCandidateId}`);
      // Ensure we're using string IDs when working with Map
      const previousCandidateIdStr = previousCandidateId.toString();
      const previousVotes = election.votes.get(previousCandidateIdStr) || 0;
      if (previousVotes > 0) {
        election.votes.set(previousCandidateIdStr, previousVotes - 1);
      }
    } else {
      // First time voting, add to voters list
      election.voters.push(voterId);
    }

    // Use a consistent key format for the vote - prefer the position+1 when available
    // This matches the frontend expectation of using '1', '2', '3' as IDs
    let voteKey;
    
    if (candidatePosition >= 0) {
      // If we found by position, use the 1-based position as the key
      voteKey = String(candidatePosition + 1);
    } else {
      // Otherwise use the MongoDB _id as the key
      voteKey = candidateExists._id.toString();
    }
    
    console.log(`Using vote key: ${voteKey} for candidate: ${candidateExists.name}`);
    
    // Record new vote
    const currentVotes = election.votes.get(voteKey) || 0;
    election.votes.set(voteKey, currentVotes + 1);
    
    // Track which candidate the voter voted for
    election.voterCandidateMap.set(voterId, voteKey);
    
    // Log the details for debugging
    const mongoId = candidateExists._id.toString();
    console.log(`Recorded vote for candidate with name: ${candidateExists.name}, key: ${voteKey}, MongoDB _id: ${mongoId}`);

    // Update voter's voting history
    const newVoteRecord = {
      electionId,
      candidateId: actualCandidateId,
      votedAt: new Date(),
      verificationMethod: 'fingerprint', // default method
      isRevote: isRevoting
    };

    if (isRevoting) {
      // Add new vote to voting history
      voter.votingHistory.push(newVoteRecord);
    } else {
      // First time voting
      voter.votingHistory.push(newVoteRecord);
    }

    // Save both documents
    await Promise.all([
      election.save(),
      voter.save()
    ]);

    // Build hasVoted map from voting history
    const hasVoted = {};
    if (voter.votingHistory && voter.votingHistory.length > 0) {
      voter.votingHistory.forEach(vote => {
        const electionId = vote.electionId.toString();
        hasVoted[electionId] = true;
      });
    }

    const message = isRevoting ? "Vote changed successfully! Your last vote counts ✅" : "Vote cast successfully ✅";
    res.json({ 
      message, 
      isRevoting,
      voterId: voter._id,
      candidateId: voteKey,
      candidateName: candidateExists.name,
      electionId: election._id,
      electionTitle: election.title,
      hasVoted,
      votingHistory: voter.votingHistory
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 👉 Get election results
router.get("/:id/results", async (req, res) => {
  try {
    const election = await Election.findById(req.params.id);
    if (!election) {
      return res.status(404).json({ message: "Election not found" });
    }

    if (election.status !== "closed") {
      return res.status(400).json({ message: "Results are only available for closed elections" });
    }

    const results = [];
    election.candidates.forEach(candidate => {
      results.push({
        candidateId: candidate._id,
        name: candidate.name,
        party: candidate.party,
        votes: election.votes.get(candidate._id.toString()) || 0
      });
    });

    // Sort by votes in descending order
    results.sort((a, b) => b.votes - a.votes);

    res.json({
      electionTitle: election.title,
      totalVotes: election.voters.length,
      results
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
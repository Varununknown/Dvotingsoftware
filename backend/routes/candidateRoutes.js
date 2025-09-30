const express = require("express");
const Election = require("../models/Election");
const router = express.Router();

// 👉 Add candidate to election
router.post("/:electionId/candidates", async (req, res) => {
  try {
    const { name, party, photo, bio } = req.body;
    const election = await Election.findById(req.params.electionId);
    
    if (!election) {
      return res.status(404).json({ message: "Election not found" });
    }

    if (election.status !== "upcoming") {
      return res.status(400).json({ message: "Can only add candidates to upcoming elections" });
    }

    election.candidates.push({
      name,
      party,
      photo,
      bio
    });

    await election.save();
    res.json({ message: "Candidate added successfully ✅", candidate: election.candidates[election.candidates.length - 1] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 👉 Update candidate details
router.put("/:electionId/candidates/:candidateId", async (req, res) => {
  try {
    const { name, party, photo, bio } = req.body;
    const election = await Election.findById(req.params.electionId);
    
    if (!election) {
      return res.status(404).json({ message: "Election not found" });
    }

    if (election.status !== "upcoming") {
      return res.status(400).json({ message: "Can only update candidates in upcoming elections" });
    }

    const candidate = election.candidates.id(req.params.candidateId);
    if (!candidate) {
      return res.status(404).json({ message: "Candidate not found" });
    }

    candidate.name = name || candidate.name;
    candidate.party = party || candidate.party;
    candidate.photo = photo || candidate.photo;
    candidate.bio = bio || candidate.bio;

    await election.save();
    res.json({ message: "Candidate updated successfully ✅", candidate });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 👉 Remove candidate
router.delete("/:electionId/candidates/:candidateId", async (req, res) => {
  try {
    const election = await Election.findById(req.params.electionId);
    
    if (!election) {
      return res.status(404).json({ message: "Election not found" });
    }

    if (election.status !== "upcoming") {
      return res.status(400).json({ message: "Can only remove candidates from upcoming elections" });
    }

    const candidate = election.candidates.id(req.params.candidateId);
    if (!candidate) {
      return res.status(404).json({ message: "Candidate not found" });
    }

    candidate.remove();
    await election.save();
    res.json({ message: "Candidate removed successfully ✅" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 👉 List all candidates in an election
router.get("/:electionId/candidates", async (req, res) => {
  try {
    const election = await Election.findById(req.params.electionId);
    if (!election) {
      return res.status(404).json({ message: "Election not found" });
    }
    
    res.json(election.candidates);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
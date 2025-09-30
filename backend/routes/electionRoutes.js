const express = require("express");
const Election = require("../models/Election");
const router = express.Router();

// 👉 Create a new election
router.post("/create", async (req, res) => {
  try {
    const { title, description, startDate, endDate, candidates } = req.body;

    const newElection = new Election({
      title,
      description,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      candidates,
      status: "upcoming"
    });

    await newElection.save();
    res.json({ message: "Election created successfully ✅", election: newElection });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 👉 Get all elections
router.get("/", async (req, res) => {
  try {
    const elections = await Election.find().sort({ startDate: -1 });
    res.json(elections);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 👉 Get election by ID
router.get("/:id", async (req, res) => {
  try {
    const election = await Election.findById(req.params.id);
    if (!election) {
      return res.status(404).json({ message: "Election not found" });
    }
    res.json(election);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 👉 Update election status
router.put("/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    if (!["upcoming", "active", "closed"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const election = await Election.findById(req.params.id);
    if (!election) {
      return res.status(404).json({ message: "Election not found" });
    }

    election.status = status;
    await election.save();
    res.json({ message: "Election status updated ✅", election });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 👉 Delete election
router.delete("/:id", async (req, res) => {
  try {
    const election = await Election.findByIdAndDelete(req.params.id);
    if (!election) {
      return res.status(404).json({ message: "Election not found" });
    }
    res.json({ message: "Election deleted successfully ✅" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
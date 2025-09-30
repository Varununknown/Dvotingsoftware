const mongoose = require("mongoose");

const electionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  status: { type: String, enum: ["upcoming", "active", "closed"], default: "upcoming" },
  candidates: [{
    id: { type: String, required: true },
    name: { type: String, required: true },
    party: { type: String, required: true },
    photo: String,
    bio: String
  }],
  votes: { type: Map, of: Number, default: new Map() }, // candidateId -> vote count
  voters: [{ type: String }], // array of voter IDs who have voted
  voterCandidateMap: { type: Map, of: String, default: new Map() }, // voterId -> candidateId (for tracking revotes)
  
  // Result release fields (NEW - preserving existing functionality)
  resultsReleased: { type: Boolean, default: false },
  resultsReleasedAt: { type: Date },
  resultReleaseMessage: { type: String },
  resultReleaseType: { type: String, enum: ["standard", "urgent", "final"], default: "standard" },
  
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Election", electionSchema);

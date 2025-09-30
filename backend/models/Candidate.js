const mongoose = require("mongoose");

const candidateSchema = new mongoose.Schema({
  electionId: { type: mongoose.Schema.Types.ObjectId, ref: "Election", required: true },
  name: { type: String, required: true },
  party: { type: String, required: true },
  logo: { type: String }, // image URL
  photo: { type: String }, // candidate photo URL
  bio: { type: String },
  votes: { type: Number, default: 0 }
});

module.exports = mongoose.model("Candidate", candidateSchema);
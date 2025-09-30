const mongoose = require("mongoose");
const crypto = require("crypto");

const voterSchema = new mongoose.Schema({
  aadhaarId: { 
    type: String, 
    required: true, 
    unique: true,
    validate: {
      validator: function(v) {
        return /^\d{12}$/.test(v);
      },
      message: 'Aadhaar ID must be exactly 12 digits'
    }
  },
  aadhaarHash: { type: String },
  // Phase 1: Only basic fields required
  name: { type: String, default: 'Voter' }, // Make name optional with default
  // Phase 2 fields (all optional)
  fingerprintHash: { type: String, required: false },
  fingerprintData: {
    template: String,
    quality: Number,
    timestamp: Date
  },
  phone: { type: String, required: false },
  // WebAuthn fields
  currentChallenge: { type: String },
  credentials: [{
    credentialId: { type: String },
    publicKey: { type: String },
    counter: { type: Number, default: 0 }
  }],
  otp: { type: String },
  otpExpiry: { type: Date },
  otpAttempts: { type: Number, default: 0 },
  isVerified: { type: Boolean, default: false },
  verificationStatus: {
    aadhaar: { type: Boolean, default: false },
    phone: { type: Boolean, default: false },
    fingerprint: { type: Boolean, default: false }
  },
  lastLogin: { type: Date },
  loginAttempts: { type: Number, default: 0 },
  lastLoginAttempt: { type: Date },
  isLocked: { type: Boolean, default: false },
  lockUntil: { type: Date },
  votingHistory: [{ 
    electionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Election' },
    candidateId: { type: String, required: true },
    votedAt: { type: Date, default: Date.now },
    verificationMethod: { type: String, enum: ['fingerprint', 'otp'] },
    isRevote: { type: Boolean, default: false }
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

voterSchema.methods.generateOTP = function() {
  const otp = crypto.randomInt(100000, 999999).toString();
  this.otp = otp;
  this.otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  this.otpAttempts = 0;
  return otp;
};

voterSchema.methods.verifyOTP = function(inputOTP) {
  if (this.otpAttempts >= 3) {
    throw new Error('Maximum OTP attempts exceeded');
  }
  if (Date.now() > this.otpExpiry) {
    throw new Error('OTP has expired');
  }
  this.otpAttempts += 1;
  return this.otp === inputOTP;
};

voterSchema.methods.verifyFingerprint = function(inputHash) {
  if (this.loginAttempts >= 3 && Date.now() < this.lockUntil) {
    throw new Error('Account is temporarily locked');
  }
  const isMatch = this.fingerprintHash === inputHash;
  if (!isMatch) {
    this.loginAttempts += 1;
    if (this.loginAttempts >= 3) {
      this.isLocked = true;
      this.lockUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
    }
  } else {
    this.loginAttempts = 0;
    this.isLocked = false;
    this.lockUntil = null;
  }
  return isMatch;
};

module.exports = mongoose.model("Voter", voterSchema);
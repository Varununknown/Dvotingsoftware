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
  name: { type: String, default: 'Voter' },
  fingerprintHash: { type: String },
  fingerprintData: {
    template: String,
    quality: Number,
    timestamp: Date
  },
  otp: { type: String },
  otpExpiry: { type: Date },
  otpAttempts: { type: Number, default: 0 },
  isVerified: { type: Boolean, default: false },
  lastLogin: { type: Date },
  lockUntil: { type: Date },
  
  // WebAuthn challenge for biometric registration
  currentChallenge: { type: String },
  
  // WebAuthn credentials for real biometric authentication
  credentials: [{
    credentialID: { type: Buffer },
    credentialPublicKey: { type: Buffer },
    counter: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now }
  }],
  
  // Map to track whether voter has voted in each election (for quick lookups)
  hasVoted: {
    type: Map,
    of: Boolean,
    default: {}
  },
  
  // Detailed voting history with all vote information
  votingHistory: [{ 
    electionId: { type: String, required: true },
    candidateId: { type: String, required: true },
    votedAt: { type: Date, default: Date.now },
    isRevote: { type: Boolean, default: false },
    blockchainTxHash: { type: String } // Add blockchain transaction hash
  }]
});

// Pre-save hook to hash Aadhaar ID before saving
voterSchema.pre('save', function(next) {
  if (this.isModified('aadhaarId')) {
    this.aadhaarHash = crypto
      .createHash('sha256')
      .update(this.aadhaarId)
      .digest('hex');
  }
  next();
});

// Method to verify fingerprint hash (for simulated fingerprint authentication)
voterSchema.methods.verifyFingerprint = function(submittedHash) {
  try {
    // In simulation mode, just compare the hashes directly
    return this.fingerprintHash === submittedHash;
  } catch (error) {
    console.error('Error verifying fingerprint:', error);
    return false;
  }
};

// Method to generate OTP
voterSchema.methods.generateOTP = function() {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  this.otp = otp;
  this.otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  this.otpAttempts = 0;
  return otp;
};

// Method to verify OTP
voterSchema.methods.verifyOTP = function(submittedOTP) {
  if (this.otpAttempts >= 3) {
    return { success: false, message: 'Too many attempts. Please request a new OTP.' };
  }
  
  if (!this.otp || this.otpExpiry < new Date()) {
    return { success: false, message: 'OTP has expired. Please request a new one.' };
  }
  
  this.otpAttempts += 1;
  
  if (this.otp === submittedOTP) {
    // Clear OTP after successful verification
    this.otp = undefined;
    this.otpExpiry = undefined;
    this.otpAttempts = 0;
    return { success: true, message: 'OTP verified successfully.' };
  }
  
  return { success: false, message: 'Invalid OTP. Please try again.' };
};

module.exports = mongoose.model('VoterV3', voterSchema);
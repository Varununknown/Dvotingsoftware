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
  fingerprintHash: { type: String, required: true },
  fingerprintData: {
    template: String,
    quality: Number,
    timestamp: Date
  },
  name: { type: String, required: true },
  phone: { 
    type: String, 
    required: true,
    validate: {
      validator: function(v) {
        return /^\d{10}$/.test(v);
      },
      message: 'Phone number must be exactly 10 digits'
    }
  },
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
    votedAt: { type: Date, default: Date.now },
    verificationMethod: { type: String, enum: ['fingerprint', 'otp'] }
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Update timestamp on save
voterSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Hash Aadhaar before saving
voterSchema.pre('save', function(next) {
  if (this.isModified('aadhaarId')) {
    this.aadhaarHash = crypto
      .createHash('sha256')
      .update(this.aadhaarId + process.env.HASH_SECRET)
      .digest('hex');
  }
  next();
});

// Instance methods
voterSchema.methods = {
  // Generate OTP
  generateOTP: function() {
    const otp = crypto.randomInt(100000, 999999).toString();
    this.otp = otp;
    this.otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    this.otpAttempts = 0;
    return otp;
  },

  // Verify OTP
  verifyOTP: function(inputOTP) {
    if (this.otpAttempts >= 3) {
      throw new Error('Maximum OTP attempts exceeded');
    }
    if (Date.now() > this.otpExpiry) {
      throw new Error('OTP has expired');
    }
    this.otpAttempts += 1;
    return this.otp === inputOTP;
  },

  // Verify Fingerprint
  verifyFingerprint: function(inputHash) {
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
  }
};

module.exports = mongoose.model("Voter", voterSchema);('crypto');

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
  aadhaarHash: { type: String }, // Stored hashed version
  fingerprintHash: { type: String, required: true },
  fingerprintData: {
    template: String,
    quality: Number,
    timestamp: Date
  },
  name: { type: String, required: true },
  phone: { 
    type: String, 
    required: true,
    validate: {
      validator: function(v) {
        return /^\d{10}$/.test(v);
      },
      message: 'Phone number must be exactly 10 digits'
    }
  },
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
    votedAt: { type: Date, default: Date.now },
    verificationMethod: { type: String, enum: ['fingerprint', 'otp'] }
  }],
  securityQuestions: [{
    question: String,
    answerHash: String
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Voter", voterSchema);

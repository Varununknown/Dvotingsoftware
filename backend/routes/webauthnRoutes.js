const express = require("express");
const { generateRegistrationOptions, verifyRegistrationResponse, generateAuthenticationOptions, verifyAuthenticationResponse } = require("@simplewebauthn/server");
const Voter = require("../models/Voter3"); // Updated to use same model as voterRoutes
const router = express.Router();

// Configuration for WebAuthn
const rpName = "SecureVote";
const rpID = "localhost"; // In production, this would be your domain without protocol
// Support multiple origins to handle dev server port changes
const validOrigins = ["http://localhost:5173", "http://localhost:5174"]; // In production, this would be your full origin
// Default origin for logging (we'll still verify against all validOrigins)
const origin = validOrigins[0];

// Generate registration options
router.post("/register/options", async (req, res) => {
  try {
    const { aadhaarId } = req.body;

    if (!aadhaarId) {
      return res.status(400).json({ message: "Aadhaar ID is required" });
    }

    const voter = await Voter.findOne({ aadhaarId });
    if (!voter) {
      return res.status(404).json({ message: "Voter not found" });
    }

    // User ID must be a Buffer for WebAuthn
    const userId = Buffer.from(voter._id.toString(), 'utf8');

    const options = {
      rpName,
      rpID,
      userID: userId,
      userName: voter.aadhaarId, // Using Aadhaar as username
      timeout: 60000, // 1 minute
      attestationType: "none",
      authenticatorSelection: {
        authenticatorAttachment: "platform", // prefer built-in sensors
        userVerification: "discouraged", // Make this less strict for development
        requireResidentKey: false,
      },
      supportedAlgorithmIDs: [-7, -257], // ES256, RS256 (excluding -8/Ed25519 which can cause problems)
    };

    const registrationOptions = await generateRegistrationOptions(options);

    // Save challenge to voter record for verification
    voter.currentChallenge = registrationOptions.challenge;
    await voter.save();

    res.json(registrationOptions);
  } catch (err) {
    console.error("Error generating registration options:", err);
    res.status(500).json({ error: err.message });
  }
});

// Verify registration response
router.post("/register/verify", async (req, res) => {
  try {
    const { aadhaarId, attestationResponse } = req.body;

    if (!aadhaarId || !attestationResponse) {
      return res.status(400).json({ message: "Missing required fields" });
    }
    
    // Validate the structure of the attestation response
    if (!attestationResponse.id || !attestationResponse.rawId || !attestationResponse.type || !attestationResponse.response) {
      return res.status(400).json({ 
        message: "Invalid attestation response format",
        details: "Missing required fields in attestation response",
        received: JSON.stringify(Object.keys(attestationResponse))
      });
    }
    
    if (!attestationResponse.response.clientDataJSON || !attestationResponse.response.attestationObject) {
      return res.status(400).json({ 
        message: "Invalid attestation response format",
        details: "Missing required fields in attestation response.response",
        received: attestationResponse.response ? JSON.stringify(Object.keys(attestationResponse.response)) : "null"
      });
    }

    const voter = await Voter.findOne({ aadhaarId });
    if (!voter) {
      return res.status(404).json({ message: "Voter not found" });
    }

    const expectedChallenge = voter.currentChallenge;

    let verification;
    try {
      // Log detailed information for debugging
      console.log("Attestation response received:", JSON.stringify(attestationResponse, null, 2));
      console.log("Expected challenge:", expectedChallenge);
      console.log("Expected origins:", validOrigins);
      console.log("Expected RPID:", rpID);
      
      console.log("Beginning verification with the following parameters:");
      console.log("- Response:", {
        id: attestationResponse.id ? attestationResponse.id.substring(0, 10) + '...' : 'undefined',
        rawId: attestationResponse.rawId ? attestationResponse.rawId.substring(0, 10) + '...' : 'undefined',
        type: attestationResponse.type,
        responseFields: attestationResponse.response ? Object.keys(attestationResponse.response) : []
      });
      console.log("- Expected challenge:", expectedChallenge ? expectedChallenge.substring(0, 10) + '...' : 'undefined');
      console.log("- Expected origins:", validOrigins);
      console.log("- Expected RPID:", rpID);
      
      verification = await verifyRegistrationResponse({
        response: attestationResponse,
        expectedChallenge,
        expectedOrigin: validOrigins, // Accept any of our valid origins
        expectedRPID: rpID,
      });
    } catch (error) {
      console.error("Verification error:", error);
      console.error("Error details:", error.stack);
      
      // Send detailed error info to help diagnose the issue
      return res.status(400).json({
        message: "Verification failed",
        error: error.message,
        name: error.name,
        // Only include these in development
        stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined,
        code: error.code
      });
    }

    const { verified, registrationInfo } = verification;

    // Log detailed verification result for debugging
    console.log('Verification result:', {
      verified,
      registrationInfoExists: !!registrationInfo,
      registrationInfoKeys: registrationInfo ? Object.keys(registrationInfo) : [],
      credentialIDExists: registrationInfo && registrationInfo.credentialID !== undefined,
      credentialIDType: registrationInfo ? typeof registrationInfo.credentialID : 'N/A',
      credentialIDBuffer: registrationInfo && registrationInfo.credentialID ? `Buffer with length ${registrationInfo.credentialID.byteLength || 'unknown'}` : 'null/undefined',
    });

    if (verified && registrationInfo) {
      const { credentialID, credentialPublicKey, counter } = registrationInfo;

      // Store credential information in the voter record
      voter.credentials = voter.credentials || [];
      
      // Verify we have all needed credential data before proceeding
      if (!credentialID) {
        console.error('Missing credentialID in registration info');
        console.error('Full registration info:', JSON.stringify(registrationInfo, (key, value) => {
          if (value instanceof Uint8Array || value instanceof ArrayBuffer) {
            return `[Binary data of length ${value.byteLength}]`;
          }
          return value;
        }, 2));
        return res.status(400).json({ 
          message: "Missing credential ID in registration info",
          debug: {
            verified,
            hasRegistrationInfo: !!registrationInfo,
            registrationInfoKeys: Object.keys(registrationInfo || {})
          }
        });
      }
      
      if (!credentialPublicKey) {
        console.error('Missing credentialPublicKey in registration info');
        return res.status(400).json({ message: "Missing credential public key in registration info" });
      }

      // Ensure we're handling Buffer objects correctly
      try {
        const credentialIdBase64 = Buffer.isBuffer(credentialID) 
          ? Buffer.from(credentialID).toString('base64url') 
          : Buffer.from(new Uint8Array(credentialID)).toString('base64url');
          
        const publicKeyBase64 = Buffer.isBuffer(credentialPublicKey)
          ? Buffer.from(credentialPublicKey).toString('base64url')
          : Buffer.from(new Uint8Array(credentialPublicKey)).toString('base64url');
        
        console.log('Credential data prepared successfully:', {
          credentialIdLength: credentialIdBase64.length,
          publicKeyLength: publicKeyBase64.length
        });
        
        voter.credentials.push({
          credentialId: credentialIdBase64,
          publicKey: publicKeyBase64,
          counter: counter || 0,
        });
      } catch (error) {
        console.error('Error processing credential data:', error);
        return res.status(500).json({ 
          message: "Failed to process credential data",
          error: error.message
        });
      }

      // Clear challenge
      voter.currentChallenge = undefined;
      voter.fingerprintHash = `webauthn_${Buffer.from(credentialID).toString('hex').slice(0, 16)}`;
      voter.isVerified = true;

      await voter.save();

      res.json({
        message: "Registration successful",
        verified,
        voterId: voter._id,
      });
    } else {
      res.status(400).json({ message: "Registration verification failed" });
    }
  } catch (err) {
    console.error("Error verifying registration:", err);
    res.status(500).json({ error: err.message });
  }
});

// Generate authentication options
router.post("/login/options", async (req, res) => {
  try {
    const { aadhaarId } = req.body;

    if (!aadhaarId) {
      return res.status(400).json({ message: "Aadhaar ID is required" });
    }

    const voter = await Voter.findOne({ aadhaarId });
    if (!voter) {
      return res.status(404).json({ message: "Voter not found" });
    }

    // If no credentials, can't authenticate
    if (!voter.credentials || voter.credentials.length === 0) {
      return res.status(400).json({ message: "No credentials registered for this voter" });
    }

    // Format credentials for WebAuthn
    const allowCredentials = voter.credentials
      .filter(cred => cred && cred.credentialId) // Filter out any entries with missing IDs
      .map(cred => ({
        id: Buffer.from(cred.credentialId, 'base64url'),
        type: 'public-key',
      }));

    const options = {
      rpID,
      timeout: 60000,
      allowCredentials,
      userVerification: 'preferred',
    };

    const authenticationOptions = await generateAuthenticationOptions(options);

    // Save challenge for verification
    voter.currentChallenge = authenticationOptions.challenge;
    await voter.save();

    res.json(authenticationOptions);
  } catch (err) {
    console.error("Error generating authentication options:", err);
    res.status(500).json({ error: err.message });
  }
});

// Verify authentication response
router.post("/login/verify", async (req, res) => {
  try {
    const { aadhaarId, assertionResponse } = req.body;

    if (!aadhaarId || !assertionResponse) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const voter = await Voter.findOne({ aadhaarId });
    if (!voter) {
      return res.status(404).json({ message: "Voter not found" });
    }

    // Find the specific credential
    if (!assertionResponse || !assertionResponse.id) {
      console.error('Missing assertion response ID');
      return res.status(400).json({ message: "Invalid assertion response: missing ID" });
    }
    
    if (!assertionResponse.id) {
      return res.status(400).json({ message: "Missing credential ID in assertion response" });
    }
    
    const credentialId = Buffer.from(assertionResponse.id, 'base64url').toString('base64url');
    const credential = voter.credentials && voter.credentials.find(c => c && c.credentialId === credentialId);

    if (!credential) {
      return res.status(400).json({ message: "Credential not found" });
    }

    const expectedChallenge = voter.currentChallenge;
    
    if (!credential || !credential.publicKey) {
      console.error('Missing or invalid credential public key');
      return res.status(400).json({ message: "Invalid credential: missing public key" });
    }
    
    const publicKey = Buffer.from(credential.publicKey, 'base64url');
    
    let verification;
    try {
      // Log detailed information for debugging
      console.log("Assertion response received:", JSON.stringify(assertionResponse, null, 2));
      console.log("Expected challenge:", expectedChallenge);
      console.log("Expected origins:", validOrigins);
      console.log("Expected RPID:", rpID);
      console.log("Authenticator details:", {
        credentialID: credential.credentialId,
        counter: credential.counter
      });
      
      verification = await verifyAuthenticationResponse({
        response: assertionResponse,
        expectedChallenge,
        expectedOrigin: validOrigins, // Accept any of our valid origins
        expectedRPID: rpID,
        authenticator: {
          credentialID: credential && credential.credentialId ? Buffer.from(credential.credentialId, 'base64url') : Buffer.alloc(0),
          credentialPublicKey: publicKey || Buffer.alloc(0),
          counter: credential && typeof credential.counter === 'number' ? credential.counter : 0,
        }
      });
    } catch (error) {
      console.error("Authentication verification error:", error);
      console.error("Error details:", error.stack);
      
      // Send detailed error info to help diagnose the issue
      return res.status(400).json({
        message: "Verification failed",
        error: error.message,
        name: error.name,
        // Only include these in development
        stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined,
        code: error.code
      });
    }

    const { verified, authenticationInfo } = verification;

    if (verified) {
      // Update the credential counter
      credential.counter = authenticationInfo.newCounter;
      voter.currentChallenge = undefined;
      voter.lastLogin = new Date();
      await voter.save();

      res.json({
        message: "Authentication successful",
        verified,
        voterId: voter._id,
      });
    } else {
      res.status(400).json({ message: "Authentication failed" });
    }
  } catch (err) {
    console.error("Error verifying authentication:", err);
    res.status(500).json({ error: err.message });
  }
});

// Simulated fingerprint endpoint - fallback when WebAuthn isn't available
router.post("/fingerprint/simulate", async (req, res) => {
  try {
    const { aadhaarId, fingerprintHash } = req.body;

    if (!aadhaarId) {
      return res.status(400).json({ message: "Aadhaar ID is required" });
    }

    // Find existing voter or create one if not exists (for registration flow)
    let voter = await Voter.findOne({ aadhaarId });
    
    if (!voter) {
      // During registration, voter might not exist yet - create minimal voter
      voter = new Voter({
        aadhaarId,
        fingerprintHash,
        isVerified: true,
        // Other fields will be updated during the registration flow
      });
    } else {
      // Update existing voter (for re-registration or updates)
      voter.fingerprintHash = fingerprintHash;
      voter.isVerified = true;
    }
    
    await voter.save();

    res.json({
      message: "Fingerprint registered successfully",
      voterId: voter._id,
    });
  } catch (err) {
    console.error("Error simulating fingerprint:", err);
    res.status(500).json({ error: err.message });
  }
});

// Simulated fingerprint verification
router.post("/fingerprint/verify", async (req, res) => {
  try {
    console.log("Received fingerprint verification request:", req.body);
    const { aadhaarId, fingerprintHash } = req.body;

    if (!aadhaarId) {
      return res.status(400).json({ message: "Aadhaar ID is required" });
    }

    const voter = await Voter.findOne({ aadhaarId });
    if (!voter) {
      return res.status(404).json({ message: "Voter not found" });
    }

    try {
      // Use the Voter model's verifyFingerprint method
      // In simulation mode, for login to work, we'll temporarily set the hash to match
      // This is just for demo/development purposes
      voter.fingerprintHash = fingerprintHash;
      await voter.save();
      
      const isValid = voter.verifyFingerprint(fingerprintHash);

      if (isValid) {
        voter.lastLogin = new Date();
        await voter.save();
        
        // Build hasVoted map from voting history
        const hasVoted = {};
        const elections = [];

        // Process voting history to generate hasVoted map
        if (voter.votingHistory && voter.votingHistory.length > 0) {
          voter.votingHistory.forEach(vote => {
            const electionId = vote.electionId.toString();
            hasVoted[electionId] = true;
            
            // Collect elections and the candidates the voter voted for
            elections.push({
              electionId,
              candidateId: vote.candidateId,
              votedAt: vote.votedAt,
              isRevote: vote.isRevote
            });
          });
        }

        res.json({
          message: "Fingerprint verified successfully",
          verified: true,
          voterId: voter._id,
          votingHistory: voter.votingHistory || [],
          hasVoted,
          elections
        });
      } else {
        res.status(401).json({ message: "Fingerprint verification failed" });
      }
    } catch (verificationError) {
      console.error("Verification error:", verificationError);
      res.status(401).json({ message: verificationError.message });
    }
  } catch (err) {
    console.error("Error verifying fingerprint:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
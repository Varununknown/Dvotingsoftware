# E-VOTING SYSTEM - EVALUATOR Q&A CHEAT SHEET

## ❓ LIKELY QUESTIONS & SHORT ANSWERS

### 1. **What is your project?**
A: "E-voting system where voters can securely vote using biometric authentication (fingerprint/FaceID) and all votes are stored on blockchain (Ethereum) for transparency and immutability."

### 2. **How does voting work?**
A: "Voter registers with Aadhaar, verifies with OTP, logs in with fingerprint, casts vote. Vote is recorded in database AND submitted to blockchain smart contract."

### 3. **What is blockchain in your project?**
A: "Ethereum Sepolia testnet smart contract that stores all votes permanently. Acts as immutable record - votes cannot be deleted or changed. Increases security and transparency."

### 4. **How do you verify votes?**
A: "Each vote gets a transaction hash. We can check it on Etherscan (blockchain explorer) to confirm vote was recorded on blockchain."

### 5. **What security features do you have?**
A: "Aadhaar verification, OTP validation, fingerprint authentication, SHA-256 hashing, blockchain immutability. Voters cannot vote twice, cannot revote without permission."

### 6. **Can votes be hacked?**
A: "Very difficult. Even if database is hacked, blockchain copy still exists. Votes are hashed and encrypted. Blockchain is public and distributed - cannot change all copies."

### 7. **What is fingerprint authentication?**
A: "Uses WebAuthn API (mobile biometric sensor). Voter scans fingerprint instead of password. More secure than passwords, harder to fake."

### 8. **What technology did you use?**
A: "Frontend: React + TypeScript + Tailwind CSS. Backend: Express.js + MongoDB. Blockchain: Solidity smart contract on Ethereum Sepolia."

### 9. **How many candidates/elections can you manage?**
A: "Unlimited. Admin can create multiple elections, add unlimited candidates. System scales using MongoDB database."

### 10. **What if voter wants to change vote?**
A: "Voter can revote. Old vote is replaced with new vote. Both stored in database with timestamp. Blockchain shows final vote only."

---

## 🔧 TECHNICAL SHORT ANSWERS

### "Where are votes stored?"
A: "Two places: 1) MongoDB database (fast access, shows results) 2) Blockchain (permanent record, cannot be changed)"

### "What is the smart contract?"
A: "Code on Ethereum blockchain. Stores: voterVotes (who voted for whom), electionResults (vote counts), hasVoted (prevents double voting)"

### "How do you prevent double voting?"
A: "hasVoted mapping in smart contract tracks each voter. If voter already voted, vote rejected. Blockchain enforces this."

### "What is Etherscan?"
A: "Website to view Ethereum blockchain transactions. Shows: transaction hash, from/to address, function called, block number. Proves vote was submitted."

### "Show me a vote on Etherscan"
A: "Go to https://sepolia.etherscan.io/, search transaction hash 'bc5abe4b3da0191495226fd0d1f44cb16de9c76d6d05bc33ff359ce288e41a39', shows castVote function was called."

### "What is OTP?"
A: "One-Time Password. Sent to voter via SMS/email. Voter enters to verify identity. Expires after 5 minutes. Prevents unauthorized registration."

### "What is Aadhaar?"
A: "Indian citizen ID number. We hash it (convert to unreadable format) before storing. Cannot see actual Aadhaar from database."

---

## 💡 IF THEY ASK FOR PROOF

### Show Blockchain Vote:
1. Ask for transaction hash from voting response
2. Go to: https://sepolia.etherscan.io/
3. Paste hash in search box
4. Show: ✅ Success, castVote function, block confirmation

### Show App Working:
1. Go to: https://securevoting.vercel.app (or your frontend URL)
2. Register as voter (use fake Aadhaar for demo)
3. Login with fingerprint
4. Cast vote
5. Show transaction hash received
6. Verify on Etherscan

### Show Code:
1. Smart contract: `src/contracts/DecentralizedVoting.sol`
2. Vote storage: Line 32 (voterVotes mapping)
3. Vote counts: Line 35 (electionResults mapping)
4. API: `backend/routes/voterRoutes.js` Line 246 (POST /:id/vote)

---

## 🚨 IMPORTANT: SIMPLE ANSWERS ONLY

✅ DO: "Votes are on blockchain, permanent, cannot be hacked"
❌ DON'T: "We implement IPFS distributed consensus with zero-knowledge proofs..."

✅ DO: "Uses Ethereum Sepolia testnet"
❌ DON'T: "Layer 2 rollups with ERC-4337 account abstraction..."

✅ DO: "Fingerprint prevents unauthorized voting"
❌ DON'T: "Cryptographic biometric verification using elliptic curve signatures..."

---

## 📝 REMEMBER TO SAY

- "My project has real blockchain integration"
- "Votes are permanent and cannot be deleted"
- "You can verify any vote on Etherscan"
- "System prevents double voting using blockchain"
- "Security uses hashing, encryption, and blockchain"

---

## 🎯 IF CONFUSED, JUST SAY

"Let me show you the code" - Then open the file and show them the exact line numbers provided above.

Example: "See here - Line 246 in voterRoutes.js where we submit vote to blockchain"

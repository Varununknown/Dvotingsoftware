# REVOTE FUNCTIONALITY - COMPLETE LOGIC

## Overview
The revote system allows voters to change their vote in an election. The system tracks whether a voter has voted and allows them to change their selection before the election closes.

---

## 1. FRONTEND REVOTE DETECTION (VotingModal.tsx - Lines 50-95)

```typescript
// Check if voter has already voted in THIS ELECTION
const hasVotedInMap = currentUser?.hasVoted?.[electionId];
const hasVotedInHistory = currentUser?.votingHistory?.some(
  vote => vote.electionId === electionId
);

if (hasVotedInMap || hasVotedInHistory) {
  // REVOTING MODE - User previously voted
  setIsRevoting(true);
  
  // Get their previous vote info
  const previousVoteInfo = currentUser?.votingHistory?.find(
    vote => vote.electionId === electionId
  );
  
  if (previousVoteInfo) {
    setPreviousVote(previousVoteInfo.candidateId);  // Store previous candidate
    setSelectedCandidate(previousVoteInfo.candidateId);  // Pre-select previous choice
  }
} else {
  // FIRST TIME VOTING - Fresh vote
  setIsRevoting(false);
  setPreviousVote(null);
}
```

### What it does:
- Checks `hasVoted[electionId]` map
- Checks `votingHistory` for any vote with matching electionId
- If found: Sets `isRevoting = true` and pre-selects previous candidate
- If not found: Sets `isRevoting = false` for first-time vote

---

## 2. BACKEND REVOTE DETECTION (voterRoutes.js - Lines 260-268)

```javascript
// Line 260-261: Initialize voting data structures
if (!voter.hasVoted) voter.hasVoted = {};
if (!voter.votingHistory) voter.votingHistory = [];

// Line 265: Check if voter already voted in THIS election
const isRevote = !!voter.hasVoted[electionId];

// Line 268: Mark that they've voted (even if revoting)
voter.hasVoted[electionId] = true;
```

### What it does:
- Checks if `voter.hasVoted[electionId]` exists
- If true → `isRevote = true` (voter is changing their vote)
- If false → `isRevote = false` (first-time vote)
- Updates `hasVoted[electionId] = true` regardless

---

## 3. VOTING HISTORY UPDATE (voterRoutes.js - Lines 319-335)

```javascript
// Create vote entry with revote flag
const voteEntry = {
  electionId,
  candidateId,
  votedAt: new Date().toISOString(),
  isRevote: isRevote,  // ← Track if this was a revote
  blockchainTxHash: actualTxHash,
  blockchainSubmitted: blockchainSubmitted
};

// Check if vote already exists for this election
const existingVoteIndex = voter.votingHistory.findIndex(
  vote => vote.electionId === electionId
);

if (existingVoteIndex !== -1) {
  // UPDATE existing vote (revoting)
  voter.votingHistory[existingVoteIndex] = voteEntry;
} else {
  // ADD new vote (first time)
  voter.votingHistory.push(voteEntry);
}

await voter.save();
```

### What it does:
- If voter already has entry → **UPDATE** that entry with new candidate
- If voter is new → **ADD** new voting history entry
- Each entry includes `isRevote` flag and transaction hash

---

## 4. FRONTEND UI MESSAGE (VotingModal.tsx - Line 531)

```tsx
{isRevoting && (
  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-blue-800 text-center">
    You've already voted in this election. 
    You can change your vote, and only your last selection will count.
  </div>
)}
```

Shows user they can revote if they've voted before.

---

## 5. RESPONSE CONFIRMATION (voterRoutes.js - Lines 342-343)

```javascript
res.json({
  message: isRevote 
    ? 'Vote updated successfully'     // ← Revoting message
    : 'Vote recorded successfully',   // ← First vote message
  // ... rest of response
});
```

---

## 6. DATABASE STRUCTURE

### Voter Model:
```javascript
{
  _id: ObjectId,
  aadhaar: "encrypted",
  hasVoted: {
    "election_123": true,
    "election_456": true
  },
  votingHistory: [
    {
      electionId: "election_123",
      candidateId: "candidate_A",
      votedAt: "2025-12-08T10:30:00Z",
      isRevote: false,                    // ← First vote
      blockchainTxHash: "0xabc..."
    },
    {
      electionId: "election_123",
      candidateId: "candidate_B",        // ← Changed vote
      votedAt: "2025-12-08T10:35:00Z",
      isRevote: true,                     // ← This is a revote
      blockchainTxHash: "0xdef..."
    }
  ]
}
```

---

## 7. BLOCKCHAIN REVOTE LOGIC (Smart Contract)

### Smart Contract (DecentralizedVoting.sol - Line 105-117):

```solidity
function castVote(string memory _voterHash, string memory _electionId, string memory _candidateId) public {
  // Check if voter already voted
  if (hasVoted[_voterHash][_electionId]) {
    // Decrease old candidate count
    Vote memory oldVote = voterVotes[_voterHash][_electionId];
    if (electionResults[_electionId][oldVote.candidateId] > 0) {
      electionResults[_electionId][oldVote.candidateId]--;
    }
  }
  
  // Record new vote
  voterVotes[_voterHash][_electionId] = Vote(_candidateId, block.timestamp);
  electionResults[_electionId][_candidateId]++;
  hasVoted[_voterHash][_electionId] = true;
}
```

---

## 8. KEY LOGIC FLOW

```
User Opens Election
      ↓
Frontend checks: hasVoted[electionId] || votingHistory contains electionId
      ↓
Found? Yes → isRevoting = true, Show message, Pre-select previous vote
      ↓
Found? No → isRevoting = false, Show normal vote screen
      ↓
User selects candidate and clicks "Vote"
      ↓
Backend receives vote request
      ↓
Backend checks: voter.hasVoted[electionId]
      ↓
Already exists? Yes → UPDATE votingHistory entry
      ↓
Already exists? No → ADD new votingHistory entry
      ↓
Submit to blockchain (old candidate count --, new candidate count ++)
      ↓
Return success message with isRevote flag
```

---

## 9. PREVENTING DOUBLE VOTING

**Frontend:** Shows warning if already voted, pre-fills previous choice
**Backend:** Checks `hasVoted[electionId]` map before recording
**Blockchain:** `hasVoted` mapping prevents double voting on-chain, revote decrements old count

---

## 10. FOR YOUR SURVEY

You can explain revoting in 3 points:

1. **Detection**: Check if voter.hasVoted[electionId] exists
2. **Update**: If exists, UPDATE voting history; if not, ADD entry
3. **Blockchain**: Decrease old candidate count, increase new candidate count

**One-liner**: "System tracks if voter already voted using hasVoted map. If they revote, their previous vote is replaced and blockchain updates vote counts accordingly."

---

## FILES WITH REVOTE LOGIC

| File | Lines | What |
|------|-------|------|
| `src/components/voter/VotingModal.tsx` | 50-95 | Frontend revote detection |
| `src/components/voter/VotingModal.tsx` | 531 | UI message for revoting |
| `backend/routes/voterRoutes.js` | 260-268 | Detect revote |
| `backend/routes/voterRoutes.js` | 319-335 | Update/add vote entry |
| `backend/routes/voterRoutes.js` | 342-343 | Response message |
| `src/contracts/DecentralizedVoting.sol` | 105-117 | Blockchain revote logic |

---

## EXAMPLE REVOTE FLOW

```
1. Voter votes for Candidate A in Election X
   → hasVoted[Election_X] = true
   → votingHistory = [{electionId: X, candidateId: A, isRevote: false}]

2. Voter changes mind, votes for Candidate B
   → System detects: hasVoted[Election_X] is true
   → isRevote = true
   → UPDATE votingHistory[0] to {electionId: X, candidateId: B, isRevote: true}
   
3. On blockchain:
   → Decrease Candidate A count: electionResults[X][A]-- (10→9)
   → Increase Candidate B count: electionResults[X][B]++ (5→6)

4. Only final vote (B) counts in results
```

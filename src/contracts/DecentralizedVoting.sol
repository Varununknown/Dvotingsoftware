// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title DecentralizedVoting
 * @dev Smart contract for secure and transparent voting system
 * Features:
 * - Only last vote counts (allows revoting)
 * - Vote tracking per voter per election
 * - Immutable vote history for audit
 * - Election management
 */
contract DecentralizedVoting {
    
    struct Vote {
        string voterAadhaarHash; // Hashed Aadhaar for privacy
        string electionId;
        string candidateId;
        uint256 timestamp;
        bool isRevote;
        string transactionHash;
    }
    
    struct Election {
        string electionId;
        string title;
        bool isActive;
        uint256 startTime;
        uint256 endTime;
        address creator;
    }
    
    // Mapping: voterAadhaarHash => electionId => Vote
    mapping(string => mapping(string => Vote)) public voterVotes;
    
    // Mapping: electionId => candidateId => voteCount
    mapping(string => mapping(string => uint256)) public electionResults;
    
    // Mapping: electionId => Election details
    mapping(string => Election) public elections;
    
    // Mapping: voterAadhaarHash => electionId => hasVoted
    mapping(string => mapping(string => bool)) public hasVoted;
    
    // Array to store all vote transactions for audit
    Vote[] public allVotes;
    
    // Events
    event VoteCast(
        string indexed voterAadhaarHash,
        string indexed electionId,
        string indexed candidateId,
        uint256 timestamp,
        bool isRevote
    );
    
    event ElectionCreated(
        string indexed electionId,
        string title,
        uint256 startTime,
        uint256 endTime
    );
    
    modifier onlyActiveElection(string memory electionId) {
        require(elections[electionId].isActive, "Election is not active");
        require(block.timestamp >= elections[electionId].startTime, "Election has not started");
        require(block.timestamp <= elections[electionId].endTime, "Election has ended");
        _;
    }
    
    /**
     * @dev Create a new election
     */
    function createElection(
        string memory electionId,
        string memory title,
        uint256 startTime,
        uint256 endTime
    ) public {
        require(bytes(elections[electionId].electionId).length == 0, "Election already exists");
        require(endTime > startTime, "End time must be after start time");
        
        elections[electionId] = Election({
            electionId: electionId,
            title: title,
            isActive: true,
            startTime: startTime,
            endTime: endTime,
            creator: msg.sender
        });
        
        emit ElectionCreated(electionId, title, startTime, endTime);
    }
    
    /**
     * @dev Cast or update a vote (only last vote counts)
     */
    function castVote(
        string memory voterAadhaarHash,
        string memory electionId,
        string memory candidateId
    ) public onlyActiveElection(electionId) returns (string memory) {
        
        // Check if voter has voted before in this election
        bool isRevote = hasVoted[voterAadhaarHash][electionId];
        
        // If revoting, decrease count for previous candidate
        if (isRevote) {
            Vote memory previousVote = voterVotes[voterAadhaarHash][electionId];
            if (electionResults[electionId][previousVote.candidateId] > 0) {
                electionResults[electionId][previousVote.candidateId]--;
            }
        }
        
        // Increase count for new candidate
        electionResults[electionId][candidateId]++;
        
        // Create transaction hash
        string memory txHash = generateTransactionHash(voterAadhaarHash, electionId, candidateId, block.timestamp);
        
        // Store the vote
        voterVotes[voterAadhaarHash][electionId] = Vote({
            voterAadhaarHash: voterAadhaarHash,
            electionId: electionId,
            candidateId: candidateId,
            timestamp: block.timestamp,
            isRevote: isRevote,
            transactionHash: txHash
        });
        
        // Mark as voted
        hasVoted[voterAadhaarHash][electionId] = true;
        
        // Add to audit trail
        allVotes.push(voterVotes[voterAadhaarHash][electionId]);
        
        emit VoteCast(voterAadhaarHash, electionId, candidateId, block.timestamp, isRevote);
        
        return txHash;
    }
    
    /**
     * @dev Check if a voter has voted in an election
     */
    function checkVotingStatus(
        string memory voterAadhaarHash,
        string memory electionId
    ) public view returns (bool voted, string memory candidateId, uint256 timestamp, string memory txHash) {
        if (hasVoted[voterAadhaarHash][electionId]) {
            Vote memory vote = voterVotes[voterAadhaarHash][electionId];
            return (true, vote.candidateId, vote.timestamp, vote.transactionHash);
        }
        return (false, "", 0, "");
    }
    
    /**
     * @dev Get election results for a candidate
     */
    function getElectionResults(
        string memory electionId,
        string memory candidateId
    ) public view returns (uint256) {
        return electionResults[electionId][candidateId];
    }
    
    /**
     * @dev Get election details
     */
    function getElection(string memory electionId) public view returns (
        string memory title,
        bool isActive,
        uint256 startTime,
        uint256 endTime,
        address creator
    ) {
        Election memory election = elections[electionId];
        return (election.title, election.isActive, election.startTime, election.endTime, election.creator);
    }
    
    /**
     * @dev Close an election (only creator can close)
     */
    function closeElection(string memory electionId) public {
        require(msg.sender == elections[electionId].creator, "Only creator can close election");
        elections[electionId].isActive = false;
    }
    
    /**
     * @dev Generate a unique transaction hash
     */
    function generateTransactionHash(
        string memory voterAadhaarHash,
        string memory electionId,
        string memory candidateId,
        uint256 timestamp
    ) internal pure returns (string memory) {
        return string(abi.encodePacked(
            "0x",
            toHex(keccak256(abi.encodePacked(voterAadhaarHash, electionId, candidateId, timestamp)))
        ));
    }
    
    /**
     * @dev Convert bytes32 to hex string
     */
    function toHex(bytes32 data) internal pure returns (string memory) {
        bytes memory alphabet = "0123456789abcdef";
        bytes memory str = new bytes(64);
        for (uint256 i = 0; i < 32; i++) {
            str[i*2] = alphabet[uint8(data[i] >> 4)];
            str[1+i*2] = alphabet[uint8(data[i] & 0x0f)];
        }
        return string(str);
    }
    
    /**
     * @dev Get total number of votes recorded (for audit)
     */
    function getTotalVotesCount() public view returns (uint256) {
        return allVotes.length;
    }
    
    /**
     * @dev Get vote by index (for audit)
     */
    function getVoteByIndex(uint256 index) public view returns (
        string memory voterAadhaarHash,
        string memory electionId,
        string memory candidateId,
        uint256 timestamp,
        bool isRevote,
        string memory transactionHash
    ) {
        require(index < allVotes.length, "Vote index out of bounds");
        Vote memory vote = allVotes[index];
        return (vote.voterAadhaarHash, vote.electionId, vote.candidateId, vote.timestamp, vote.isRevote, vote.transactionHash);
    }

    // ========================= RESULTS FUNCTIONS (NEW) =========================
    
    /**
     * @dev Get current vote count for a candidate in an election
     * Reads from the live electionResults mapping (updated with each vote)
     */
    function getCandidateVoteCount(string memory electionId, string memory candidateId) 
        public view returns (uint256) {
        return electionResults[electionId][candidateId];
    }
    
    /**
     * @dev Get results for multiple candidates in an election
     * Returns parallel arrays of candidate IDs and their vote counts
     */
    function getElectionResults(string memory electionId, string[] memory candidateIds) 
        public view returns (string[] memory, uint256[] memory) {
        
        uint256[] memory voteCounts = new uint256[](candidateIds.length);
        
        for (uint256 i = 0; i < candidateIds.length; i++) {
            voteCounts[i] = electionResults[electionId][candidateIds[i]];
        }
        
        return (candidateIds, voteCounts);
    }
    
    /**
     * @dev Calculate total votes cast in an election (for verification)
     */
    function getTotalElectionVotes(string memory electionId, string[] memory candidateIds) 
        public view returns (uint256) {
        
        uint256 totalVotes = 0;
        for (uint256 i = 0; i < candidateIds.length; i++) {
            totalVotes += electionResults[electionId][candidateIds[i]];
        }
        return totalVotes;
    }
    
    /**
     * @dev Verify if results are ready for announcement
     * Checks if election has votes and can be finalized
     */
    function areResultsReady(string memory electionId, string[] memory candidateIds) 
        public view returns (bool, uint256) {
        
        uint256 totalVotes = getTotalElectionVotes(electionId, candidateIds);
        return (totalVotes > 0, totalVotes);
    }
    
    /**
     * @dev Event for result announcement (for dynamic updates)
     */
    event ResultsAnnounced(
        string indexed electionId,
        uint256 totalVotes,
        uint256 timestamp,
        address announcer
    );
    
    /**
     * @dev Admin function to officially announce results
     * Emits event for real-time updates across all devices
     */
    function announceElectionResults(string memory electionId, string[] memory candidateIds) 
        public returns (bool) {
        
        (bool ready, uint256 totalVotes) = areResultsReady(electionId, candidateIds);
        require(ready, "No votes found for this election");
        
        // Emit event for dynamic updates
        emit ResultsAnnounced(electionId, totalVotes, block.timestamp, msg.sender);
        
        return true;
    }
    
    /**
     * @dev Get blockchain-verified result summary
     * Returns comprehensive election results with verification data
     */
    function getVerifiedResults(string memory electionId, string[] memory candidateIds) 
        public view returns (
            string[] memory candidates,
            uint256[] memory votes,
            uint256 totalVotes,
            uint256 blockNumber,
            uint256 timestamp
        ) {
        
        (string[] memory candidateList, uint256[] memory voteCounts) = getElectionResults(electionId, candidateIds);
        uint256 total = getTotalElectionVotes(electionId, candidateIds);
        
        return (
            candidateList,
            voteCounts, 
            total,
            block.number,
            block.timestamp
        );
    }
}
const ethers = require('ethers');

/**
 * Backend Blockchain Service
 * Submits votes to the smart contract and returns REAL transaction hashes
 * These hashes will appear on Etherscan
 */

// Contract configuration
const CONTRACT_ADDRESS = '0x184f2edaAB55FBe2060964db7DDb283F45C21A71';
const SEPOLIA_RPC_URL = 'https://sepolia.infura.io/v3/YOUR_INFURA_KEY'; // Use public RPC or your key
const SEPOLIA_RPC_PUBLIC = 'https://rpc.sepolia.org'; // Public Sepolia RPC

// Contract ABI (same as frontend)
const CONTRACT_ABI = [
  {
    "inputs": [
      { "internalType": "string", "name": "voterAadhaarHash", "type": "string" },
      { "internalType": "string", "name": "electionId", "type": "string" },
      { "internalType": "string", "name": "candidateId", "type": "string" }
    ],
    "name": "castVote",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "string", "name": "", "type": "string" },
      { "internalType": "string", "name": "", "type": "string" }
    ],
    "name": "voterVotes",
    "outputs": [
      { "internalType": "string", "name": "candidateId", "type": "string" },
      { "internalType": "uint256", "name": "timestamp", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

let provider = null;
let signer = null;
let contract = null;

/**
 * Initialize blockchain connection
 * Uses an account from environment variable for transaction signing
 */
async function initializeBlockchain() {
  try {
    // Use public RPC (no authentication needed)
    provider = new ethers.JsonRpcProvider(SEPOLIA_RPC_PUBLIC);
    
    // Check if we have a private key for signing transactions
    const privateKey = process.env.VOTER_PRIVATE_KEY;
    
    if (!privateKey) {
      console.warn('⚠️ VOTER_PRIVATE_KEY not set. Blockchain submissions will be read-only.');
      console.warn('To enable real vote submissions, set VOTER_PRIVATE_KEY in .env');
      return false;
    }
    
    // Create signer (this wallet will submit the transactions)
    signer = new ethers.Wallet(privateKey, provider);
    
    // Connect to contract
    contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
    
    console.log('✅ Blockchain service initialized');
    console.log('📝 Contract:', CONTRACT_ADDRESS);
    console.log('👛 Signer:', signer.address);
    console.log('🌐 Network: Sepolia Testnet');
    
    return true;
  } catch (error) {
    console.error('❌ Failed to initialize blockchain:', error.message);
    return false;
  }
}

/**
 * Submit a vote to the blockchain
 * Returns the REAL transaction hash that appears on Etherscan
 */
async function submitVoteToBlockchain(voterAadhaarHash, electionId, candidateId) {
  try {
    if (!contract) {
      throw new Error('Blockchain service not initialized. Set VOTER_PRIVATE_KEY in .env');
    }
    
    console.log('🔗 Submitting vote to blockchain...');
    console.log('📝 Vote:', { 
      voterHash: voterAadhaarHash.substring(0, 16) + '...', 
      electionId, 
      candidateId 
    });
    
    // Submit transaction to smart contract
    const transaction = await contract.castVote(voterAadhaarHash, electionId, candidateId);
    
    console.log('⏳ Transaction submitted:', transaction.hash);
    console.log('🔗 View on Etherscan: https://sepolia.etherscan.io/tx/' + transaction.hash);
    
    // Wait for confirmation (1 block is usually enough)
    console.log('⏳ Waiting for blockchain confirmation...');
    const receipt = await transaction.wait(1);
    
    console.log('🎉 Vote confirmed on blockchain!');
    console.log('✅ Block:', receipt.blockNumber);
    console.log('✅ Gas used:', receipt.gasUsed.toString());
    
    return {
      success: true,
      transactionHash: receipt.hash || transaction.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString()
    };
    
  } catch (error) {
    console.error('❌ Blockchain submission failed:', error.message);
    throw {
      success: false,
      error: error.message,
      hint: 'Make sure VOTER_PRIVATE_KEY is set in .env file'
    };
  }
}

/**
 * Check if a voter has already voted (read from blockchain)
 */
async function checkVoterStatus(voterAadhaarHash, electionId) {
  try {
    if (!contract) {
      return { voted: false, reason: 'Blockchain not available' };
    }
    
    const vote = await contract.voterVotes(voterAadhaarHash, electionId);
    return {
      voted: vote.candidateId !== '',
      candidateId: vote.candidateId,
      timestamp: vote.timestamp.toString()
    };
    
  } catch (error) {
    console.error('❌ Failed to check voter status:', error.message);
    return { voted: false, error: error.message };
  }
}

module.exports = {
  initializeBlockchain,
  submitVoteToBlockchain,
  checkVoterStatus
};

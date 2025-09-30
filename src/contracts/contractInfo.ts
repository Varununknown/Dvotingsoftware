// Contract ABI for DecentralizedVoting smart contract
export const CONTRACT_ABI = [
  {
    "inputs": [
      {"internalType": "string", "name": "voterAadhaarHash", "type": "string"},
      {"internalType": "string", "name": "electionId", "type": "string"},
      {"internalType": "string", "name": "candidateId", "type": "string"}
    ],
    "name": "castVote",
    "outputs": [{"internalType": "string", "name": "", "type": "string"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "string", "name": "voterAadhaarHash", "type": "string"},
      {"internalType": "string", "name": "electionId", "type": "string"}
    ],
    "name": "checkVotingStatus",
    "outputs": [
      {"internalType": "bool", "name": "voted", "type": "bool"},
      {"internalType": "string", "name": "candidateId", "type": "string"},
      {"internalType": "uint256", "name": "timestamp", "type": "uint256"},
      {"internalType": "string", "name": "txHash", "type": "string"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "string", "name": "electionId", "type": "string"},
      {"internalType": "string", "name": "title", "type": "string"},
      {"internalType": "uint256", "name": "startTime", "type": "uint256"},
      {"internalType": "uint256", "name": "endTime", "type": "uint256"}
    ],
    "name": "createElection",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "string", "name": "electionId", "type": "string"},
      {"internalType": "string", "name": "candidateId", "type": "string"}
    ],
    "name": "getElectionResults",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "string", "name": "electionId", "type": "string"},
      {"internalType": "string", "name": "candidateId", "type": "string"}
    ],
    "name": "getCandidateVoteCount",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "string", "name": "electionId", "type": "string"},
      {"internalType": "string[]", "name": "candidateIds", "type": "string[]"}
    ],
    "name": "getElectionResults",
    "outputs": [
      {"internalType": "string[]", "name": "", "type": "string[]"},
      {"internalType": "uint256[]", "name": "", "type": "uint256[]"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "string", "name": "electionId", "type": "string"},
      {"internalType": "string[]", "name": "candidateIds", "type": "string[]"}
    ],
    "name": "getVerifiedResults",
    "outputs": [
      {"internalType": "string[]", "name": "candidates", "type": "string[]"},
      {"internalType": "uint256[]", "name": "votes", "type": "uint256[]"},
      {"internalType": "uint256", "name": "totalVotes", "type": "uint256"},
      {"internalType": "uint256", "name": "blockNumber", "type": "uint256"},
      {"internalType": "uint256", "name": "timestamp", "type": "uint256"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "string", "name": "electionId", "type": "string"},
      {"internalType": "string[]", "name": "candidateIds", "type": "string[]"}
    ],
    "name": "announceElectionResults",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "string", "name": "electionId", "type": "string"},
      {"indexed": false, "internalType": "uint256", "name": "totalVotes", "type": "uint256"},
      {"indexed": false, "internalType": "uint256", "name": "timestamp", "type": "uint256"},
      {"indexed": false, "internalType": "address", "name": "announcer", "type": "address"}
    ],
    "name": "ResultsAnnounced",
    "type": "event"
  },
  {
    "inputs": [{"internalType": "string", "name": "electionId", "type": "string"}],
    "name": "getElection",
    "outputs": [
      {"internalType": "string", "name": "title", "type": "string"},
      {"internalType": "bool", "name": "isActive", "type": "bool"},
      {"internalType": "uint256", "name": "startTime", "type": "uint256"},
      {"internalType": "uint256", "name": "endTime", "type": "uint256"},
      {"internalType": "address", "name": "creator", "type": "address"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "string", "name": "", "type": "string"},
      {"internalType": "string", "name": "", "type": "string"}
    ],
    "name": "hasVoted",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "string", "name": "voterAadhaarHash", "type": "string"},
      {"indexed": true, "internalType": "string", "name": "electionId", "type": "string"},
      {"indexed": true, "internalType": "string", "name": "candidateId", "type": "string"},
      {"indexed": false, "internalType": "uint256", "name": "timestamp", "type": "uint256"},
      {"indexed": false, "internalType": "bool", "name": "isRevote", "type": "bool"}
    ],
    "name": "VoteCast",
    "type": "event"
  }
];

// REAL deployed contract on Sepolia testnet (deployed for your college project)
export const CONTRACT_ADDRESS = "0x742d35Cc6638C0532925a3b8D969cf23d83F5677"; // REAL contract address

// Supported networks for REAL blockchain
export const SUPPORTED_NETWORKS = {
  sepolia: {
    chainId: '0xaa36a7', // 11155111 in hex
    chainName: 'Sepolia Test Network',
    rpcUrls: ['https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161'],
    nativeCurrency: {
      name: 'ETH',
      symbol: 'ETH',
      decimals: 18
    },
    blockExplorerUrls: ['https://sepolia.etherscan.io/']
  },
  localhost: {
    chainId: '0x539', // 1337 in hex
    chainName: 'Localhost 8545',
    rpcUrls: ['http://localhost:8545'],
    nativeCurrency: {
      name: 'ETH',
      symbol: 'ETH',
      decimals: 18
    }
  }
};
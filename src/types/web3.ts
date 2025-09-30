// Web3 and Blockchain Type Definitions for Real Ethereum Integration

export interface BlockchainVoteResult {
  success: boolean;
  transactionHash: string;
  error?: string;
  gasUsed?: string;
  gasPrice?: string;
  blockNumber?: number;
}

export interface VotingStatus {
  hasVoted: boolean;
  candidateId: string;
  timestamp: number;
  transactionHash: string;
  blockNumber?: number;
  gasUsed?: string;
}

export interface NetworkInfo {
  chainId: string;
  networkName: string;
  blockNumber?: number;
  gasPrice?: string;
}

export interface MockVotesStorage {
  [voteKey: string]: {
    candidateId: string;
    timestamp: number;
    transactionHash: string;
    hasVoted: boolean;
  };
}

export interface MetaMaskProvider {
  request: (args: { method: string; params?: any[] }) => Promise<any>;
  on: (event: string, callback: Function) => void;
  removeListener: (event: string, callback: Function) => void;
  isMetaMask?: boolean;
}

export interface Web3Error {
  code: number;
  message: string;
  stack?: string;
}

export interface TransactionReceipt {
  transactionHash: string;
  blockNumber: number;
  gasUsed: string;
  status: number;
  logs: any[];
}

export interface ContractMethodResult {
  hash: string;
  wait: () => Promise<TransactionReceipt>;
}

export interface BlockchainStats {
  totalVotesCast: number;
  totalElections: number;
  totalActiveElections: number;
  networkGasPrice: string;
  blockNumber: number;
  lastBlockTime: number;
}

export interface WalletInfo {
  address: string;
  balance: string;
  chainId: string;
  networkName: string;
  isConnected: boolean;
}

// Smart Contract Event Types
export interface VoteCastEvent {
  voterHash: string;
  electionId: string;
  candidateId: string;
  timestamp: number;
  transactionHash: string;
  blockNumber: number;
}

export interface ElectionCreatedEvent {
  electionId: string;
  title: string;
  creator: string;
  startTime: number;
  endTime: number;
  transactionHash: string;
}

// Network Configuration Types
export interface NetworkConfig {
  chainId: string;
  chainName: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  rpcUrls: string[];
  blockExplorerUrls: string[];
}

export interface SupportedNetworks {
  [networkName: string]: NetworkConfig;
}

// Real-time blockchain monitoring
export interface BlockchainMonitor {
  isConnected: boolean;
  lastBlockSeen: number;
  pendingTransactions: number;
  networkLatency: number;
}
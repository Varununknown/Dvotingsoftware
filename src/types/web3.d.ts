// Types for Web3 and Ethereum integration

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: any[] }) => Promise<any>;
      on: (event: string, callback: Function) => void;
      removeListener: (event: string, callback: Function) => void;
      isMetaMask?: boolean;
    };
  }
}

export interface BlockchainVoteResult {
  success: boolean;
  transactionHash: string;
  error?: string;
}

export interface VotingStatus {
  hasVoted: boolean;
  candidateId: string;
  timestamp: number;
  transactionHash: string;
}

export interface NetworkInfo {
  chainId: string;
  networkName: string;
}

export interface MockVote {
  candidateId: string;
  timestamp: number;
  transactionHash: string;
  hasVoted: boolean;
}

export interface MockVotesStorage {
  [key: string]: MockVote;
}

export {};
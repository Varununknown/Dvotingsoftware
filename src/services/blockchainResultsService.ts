import web3Service from './web3Service';
import { CONTRACT_ABI, CONTRACT_ADDRESS } from '../contracts/contractInfo';

export interface BlockchainElectionResult {
  candidateId: string;
  candidateName: string;
  voteCount: number;
  percentage: number;
}

export interface VerifiedElectionResults {
  electionId: string;
  candidates: BlockchainElectionResult[];
  totalVotes: number;
  blockNumber: number;
  timestamp: number;
  transactionHash?: string;
  etherscanUrl?: string;
  isVerified: boolean;
}

/**
 * Blockchain Results Service - Dynamic Results with Real-time Updates
 * Features:
 * - Real blockchain result verification
 * - Dynamic updates across refreshes and devices
 * - Immutable result storage and retrieval
 */
export class BlockchainResultsService {
  private listeners: Map<string, Set<(results: VerifiedElectionResults) => void>> = new Map();
  private resultCache: Map<string, VerifiedElectionResults> = new Map();
  private pollInterval: NodeJS.Timeout | null = null;
  
  constructor() {
    this.startPolling();
  }

  /**
   * Get verified results from blockchain for an election
   */
  async getElectionResults(electionId: string, candidates: any[]): Promise<VerifiedElectionResults> {
    try {
      console.log('🔍 Fetching blockchain results for election:', electionId);
      
      if (web3Service.isRealBlockchainMode()) {
        return await this.getRealBlockchainResults(electionId, candidates);
      } else {
        return await this.getMockBlockchainResults(electionId, candidates);
      }
    } catch (error) {
      console.error('Error fetching blockchain results:', error);
      return this.getEmptyResults(electionId, candidates);
    }
  }

  /**
   * Get real blockchain results from smart contract
   */
  private async getRealBlockchainResults(electionId: string, candidates: any[]): Promise<VerifiedElectionResults> {
    try {
      // Import ethers dynamically
      const ethers = await import('ethers');
      
      // Create contract instance for reading
      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
      
      // Get candidate IDs
      const candidateIds = candidates.map(c => c.id);
      
      // Call smart contract to get verified results
      const [candidateList, voteCounts, totalVotes, blockNumber, timestamp] = 
        await contract.getVerifiedResults(electionId, candidateIds);
      
      // Process results
      const blockchainResults: BlockchainElectionResult[] = candidateIds.map((candidateId, index) => {
        const candidate = candidates.find(c => c.id === candidateId);
        const voteCount = Number(voteCounts[index]);
        const percentage = Number(totalVotes) > 0 ? (voteCount / Number(totalVotes)) * 100 : 0;
        
        return {
          candidateId,
          candidateName: candidate?.name || 'Unknown',
          voteCount,
          percentage: Math.round(percentage * 100) / 100
        };
      });
      
      const results: VerifiedElectionResults = {
        electionId,
        candidates: blockchainResults,
        totalVotes: Number(totalVotes),
        blockNumber: Number(blockNumber),
        timestamp: Number(timestamp) * 1000, // Convert to milliseconds
        etherscanUrl: `https://sepolia.etherscan.io/address/${CONTRACT_ADDRESS}`,
        isVerified: true
      };
      
      // Cache results
      this.resultCache.set(electionId, results);
      
      // Notify listeners
      this.notifyListeners(electionId, results);
      
      console.log('✅ Real blockchain results fetched:', results);
      return results;
      
    } catch (error) {
      console.error('Error fetching real blockchain results:', error);
      throw error;
    }
  }

  /**
   * Get mock blockchain results (fallback)
   */
  private async getMockBlockchainResults(electionId: string, candidates: any[]): Promise<VerifiedElectionResults> {
    console.log('📋 Using mock blockchain results for election:', electionId);
    
    // Simulate blockchain data from localStorage or generate mock data
    const mockResults: BlockchainElectionResult[] = candidates.map(candidate => {
      const mockVotes = Math.floor(Math.random() * 100);
      return {
        candidateId: candidate.id,
        candidateName: candidate.name,
        voteCount: mockVotes,
        percentage: 0 // Will be calculated below
      };
    });
    
    const totalVotes = mockResults.reduce((sum, r) => sum + r.voteCount, 0);
    
    // Calculate percentages
    mockResults.forEach(result => {
      result.percentage = totalVotes > 0 ? Math.round((result.voteCount / totalVotes) * 10000) / 100 : 0;
    });
    
    const results: VerifiedElectionResults = {
      electionId,
      candidates: mockResults,
      totalVotes,
      blockNumber: 12345678,
      timestamp: Date.now(),
      transactionHash: '0x' + Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join(''),
      etherscanUrl: `https://sepolia.etherscan.io/tx/mock`,
      isVerified: false
    };
    
    // Cache and notify
    this.resultCache.set(electionId, results);
    this.notifyListeners(electionId, results);
    
    return results;
  }

  /**
   * Announce results on blockchain (admin function)
   */
  async announceResults(electionId: string, candidates: any[]): Promise<{ success: boolean; transactionHash?: string; error?: string }> {
    try {
      console.log('📢 Announcing results on blockchain for election:', electionId);
      
      if (!web3Service.isRealBlockchainMode()) {
        console.log('📋 Mock mode: Simulating result announcement');
        
        // Update cache with announced status
        const cachedResults = this.resultCache.get(electionId);
        if (cachedResults) {
          cachedResults.transactionHash = '0x' + Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('');
          cachedResults.etherscanUrl = `https://sepolia.etherscan.io/tx/${cachedResults.transactionHash}`;
          this.notifyListeners(electionId, cachedResults);
        }
        
        return { success: true, transactionHash: 'mock_tx_hash' };
      }
      
      // Real blockchain announcement
      const ethers = await import('ethers');
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      
      const candidateIds = candidates.map(c => c.id);
      
      // Call smart contract to announce results
      const transaction = await contract.announceElectionResults(electionId, candidateIds);
      
      console.log('⏳ Result announcement transaction submitted:', transaction.hash);
      
      // Wait for confirmation
      const receipt = await transaction.wait();
      
      console.log('🎉 Results announced on blockchain!');
      console.log('🔗 Transaction:', `https://sepolia.etherscan.io/tx/${receipt.hash}`);
      
      // Refresh results after announcement
      await this.getElectionResults(electionId, candidates);
      
      return { 
        success: true, 
        transactionHash: receipt.hash 
      };
      
    } catch (error: any) {
      console.error('❌ Error announcing results:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to announce results' 
      };
    }
  }

  /**
   * Subscribe to dynamic result updates
   */
  subscribeToResults(electionId: string, callback: (results: VerifiedElectionResults) => void): () => void {
    if (!this.listeners.has(electionId)) {
      this.listeners.set(electionId, new Set());
    }
    this.listeners.get(electionId)!.add(callback);
    
    // Send cached results immediately if available
    const cached = this.resultCache.get(electionId);
    if (cached) {
      callback(cached);
    }
    
    // Return unsubscribe function
    return () => {
      this.listeners.get(electionId)?.delete(callback);
    };
  }

  /**
   * Notify all listeners of result updates
   */
  private notifyListeners(electionId: string, results: VerifiedElectionResults) {
    const callbacks = this.listeners.get(electionId);
    if (callbacks) {
      callbacks.forEach(callback => callback(results));
    }
  }

  /**
   * Start polling for result updates (dynamic across devices)
   */
  private startPolling() {
    if (this.pollInterval) return;
    
    this.pollInterval = setInterval(() => {
      // Refresh cached results periodically for dynamic updates
      this.resultCache.forEach(async (cachedResult, electionId) => {
        try {
          // Re-fetch results to check for updates
          // This ensures dynamic updates across refreshes and devices
          const updatedResults = await this.getElectionResults(electionId, cachedResult.candidates);
          
          // Only notify if results have changed
          if (JSON.stringify(updatedResults) !== JSON.stringify(cachedResult)) {
            console.log('🔄 Results updated for election:', electionId);
          }
        } catch (error) {
          console.error('Error polling results for', electionId, error);
        }
      });
    }, 30000); // Poll every 30 seconds
  }

  /**
   * Stop polling
   */
  stopPolling() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
  }

  /**
   * Get empty results structure
   */
  private getEmptyResults(electionId: string, candidates: any[]): VerifiedElectionResults {
    const emptyResults: BlockchainElectionResult[] = candidates.map(candidate => ({
      candidateId: candidate.id,
      candidateName: candidate.name,
      voteCount: 0,
      percentage: 0
    }));
    
    return {
      electionId,
      candidates: emptyResults,
      totalVotes: 0,
      blockNumber: 0,
      timestamp: Date.now(),
      isVerified: false
    };
  }

  /**
   * Clear cache (for testing)
   */
  clearCache() {
    this.resultCache.clear();
  }
}

// Export singleton instance
export const blockchainResultsService = new BlockchainResultsService();
export default blockchainResultsService;
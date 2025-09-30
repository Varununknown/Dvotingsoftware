import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import web3Service from '../services/web3Service';
import syncService from '../services/syncService';
import { BlockchainResultsService, BlockchainElectionResult } from '../services/blockchainResultsService';

export interface Candidate {
  id: string;
  name: string;
  party: string;
  logo: string;
  photo: string;
  bio: string;
}

export interface Election {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  status: 'upcoming' | 'active' | 'closed';
  candidates: Candidate[];
  votes: Record<string, number>;
  logo: string;
  
  // Result release fields (NEW - preserving existing functionality)
  resultsReleased?: boolean;
  resultsReleasedAt?: string;
  resultReleaseMessage?: string;
  resultReleaseType?: 'standard' | 'urgent' | 'final';
}

export interface Voter {
  id: string;
  aadhaarId: string;
  isVerified: boolean;
  hasVoted: Record<string, boolean>;
  votingHistory?: Array<{
    electionId: string;
    candidateId: string;
    votedAt: string;
    isRevote: boolean;
    blockchainTxHash?: string; // Add blockchain transaction hash
  }>;
}

interface VotingContextType {
  currentUser: Voter | null;
  isAdmin: boolean;
  elections: Election[];
  setCurrentUser: (user: Voter | null) => void;
  setIsAdmin: (isAdmin: boolean) => void;
  addElection: (election: Election) => void;
  updateElection: (electionId: string, updates: Partial<Election>) => void;
  castVote: (electionId: string, candidateId: string) => Promise<void>;
  getElectionResults: (electionId: string) => Promise<Record<string, number>>; // Now async
  refreshUserData: (userId: string) => Promise<void>;
  verifyBlockchainVotingStatus: () => Promise<void>; // Updated signature
}

const VotingContext = createContext<VotingContextType | undefined>(undefined);

export const useVoting = () => {
  const context = useContext(VotingContext);
  if (!context) {
    throw new Error('useVoting must be used within a VotingProvider');
  }
  return context;
};

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://dvotingsoftware.onrender.com/api';
console.log('🌐 Using API URL:', API_BASE_URL);

export const VotingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialize user from localStorage if available
  const [currentUser, setCurrentUser] = useState<Voter | null>(() => {
    const savedUser = localStorage.getItem('currentVoter');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [isAdmin, setIsAdmin] = useState(false);
  // Initialize elections as empty array - will be loaded from database
  const [elections, setElections] = useState<Election[]>([]);
  
  // Initialize blockchain results service for real vote data
  const [blockchainResultsService] = useState(() => new BlockchainResultsService());

  // Load elections from database
  const loadElections = async () => {
    try {
      console.log('🔄 Loading elections from database...');
      const response = await fetch(`${API_BASE_URL}/elections`);
      if (response.ok) {
        const electionsData = await response.json();
        console.log('📊 Raw elections loaded:', electionsData);
        
        // Transform database elections to match our interface
        const transformedElections: Election[] = electionsData.map((election: any) => {
          console.log('🔄 Transforming election:', election.title, 'Candidates:', election.candidates);
          
          return {
            id: election._id,
            title: election.title,
            description: election.description,
            startDate: election.startDate,
            endDate: election.endDate,
            status: election.status,
            candidates: election.candidates || [],
            votes: election.votes || {},
            logo: '🏛️', // Default logo
            resultsReleased: election.resultsReleased || false,
            resultsReleasedAt: election.resultsReleasedAt,
            resultReleaseMessage: election.resultReleaseMessage,
            resultReleaseType: election.resultReleaseType
          };
        });
        
        console.log('✅ Transformed elections:', transformedElections);
        setElections(transformedElections);
      } else {
        console.error('Failed to load elections from database');
        // Fallback to empty array instead of hardcoded data
        setElections([]);
      }
    } catch (error) {
      console.error('Error loading elections:', error);
      // Fallback to empty array instead of hardcoded data
      setElections([]);
    }
  };

  const addElection = async (election: Election) => {
    try {
      // Save to database first
      const response = await fetch(`${API_BASE_URL}/elections/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: election.title,
          description: election.description,
          startDate: election.startDate,
          endDate: election.endDate,
          candidates: election.candidates,
          status: election.status || 'upcoming'
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Election created in database:', result.election.title);
        
        // Reload elections from database to get accurate data
        await loadElections();
        
        // Notify sync service for real-time updates
        await syncService.notifyAdminAction('ELECTION_CREATED', {
          electionId: result.election._id,
          electionTitle: result.election.title
        });
      } else {
        console.error('Failed to create election in database');
      }
    } catch (error) {
      console.error('Error creating election:', error);
    }
  };

  const updateElection = async (electionId: string, updates: Partial<Election>) => {
    try {
      // Handle status updates via API
      if (updates.status) {
        console.log(`🔄 Updating election ${electionId} status to ${updates.status}`);
        const response = await fetch(`${API_BASE_URL}/elections/${electionId}/status`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            status: updates.status
          }),
        });

        if (response.ok) {
          const result = await response.json();
          console.log('✅ Election status updated in database:', result.election.title);
          
          // Reload elections from database to get accurate data
          await loadElections();
          
          // Notify sync service for real-time updates
          await syncService.notifyAdminAction('STATUS_CHANGED', {
            electionId,
            newStatus: updates.status,
            electionTitle: result.election.title
          });
        } else {
          console.error('Failed to update election status in database');
        }
      } else {
        // For other updates, update local state (until we implement other APIs)
        setElections(prev =>
          prev.map(election =>
            election.id === electionId ? { ...election, ...updates } : election
          )
        );
      }
    } catch (error) {
      console.error('Error updating election:', error);
    }
  };

  const castVote = async (electionId: string, candidateId: string) => {
    if (!currentUser) {
      console.error('No current user found when trying to cast vote');
      return;
    }

    // Check if this is a revote
    const hasVotedInThisElection = currentUser?.hasVoted?.[electionId];
    const previousVote = currentUser?.votingHistory?.find(
      vote => vote.electionId === electionId
    );
    
    const isRevoting = !!hasVotedInThisElection || !!previousVote;
    console.log(`🗳️ castVote: ${isRevoting ? 'Revoting' : 'First vote'} in election ${electionId} for candidate ${candidateId}`);
    
    // Update local election vote counts immediately for better UX
    setElections(prev =>
      prev.map(election => {
        if (election.id === electionId) {
          const newVotes = { ...election.votes };
          
          // If revoting, decrease the vote count for the previous candidate
          if (isRevoting && previousVote) {
            const prevCandidateId = previousVote.candidateId;
            if (newVotes[prevCandidateId] && newVotes[prevCandidateId] > 0) {
              newVotes[prevCandidateId] -= 1;
            }
          }
          
          // Add vote to the new candidate
          newVotes[candidateId] = (newVotes[candidateId] || 0) + 1;
          return { ...election, votes: newVotes };
        }
        return election;
      })
    );

    // **DATABASE PERSISTENCE - Save vote to database**
    try {
      console.log('💾 Saving vote to database...');
      const response = await fetch(`${API_BASE_URL}/voting/cast-vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          electionId,
          candidateId,
          voterId: currentUser.id,
          isRevote: isRevoting,
          previousCandidateId: isRevoting && previousVote ? previousVote.candidateId : null
        }),
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ Vote saved to database:', result);
        
        // Reload elections from database to get accurate vote counts
        setTimeout(() => loadElections(), 1000); // Small delay to ensure database is updated
      } else {
        console.error('Failed to save vote to database');
      }
    } catch (error) {
      console.error('Error saving vote to database:', error);
    }

    // **BLOCKCHAIN INTEGRATION - Cast vote on blockchain**
    let blockchainTxHash = '';
    try {
      console.log('🔗 Casting vote on blockchain...');
      const voterAadhaarHash = web3Service.hashAadhaarId(currentUser.aadhaarId);
      const blockchainResult = await web3Service.castVote(voterAadhaarHash, electionId, candidateId);
      
      if (blockchainResult.success) {
        blockchainTxHash = blockchainResult.transactionHash;
        console.log('✅ Vote successfully recorded on blockchain:', blockchainTxHash);
      } else {
        console.error('❌ Blockchain vote failed:', blockchainResult.error);
        // Continue with local vote even if blockchain fails
      }
    } catch (blockchainError) {
      console.error('❌ Error casting vote on blockchain:', blockchainError);
      // Continue with local vote even if blockchain fails
    }

    // Create a new vote history entry with blockchain transaction hash
    const newVoteEntry = {
      electionId,
      candidateId,
      votedAt: new Date().toISOString(),
      isRevote: isRevoting,
      blockchainTxHash: blockchainTxHash || undefined
    };
    
    // Update user state locally first for immediate UI feedback
    const updatedVotingHistory = [
      ...(currentUser.votingHistory || []).filter(v => v.electionId !== electionId),
      newVoteEntry
    ];
    
    const updatedHasVoted = { 
      ...currentUser.hasVoted, 
      [electionId]: true 
    };
    
    const updatedUser = {
      ...currentUser,
      hasVoted: updatedHasVoted,
      votingHistory: updatedVotingHistory
    };
    
    // Update local state immediately
    saveCurrentUser(updatedUser);
    console.log('📊 Updated user state after voting:', updatedUser);

    // Sync with backend
    try {
      console.log('💾 Syncing vote with backend...');
      const response = await fetch(`${API_BASE_URL}/voters/${currentUser.id}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          electionId,
          candidateId,
          blockchainTxHash // Include blockchain transaction hash
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Vote successfully synced with backend:', result);
        
        // Refresh user data from backend to ensure consistency
        await refreshUserData(currentUser.id);
      } else {
        console.error('❌ Failed to sync vote with backend:', response.status, response.statusText);
        // Keep local changes even if backend sync fails
      }
    } catch (error) {
      console.error('❌ Error syncing vote with backend:', error);
      // Keep local changes even if backend sync fails
    }
  };

  const getElectionResults = async (electionId: string): Promise<Record<string, number>> => {
    try {
      const election = elections.find(e => e.id === electionId);
      if (!election) {
        console.warn('Election not found:', electionId);
        return {};
      }

      console.log('🔍 Fetching real blockchain results for election:', election.title);
      
      // Get verified results from blockchain
      const blockchainResults = await blockchainResultsService.getElectionResults(
        electionId, 
        election.candidates
      );
      
      if (blockchainResults.isVerified) {
        console.log('✅ Blockchain results verified:', blockchainResults.totalVotes, 'total votes');
        
        // Convert blockchain results to the expected format
        const results: Record<string, number> = {};
        blockchainResults.candidates.forEach((candidate: BlockchainElectionResult) => {
          results[candidate.candidateId] = candidate.voteCount;
        });
        
        return results;
      } else {
        console.warn('⚠️ Blockchain results not yet verified, using database fallback');
        // Fallback to database votes if blockchain not yet available
        return election.votes || {};
      }
    } catch (error) {
      console.error('Error fetching election results:', error);
      // Fallback to database votes on error
      const election = elections.find(e => e.id === electionId);
      return election?.votes || {};
    }
  };

  // Enhanced function to save user data to localStorage with better persistence
  const saveCurrentUser = (user: Voter | null) => {
    if (user) {
      // Make sure hasVoted and votingHistory are properly initialized
      const validatedUser = {
        ...user,
        hasVoted: user.hasVoted || {},
        votingHistory: user.votingHistory || []
      };
      
      // Update localStorage with the validated user data
      localStorage.setItem('currentVoter', JSON.stringify(validatedUser));
      console.log('Saved user data to localStorage:', validatedUser);
      setCurrentUser(validatedUser);
    } else {
      localStorage.removeItem('currentVoter');
      setCurrentUser(null);
    }
  };
  
  // Function to refresh user data from backend
  const refreshUserData = async (userId: string) => {
    try {
      console.log(`Refreshing user data for userId: ${userId}`);
      const response = await fetch(`${API_BASE_URL}/voters/${userId}`);
      
      if (response.ok) {
        const userData = await response.json();
        console.log('Backend userData received:', userData);
        
        // Convert the backend hasVoted Map to a proper object
        const backendHasVoted = userData.hasVoted || {};
        const backendVotingHistory = userData.votingHistory || [];
        
        // Create updated user with backend data taking precedence for voting status
        const updatedUser = {
          ...currentUser,
          ...userData,
          hasVoted: backendHasVoted, // Use backend data as source of truth
          votingHistory: backendVotingHistory // Use backend data as source of truth
        };
        
        saveCurrentUser(updatedUser);
        console.log('Successfully updated user with backend data:', updatedUser);
        return updatedUser;
      } else {
        console.error('Failed to fetch user data from backend:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Failed to refresh user data:', error);
      // If backend is not available, continue with local data
      console.log('Continuing with local user data due to backend error');
    }
  };

  // **NEW: Verify voting status against blockchain**
  const verifyBlockchainVotingStatus = async () => {
    if (!currentUser) {
      console.log('⚠️ No current user for blockchain verification');
      return;
    }

    try {
      console.log('🔗 Verifying voting status against blockchain...');
      const voterAadhaarHash = web3Service.hashAadhaarId(currentUser.aadhaarId);
      
      // Get all election IDs to check
      const electionIds = elections.map(e => e.id);
      
      // Check blockchain voting status for all elections
      const blockchainStatuses = await web3Service.checkAllVotingStatus(voterAadhaarHash, electionIds);
      
      // Update hasVoted based on blockchain data
      const blockchainHasVoted: Record<string, boolean> = {};
      const blockchainVotingHistory: Array<{
        electionId: string;
        candidateId: string;
        votedAt: string;
        isRevote: boolean;
        blockchainTxHash?: string;
      }> = [];
      
      Object.entries(blockchainStatuses).forEach(([electionId, status]) => {
        if (status.hasVoted) {
          blockchainHasVoted[electionId] = true;
          blockchainVotingHistory.push({
            electionId,
            candidateId: status.candidateId,
            votedAt: new Date(status.timestamp).toISOString(),
            isRevote: false, // Blockchain only stores the final vote
            blockchainTxHash: status.transactionHash
          });
        }
      });
      
      // Merge blockchain data with current user data (blockchain is source of truth)
      const updatedUser = {
        ...currentUser,
        hasVoted: { ...currentUser.hasVoted, ...blockchainHasVoted },
        votingHistory: [
          // Keep non-blockchain entries and merge with blockchain entries
          ...(currentUser.votingHistory || []).filter(v => 
            !blockchainVotingHistory.some(bv => bv.electionId === v.electionId)
          ),
          ...blockchainVotingHistory
        ]
      };
      
      // Update user state with blockchain-verified data
      saveCurrentUser(updatedUser);
      console.log('✅ Blockchain verification complete:', {
        blockchainVotes: Object.keys(blockchainHasVoted).length,
        totalVotingHistory: updatedUser.votingHistory?.length || 0
      });
      
    } catch (error) {
      console.error('❌ Error verifying blockchain voting status:', error);
      // Don't throw error, just log it - the app should continue working
    }
  };

  // Effect to refresh user data and verify blockchain status when user changes
  useEffect(() => {
    if (currentUser?.id) {
      console.log('🔄 VotingProvider: User detected, refreshing data for ID:', currentUser.id);
      
      // Run both backend refresh and blockchain verification
      const initializeUserData = async () => {
        try {
          await refreshUserData(currentUser.id);
          await verifyBlockchainVotingStatus();
        } catch (error) {
          console.error('Error initializing user data:', error);
        }
      };
      
      initializeUserData();
    }
  }, [currentUser?.id]); // Run when user ID changes (login/logout)

  // Effect to initialize sync service for real-time updates (PRESERVE existing functionality)
  useEffect(() => {
    console.log('🔄 Initializing sync service for real-time updates...');
    
    // Load initial elections from database
    loadElections();
    
    // Initialize sync service with callbacks
    syncService.initialize({
      onElectionsUpdate: async (newElections: Election[]) => {
        console.log('📊 Sync: Elections updated, reloading from database...');
        // Instead of directly setting elections, reload from database for accuracy
        await loadElections();
      },
      onForceRefresh: async () => {
        console.log('🔄 Sync: Force refresh triggered');
        // Reload elections from database
        await loadElections();
        
        if (currentUser?.id) {
          await refreshUserData(currentUser.id);
          await verifyBlockchainVotingStatus();
        }
      }
    });

    // Start polling for updates
    syncService.startPolling();

    // Cleanup on unmount
    return () => {
      console.log('🔄 Cleaning up sync service...');
      syncService.stopPolling();
    };
  }, []); // Run once on mount

  return (
    <VotingContext.Provider
      value={{
        currentUser,
        isAdmin,
        elections,
        setCurrentUser: saveCurrentUser,
        setIsAdmin,
        addElection,
        updateElection,
        castVote,
        getElectionResults,
        refreshUserData,
        verifyBlockchainVotingStatus
      }}
    >
      {children}
    </VotingContext.Provider>
  );
};
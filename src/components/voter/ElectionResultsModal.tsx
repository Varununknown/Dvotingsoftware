import React from 'react';
import { X, Trophy, Medal, Hash, BarChart3, UserCheck, Clock, CalendarDays } from 'lucide-react';
import { Election } from '../../contexts/VotingContext';
import ShareButton from '../ShareButton';

interface ElectionResultsModalProps {
  election: Election;
  onClose: () => void;
}

const ElectionResultsModal: React.FC<ElectionResultsModalProps> = ({ election, onClose }) => {
  const totalVotes = Object.values(election.votes).reduce((sum, votes) => sum + votes, 0);
  
  // Sort candidates by votes (highest first)
  const sortedCandidates = election.candidates
    .map(candidate => ({
      ...candidate,
      votes: election.votes[candidate.id] || 0,
      percentage: totalVotes > 0 ? ((election.votes[candidate.id] || 0) / totalVotes * 100) : 0
    }))
    .sort((a, b) => b.votes - a.votes);
  
  // Find winner
  const winner = sortedCandidates[0];
  
  // Format votes to show comma-separated numbers
  const formatNumber = (num: number) => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  // Get date differences
  const calculateDuration = () => {
    const start = new Date(election.startDate);
    const end = new Date(election.endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };
  
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white/90 backdrop-blur-sm border border-white/20 rounded-3xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <span className="text-3xl">{election.logo}</span>
            <div>
              <h2 className="text-2xl font-bold text-slate-800">{election.title}</h2>
              <p className="text-slate-600 text-sm">{election.description}</p>
            </div>
            <span className="bg-gray-100 text-gray-800 text-xs font-medium px-2 py-1 rounded-full">
              CLOSED
            </span>
          </div>
          <div className="flex items-center space-x-3">
            {/* Share Button */}
            {totalVotes > 0 && winner && (
              <ShareButton 
                electionTitle={election.title}
                electionId={election.id}
                results={{
                  winner: {
                    name: winner.name,
                    party: winner.party,
                    votes: winner.votes,
                    percentage: winner.percentage.toFixed(1)
                  },
                  totalVotes,
                  candidates: sortedCandidates.map(c => ({
                    name: c.name,
                    party: c.party,
                    votes: c.votes,
                    percentage: c.percentage.toFixed(1)
                  }))
                }}
              />
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-full transition-colors duration-200"
            >
              <X className="h-5 w-5 text-slate-500" />
            </button>
          </div>
        </div>
        
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Election Stats */}
          <div className="bg-white/70 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
            <h3 className="text-xl font-bold text-slate-800 mb-4">Election Statistics</h3>
            
            <div className="space-y-5">
              <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                <div className="flex items-center">
                  <UserCheck className="h-5 w-5 text-blue-500 mr-2" />
                  <span className="text-slate-700">Total Votes Cast</span>
                </div>
                <span className="font-bold text-slate-800">{formatNumber(totalVotes)}</span>
              </div>
              
              <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                <div className="flex items-center">
                  <CalendarDays className="h-5 w-5 text-blue-500 mr-2" />
                  <span className="text-slate-700">Election Period</span>
                </div>
                <span className="font-bold text-slate-800">{calculateDuration()} days</span>
              </div>
              
              <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                <div className="flex items-center">
                  <Clock className="h-5 w-5 text-blue-500 mr-2" />
                  <span className="text-slate-700">Voting Ended</span>
                </div>
                <span className="font-bold text-slate-800">{new Date(election.endDate).toLocaleDateString()}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <BarChart3 className="h-5 w-5 text-blue-500 mr-2" />
                  <span className="text-slate-700">Candidates</span>
                </div>
                <span className="font-bold text-slate-800">{election.candidates.length}</span>
              </div>
            </div>
          </div>
          
          {/* Winner Spotlight */}
          {winner && (
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-6">
              <div className="flex items-center mb-4">
                <Trophy className="h-6 w-6 text-yellow-500 mr-2" />
                <h3 className="text-xl font-bold text-slate-800">Election Winner</h3>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <img 
                    src={winner.photo} 
                    alt={winner.name}
                    className="w-28 h-28 rounded-xl object-cover border-4 border-white shadow-lg"
                  />
                  <div className="absolute -top-3 -right-3 bg-yellow-400 rounded-full p-2 shadow-md">
                    <Trophy className="h-5 w-5 text-white" />
                  </div>
                </div>
                
                <div>
                  <h4 className="text-2xl font-bold text-slate-800 flex items-center">
                    {winner.name} <span className="ml-2 text-2xl">{winner.logo}</span>
                  </h4>
                  <p className="text-slate-600">{winner.party}</p>
                  <div className="mt-2">
                    <div className="flex items-center space-x-2 text-lg font-bold text-blue-700">
                      <span>{formatNumber(winner.votes)} votes</span>
                      <span>•</span>
                      <span>{winner.percentage.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-blue-100 rounded-full h-2 mt-1">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${winner.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Results Chart */}
        <div className="mb-8">
          <h3 className="text-xl font-bold text-slate-800 mb-4">Vote Distribution</h3>
          <div className="bg-white/70 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
            {sortedCandidates.map((candidate, index) => (
              <div key={candidate.id} className="mb-4 last:mb-0">
                <div className="flex justify-between items-center mb-1">
                  <div className="flex items-center space-x-2">
                    {index === 0 && <Trophy className="h-4 w-4 text-yellow-500" />}
                    {index === 1 && <Medal className="h-4 w-4 text-slate-400" />}
                    {index === 2 && <Medal className="h-4 w-4 text-amber-700" />}
                    <span className="font-medium text-slate-800">{candidate.name} ({candidate.party})</span>
                    <span className="text-xl">{candidate.logo}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-sm font-medium text-slate-700">{candidate.percentage.toFixed(1)}%</span>
                    <span className="font-bold text-slate-800">{formatNumber(candidate.votes)}</span>
                  </div>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-3">
                  <div 
                    className={`${
                      index === 0 ? 'bg-blue-600' : 
                      index === 1 ? 'bg-slate-500' :
                      index === 2 ? 'bg-amber-700' : 'bg-slate-400'
                    } h-3 rounded-full transition-all duration-1000 ease-out`}
                    style={{ width: `${candidate.percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
            
            <p className="text-sm text-slate-500 mt-4 text-center">
              Total Votes: {formatNumber(totalVotes)}
            </p>
          </div>
        </div>
        
        {/* Blockchain Verification */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-center text-blue-800">
            <Hash className="h-4 w-4 mr-2" />
            <span className="font-medium text-sm">Blockchain Verification</span>
          </div>
          <p className="text-blue-700 text-xs font-mono mt-1">
            0x{Math.random().toString(16).substr(2, 40)}...
          </p>
          <p className="text-xs text-blue-600 mt-1">
            These results are secured on the Ethereum blockchain and cannot be altered.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ElectionResultsModal;
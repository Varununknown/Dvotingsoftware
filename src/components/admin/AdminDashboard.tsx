import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVoting } from '../../contexts/VotingContext';
import syncService from '../../services/syncService';

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://dvotingsoftware.onrender.com/api';

import { 
  LayoutDashboard, 
  Plus, 
  Settings, 
  Users, 
  BarChart3, 
  LogOut,
  Vote,
  Calendar,
  Lock,
  TrendingUp,
  Building,
  CheckCircle,
  Clock,
  AlertCircle,
  Eye,
  Trophy,
  Megaphone,
  Send
} from 'lucide-react';
import CreateElectionModal from './CreateElectionModal';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { elections, setIsAdmin, updateElection } = useVoting();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const handleLogout = () => {
    setIsAdmin(false);
    navigate('/');
  };

  const activeElections = elections.filter(e => e.status === 'active');
  const upcomingElections = elections.filter(e => e.status === 'upcoming');
  const closedElections = elections.filter(e => e.status === 'closed');

  const totalVotes = elections.reduce((sum, election) => {
    return sum + Object.values(election.votes).reduce((electionSum, votes) => electionSum + votes, 0);
  }, 0);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'elections', label: 'Manage Elections', icon: Vote },
    { id: 'candidates', label: 'Candidates', icon: Users },
    { id: 'results', label: 'Results & Analytics', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const handleElectionStatusChange = async (electionId: string, newStatus: 'upcoming' | 'active' | 'closed') => {
    // Update election locally first (preserve existing functionality)
    updateElection(electionId, { status: newStatus });
    
    // Notify sync service for real-time updates across devices
    await syncService.notifyAdminAction('STATUS_CHANGED', {
      electionId,
      newStatus,
      oldStatus: elections.find(e => e.id === electionId)?.status
    });
  };

  const handleReleaseResults = async (electionId: string) => {
    try {
      const election = elections.find(e => e.id === electionId);
      if (!election) return;

      // Call backend API to release results
      const response = await fetch(`${API_BASE_URL}/elections/${electionId}/release-results`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          releaseMessage: `Results for ${election.title} have been officially released!`,
          releaseType: 'standard'
        }),
      });

      if (response.ok) {
        // Update local state
        updateElection(electionId, { 
          resultsReleased: true, 
          resultsReleasedAt: new Date().toISOString() 
        });

        // Notify sync service for cross-device updates
        await syncService.notifyAdminAction('RESULTS_RELEASED', {
          electionId,
          electionTitle: election.title
        });

        console.log('Results released successfully!');
      } else {
        console.error('Failed to release results');
      }
    } catch (error) {
      console.error('Error releasing results:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-white/70 backdrop-blur-sm border-r border-white/20 min-h-screen p-6">
          <div className="flex items-center space-x-3 mb-8">
            <div className="p-2 bg-amber-600 rounded-lg">
              <Building className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-800">SecureVote</h1>
              <p className="text-sm text-slate-600">Admin Panel</p>
            </div>
          </div>

          <nav className="space-y-2">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors duration-200 ${
                  activeTab === item.id
                    ? 'bg-amber-100 text-amber-700'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <item.icon className="h-5 w-5" />
                <span className="font-medium">{item.label}</span>
              </button>
            ))}
          </nav>

          <div className="mt-auto pt-8">
            <button
              onClick={handleLogout}
              className="w-full flex items-center space-x-3 px-4 py-3 text-slate-600 hover:bg-red-50 hover:text-red-600 rounded-xl transition-colors duration-200"
            >
              <LogOut className="h-5 w-5" />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6">
          {activeTab === 'dashboard' && (
            <div>
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-3xl font-bold text-slate-800">Dashboard Overview</h2>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="bg-gradient-to-r from-amber-500 to-amber-600 text-white px-6 py-3 rounded-xl font-medium hover:from-amber-600 hover:to-amber-700 transition-colors duration-200 flex items-center space-x-2"
                >
                  <Plus className="h-5 w-5" />
                  <span>Create Election</span>
                </button>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white/70 backdrop-blur-sm border border-white/20 rounded-3xl p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-600 text-sm">Active Elections</p>
                      <p className="text-3xl font-bold text-green-600">{activeElections.length}</p>
                    </div>
                    <div className="p-3 bg-green-100 rounded-2xl">
                      <Vote className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white/70 backdrop-blur-sm border border-white/20 rounded-3xl p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-600 text-sm">Upcoming Elections</p>
                      <p className="text-3xl font-bold text-blue-600">{upcomingElections.length}</p>
                    </div>
                    <div className="p-3 bg-blue-100 rounded-2xl">
                      <Calendar className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white/70 backdrop-blur-sm border border-white/20 rounded-3xl p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-600 text-sm">Closed Elections</p>
                      <p className="text-3xl font-bold text-gray-600">{closedElections.length}</p>
                    </div>
                    <div className="p-3 bg-gray-100 rounded-2xl">
                      <Lock className="h-6 w-6 text-gray-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white/70 backdrop-blur-sm border border-white/20 rounded-3xl p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-600 text-sm">Total Votes Cast</p>
                      <p className="text-3xl font-bold text-purple-600">{totalVotes.toLocaleString()}</p>
                    </div>
                    <div className="p-3 bg-purple-100 rounded-2xl">
                      <TrendingUp className="h-6 w-6 text-purple-600" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Elections */}
              <div className="bg-white/70 backdrop-blur-sm border border-white/20 rounded-3xl p-6">
                <h3 className="text-xl font-bold text-slate-800 mb-6">Election Status</h3>
                <div className="space-y-4">
                  {elections.map((election) => {
                    const totalElectionVotes = Object.values(election.votes).reduce((sum, votes) => sum + votes, 0);
                    return (
                      <div key={election.id} className="flex items-center justify-between p-4 bg-white/50 rounded-xl border border-white/30">
                        <div className="flex items-center space-x-4">
                          <span className="text-2xl">{election.logo}</span>
                          <div>
                            <h4 className="font-semibold text-slate-800">{election.title}</h4>
                            <p className="text-sm text-slate-600">{totalElectionVotes.toLocaleString()} votes cast</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            election.status === 'active' ? 'bg-green-100 text-green-800' :
                            election.status === 'upcoming' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {election.status.toUpperCase()}
                          </span>
                          <button className="p-2 hover:bg-slate-100 rounded-full transition-colors duration-200">
                            <Eye className="h-4 w-4 text-slate-500" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'elections' && (
            <div>
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-3xl font-bold text-slate-800">Manage Elections</h2>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="bg-gradient-to-r from-amber-500 to-amber-600 text-white px-6 py-3 rounded-xl font-medium hover:from-amber-600 hover:to-amber-700 transition-colors duration-200 flex items-center space-x-2"
                >
                  <Plus className="h-5 w-5" />
                  <span>Create New Election</span>
                </button>
              </div>

              <div className="grid gap-6">
                {elections.map((election) => (
                  <div key={election.id} className="bg-white/70 backdrop-blur-sm border border-white/20 rounded-3xl p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-4">
                        <span className="text-3xl">{election.logo}</span>
                        <div>
                          <h3 className="text-xl font-bold text-slate-800">{election.title}</h3>
                          <p className="text-slate-600">{election.description}</p>
                          <div className="flex items-center space-x-4 mt-2">
                            <p className="text-sm text-slate-500">
                              Start: {new Date(election.startDate).toLocaleDateString()}
                            </p>
                            <p className="text-sm text-slate-500">
                              End: {new Date(election.endDate).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <select
                          value={election.status}
                          onChange={(e) => handleElectionStatusChange(election.id, e.target.value as any)}
                          className={`px-3 py-1 rounded-full text-xs font-medium border-0 ${
                            election.status === 'active' ? 'bg-green-100 text-green-800' :
                            election.status === 'upcoming' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}
                        >
                          <option value="upcoming">UPCOMING</option>
                          <option value="active">ACTIVE</option>
                          <option value="closed">CLOSED</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-3 gap-4">
                      {election.candidates.map((candidate) => (
                        <div key={candidate.id} className="bg-white/50 rounded-xl p-4 border border-white/30">
                          <img 
                            src={candidate.photo} 
                            alt={candidate.name}
                            className="w-16 h-16 rounded-full object-cover mx-auto mb-3"
                          />
                          <div className="text-center">
                            <h4 className="font-semibold text-slate-800">{candidate.name}</h4>
                            <p className="text-sm text-slate-600">{candidate.party}</p>
                            <span className="text-lg">{candidate.logo}</span>
                            <p className="text-sm text-slate-500 mt-2">
                              Votes: {election.votes[candidate.id] || 0}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'results' && (
            <div>
              <h2 className="text-3xl font-bold text-slate-800 mb-8">Results & Analytics</h2>
              
              <div className="grid gap-6">
                {elections.map((election) => {
                  const totalVotes = Object.values(election.votes).reduce((sum, votes) => sum + votes, 0);
                  const sortedCandidates = election.candidates
                    .map(candidate => ({
                      ...candidate,
                      votes: election.votes[candidate.id] || 0,
                      percentage: totalVotes > 0 ? ((election.votes[candidate.id] || 0) / totalVotes * 100).toFixed(1) : '0.0'
                    }))
                    .sort((a, b) => b.votes - a.votes);

                  const winner = sortedCandidates[0];

                  return (
                    <div key={election.id} className="bg-white/70 backdrop-blur-sm border border-white/20 rounded-3xl p-6">
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center space-x-4">
                          <span className="text-3xl">{election.logo}</span>
                          <div>
                            <h3 className="text-xl font-bold text-slate-800">{election.title}</h3>
                            <p className="text-slate-600">Total Votes: {totalVotes.toLocaleString()}</p>
                          </div>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          election.status === 'active' ? 'bg-green-100 text-green-800' :
                          election.status === 'upcoming' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {election.status.toUpperCase()}
                        </span>
                      </div>

                      {totalVotes > 0 && (
                        <>
                          {election.status === 'closed' && winner && (
                            <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 rounded-xl p-4 mb-6">
                              <div className="flex items-center space-x-3">
                                <Trophy className="h-6 w-6 text-yellow-600" />
                                <div>
                                  <p className="font-semibold text-yellow-800">Winner: {winner.name}</p>
                                  <p className="text-yellow-700 text-sm">{winner.votes.toLocaleString()} votes ({winner.percentage}%)</p>
                                </div>
                              </div>
                            </div>
                          )}

                          <div className="space-y-4">
                            {sortedCandidates.map((candidate, index) => (
                              <div key={candidate.id} className="flex items-center space-between">
                                <div className="flex items-center space-x-4 flex-1">
                                  <img 
                                    src={candidate.photo} 
                                    alt={candidate.name}
                                    className="w-12 h-12 rounded-full object-cover"
                                  />
                                  <div className="flex-1">
                                    <div className="flex items-center justify-between mb-2">
                                      <div>
                                        <h4 className="font-semibold text-slate-800">{candidate.name}</h4>
                                        <p className="text-sm text-slate-600">{candidate.party}</p>
                                      </div>
                                      <div className="text-right">
                                        <p className="font-bold text-slate-800">{candidate.votes.toLocaleString()}</p>
                                        <p className="text-sm text-slate-600">{candidate.percentage}%</p>
                                      </div>
                                    </div>
                                    <div className="w-full bg-slate-200 rounded-full h-2">
                                      <div 
                                        className={`h-2 rounded-full transition-all duration-500 ${
                                          index === 0 ? 'bg-gradient-to-r from-green-500 to-green-600' :
                                          index === 1 ? 'bg-gradient-to-r from-blue-500 to-blue-600' :
                                          'bg-gradient-to-r from-slate-400 to-slate-500'
                                        }`}
                                        style={{ width: `${candidate.percentage}%` }}
                                      ></div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </>
                      )}

                      {/* Result Release Section for Closed Elections */}
                      {election.status === 'closed' && totalVotes > 0 && (
                        <div className="mt-6 pt-6 border-t border-slate-200">
                          {!election.resultsReleased ? (
                            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                  <Megaphone className="h-6 w-6 text-blue-600" />
                                  <div>
                                    <h4 className="font-semibold text-blue-800">Release Results</h4>
                                    <p className="text-blue-700 text-sm">Announce results to all voters dynamically</p>
                                  </div>
                                </div>
                                <button
                                  onClick={() => handleReleaseResults(election.id)}
                                  className="flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-colors duration-200"
                                >
                                  <Send className="h-4 w-4" />
                                  <span>Release Now</span>
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4">
                              <div className="flex items-center space-x-3">
                                <CheckCircle className="h-6 w-6 text-green-600" />
                                <div>
                                  <h4 className="font-semibold text-green-800">Results Released</h4>
                                  <p className="text-green-700 text-sm">
                                    Released on {election.resultsReleasedAt ? 
                                      new Date(election.resultsReleasedAt).toLocaleDateString() : 
                                      'Unknown date'
                                    }
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {totalVotes === 0 && (
                        <div className="text-center py-8">
                          <BarChart3 className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                          <p className="text-slate-600">No votes cast yet</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'candidates' && (
            <div>
              <h2 className="text-3xl font-bold text-slate-800 mb-8">Candidate Management</h2>
              
              <div className="grid gap-6">
                {elections.map((election) => (
                  <div key={election.id} className="bg-white/70 backdrop-blur-sm border border-white/20 rounded-3xl p-6">
                    <div className="flex items-center space-x-4 mb-6">
                      <span className="text-2xl">{election.logo}</span>
                      <h3 className="text-xl font-bold text-slate-800">{election.title}</h3>
                    </div>
                    
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {election.candidates.map((candidate) => (
                        <div key={candidate.id} className="bg-white/50 rounded-xl p-6 border border-white/30">
                          <img 
                            src={candidate.photo} 
                            alt={candidate.name}
                            className="w-20 h-20 rounded-full object-cover mx-auto mb-4"
                          />
                          <div className="text-center">
                            <h4 className="font-semibold text-slate-800 mb-1">{candidate.name}</h4>
                            <p className="text-sm text-slate-600 mb-2">{candidate.party}</p>
                            <span className="text-2xl block mb-3">{candidate.logo}</span>
                            <p className="text-xs text-slate-500 mb-4">{candidate.bio}</p>
                            <div className="flex items-center justify-center space-x-2 text-sm">
                              <span className="text-slate-600">Votes:</span>
                              <span className="font-semibold text-slate-800">
                                {election.votes[candidate.id] || 0}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="max-w-2xl">
              <h2 className="text-3xl font-bold text-slate-800 mb-8">System Settings</h2>
              <div className="bg-white/70 backdrop-blur-sm border border-white/20 rounded-3xl p-8">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-800 mb-4">Security Settings</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-xl">
                        <div className="flex items-center">
                          <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
                          <span className="text-green-800 font-medium">Blockchain Integration</span>
                        </div>
                        <span className="text-green-700 text-sm">Active</span>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-xl">
                        <div className="flex items-center">
                          <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
                          <span className="text-green-800 font-medium">Biometric Verification</span>
                        </div>
                        <span className="text-green-700 text-sm">Enabled</span>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-xl">
                        <div className="flex items-center">
                          <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
                          <span className="text-green-800 font-medium">End-to-End Encryption</span>
                        </div>
                        <span className="text-green-700 text-sm">Active</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-slate-800 mb-4">System Information</h3>
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-slate-600">Version:</span>
                          <span className="ml-2 font-medium">v2.1.0</span>
                        </div>
                        <div>
                          <span className="text-slate-600">Last Update:</span>
                          <span className="ml-2 font-medium">Jan 2025</span>
                        </div>
                        <div>
                          <span className="text-slate-600">Uptime:</span>
                          <span className="ml-2 font-medium">99.9%</span>
                        </div>
                        <div>
                          <span className="text-slate-600">Network:</span>
                          <span className="ml-2 font-medium">Mainnet</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {showCreateModal && (
        <CreateElectionModal onClose={() => setShowCreateModal(false)} />
      )}
    </div>
  );
};

export default AdminDashboard;
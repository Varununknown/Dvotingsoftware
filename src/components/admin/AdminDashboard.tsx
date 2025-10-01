import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVoting } from '../../contexts/VotingContext';
import syncService from '../../services/syncService';
import ShareButton from '../ShareButton';

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
  Send,
  Menu,
  Search,
  Trash2,
  UserX,
  Filter,
  Shield
} from 'lucide-react';
import CreateElectionModal from './CreateElectionModal';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { elections, setIsAdmin, updateElection } = useVoting();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // User Management State
  const [voters, setVoters] = useState([]);
  const [voterStats, setVoterStats] = useState({ totalVoters: 0, verifiedVoters: 0, votersWhoVoted: 0 });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // all, verified, unverified
  const [loadingUsers, setLoadingUsers] = useState(false);

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
    { id: 'users', label: 'User Management', icon: Shield },
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
        method: 'PUT',
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

  const handleUnreleaseResults = async (electionId: string) => {
    try {
      const election = elections.find(e => e.id === electionId);
      if (!election) return;

      // Call backend API to unrelease results
      const response = await fetch(`${API_BASE_URL}/elections/${electionId}/unrelease-results`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        // Update local state
        updateElection(electionId, { 
          resultsReleased: false, 
          resultsReleasedAt: undefined 
        });

        // Notify sync service for cross-device updates
        await syncService.notifyAdminAction('RESULTS_UNRELEASED', {
          electionId,
          electionTitle: election.title
        });

        console.log('Results hidden successfully!');
      } else {
        console.error('Failed to hide results');
      }
    } catch (error) {
      console.error('Error hiding results:', error);
    }
  };

  const handleDeleteElection = async (electionId: string) => {
    try {
      const election = elections.find(e => e.id === electionId);
      if (!election) return;

      // Confirmation dialog for safety
      const confirmed = window.confirm(
        `⚠️ DANGER: Delete "${election.title}"?\n\nThis action CANNOT be undone!\n\n` +
        `• All votes will be permanently lost\n` +
        `• Election data will be completely removed\n` +
        `• Voters will no longer see this election\n\n` +
        `Are you absolutely sure?`
      );

      if (!confirmed) return;

      // Call backend API to delete election
      const response = await fetch(`${API_BASE_URL}/elections/${electionId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        // Remove from local state (preserving other elections)
        window.location.reload(); // Safe reload to ensure state consistency

        console.log('Election deleted successfully!');
      } else {
        console.error('Failed to delete election');
        alert('Failed to delete election. Please try again.');
      }
    } catch (error) {
      console.error('Error deleting election. Please try again.');
      alert('Error deleting election. Please try again.');
    }
  };

  // User Management Functions
  const fetchAllVoters = async () => {
    setLoadingUsers(true);
    try {
      const response = await fetch(`${API_BASE_URL}/voters/admin/all`);
      if (response.ok) {
        const data = await response.json();
        setVoters(data.voters);
        setVoterStats(data.stats);
      } else {
        console.error('Failed to fetch voters');
      }
    } catch (error) {
      console.error('Error fetching voters:', error);
    }
    setLoadingUsers(false);
  };

  const handleRemoveUser = async (voterId: string, voterName: string, aadhaarId: string) => {
    const confirmed = window.confirm(
      `⚠️ DANGER: Remove voter "${voterName}"?\n\n` +
      `Aadhaar ID: ${aadhaarId}\n\n` +
      `This action CANNOT be undone!\n\n` +
      `• All voting history will be permanently lost\n` +
      `• User will need to re-register to vote again\n` +
      `• This may affect election integrity\n\n` +
      `Are you absolutely sure?`
    );

    if (!confirmed) return;

    try {
      const response = await fetch(`${API_BASE_URL}/voters/admin/${voterId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        // Refresh the voter list
        await fetchAllVoters();
        alert('User removed successfully! ✅');
      } else {
        console.error('Failed to remove user');
        alert('Failed to remove user. Please try again.');
      }
    } catch (error) {
      console.error('Error removing user:', error);
      alert('Error removing user. Please try again.');
    }
  };

  const handleRemoveAllUsers = async () => {
    // First confirmation
    const firstConfirm = window.confirm(
      `🚨 EXTREME DANGER: Remove ALL Users?\n\n` +
      `This will PERMANENTLY DELETE ALL ${voterStats.totalVoters} registered voters!\n\n` +
      `⚠️ WARNING: This action is IRREVERSIBLE!\n\n` +
      `Are you sure you want to continue?`
    );

    if (!firstConfirm) return;

    // Second confirmation (double safety check)
    const secondConfirm = window.confirm(
      `🔥 FINAL WARNING: Delete ALL Users?\n\n` +
      `You are about to permanently delete:\n` +
      `• ${voterStats.totalVoters} total users\n` +
      `• ${voterStats.verifiedVoters} verified users\n` +
      `• All voting history and records\n` +
      `• All biometric credentials\n\n` +
      `This will reset the entire voter database!\n\n` +
      `Type 'DELETE ALL' to confirm, or cancel to abort.`
    );

    if (!secondConfirm) return;

    // Third confirmation with text input
    const finalConfirm = prompt(
      `🚨 LAST CHANCE: Type 'DELETE ALL USERS' to confirm:\n\n` +
      `This is your final opportunity to cancel this destructive action.\n\n` +
      `Type exactly: DELETE ALL USERS`
    );

    if (finalConfirm !== 'DELETE ALL USERS') {
      alert('❌ Action cancelled. Users were NOT deleted.');
      return;
    }

    try {
      console.log('🚨 Attempting to delete all users...');
      console.log('🔍 API URL:', `${API_BASE_URL}/voters/admin/remove-all`);
      
      const response = await fetch(`${API_BASE_URL}/voters/admin/remove-all`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      console.log('📡 Response status:', response.status);
      console.log('📡 Response ok:', response.ok);

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Success result:', result);
        // Refresh the voter list
        await fetchAllVoters();
        alert(`✅ All users removed successfully!\n\nDeleted: ${result.deletedCount} users`);
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('❌ Error response:', errorData);
        console.error('❌ Response status:', response.status);
        console.error('❌ Response statusText:', response.statusText);
        alert(`❌ Failed to remove all users: ${errorData.error || errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('❌ Network/fetch error:', error);
      alert(`❌ Error removing all users: ${error.message || 'Network error'}`);
    }
  };

  // Load voters when switching to users tab
  React.useEffect(() => {
    if (activeTab === 'users') {
      fetchAllVoters();
    }
  }, [activeTab]);

  // Filter voters based on search and status
  const filteredVoters = voters.filter(voter => {
    const matchesSearch = voter.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         voter.aadhaarId.includes(searchTerm);
    const matchesFilter = filterStatus === 'all' || 
                         (filterStatus === 'verified' && voter.isVerified) ||
                         (filterStatus === 'unverified' && !voter.isVerified);
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="flex">
        {/* Mobile Menu Toggle */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-white/70 backdrop-blur-sm border border-white/20 hover:bg-white/80 transition-colors duration-200"
        >
          <Menu className="h-6 w-6 text-slate-600" />
        </button>

        {/* Sidebar */}
        <div className={`${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-40 w-64 bg-white/70 backdrop-blur-sm border-r border-white/20 min-h-screen p-4 lg:p-6 transition-transform duration-300 ease-in-out overflow-y-auto`}>
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

        {/* Overlay for mobile when sidebar is open */}
        {isMobileMenuOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        {/* Main Content */}
        <div className="flex-1 p-4 lg:p-6 lg:ml-0">
          {/* Mobile Header Space */}
          <div className="lg:hidden h-16 mb-4"></div>
          
          {activeTab === 'dashboard' && (
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 lg:mb-8 gap-4">
                <h2 className="text-2xl lg:text-3xl font-bold text-slate-800">Dashboard Overview</h2>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="bg-gradient-to-r from-amber-500 to-amber-600 text-white px-4 lg:px-6 py-2.5 lg:py-3 rounded-xl font-medium hover:from-amber-600 hover:to-amber-700 transition-colors duration-200 flex items-center justify-center space-x-2"
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

                    <div className="grid md:grid-cols-3 gap-4 mb-6">
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

                    {/* Election Action Buttons */}
                    <div className="flex flex-wrap gap-3 pt-4 border-t border-white/30">
                      {election.status === 'closed' && (
                        <button
                          onClick={() => election.resultsReleased ? handleUnreleaseResults(election.id) : handleReleaseResults(election.id)}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center space-x-2 ${
                            election.resultsReleased 
                              ? 'bg-orange-100 text-orange-700 hover:bg-orange-200' 
                              : 'bg-green-100 text-green-700 hover:bg-green-200'
                          }`}
                        >
                          <Megaphone className="h-4 w-4" />
                          <span>{election.resultsReleased ? 'Hide Results' : 'Release Results'}</span>
                        </button>
                      )}
                      
                      <button
                        onClick={() => handleDeleteElection(election.id)}
                        className="px-4 py-2 rounded-lg text-sm font-medium bg-red-100 text-red-700 hover:bg-red-200 transition-colors duration-200 flex items-center space-x-2"
                      >
                        <AlertCircle className="h-4 w-4" />
                        <span>Delete Election</span>
                      </button>
                      
                      {election.resultsReleased && (
                        <div className="px-3 py-1 bg-green-50 text-green-700 text-xs rounded-full border border-green-200 flex items-center space-x-1">
                          <CheckCircle className="h-3 w-3" />
                          <span>Results Published</span>
                        </div>
                      )}
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
                        <div className="flex items-center space-x-3">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            election.status === 'active' ? 'bg-green-100 text-green-800' :
                            election.status === 'upcoming' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {election.status.toUpperCase()}
                          </span>
                          
                          {/* Share button for released results */}
                          {election.status === 'closed' && election.resultsReleased && totalVotes > 0 && winner && (
                            <ShareButton 
                              electionTitle={election.title}
                              electionId={election.id}
                              results={{
                                winner: {
                                  name: winner.name,
                                  party: winner.party,
                                  votes: winner.votes,
                                  percentage: winner.percentage
                                },
                                totalVotes,
                                candidates: sortedCandidates.map(c => ({
                                  name: c.name,
                                  party: c.party,
                                  votes: c.votes,
                                  percentage: c.percentage
                                }))
                              }}
                            />
                          )}
                        </div>
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

          {activeTab === 'users' && (
            <div>
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-3xl font-bold text-slate-800">User Management</h2>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={fetchAllVoters}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center space-x-2"
                    disabled={loadingUsers}
                  >
                    <Shield className="h-4 w-4" />
                    <span>{loadingUsers ? 'Loading...' : 'Refresh'}</span>
                  </button>
                  
                  {voterStats.totalVoters > 0 && (
                    <button
                      onClick={handleRemoveAllUsers}
                      className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors duration-200 flex items-center space-x-2 border-2 border-red-700"
                      disabled={loadingUsers}
                      title="Remove all users - DANGER: Irreversible action!"
                    >
                      <UserX className="h-4 w-4" />
                      <span>Remove All Users</span>
                    </button>
                  )}
                </div>
              </div>

              {/* User Statistics */}
              <div className="grid md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white/70 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-600 text-sm">Total Users</p>
                      <p className="text-2xl font-bold text-blue-600">{voterStats.totalVoters}</p>
                    </div>
                    <Users className="h-8 w-8 text-blue-600" />
                  </div>
                </div>
                
                <div className="bg-white/70 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-600 text-sm">Verified Users</p>
                      <p className="text-2xl font-bold text-green-600">{voterStats.verifiedVoters}</p>
                    </div>
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                </div>
                
                <div className="bg-white/70 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-600 text-sm">Active Voters</p>
                      <p className="text-2xl font-bold text-purple-600">{voterStats.votersWhoVoted}</p>
                    </div>
                    <Vote className="h-8 w-8 text-purple-600" />
                  </div>
                </div>
              </div>

              {/* Search and Filter */}
              <div className="bg-white/70 backdrop-blur-sm border border-white/20 rounded-2xl p-6 mb-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search by name or Aadhaar ID..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div className="sm:w-48">
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="all">All Users</option>
                      <option value="verified">Verified Only</option>
                      <option value="unverified">Unverified Only</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* User List */}
              <div className="bg-white/70 backdrop-blur-sm border border-white/20 rounded-2xl overflow-hidden">
                {loadingUsers ? (
                  <div className="p-8 text-center">
                    <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-slate-600">Loading users...</p>
                  </div>
                ) : filteredVoters.length === 0 ? (
                  <div className="p-8 text-center">
                    <UserX className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-slate-600 mb-2">No Users Found</h3>
                    <p className="text-slate-500">
                      {searchTerm || filterStatus !== 'all' 
                        ? 'Try adjusting your search or filter criteria.' 
                        : 'No registered users in the system yet.'}
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-slate-50 border-b">
                        <tr>
                          <th className="text-left p-4 font-medium text-slate-700">User Info</th>
                          <th className="text-left p-4 font-medium text-slate-700">Status</th>
                          <th className="text-left p-4 font-medium text-slate-700">Voting Activity</th>
                          <th className="text-left p-4 font-medium text-slate-700">Registered</th>
                          <th className="text-center p-4 font-medium text-slate-700">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredVoters.map((voter, index) => (
                          <tr key={voter._id} className={`border-b ${index % 2 === 0 ? 'bg-white/50' : 'bg-slate-50/50'} hover:bg-blue-50/50 transition-colors duration-200`}>
                            <td className="p-4">
                              <div>
                                <p className="font-medium text-slate-800">{voter.name}</p>
                                <p className="text-sm text-slate-600">ID: ****{voter.aadhaarId.slice(-4)}</p>
                              </div>
                            </td>
                            <td className="p-4">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                voter.isVerified 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {voter.isVerified ? 'Verified' : 'Pending'}
                              </span>
                            </td>
                            <td className="p-4">
                              <div className="text-sm">
                                {Object.keys(voter.hasVoted || {}).length > 0 ? (
                                  <div>
                                    <p className="text-green-600 font-medium">Active Voter</p>
                                    <p className="text-slate-500">{Object.keys(voter.hasVoted).length} elections</p>
                                  </div>
                                ) : (
                                  <p className="text-slate-500">No votes yet</p>
                                )}
                              </div>
                            </td>
                            <td className="p-4">
                              <p className="text-sm text-slate-600">
                                {new Date(voter.createdAt).toLocaleDateString()}
                              </p>
                            </td>
                            <td className="p-4 text-center">
                              <button
                                onClick={() => handleRemoveUser(voter._id, voter.name, voter.aadhaarId)}
                                className="px-3 py-1 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center space-x-1 mx-auto"
                              >
                                <Trash2 className="h-3 w-3" />
                                <span>Remove</span>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Results Summary */}
              {!loadingUsers && filteredVoters.length > 0 && (
                <div className="mt-4 text-center text-sm text-slate-600">
                  Showing {filteredVoters.length} of {voters.length} users
                </div>
              )}
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
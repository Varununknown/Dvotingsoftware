import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVoting } from '../../contexts/VotingContext';
import { useWeb3 } from '../../contexts/Web3Context';
import { 
  User, 
  Vote, 
  Calendar, 
  BarChart3, 
  HelpCircle, 
  LogOut, 
  Camera, 
  CheckCircle,
  Clock,
  Trophy,
  Shield,
  Hash,
  Search,
  Filter,
  X,
  SortAsc,
  SortDesc,
  PieChart,
  Bell,
  Menu
} from 'lucide-react';
import VotingModal from './VotingModal';
import ElectionResultsModal from './ElectionResultsModal';
import CountdownTimer from './CountdownTimer';
import WalletConnection from '../WalletConnection';
import { 
  useNotifications, 
  useElectionNotifications, 
  NotificationBell, 
  NotificationPanel 
} from './NotificationSystem';

const VoterDashboard = () => {
  const navigate = useNavigate();
  const { currentUser, elections, refreshUserData, setCurrentUser } = useVoting();
  
  useEffect(() => {
    // Refresh user data on dashboard load if user is logged in
    if (currentUser?.id) {
      console.log('Refreshing user data on dashboard load...');
      refreshUserData(currentUser.id);
      
      // Set up interval to periodically refresh voter data
      const intervalId = setInterval(() => {
        console.log('Periodic refresh of user data...');
        refreshUserData(currentUser.id);
      }, 30000); // Every 30 seconds
      
      return () => clearInterval(intervalId);
    }
  }, [currentUser?.id, refreshUserData]);
  const [activeTab, setActiveTab] = useState('active');
  const [selectedElection, setSelectedElection] = useState<string | null>(null);
  const [selectedResultElection, setSelectedResultElection] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [dateFilter, setDateFilter] = useState<'all' | 'thisWeek' | 'thisMonth'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Initialize election notifications
  useElectionNotifications(elections);

  // Extract unique categories from elections
  const categories = ['all', ...Array.from(new Set(elections.map(e => e.description.split(' ')[0])))];

  if (!currentUser) {
    navigate('/voter/login');
    return null;
  }

  const handleLogout = () => {
    // Properly clear user data and localStorage
    setCurrentUser(null);
    localStorage.removeItem('currentVoter');
    localStorage.removeItem('mockBlockchainVotes'); // Clear any cached blockchain data
    
    // Navigate to home page
    navigate('/');
  };

  // Date filter functions
  const isThisWeek = (date: string) => {
    const today = new Date();
    const eventDate = new Date(date);
    const diffTime = Math.abs(eventDate.getTime() - today.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7;
  };

  const isThisMonth = (date: string) => {
    const today = new Date();
    const eventDate = new Date(date);
    return eventDate.getMonth() === today.getMonth() && 
           eventDate.getFullYear() === today.getFullYear();
  };

  // Filter and sort elections
  const filterElections = (electionList: typeof elections) => {
    return electionList
      .filter(election => {
        // Search term filter
        if (searchTerm && !election.title.toLowerCase().includes(searchTerm.toLowerCase()) && 
            !election.description.toLowerCase().includes(searchTerm.toLowerCase())) {
          return false;
        }
        
        // Date filter
        if (dateFilter === 'thisWeek' && !isThisWeek(election.status === 'upcoming' ? election.startDate : election.endDate)) {
          return false;
        }
        if (dateFilter === 'thisMonth' && !isThisMonth(election.status === 'upcoming' ? election.startDate : election.endDate)) {
          return false;
        }
        
        // Category filter
        if (categoryFilter !== 'all' && !election.description.toLowerCase().includes(categoryFilter.toLowerCase())) {
          return false;
        }
        
        return true;
      })
      .sort((a, b) => {
        const dateA = new Date(a.status === 'upcoming' ? a.startDate : a.endDate).getTime();
        const dateB = new Date(b.status === 'upcoming' ? b.startDate : b.endDate).getTime();
        return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
      });
  };

  const activeElections = filterElections(elections.filter(e => e.status === 'active'));
  const upcomingElections = filterElections(elections.filter(e => e.status === 'upcoming'));
  // Only show elections where results are explicitly released by admin
  const closedElections = filterElections(elections.filter(e => e.status === 'closed' && e.resultsReleased === true));

  const menuItems = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'active', label: 'Active Elections', icon: Vote },
    { id: 'upcoming', label: 'Upcoming Elections', icon: Calendar },
    { id: 'results', label: 'Results', icon: BarChart3 },
    { id: 'help', label: 'Help', icon: HelpCircle },
  ];

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
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-600 rounded-lg">
                <Vote className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-800">SecureVote</h1>
                <p className="text-sm text-slate-600">Voter Portal</p>
              </div>
            </div>
            
            <NotificationBell />
          </div>

          <nav className="space-y-2">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors duration-200 ${
                  activeTab === item.id
                    ? 'bg-blue-100 text-blue-700'
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
          
          {/* Blockchain Connection Status */}
          <WalletConnection className="mb-4 lg:mb-6" />
          
          {/* Search and Filter Bar - only show for election tabs */}
          {(activeTab === 'active' || activeTab === 'upcoming' || activeTab === 'results') && (
            <div className="mb-4 lg:mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="relative flex-grow max-w-md">
                  <input
                    type="text"
                    placeholder="Search elections..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-white/70 backdrop-blur-sm border border-white/20 rounded-xl py-2 pl-10 pr-4 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <Search className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                </div>
                
                <button 
                  onClick={() => setShowFilters(!showFilters)}
                  className={`flex items-center justify-center space-x-2 py-2 px-4 rounded-xl transition-colors duration-200 ${
                    showFilters ? 'bg-blue-100 text-blue-700' : 'bg-white/70 backdrop-blur-sm border border-white/20 text-slate-600'
                  }`}
                >
                  <Filter className="h-5 w-5" />
                  <span>Filters</span>
                </button>
                
                <button 
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="flex items-center space-x-2 bg-white/70 backdrop-blur-sm border border-white/20 py-2 px-4 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors duration-200"
                >
                  {sortOrder === 'asc' ? (
                    <><SortAsc className="h-5 w-5" /><span>Earliest</span></>
                  ) : (
                    <><SortDesc className="h-5 w-5" /><span>Latest</span></>
                  )}
                </button>
              </div>
              
              {showFilters && (
                <div className="mt-3 bg-white/80 backdrop-blur-sm border border-white/20 rounded-xl p-4 animate-fadeIn">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-slate-800">Filter Options</h3>
                    <button 
                      onClick={() => setShowFilters(false)} 
                      className="p-1 text-slate-400 hover:text-slate-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-slate-600 mb-1">Date Range</label>
                      <select
                        value={dateFilter}
                        onChange={(e) => setDateFilter(e.target.value as any)}
                        className="w-full bg-white/70 border border-slate-200 rounded-lg p-2 text-sm"
                      >
                        <option value="all">All Dates</option>
                        <option value="thisWeek">This Week</option>
                        <option value="thisMonth">This Month</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm text-slate-600 mb-1">Category</label>
                      <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="w-full bg-white/70 border border-slate-200 rounded-lg p-2 text-sm"
                      >
                        {categories.map((category) => (
                          <option key={category} value={category}>
                            {category === 'all' ? 'All Categories' : category}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="max-w-2xl">
              <h2 className="text-3xl font-bold text-slate-800 mb-6">Profile</h2>
              <div className="bg-white/70 backdrop-blur-sm border border-white/20 rounded-3xl p-8">
                <div className="flex items-center space-x-6 mb-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                    <User className="h-10 w-10 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-slate-800">Verified Voter</h3>
                    <p className="text-slate-600">ID: ****{currentUser.aadhaarId.slice(-4)}</p>
                    <div className="flex items-center mt-2">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                      <span className="text-green-700 font-medium">Verified</span>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                    <div className="flex items-center text-green-800">
                      <Shield className="h-5 w-5 mr-2" />
                      <span className="font-medium">Biometric Verified</span>
                    </div>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <div className="flex items-center text-blue-800">
                      <Hash className="h-5 w-5 mr-2" />
                      <span className="font-medium">Blockchain Secured</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'active' && (
            <div>
              <h2 className="text-3xl font-bold text-slate-800 mb-6">Active Elections</h2>
              {activeElections.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-slate-600 mb-2">No Active Elections</h3>
                  <p className="text-slate-500">Check back later for upcoming elections.</p>
                </div>
              ) : (
                <div className="grid gap-6">
                  {activeElections.map((election) => (
                    <div key={election.id} className="bg-white/70 backdrop-blur-sm border border-white/20 rounded-3xl p-6">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-4 space-y-4 sm:space-y-0">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <span className="text-2xl">{election.logo}</span>
                            <h3 className="text-xl font-bold text-slate-800">{election.title}</h3>
                            <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full">
                              LIVE
                            </span>
                          </div>
                          <p className="text-slate-600 mb-2">{election.description}</p>
                          <div className="flex flex-wrap justify-between items-center">
                            <p className="text-sm text-slate-500">Ends: {new Date(election.endDate).toLocaleDateString()}</p>
                            <CountdownTimer targetDate={election.endDate} isActive={true} />
                          </div>
                        </div>
                        {(currentUser.hasVoted?.[election.id] || currentUser.votingHistory?.some(v => v.electionId === election.id)) ? (
                          <div className="flex flex-col sm:items-end items-center mt-4 sm:mt-0">
                            <div className="flex items-center bg-green-100 text-green-800 px-4 py-2 rounded-full mb-2">
                              <CheckCircle className="h-4 w-4 mr-2" />
                              <span className="font-medium">Voted</span>
                            </div>
                            {/* Show blockchain transaction hash if available */}
                            {(() => {
                              const vote = currentUser.votingHistory?.find(v => v.electionId === election.id);
                              return vote?.blockchainTxHash ? (
                                <div className="flex items-center text-xs text-slate-500 mb-1">
                                  <Hash className="h-3 w-3 mr-1" />
                                  <span title={vote.blockchainTxHash}>
                                    Blockchain: {vote.blockchainTxHash.substring(0, 10)}...
                                  </span>
                                </div>
                              ) : null;
                            })()}
                            <button
                              onClick={() => setSelectedElection(election.id)}
                              className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 py-2 rounded-xl font-medium hover:from-orange-600 hover:to-orange-700 transition-colors duration-200 text-sm flex items-center space-x-2"
                            >
                              <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
                              <span>Revote</span>
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setSelectedElection(election.id)}
                            className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-2 rounded-xl font-medium hover:from-blue-600 hover:to-blue-700 transition-colors duration-200 mt-4 sm:mt-0"
                          >
                            Vote Now
                          </button>
                        )}
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
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'upcoming' && (
            <div>
              <h2 className="text-3xl font-bold text-slate-800 mb-6">Upcoming Elections</h2>
              {upcomingElections.length === 0 ? (
                <div className="text-center py-12">
                  <Clock className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-slate-600 mb-2">No Upcoming Elections</h3>
                  <p className="text-slate-500">All scheduled elections are currently active or closed.</p>
                </div>
              ) : (
                <div className="grid gap-6">
                  {upcomingElections.map((election) => (
                    <div key={election.id} className="bg-white/70 backdrop-blur-sm border border-white/20 rounded-3xl p-6">
                      <div className="flex items-center space-x-3 mb-4">
                        <span className="text-2xl">{election.logo}</span>
                        <h3 className="text-xl font-bold text-slate-800">{election.title}</h3>
                        <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2 py-1 rounded-full">
                          UPCOMING
                        </span>
                      </div>
                      <p className="text-slate-600 mb-4">{election.description}</p>
                      <div className="flex flex-wrap justify-between items-center">
                        <p className="text-slate-500">Starts: {new Date(election.startDate).toLocaleDateString()}</p>
                        <CountdownTimer targetDate={election.startDate} isActive={false} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'results' && (
            <div>
              <h2 className="text-3xl font-bold text-slate-800 mb-6">Election Results</h2>
              {closedElections.length === 0 ? (
                <div className="text-center py-12">
                  <BarChart3 className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-slate-600 mb-2">No Results Available</h3>
                  <p className="text-slate-500">Results will appear here after elections are completed.</p>
                </div>
              ) : (
                <div className="grid gap-6">
                  {closedElections.map((election) => {
                    const totalVotes = Object.values(election.votes).reduce((sum, votes) => sum + votes, 0);
                    const sortedCandidates = election.candidates
                      .map(candidate => ({
                        ...candidate,
                        votes: election.votes[candidate.id] || 0,
                        percentage: totalVotes > 0 ? ((election.votes[candidate.id] || 0) / totalVotes * 100).toFixed(1) : '0.0'
                      }))
                      .sort((a, b) => b.votes - a.votes);

                    return (
                      <div key={election.id} className="bg-white/70 backdrop-blur-sm border border-white/20 rounded-3xl p-6">
                        <div className="flex items-center justify-between mb-6">
                          <div className="flex items-center space-x-3">
                            <span className="text-2xl">{election.logo}</span>
                            <h3 className="text-xl font-bold text-slate-800">{election.title}</h3>
                            <span className="bg-gray-100 text-gray-800 text-xs font-medium px-2 py-1 rounded-full">
                              CLOSED
                            </span>
                          </div>
                          
                          <button 
                            onClick={() => setSelectedResultElection(election.id)}
                            className="bg-gradient-to-r from-indigo-500 to-indigo-600 text-white px-4 py-2 rounded-xl font-medium hover:from-indigo-600 hover:to-indigo-700 transition-colors duration-200 flex items-center space-x-2"
                          >
                            <PieChart className="h-4 w-4" />
                            <span>View Results</span>
                          </button>
                        </div>

                        <div className="mb-6">
                          <p className="text-slate-600 mb-2">Total Votes: {totalVotes.toLocaleString()}</p>
                          <div className="w-full bg-slate-200 rounded-full h-2">
                            <div 
                              className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full" 
                              style={{ width: '100%' }}
                            ></div>
                          </div>
                        </div>

                        <div className="space-y-4">
                          {sortedCandidates.map((candidate, index) => (
                            <div key={candidate.id} className="flex items-center justify-between p-4 bg-white/50 rounded-xl border border-white/30">
                              <div className="flex items-center space-x-4">
                                {index === 0 && (
                                  <Trophy className="h-6 w-6 text-yellow-500" />
                                )}
                                <img 
                                  src={candidate.photo} 
                                  alt={candidate.name}
                                  className="w-12 h-12 rounded-full object-cover"
                                />
                                <div>
                                  <h4 className="font-semibold text-slate-800">{candidate.name}</h4>
                                  <p className="text-sm text-slate-600">{candidate.party}</p>
                                </div>
                                <span className="text-lg">{candidate.logo}</span>
                              </div>
                              <div className="text-right">
                                <p className="text-lg font-bold text-slate-800">{candidate.votes.toLocaleString()}</p>
                                <p className="text-sm text-slate-600">{candidate.percentage}%</p>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                          <div className="flex items-center text-blue-800">
                            <Hash className="h-4 w-4 mr-2" />
                            <span className="font-medium text-sm">Blockchain Transaction Hash</span>
                          </div>
                          <p className="text-blue-700 text-xs font-mono mt-1">
                            0x{Math.random().toString(16).substr(2, 40)}...
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'help' && (
            <div className="max-w-2xl">
              <h2 className="text-3xl font-bold text-slate-800 mb-6">Help & Support</h2>
              <div className="bg-white/70 backdrop-blur-sm border border-white/20 rounded-3xl p-8">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-800 mb-2">How to Vote</h3>
                    <p className="text-slate-600">1. Navigate to Active Elections<br/>2. Click "Vote Now" on your chosen election<br/>3. Review candidates and cast your vote<br/>4. Confirm with biometric verification</p>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-800 mb-2">Security</h3>
                    <p className="text-slate-600">Your vote is secured using blockchain technology and biometric verification. All transactions are immutable and transparent.</p>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-800 mb-2">Support</h3>
                    <p className="text-slate-600">For technical support, contact the Election Commission at support@securevote.gov</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {selectedElection && (
        <VotingModal
          electionId={selectedElection}
          onClose={() => setSelectedElection(null)}
        />
      )}
      
      {selectedResultElection && (
        <ElectionResultsModal
          election={elections.find(e => e.id === selectedResultElection)!}
          onClose={() => setSelectedResultElection(null)}
        />
      )}
      
      {/* Notification Panel */}
      <NotificationPanel />
    </div>
  );
};

export default VoterDashboard;
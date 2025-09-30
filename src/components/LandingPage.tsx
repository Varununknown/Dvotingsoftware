import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Vote, Building, Shield, Users, CheckCircle, Globe } from 'lucide-react';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <header className="px-4 sm:px-6 py-4">
        <nav className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="p-1.5 sm:p-2 bg-black rounded-lg">
              <Vote className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-800">SecureVote</h1>
              <p className="text-xs sm:text-sm text-slate-600">Blockchain Voting Platform</p>
            </div>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="px-4 sm:px-6 py-12 sm:py-20">
        <div className="max-w-7xl mx-auto text-center">
          <div className="mb-4">
            <span className="inline-flex items-center px-3 sm:px-4 py-2 bg-green-100 text-green-800 rounded-full text-xs sm:text-sm font-medium mb-4">
              <Shield className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
              Government Certified Platform
            </span>
          </div>
          
          <h1 className="text-2xl sm:text-3xl md:text-6xl font-bold text-slate-800 mb-4 sm:mb-6">
            Decentralized Voting System
          </h1>
          
          {/*<p className="text-0xl text-slate-600 mb-4 max-w-3xl mx-auto">
            Enhancing Election Integrity with Blockchain Technology
          </p>
          */}

          <p className="text-base sm:text-lg text-slate-500 mb-8 sm:mb-12 max-w-2xl mx-auto px-4">
            Accountability, Transparency, and tamper-proof elections powered by cutting-edge blockchain infrastructure.
          </p>

          {/* Role Selection Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 max-w-4xl mx-auto mb-12 sm:mb-16">
            {/* Voter Card */}
            <div
              onClick={() => navigate('/voter/register')}
              className="group relative overflow-hidden bg-white/70 backdrop-blur-sm border border-white/20 rounded-2xl sm:rounded-3xl p-6 sm:p-8 cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-2xl"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-indigo-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              <div className="relative z-10">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-black to-blue-600 rounded-xl sm:rounded-2xl flex items-center justify-center mb-4 sm:mb-6 mx-auto group-hover:from-blue-600 group-hover:to-black transition-colors duration-300">
                  <Users className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                </div>
                
                <h3 className="text-xl sm:text-2xl font-bold text-slate-800 mb-3 sm:mb-4">
                  I am a Voter 🧑‍💻
                </h3>
                
                <p className="text-sm sm:text-base text-slate-600 mb-4 sm:mb-6">
                  Cast your vote securely and track your participation in democratic processes.
                </p>
                
                <div className="space-y-2 text-xs sm:text-sm text-slate-500 mb-6 sm:mb-8">
                  <div className="flex items-center">
                    <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 mr-2" />
                    Aadhaar-based registration
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 mr-2" />
                    Biometric verification
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 mr-2" />
                    Blockchain-secured voting
                  </div>
                </div>
                
                <button className="w-full bg-gradient-to-r from-blue-700 to-black text-white py-2.5 sm:py-3 px-4 sm:px-6 rounded-xl font-semibold text-sm sm:text-base transform transition-all duration-200 group-hover:from-black group-hover:to-blue-700 hover:shadow-lg">
                  Register to Vote
                </button>
              </div>
            </div>

            {/* Election Commission Card */}
            <div
              onClick={() => navigate('/admin/login')}
              className="group relative overflow-hidden bg-white/70 backdrop-blur-sm border border-white/20 rounded-2xl sm:rounded-3xl p-6 sm:p-8 cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-2xl"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-orange-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              <div className="relative z-10">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl sm:rounded-2xl flex items-center justify-center mb-4 sm:mb-6 mx-auto group-hover:from-amber-600 group-hover:to-amber-700 transition-colors duration-300">
                  <Building className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                </div>
                
                
                <h3 className="text-xl sm:text-2xl font-bold text-slate-800 mb-3 sm:mb-4">
                  Election Commission �️
                </h3>
                
                <p className="text-sm sm:text-base text-slate-600 mb-4 sm:mb-6">
                  Manage elections, monitor voting processes, and ensure democratic integrity.
                </p>
                
                <div className="space-y-2 text-xs sm:text-sm text-slate-500 mb-6 sm:mb-8">
                  <div className="flex items-center">
                    <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 mr-2" />
                    Election management
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 mr-2" />
                    Real-time monitoring
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 mr-2" />
                    Results analytics
                  </div>
                </div>
                
                <button className="w-full bg-gradient-to-r from-amber-500 to-amber-600 text-white py-2.5 sm:py-3 px-4 sm:px-6 rounded-xl font-semibold text-sm sm:text-base transform transition-all duration-200 group-hover:from-amber-600 group-hover:to-amber-700 hover:shadow-lg">
                  Admin Access
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-4 sm:px-6 py-12 sm:py-20 bg-white/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-4xl font-bold text-slate-800 mb-3 sm:mb-4">
              Why Choose SecureVote?
            </h2>
            <p className="text-lg sm:text-xl text-slate-600 px-4">
              Built with cutting-edge technology for maximum security and transparency
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
            <div className="text-center p-6 sm:p-8">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6">
                <Shield className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-slate-800 mb-3 sm:mb-4">Blockchain Security</h3>
              <p className="text-sm sm:text-base text-slate-600">Every vote is cryptographically secured and stored on an immutable blockchain ledger.</p>
            </div>

            <div className="text-center p-6 sm:p-8">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6">
                <Users className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-slate-800 mb-3 sm:mb-4">Biometric Verification</h3>
              <p className="text-sm sm:text-base text-slate-600">Advanced fingerprint and facial recognition ensures only authorized voters can participate.</p>
            </div>

            <div className="text-center p-6 sm:p-8">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6">
                <Globe className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-slate-800 mb-3 sm:mb-4">Real-time Transparency</h3>
              <p className="text-sm sm:text-base text-slate-600">Monitor election progress and verify results with complete transparency and auditability.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-4 sm:px-6 py-6 sm:py-8 bg-black text-white">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center space-x-2 sm:space-x-3 mb-3 sm:mb-4">
            <div className="p-1.5 sm:p-2 bg-blue-600 rounded-lg">
              <Vote className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </div>
            <span className="text-lg sm:text-xl font-bold">SecureVote</span>
          </div>
          <p className="text-sm sm:text-base text-slate-400">
            All right Reserved © 2025
          </p>
          <p className="text-sm sm:text-base text-slate-400">
            Developed By Batch-8 CSE-ICB
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;

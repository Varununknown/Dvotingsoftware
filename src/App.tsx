import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { VotingProvider } from './contexts/VotingContext';
import { NotificationProvider } from './components/voter/NotificationSystem';
import LandingPage from './components/LandingPage';
import VoterRegistration from './components/voter/VoterRegistration';
import VoterLogin from './components/voter/VoterLogin';
import VoterDashboard from './components/voter/VoterDashboard';
import AdminLogin from './components/admin/AdminLogin';
import AdminDashboard from './components/admin/AdminDashboard';

function App() {
  return (
    <VotingProvider>
      <NotificationProvider>
        <Router>
          <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/voter/register" element={<VoterRegistration />} />
              <Route path="/voter/login" element={<VoterLogin />} />
              <Route path="/voter/dashboard" element={<VoterDashboard />} />
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              {/* Add a catch-all route to handle refreshes and direct URLs */}
              <Route path="*" element={<LandingPage />} />
            </Routes>
          </div>
        </Router>
      </NotificationProvider>
    </VotingProvider>
  );
}

export default App;
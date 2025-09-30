import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield, Fingerprint, CheckCircle, Smartphone, User } from 'lucide-react';
import OTPModal from './OTPModal';

const VoterRegistration = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [aadhaarId, setAadhaarId] = useState('');
  const [otp, setOtp] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanComplete, setScanComplete] = useState(false);
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [otpModalData, setOtpModalData] = useState({ otp: '', message: '' });

  const handleAadhaarSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (aadhaarId.length === 12) {
      try {
        const response = await fetch('http://localhost:5000/api/voters/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            aadhaarId,
            name: 'Test User', // You should add name input field
            phone: '1234567890', // You should add phone input field
            fingerprintHash: 'dummy-hash' // Will be replaced with actual hash
          }),
        });

        const data = await response.json();
        
        if (data.otp) {
          // Show OTP modal
          setOtpModalData({ otp: data.otp, message: data.otpMessage });
          setShowOTPModal(true);
          setStep(2);
        } else {
          alert('Error: ' + data.message);
        }
      } catch (error) {
        alert('Error connecting to server');
        console.error('Error:', error);
      }
    }
  };

  const handleOTPSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length === 6) {
      try {
        const response = await fetch('http://localhost:5000/api/voters/verify-otp', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            aadhaarId,
            otp
          }),
        });

        const data = await response.json();
        
        if (data.isVerified) {
          setStep(3);
        } else {
          alert('Invalid OTP. Please try again.');
        }
      } catch (error) {
        alert('Error connecting to server');
        console.error('Error:', error);
      }
    }
  };

  const handleFingerprintScan = () => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      setScanComplete(true);
      setTimeout(() => setStep(4), 1000);
    }, 3000);
  };

  const handleComplete = () => {
    navigate('/voter/login');
  };

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 py-8">
        <div className="max-w-md mx-auto px-6">
        {/* Header */}
        <div className="flex items-center mb-8">
          <button
            onClick={() => navigate('/')}
            className="p-2 rounded-lg bg-white/70 backdrop-blur-sm border border-white/20 hover:bg-white/80 transition-colors duration-200"
          >
            <ArrowLeft className="h-5 w-5 text-slate-600" />
          </button>
          <h1 className="text-2xl font-bold text-slate-800 ml-4">Voter Registration</h1>
        </div>

        {/* Progress Indicator */}
          <div className="flex items-center justify-between mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold ${
                    i <= step
                      ? 'bg-blue-600 text-white'
                      : 'bg-white/70 text-slate-400 border border-slate-200'
                  }`}
                >
                  {i < step ? <CheckCircle className="h-5 w-5" /> : i}
                </div>
                {i < 4 && (
                  <div
                    className={`w-12 h-0.5 ml-2 ${
                      i < step ? 'bg-blue-600' : 'bg-slate-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Step Content */}
          <div className="bg-white/70 backdrop-blur-sm border border-white/20 rounded-3xl p-8 shadow-xl">
            {step === 1 && (
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <User className="h-8 w-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-slate-800 mb-4">Enter Aadhaar ID</h2>
                <p className="text-slate-600 mb-8">Please enter your 12-digit Aadhaar number for verification.</p>
                
                <form onSubmit={handleAadhaarSubmit}>
                  <input
                    type="text"
                    value={aadhaarId}
                    onChange={(e) => setAadhaarId(e.target.value.replace(/\D/g, '').slice(0, 12))}
                    placeholder="Enter 12-digit Aadhaar ID"
                    className="w-full p-4 text-center text-lg font-mono border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 mb-6"
                    maxLength={12}
                    required
                  />
                  <button
                    type="submit"
                    disabled={aadhaarId.length !== 12}
                    className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 px-6 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:from-blue-600 hover:to-blue-700 transition-colors duration-200"
                  >
                    Verify Aadhaar ID
                  </button>
                </form>
              </div>
            )}

            {step === 2 && (
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Smartphone className="h-8 w-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-slate-800 mb-4">OTP Verification</h2>
                <p className="text-slate-600 mb-2">Enter the 6-digit OTP sent to your registered mobile number</p>
                <p className="text-sm text-slate-500 mb-8">****{aadhaarId.slice(-4)}</p>
                
                <form onSubmit={handleOTPSubmit}>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="Enter 6-digit OTP"
                    className="w-full p-4 text-center text-lg font-mono border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 mb-6"
                    maxLength={6}
                    required
                  />
                  <button
                    type="submit"
                    disabled={otp.length !== 6}
                    className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-3 px-6 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:from-green-600 hover:to-green-700 transition-colors duration-200"
                  >
                    Verify OTP
                  </button>
                </form>
                
                <button className="text-blue-600 text-sm mt-4 hover:underline">
                  Resend OTP
                </button>
              </div>
            )}

            {step === 3 && (
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Fingerprint className="h-8 w-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-slate-800 mb-4">Fingerprint Capture</h2>
                <p className="text-slate-600 mb-8">Please scan your fingerprint for biometric verification.</p>
                
                <div className="relative mb-8">
                  <div
                    className={`w-32 h-32 mx-auto border-4 rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 ${
                      isScanning
                        ? 'border-blue-500 bg-blue-50 animate-pulse'
                        : scanComplete
                        ? 'border-green-500 bg-green-50'
                        : 'border-slate-300 bg-slate-50 hover:border-purple-500'
                    }`}
                    onClick={handleFingerprintScan}
                  >
                    {scanComplete ? (
                      <CheckCircle className="h-12 w-12 text-green-500" />
                    ) : (
                      <Fingerprint 
                        className={`h-12 w-12 transition-colors duration-300 ${
                          isScanning ? 'text-blue-500' : 'text-slate-400'
                        }`} 
                      />
                    )}
                  </div>
                  
                  {isScanning && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-40 h-40 border-4 border-blue-500 border-t-transparent rounded-full animate-spin opacity-30"></div>
                    </div>
                  )}
                </div>
                
                {!isScanning && !scanComplete && (
                  <button
                    onClick={handleFingerprintScan}
                    className="w-full bg-gradient-to-r from-purple-500 to-purple-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-purple-600 hover:to-purple-700 transition-colors duration-200"
                  >
                    Start Fingerprint Scan
                  </button>
                )}
                
                {isScanning && (
                  <p className="text-blue-600 font-medium">Scanning fingerprint...</p>
                )}
                
                {scanComplete && (
                  <p className="text-green-600 font-medium">Fingerprint captured successfully!</p>
                )}
              </div>
            )}

            {step === 4 && (
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="h-10 w-10 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-slate-800 mb-4">Registration Complete!</h2>
                <p className="text-slate-600 mb-8">
                  You are successfully registered ✅<br />
                  Your voter ID has been created and verified.
                </p>
                
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-8">
                  <div className="flex items-center text-green-800">
                    <Shield className="h-5 w-5 mr-2" />
                    <span className="font-medium">Your data is secure</span>
                  </div>
                  <p className="text-green-700 text-sm mt-1">
                    All information is encrypted and stored on blockchain
                  </p>
                </div>
                
                <button
                  onClick={handleComplete}
                  className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-green-600 hover:to-green-700 transition-colors duration-200"
                >
                  Continue to Login
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {showOTPModal && (
        <OTPModal
          otp={otpModalData.otp}
          message={otpModalData.message}
          onClose={() => setShowOTPModal(false)}
        />
      )}
    </>
  );
};

export default VoterRegistration;

  const handleAadhaarSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (aadhaarId.length === 12) {
      try {
        const response = await fetch('http://localhost:5000/api/voters/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            aadhaarId,
            name: 'Test User', // You should add name input field
            phone: '1234567890', // You should add phone input field
            fingerprintHash: 'dummy-hash' // Will be replaced with actual hash
          }),
        });

        const data = await response.json();
        
        if (data.otp) {
          // Show OTP modal
          setOtpModalData({ otp: data.otp, message: data.otpMessage });
          setShowOTPModal(true);
          setStep(2);
        } else {
          alert('Error: ' + data.message);
        }
      } catch (error) {
        alert('Error connecting to server');
        console.error('Error:', error);
      }
    }
  };

  const handleOTPSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length === 6) {
      try {
        const response = await fetch('http://localhost:5000/api/voters/verify-otp', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            aadhaarId,
            otp
          }),
        });

        const data = await response.json();
        
        if (data.isVerified) {
          setStep(3);
        } else {
          alert('Invalid OTP. Please try again.');
        }
      } catch (error) {
        alert('Error connecting to server');
        console.error('Error:', error);
      }
    }
  };

  const handleFingerprintScan = () => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      setScanComplete(true);
      setTimeout(() => setStep(4), 1000);
    }, 3000);
  };

  const handleComplete = () => {
    navigate('/voter/login');
  };

  return (
    <>
      <div className="relative">
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 py-8">
          <div className="max-w-md mx-auto px-6">
            {/* Header */}
            <div className="flex items-center mb-8">
              <button
                onClick={() => navigate('/')}
                className="p-2 rounded-lg bg-white/70 backdrop-blur-sm border border-white/20 hover:bg-white/80 transition-colors duration-200"
              >
                <ArrowLeft className="h-5 w-5 text-slate-600" />
              </button>
              <h1 className="text-2xl font-bold text-slate-800 ml-4">Voter Registration</h1>
            </div>

            {/* Progress Indicator */}
        <div className="flex items-center justify-between mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold ${
                  i <= step
                    ? 'bg-blue-600 text-white'
                    : 'bg-white/70 text-slate-400 border border-slate-200'
                }`}
              >
                {i < step ? <CheckCircle className="h-5 w-5" /> : i}
              </div>
              {i < 4 && (
                <div
                  className={`w-12 h-0.5 ml-2 ${
                    i < step ? 'bg-blue-600' : 'bg-slate-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="bg-white/70 backdrop-blur-sm border border-white/20 rounded-3xl p-8 shadow-xl">
          {step === 1 && (
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <User className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-4">Enter Aadhaar ID</h2>
              <p className="text-slate-600 mb-8">Please enter your 12-digit Aadhaar number for verification.</p>
              
              <form onSubmit={handleAadhaarSubmit}>
                <input
                  type="text"
                  value={aadhaarId}
                  onChange={(e) => setAadhaarId(e.target.value.replace(/\D/g, '').slice(0, 12))}
                  placeholder="Enter 12-digit Aadhaar ID"
                  className="w-full p-4 text-center text-lg font-mono border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 mb-6"
                  maxLength={12}
                  required
                />
                <button
                  type="submit"
                  disabled={aadhaarId.length !== 12}
                  className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 px-6 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:from-blue-600 hover:to-blue-700 transition-colors duration-200"
                >
                  Verify Aadhaar ID
                </button>
              </form>
            </div>
          )}

          {step === 2 && (
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Smartphone className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-4">OTP Verification</h2>
              <p className="text-slate-600 mb-2">Enter the 6-digit OTP sent to your registered mobile number</p>
              <p className="text-sm text-slate-500 mb-8">****{aadhaarId.slice(-4)}</p>
              
              <form onSubmit={handleOTPSubmit}>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="Enter 6-digit OTP"
                  className="w-full p-4 text-center text-lg font-mono border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 mb-6"
                  maxLength={6}
                  required
                />
                <button
                  type="submit"
                  disabled={otp.length !== 6}
                  className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-3 px-6 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:from-green-600 hover:to-green-700 transition-colors duration-200"
                >
                  Verify OTP
                </button>
              </form>
              
              <button className="text-blue-600 text-sm mt-4 hover:underline">
                Resend OTP
              </button>
            </div>
          )}

          {step === 3 && (
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Fingerprint className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-4">Fingerprint Capture</h2>
              <p className="text-slate-600 mb-8">Please scan your fingerprint for biometric verification.</p>
              
              <div className="relative mb-8">
                <div
                  className={`w-32 h-32 mx-auto border-4 rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 ${
                    isScanning
                      ? 'border-blue-500 bg-blue-50 animate-pulse'
                      : scanComplete
                      ? 'border-green-500 bg-green-50'
                      : 'border-slate-300 bg-slate-50 hover:border-purple-500'
                  }`}
                  onClick={handleFingerprintScan}
                >
                  {scanComplete ? (
                    <CheckCircle className="h-12 w-12 text-green-500" />
                  ) : (
                    <Fingerprint 
                      className={`h-12 w-12 transition-colors duration-300 ${
                        isScanning ? 'text-blue-500' : 'text-slate-400'
                      }`} 
                    />
                  )}
                </div>
                
                {isScanning && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-40 h-40 border-4 border-blue-500 border-t-transparent rounded-full animate-spin opacity-30"></div>
                  </div>
                )}
              </div>
              
              {!isScanning && !scanComplete && (
                <button
                  onClick={handleFingerprintScan}
                  className="w-full bg-gradient-to-r from-purple-500 to-purple-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-purple-600 hover:to-purple-700 transition-colors duration-200"
                >
                  Start Fingerprint Scan
                </button>
              )}
              
              {isScanning && (
                <p className="text-blue-600 font-medium">Scanning fingerprint...</p>
              )}
              
              {scanComplete && (
                <p className="text-green-600 font-medium">Fingerprint captured successfully!</p>
              )}
            </div>
          )}

          {step === 4 && (
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="h-10 w-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-4">Registration Complete!</h2>
              <p className="text-slate-600 mb-8">
                You are successfully registered ✅<br />
                Your voter ID has been created and verified.
              </p>
              
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-8">
                <div className="flex items-center text-green-800">
                  <Shield className="h-5 w-5 mr-2" />
                  <span className="font-medium">Your data is secure</span>
                </div>
                <p className="text-green-700 text-sm mt-1">
                  All information is encrypted and stored on blockchain
                </p>
              </div>
              
              <button
                onClick={handleComplete}
                className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-green-600 hover:to-green-700 transition-colors duration-200"
              >
                Continue to Login
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
    {showOTPModal && (
      <OTPModal
        otp={otpModalData.otp}
        message={otpModalData.message}
        onClose={() => setShowOTPModal(false)}
      />
    )}
  );
};

export default VoterRegistration;
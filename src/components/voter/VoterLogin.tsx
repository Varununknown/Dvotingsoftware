import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVoting } from '../../contexts/VotingContext';
import { ArrowLeft, Fingerprint, AlertCircle, CheckCircle, User, Smartphone, ShieldAlert, Copy, X } from 'lucide-react';
import smartBiometricService, { BiometricCapabilities } from '../../services/smartBiometricService';

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://dvotingsoftware.onrender.com/api';
console.log('🌐 VoterLogin using API URL:', API_BASE_URL);

const VoterLogin = () => {
  const navigate = useNavigate();
  const { setCurrentUser, refreshUserData } = useVoting();
  
  // Removed auto-redirect to dashboard to allow proper login flow after registration
  // Users must complete login process even if data exists in context
  const [aadhaarId, setAadhaarId] = useState('');
  const [otp, setOtp] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanComplete, setScanComplete] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1);
  const [webAuthnSupported, setWebAuthnSupported] = useState(false);
  const [biometricCapabilities, setBiometricCapabilities] = useState<BiometricCapabilities | null>(null);
  const [authMethod, setAuthMethod] = useState<'unknown' | 'real_webauthn' | 'simulation'>('unknown');
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [currentOtp, setCurrentOtp] = useState('');
  const [isResend, setIsResend] = useState(false);
  
  // Function to show OTP notification
  const showOtpNotification = (otpValue: string, resend = false) => {
    setCurrentOtp(otpValue);
    setIsResend(resend);
    setShowOtpModal(true);
    
    // Auto-dismiss after 10 seconds (optional)
    // setTimeout(() => setShowOtpModal(false), 10000);
  };
  
  // Check biometric capabilities when component loads
  useEffect(() => {
    const detectCapabilities = async () => {
      const capabilities = await smartBiometricService.detectCapabilities();
      setBiometricCapabilities(capabilities);
      setWebAuthnSupported(capabilities.hasWebAuthn);
      
      console.log('🔍 Login biometric capabilities:', {
        hasWebAuthn: capabilities.hasWebAuthn,
        hasPlatformAuth: capabilities.hasPlatformAuthenticator,
        isHosted: capabilities.isHostedDomain,
        recommendReal: capabilities.recommendRealAuth
      });
    };
    
    detectCapabilities();
  }, []);

  const handleAadhaarSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (aadhaarId.length === 12) {
      try {
        const response = await fetch(`${API_BASE_URL}/voters/request-otp`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ aadhaarId }),
        });
        
        const data = await response.json();
        if (response.ok) {
          // Display the OTP with a styled notification
          showOtpNotification(data.otp);
          setStep(2);
        } else {
          setError(data.message || 'Failed to request OTP.');
        }
      } catch (err) {
        console.error('OTP request error:', err);
        setError('Failed to connect to the server. Please try again.');
      }
    }
  };

  const handleOTPSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (otp.length === 6) {
      try {
        const response = await fetch(`${API_BASE_URL}/voters/verify-otp`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            aadhaarId,
            otp,
          }),
        });
        
        const data = await response.json();
        if (response.ok) {
          setStep(3); // Move to fingerprint step
        } else {
          setError(data.message || 'Invalid OTP. Please try again.');
        }
      } catch (err) {
        console.error('OTP verification error:', err);
        setError('Failed to connect to the server. Please try again.');
      }
    }
  };

  const handleSimulatedScan = async () => {
    setIsScanning(true);
    setError('');
    
    // Simulate the scan process timing
    setTimeout(async () => {
      try {
        const simulatedHash = 'fp_' + Math.random().toString(36).substring(2, 10);
        // Use the verify endpoint instead of simulate
        const response = await fetch(`${API_BASE_URL}/webauthn/fingerprint/verify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ aadhaarId, fingerprintHash: simulatedHash })
        });
        
        const data = await response.json();
        setIsScanning(false);
        
        if (response.ok) {
          setScanComplete(true);
          const newUser = {
            id: data.voterId,
            aadhaarId,
            isVerified: true,
            hasVoted: data.hasVoted || {},
            votingHistory: data.votingHistory || []
          };
          
          setCurrentUser(newUser);
          
          // Immediately refresh user data from backend to ensure we have the latest voting status
          try {
            await refreshUserData(data.voterId);
            console.log('User data refreshed after successful login');
          } catch (refreshError) {
            console.error('Failed to refresh user data after login:', refreshError);
          }
          
          // Move to step 4 instead of navigating directly to dashboard
          setStep(4);
        } else {
          setError(data.message || 'Fingerprint verification failed.');
          setScanComplete(false);
        }
      } catch (err) {
        console.error('Fingerprint error:', err);
        setError('Failed to process fingerprint. Please try again.');
        setIsScanning(false);
        setScanComplete(false);
      }
    }, 2500);
  };

  const handleFingerprintScan = async () => {
    setIsScanning(true);
    setError('');
    
    try {
      console.log('🔐 Starting smart biometric authentication...');
      console.log('📱 Device info:', {
        userAgent: navigator.userAgent.substring(0, 100),
        isMobile: /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
        protocol: window.location.protocol,
        domain: window.location.hostname
      });
      
      // Use the smart biometric service for real or simulated authentication
      const result = await smartBiometricService.authenticateBiometric(aadhaarId);
      
      if (result.success) {
        setScanComplete(true);
        setAuthMethod(result.method);
        
        console.log(`✅ Biometric authentication successful using: ${result.method}`);
        console.log(`📋 ${result.message}`);
        
        // Special handling for mobile simulation fallback
        if (result.method === 'simulation' && /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
          console.log('📱 Mobile device used simulation - this is expected if no prior registration');
        }
        
        // Create user object from result
        const newUser = {
          id: result.userData?.voterId,
          aadhaarId,
          isVerified: true,
          hasVoted: result.userData?.hasVoted || {},
          votingHistory: result.userData?.votingHistory || []
        };
        
        setCurrentUser(newUser);
        
        // Refresh user data
        try {
          await refreshUserData(result.userData?.voterId);
          console.log('User data refreshed after successful login');
        } catch (refreshError) {
          console.error('Failed to refresh user data after login:', refreshError);
        }
        
        setStep(4);
      } else {
        throw new Error(result.error || 'Biometric authentication failed');
      }
    } catch (err: any) {
      console.error('❌ Biometric authentication error:', err);
      
      // Special handling for mobile credential errors
      if (err.message?.includes('No credentials') || err.message?.includes('No biometric credentials')) {
        setError('No biometric credentials found. You may need to register biometric authentication first, or the system will use fallback authentication.');
      } else {
        setError(err.message || 'Failed to authenticate biometric. Please try again.');
      }
      
      setScanComplete(false);
    } finally {
      setIsScanning(false);
    }
  };

  // Real WebAuthn implementation - currently disabled for testing
  // TODO: Re-enable after proper credential registration flow is implemented
  /*
  const handleRealWebAuthnScan = async () => {
    setIsScanning(true);
    setError('');
    
    try {
      // Step 1: Get authentication options from server
      const optionsResponse = await fetch(`${API_BASE_URL}/webauthn/login/options`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ aadhaarId })
      });
      
      if (!optionsResponse.ok) {
        throw new Error('Failed to get authentication options');
      }
      
      const options = await optionsResponse.json();
      
      // Step 2: Start WebAuthn authentication
      const credential = await navigator.credentials.get({
        publicKey: {
          ...options,
          challenge: new Uint8Array(Buffer.from(options.challenge, 'base64url')),
          allowCredentials: options.allowCredentials?.map((cred: any) => ({
            ...cred,
            id: new Uint8Array(Buffer.from(cred.id, 'base64url'))
          }))
        }
      }) as PublicKeyCredential;
      
      if (!credential) {
        throw new Error('Authentication cancelled');
      }
      
      // Step 3: Verify authentication with server
      const verifyResponse = await fetch(`${API_BASE_URL}/webauthn/login/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          aadhaarId,
          assertionResponse: {
            id: credential.id,
            rawId: Buffer.from(credential.rawId).toString('base64url'),
            type: credential.type,
            response: {
              authenticatorData: Buffer.from((credential.response as AuthenticatorAssertionResponse).authenticatorData).toString('base64url'),
              clientDataJSON: Buffer.from((credential.response as AuthenticatorAssertionResponse).clientDataJSON).toString('base64url'),
              signature: Buffer.from((credential.response as AuthenticatorAssertionResponse).signature).toString('base64url'),
              userHandle: (credential.response as AuthenticatorAssertionResponse).userHandle ? 
                Buffer.from((credential.response as AuthenticatorAssertionResponse).userHandle!).toString('base64url') : null
            }
          }
        })
      });
      
      const result = await verifyResponse.json();
      
      if (verifyResponse.ok && result.verified) {
        setScanComplete(true);
        const newUser = {
          id: result.voterId,
          aadhaarId,
          isVerified: true,
          hasVoted: {},
          votingHistory: []
        };
        
        setCurrentUser(newUser);
        
        try {
          await refreshUserData(result.voterId);
          console.log('✅ Real WebAuthn authentication successful!');
        } catch (refreshError) {
          console.error('Failed to refresh user data after login:', refreshError);
        }
        
        setStep(4);
      } else {
        throw new Error(result.message || 'WebAuthn verification failed');
      }
      
    } catch (err: any) {
      console.error('Real WebAuthn failed, falling back to simulation:', err);
      setError(`Real fingerprint failed: ${err.message}. Trying simulation...`);
      
      // Fallback to simulation if real WebAuthn fails
      setTimeout(() => {
        setError('');
        handleSimulatedScan();
      }, 1500);
    } finally {
      setIsScanning(false);
    }
  };
  */

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 py-4 sm:py-8">
      <div className="max-w-md mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="flex items-center mb-6 sm:mb-8">
          <button
            onClick={() => navigate('/')}
            className="p-1.5 sm:p-2 rounded-lg bg-white/70 backdrop-blur-sm border border-white/20 hover:bg-white/80 transition-colors duration-200"
          >
            <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5 text-slate-600" />
          </button>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800 ml-3 sm:ml-4">Voter Login</h1>
        </div>
        
        {/* Progress Indicator */}
        <div className="flex justify-between items-center mb-8 px-2">
          {[1, 2, 3, 4].map((stepNumber) => (
            <div key={stepNumber} className="flex flex-col items-center relative">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center z-10 
                  ${step >= stepNumber 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-slate-200 text-slate-500'}`}
              >
                {stepNumber}
              </div>
              <span
                className={`text-xs mt-2 font-medium ${step >= stepNumber ? 'text-blue-600' : 'text-slate-500'}`}
              >
                {stepNumber === 1 
                  ? 'Aadhaar' 
                  : stepNumber === 2 
                  ? 'OTP' 
                  : stepNumber === 3 
                  ? 'Fingerprint' 
                  : 'Complete'}
              </span>
            </div>
          ))}
          
          {/* Progress bar between the circles */}
          <div className="absolute left-0 right-0 flex justify-center px-12 mt-4">
            <div className="h-0.5 bg-slate-200 w-full absolute">
              <div
                className="h-0.5 bg-blue-600 transition-all duration-300"
                style={{ width: `${Math.max(0, ((step - 1) / 3) * 100)}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-white/70 backdrop-blur-sm border border-white/20 rounded-3xl p-8 shadow-xl">
          {step === 1 && (
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <User className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-4">Enter Aadhaar ID</h2>
              <p className="text-slate-600 mb-6">Enter your registered Aadhaar number to continue.</p>
              
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
                  <div className="flex items-center text-red-800">
                    <AlertCircle className="h-5 w-5 mr-2" />
                    <span className="font-medium">Error</span>
                  </div>
                  <p className="text-red-700 text-sm mt-1">{error}</p>
                </div>
              )}
              
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
                  Continue
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
              <p className="text-slate-600 mb-6">Enter the OTP sent to your registered mobile number.</p>
              
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
                  <div className="flex items-center text-red-800">
                    <AlertCircle className="h-5 w-5 mr-2" />
                    <span className="font-medium">Verification Failed</span>
                  </div>
                  <p className="text-red-700 text-sm mt-1">{error}</p>
                </div>
              )}
              
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
                
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const response = await fetch(`${API_BASE_URL}/voters/request-otp`, {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ aadhaarId }),
                      });
                      const data = await response.json();
                      if (response.ok) {
                        showOtpNotification(data.otp, true);
                      } else {
                        setError(data.message || 'Failed to request new OTP.');
                      }
                    } catch (err) {
                      console.error('OTP request error:', err);
                      setError('Failed to connect to the server. Please try again.');
                    }
                  }}
                  className="w-full mt-4 bg-transparent text-blue-600 py-2 px-6 rounded-xl font-medium hover:underline"
                >
                  Resend OTP
                </button>
              </form>
            </div>
          )}

          {step === 3 && (
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Fingerprint className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-4">Biometric Authentication</h2>
              
              {/* Mobile-specific instructions */}
              {/Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
                  <div className="flex items-center text-blue-800">
                    <Smartphone className="h-5 w-5 mr-2" />
                    <span className="font-medium">Mobile Device Detected</span>
                  </div>
                  <p className="text-blue-700 text-sm mt-1">
                    📱 Your device's fingerprint sensor will activate when you tap "Scan Fingerprint"
                  </p>
                  <p className="text-blue-600 text-xs mt-1">
                    🔧 If fingerprint doesn't activate, please ensure your device has biometric security enabled in settings.
                  </p>
                </div>
              )}
              
              {/* WebAuthn Support Indicator */}
              {biometricCapabilities && (
                <div className={`border rounded-xl p-4 mb-4 ${
                  biometricCapabilities.recommendRealAuth 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-yellow-50 border-yellow-200'
                }`}>
                  <div className="flex items-center text-sm">
                    <span className={`font-medium ${
                      biometricCapabilities.recommendRealAuth ? 'text-green-800' : 'text-yellow-800'
                    }`}>
                      {biometricCapabilities.recommendRealAuth 
                        ? '✅ Real biometric authentication available' 
                        : '⚠️ Using fallback authentication'}
                    </span>
                  </div>
                  {/Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) && (
                    <p className="text-xs mt-1 text-blue-600">
                      📱 Mobile detected - forcing biometric sensor activation
                    </p>
                  )}
                </div>
              )}
              
              <p className="text-slate-600 mb-6">Scan your fingerprint to complete login.</p>
              
              {webAuthnSupported && (
                <div className="flex items-center justify-center text-blue-600 mb-4 bg-blue-50 py-2 px-4 rounded-lg">
                  <ShieldAlert className="h-4 w-4 mr-2" />
                  <span className="text-xs font-medium">Using secure platform fingerprint sensor</span>
                </div>
              )}
              
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
                  <div className="flex items-center text-red-800">
                    <AlertCircle className="h-5 w-5 mr-2" />
                    <span className="font-medium">Authentication Failed</span>
                  </div>
                  <p className="text-red-700 text-sm mt-1">{error}</p>
                </div>
              )}
              
              <div className="relative mb-8">
                <div
                  className={`w-32 h-32 mx-auto border-4 rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 ${
                    isScanning
                      ? 'border-blue-500 bg-blue-50 animate-pulse'
                      : scanComplete
                      ? 'border-green-500 bg-green-50'
                      : error
                      ? 'border-red-500 bg-red-50'
                      : 'border-slate-300 bg-slate-50 hover:border-purple-500'
                  }`}
                  onClick={!isScanning ? handleFingerprintScan : undefined}
                >
                  {scanComplete ? (
                    <CheckCircle className="h-12 w-12 text-green-500" />
                  ) : error && !isScanning ? (
                    <AlertCircle className="h-12 w-12 text-red-500" />
                  ) : (
                    <Fingerprint 
                      className={`h-12 w-12 transition-colors duration-300 ${
                        isScanning ? 'text-blue-500' : error ? 'text-red-500' : 'text-slate-400'
                      }`} 
                    />
                  )}
                </div>
                
                {isScanning && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="relative">
                      {/* Outer spinning ring */}
                      <div className="w-40 h-40 border-4 border-black border-t-transparent rounded-full animate-spin opacity-20"></div>
                      
                      {/* Inner spinning ring - opposite direction */}
                      <div className="w-32 h-32 border-4 border-purple-500 border-b-transparent rounded-full animate-spin absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-30" 
                           style={{animationDirection: 'reverse', animationDuration: '1.2s'}}></div>
                      
                      {/* Pulse effect in the center */}
                      <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-pulse opacity-20"></div>
                    </div>
                  </div>
                )}
              </div>
              
              {!isScanning && (
                <button
                  onClick={handleFingerprintScan}
                  className="w-full bg-gradient-to-r from-purple-500 to-purple-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-purple-600 hover:to-purple-700 transition-colors duration-200"
                >
                  {error ? 'Try Again' : 'Scan Fingerprint'}
                </button>
              )}
              
              {isScanning && (
                <p className="text-blue-600 font-medium">Authenticating...</p>
              )}
              
              {scanComplete && (
                <p className="text-green-600 font-medium">Verification successful!</p>
              )}
            </div>
          )}
          
          {step === 4 && (
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-4">Login Successful</h2>
              <p className="text-slate-600 mb-8">You have successfully verified your identity.</p>
              
              <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-8">
                <div className="flex flex-col items-center">
                  <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
                  <h3 className="text-lg font-semibold text-green-800">Verification Complete</h3>
                  <p className="text-green-700 mt-2">All verification steps completed successfully.</p>
                </div>
              </div>
              
              <button
                onClick={() => navigate('/voter/dashboard')}
                className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-green-600 hover:to-green-700 transition-colors duration-200"
              >
                Continue to Dashboard
              </button>
            </div>
          )}
        </div>

        {/* Register Link */}
        <div className="text-center mt-6">
          <p className="text-slate-600">
            New voter?{' '}
            <button
              onClick={() => navigate('/voter/register')}
              className="text-blue-600 font-medium hover:underline"
            >
              Register here
            </button>
          </p>
        </div>
      </div>
      
      {/* OTP Notification Modal */}
      {showOtpModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 animate-fade-in" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="w-11/12 max-w-md animate-scale-in">
            <div className="bg-white backdrop-blur-sm border rounded-3xl shadow-2xl overflow-hidden transform transition-all">
              {/* Header */}
              <div className="px-6 py-4 text-white bg-gradient-to-r from-black to-gray-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Smartphone className="h-6 w-6 mr-3 flex-shrink-0" />
                    <h3 className="text-xl font-bold">OTP Code</h3>
                  </div>
                  <button 
                    onClick={() => setShowOtpModal(false)}
                    className="p-1 rounded-full hover:bg-white/20 transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
              
              {/* Content */}
              <div className="px-6 py-6">
                <p className="text-slate-800 text-lg">{isResend ? 'Your new OTP is:' : 'Your OTP is:'} {currentOtp}</p>
                
                {/* Copy button for OTP */}
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(currentOtp)
                      .then(() => {
                        const button = document.getElementById('copy-login-otp-btn');
                        if (button) {
                          // const originalText = button.innerText; // Not needed
                          button.innerText = 'Copied!';
                          button.classList.add('bg-green-500');
                          button.classList.remove('bg-black');
                          
                          setTimeout(() => {
                            button.innerText = 'Copy OTP';
                            button.classList.add('bg-black');
                            button.classList.remove('bg-green-500');
                          }, 1500);
                        }
                      })
                      .catch(err => console.error('Failed to copy: ', err));
                  }}
                  id="copy-login-otp-btn"
                  className="mt-4 px-4 py-2 bg-black hover:bg-gray-800 text-white rounded-lg flex items-center justify-center transition-all duration-200"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy OTP
                </button>
              </div>
              
              {/* Action Button */}
              <div className="px-6 py-4 bg-slate-50 flex justify-end">
                <button
                  onClick={() => setShowOtpModal(false)}
                  className="px-5 py-2 rounded-xl text-white font-medium bg-gradient-to-r from-black to-gray-800 hover:from-gray-800 hover:to-black transition-colors"
                >
                  Got it
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VoterLogin;

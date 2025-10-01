import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Smartphone, Fingerprint, AlertCircle, CheckCircle, ShieldAlert, Info, X, Copy } from 'lucide-react';
import smartBiometricService, { BiometricCapabilities } from '../../services/smartBiometricService';
import { useVoting } from '../../contexts/VotingContext';

// API Configuration  
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://dvotingsoftware.onrender.com/api';
console.log('🌐 VoterRegistration using API URL:', API_BASE_URL);

// Helper function to convert base64url to Uint8Array - commented out
/*
function base64URLToUint8Array(base64URLString: string): Uint8Array {
  try {
    if (!base64URLString) {
      console.error('Empty string passed to base64URLToUint8Array');
      return new Uint8Array(0);
    }
    
    // Replace non-URL compatible chars with base64 standard chars
    const base64 = base64URLString.replace(/-/g, '+').replace(/_/g, '/');
    
    // Add padding if needed
    const padding = '='.repeat((4 - base64.length % 4) % 4);
    const base64WithPadding = base64 + padding;
    
    // For debugging
    console.log('Processing base64 string:', { 
      original: base64URLString, 
      formatted: base64WithPadding,
      length: base64WithPadding.length
    });
    
    try {
      const rawData = window.atob(base64WithPadding);
      const outputArray = new Uint8Array(rawData.length);
      
      for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
      }
      return outputArray;
    } catch (error) {
      console.error('atob error:', error, 'for string:', base64WithPadding);
      throw new Error(`Failed to decode base64: ${(error as Error).message}`);
    }
  } catch (error) {
    console.error('Error in base64URLToUint8Array:', error);
    throw new Error(`Base64 decoding error: ${(error as Error).message}`);
  }
}
*/

const VoterRegistration = () => {
  const navigate = useNavigate();
  const { setCurrentUser } = useVoting();
  const [step, setStep] = useState(1);
  const [aadhaarId, setAadhaarId] = useState('');
  const [otp, setOtp] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanComplete, setScanComplete] = useState(false);
  const [error, setError] = useState('');
  const [webAuthnSupported, setWebAuthnSupported] = useState(false);
  const [biometricCapabilities, setBiometricCapabilities] = useState<BiometricCapabilities | null>(null);
  const [authMethod, setAuthMethod] = useState<'unknown' | 'real_webauthn' | 'simulation'>('unknown');
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationType, setNotificationType] = useState<'success' | 'error' | 'info'>('info');
  const [isResend, setIsResend] = useState(false);
  // Removed usingWebAuthn state as we're only using simulated scan
  
  // Helper function to show OTP notification
  const showOtpNotification = (otpValue: string, resend = false) => {
    setNotificationMessage(resend ? `Your new OTP is: ${otpValue}` : `Your OTP is: ${otpValue}`);
    setNotificationType('info');
    setShowNotification(true);
    setIsResend(resend);
  };
  
  // Check biometric capabilities when component loads
  useEffect(() => {
    const detectCapabilities = async () => {
      const capabilities = await smartBiometricService.detectCapabilities();
      setBiometricCapabilities(capabilities);
      setWebAuthnSupported(capabilities.hasWebAuthn);
      
      console.log('🔍 Biometric capabilities detected:', {
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
    if (aadhaarId.length === 12) {
      try {
        // First check if the voter already exists
        const checkResponse = await fetch(`${API_BASE_URL}/voters/check`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            aadhaarId,
          }),
        });
        
        const checkData = await checkResponse.json();
        
        // If voter already exists, show notification and set up redirection
        if (checkData.exists) {
          // Set a special message that will be checked for redirection
          setNotificationMessage('This Aadhaar ID is already registered. Please proceed to login instead.');
          setNotificationType('info');
          setShowNotification(true);
          
          // We'll modify the component to check for this specific message for redirection
          return;
        }
        
        // If new voter, proceed with registration
        const response = await fetch(`${API_BASE_URL}/voters/register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            aadhaarId, // Only Aadhaar ID as per Phase 1 design
          }),
        });

        const data = await response.json();
        if (response.ok) {
          // Display OTP notification first, then proceed to next step
          showOtpNotification(data.otp, false);
          
          // Auto-dismiss after a short delay and proceed
          setTimeout(() => {
            setShowNotification(false);
            setStep(2);
          }, 3000);
        } else {
          setNotificationMessage(`Error: ${data.message}`);
          setNotificationType('error');
          setShowNotification(true);
        }
      } catch (error) {
        console.error('Registration error:', error);
        setNotificationMessage('Failed to register. Please try again.');
        setNotificationType('error');
        setShowNotification(true);
      }
    }
  };

  const handleOTPSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
          setNotificationMessage('OTP verified successfully');
          setNotificationType('success');
          setShowNotification(true);
          
          // Auto-dismiss after a short delay and proceed
          setTimeout(() => {
            setShowNotification(false);
            setStep(3); // Proceed to fingerprint registration like login flow
          }, 2000);
        } else {
          setNotificationMessage(`Error: ${data.message}`);
          setNotificationType('error');
          setShowNotification(true);
        }
      } catch (error) {
        console.error('OTP verification error:', error);
        setNotificationMessage('Failed to verify OTP. Please try again.');
        setNotificationType('error');
        setShowNotification(true);
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
        const response = await fetch(`${API_BASE_URL}/webauthn/fingerprint/simulate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ aadhaarId, fingerprintHash: simulatedHash })
        });
        
        const data = await response.json();
        if (response.ok) {
          setScanComplete(true);
          setIsScanning(false);
          // Instead of navigating directly, go to step 4
          setTimeout(() => setStep(4), 1000);
        } else {
          setError(data.message || 'Failed to register fingerprint.');
          setIsScanning(false);
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
  
  const handleComplete = () => {
    // Clear any existing user state before redirecting to login
    setCurrentUser(null);
    localStorage.removeItem('currentVoter');
    localStorage.removeItem('mockBlockchainVotes');
    navigate('/voter/login');
  };

  // WebAuthn implementation - commented out in favor of simulated scan
  /*
  const handleWebAuthnRegister = async () => {
    setIsScanning(true);
    setError('');
    setUsingWebAuthn(true);
    
    try {
      console.log('Starting WebAuthn registration process...');
      console.log('Browser details:', {
        userAgent: navigator.userAgent,
        webAuthnSupported: !!window.PublicKeyCredential
      });
      console.log('Registration details:', {
        aadhaarId,
        origin: window.location.origin
      });
      
      // Step 1: Get registration options from server
      const optionsResponse = await fetch(`${API_BASE_URL}/webauthn/register/options`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ aadhaarId })
      }).catch(error => {
        console.error('Network error when fetching registration options:', error);
        throw new Error(`Network error: ${error.message || 'Failed to connect to server'}`);
      });
      
      if (!optionsResponse.ok) {
        const error = await optionsResponse.json().catch(() => ({ message: 'Failed to parse server response' }));
        console.error('Server rejected registration options request:', error);
        throw new Error(error.message || `Server error: ${optionsResponse.status} ${optionsResponse.statusText}`);
      }
      
      const options = await optionsResponse.json();
      
      // Step 2: Create credentials using device fingerprint sensor
      const credential = await navigator.credentials.create({
        publicKey: {
          ...options,
          challenge: base64URLToUint8Array(options.challenge),
          user: {
            ...options.user,
            id: base64URLToUint8Array(options.user.id),
          },
          excludeCredentials: options.excludeCredentials?.map((cred: { id: string, type: string }) => ({
            ...cred,
            id: base64URLToUint8Array(cred.id),
          })),
        },
      });
      
      if (!credential) {
        throw new Error('No credentials returned from authenticator');
      }
      
      // Step 3: Send attestation to server for verification
      const attestation = credential as PublicKeyCredential;
      const response = attestation.response as AuthenticatorAttestationResponse;
      
      // Log the credential details for debugging
      console.log('Credential details:', {
        id: attestation.id,
        rawId: attestation.rawId ? `ArrayBuffer of length ${(attestation.rawId as ArrayBuffer).byteLength}` : 'undefined',
        type: attestation.type,
        response: {
          clientDataJSON: response.clientDataJSON ? 
            `ArrayBuffer of length ${response.clientDataJSON.byteLength}` : 'undefined',
          clientDataJSONDecoded: response.clientDataJSON ? 
            new TextDecoder().decode(response.clientDataJSON) : 'N/A',
          attestationObjectBuffer: response.attestationObject ? 
            `ArrayBuffer of length ${response.attestationObject.byteLength}` : 'undefined',
        }
      });
      
      // Validate all required fields are present
      if (!attestation.rawId) {
        throw new Error('Missing rawId in credential');
      }
      if (!response.clientDataJSON) {
        throw new Error('Missing clientDataJSON in response');
      }
      if (!response.attestationObject) {
        throw new Error('Missing attestationObject in response');
      }
      
      // Convert buffers to base64url strings with proper error handling
      let rawIdBase64, clientDataBase64, attestationBase64;
      
      try {
        rawIdBase64 = bufferToBase64url(attestation.rawId as ArrayBuffer);
        clientDataBase64 = bufferToBase64url(response.clientDataJSON);
        attestationBase64 = bufferToBase64url(response.attestationObject);
        
        console.log('Base64url encoded credential data:', {
          rawIdLength: rawIdBase64.length,
          clientDataLength: clientDataBase64.length,
          attestationLength: attestationBase64.length
        });
      } catch (err) {
        console.error('Error encoding credential data to base64url:', err);
        throw new Error(`Failed to encode credential data: ${(err as Error).message}`);
      }
      
      // Construct the attestation response to send to the server
      const attestationResponse = {
        id: attestation.id,
        rawId: rawIdBase64,
        type: attestation.type,
        response: {
          clientDataJSON: clientDataBase64,
          attestationObject: attestationBase64,
        },
      };
      
      console.log('Sending attestation to server:', attestationResponse);
      
      console.log('Sending verification request to server...');
      
      const verificationResponse = await fetch(`${API_BASE_URL}/webauthn/register/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          aadhaarId,
          attestationResponse,
        }),
      }).catch(error => {
        console.error('Network error when sending verification request:', error);
        throw new Error(`Network error: ${error.message || 'Failed to connect to server during verification'}`);
      });
      
      const verificationResult = await verificationResponse.json();
      console.log('Verification result:', verificationResult);
      
      if (verificationResponse.ok && verificationResult.verified) {
        setScanComplete(true);
        
        console.log('Registration successful for voter ID:', verificationResult.voterId);
        
        // Don't auto-login after registration - redirect to login page
        // This ensures proper login flow and data validation
        setTimeout(() => {
          console.log('Registration completed successfully. Redirecting to login.');
          // Clear any existing user state before redirecting to login
          setCurrentUser(null);
          localStorage.removeItem('currentVoter');
          localStorage.removeItem('mockBlockchainVotes');
          navigate('/voter/login');
        }, 800);
      } else {
        console.error('Verification error details:', verificationResult);
        
        // Extract the most specific error message available
        let errorMessage = 'Verification failed';
        
        if (verificationResult.error) {
          errorMessage = `${verificationResult.message || 'Error'}: ${verificationResult.error}`;
          
          // Check for specific error conditions and provide more helpful messages
          if (verificationResult.error.includes('origin')) {
            errorMessage = `Origin verification failed. Make sure you're using the correct URL (http://localhost:5173 or http://localhost:5174)`;
          } else if (verificationResult.error.includes('challenge')) {
            errorMessage = 'Challenge verification failed. Please try again.';
          } else if (verificationResult.error.includes('rpID')) {
            errorMessage = 'RP ID verification failed. Please check your browser settings.';
          }
        } else if (verificationResult.message) {
          errorMessage = verificationResult.message;
        }
          
        throw new Error(errorMessage);
      }
    } catch (err: any) {
      console.error('WebAuthn error:', err);
      
      // Try to extract the most informative error message
      let errorMsg = '';
      
      if (err.name === 'NotAllowedError') {
        errorMsg = 'You cancelled the fingerprint authentication.';
      } else if (err.name === 'NotSupportedError') {
        errorMsg = 'Your device fingerprint sensor isn\'t compatible. Try again with simulated scan.';
        setWebAuthnSupported(false);
      } else if (err.name === 'SecurityError') {
        errorMsg = 'Security error: The operation is only permitted in a secure context. Make sure you\'re using HTTPS or localhost.';
      } else if (err.name === 'InvalidStateError') {
        errorMsg = 'Invalid state error: The authenticator was already registered or is already processing a request.';
      } else if (err.message && err.message.includes('Buffer')) {
        errorMsg = 'Server error processing credential data. Trying simulated scan instead.';
        // Fall back to simulated scan on buffer errors
        setWebAuthnSupported(false);
        setTimeout(() => handleSimulatedScan(), 500);
      } else {
        errorMsg = `${err.name || 'Error'}: ${err.message || 'Failed to process fingerprint. Please try again.'}`;
      }
      
      setError(errorMsg);
      setScanComplete(false);
    } finally {
      setIsScanning(false);
    }
  };
  */
  
  // Helper function for WebAuthn encoding - commented out
  /*
  function bufferToBase64url(buffer: ArrayBuffer): string {
    if (!buffer) {
      console.error('Null or undefined buffer passed to bufferToBase64url');
      throw new Error('Cannot encode null or undefined buffer to base64url');
    }
    
    try {
      const bytes = new Uint8Array(buffer);
      let str = '';
      for (let i = 0; i < bytes.length; i++) {
        str += String.fromCharCode(bytes[i]);
      }
      
      // Standard base64 encoder
      const base64 = btoa(str);
      
      // Convert to base64url format (URL-safe)
      return base64
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
    } catch (error) {
      console.error('Error in bufferToBase64url:', error);
      console.error('Buffer information:', {
        type: buffer ? buffer.constructor.name : 'null/undefined',
        byteLength: buffer ? buffer.byteLength : 'N/A',
      });
      throw new Error(`Failed to convert buffer to base64url: ${(error as Error).message}`);
    }
  }
  */

  const handleFingerprintScan = async () => {
    setIsScanning(true);
    setError('');
    
    try {
      console.log('🔐 Starting smart biometric registration...');
      
      // Use the smart biometric service for real or simulated authentication
      const result = await smartBiometricService.registerBiometric(aadhaarId);
      
      if (result.success) {
        setScanComplete(true);
        setAuthMethod(result.method);
        
        console.log(`✅ Biometric registration successful using: ${result.method}`);
        console.log(`📋 ${result.message}`);
        
        // Show success message with method used
        if (result.method === 'real_webauthn') {
          setError(''); // Clear any errors
        }
        
        setTimeout(() => setStep(4), 1000);
      } else {
        throw new Error(result.error || 'Biometric registration failed');
      }
    } catch (err: any) {
      console.error('❌ Biometric registration error:', err);
      setError(err.message || 'Failed to register biometric. Please try again.');
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
      // Step 1: Get registration options from server
      const optionsResponse = await fetch(`${API_BASE_URL}/webauthn/register/options`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ aadhaarId })
      });
      
      if (!optionsResponse.ok) {
        throw new Error('Failed to get registration options');
      }
      
      const options = await optionsResponse.json();
      
      // Step 2: Start WebAuthn registration
      const credential = await navigator.credentials.create({
        publicKey: {
          ...options,
          challenge: new Uint8Array(Buffer.from(options.challenge, 'base64url')),
          user: {
            ...options.user,
            id: new Uint8Array(Buffer.from(options.user.id, 'base64url'))
          }
        }
      }) as PublicKeyCredential;
      
      if (!credential) {
        throw new Error('Registration cancelled');
      }
      
      // Step 3: Verify registration with server
      const verifyResponse = await fetch(`${API_BASE_URL}/webauthn/register/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          aadhaarId,
          attestationResponse: {
            id: credential.id,
            rawId: Buffer.from(credential.rawId).toString('base64url'),
            type: credential.type,
            response: {
              attestationObject: Buffer.from((credential.response as AuthenticatorAttestationResponse).attestationObject).toString('base64url'),
              clientDataJSON: Buffer.from((credential.response as AuthenticatorAttestationResponse).clientDataJSON).toString('base64url')
            }
          }
        })
      });
      
      const result = await verifyResponse.json();
      
      if (verifyResponse.ok && result.verified) {
        setScanComplete(true);
        console.log('✅ Real WebAuthn registration successful!');
        setTimeout(() => setStep(4), 1000);
      } else {
        throw new Error(result.message || 'WebAuthn registration failed');
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
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800 ml-3 sm:ml-4">Voter Registration</h1>
        </div>

        {/* Progress Indicator */}
        <div className="flex items-center justify-between mb-6 sm:mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center">
              <div
                className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-xs sm:text-sm font-semibold ${
                  i <= step
                    ? 'bg-blue-600 text-white'
                    : 'bg-white/70 text-slate-400 border border-slate-200'
                }`}
              >
                {i < step ? <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5" /> : i}
              </div>
              {i < 4 && (
                <div
                  className={`w-8 sm:w-12 h-0.5 ml-1 sm:ml-2 ${
                    i < step ? 'bg-blue-600' : 'bg-slate-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Main Card */}
        <div className="bg-white/70 backdrop-blur-sm border border-white/20 rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-xl">
          {step === 1 && (
            <div className="text-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6">
                <User className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-800 mb-3 sm:mb-4">Enter Aadhaar ID</h2>
              <p className="text-sm sm:text-base text-slate-600 mb-6 sm:mb-8">Enter your 12-digit Aadhaar number to register.</p>
              
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
                
                <div className="mt-6 text-slate-600">
                  Already registered? <button 
                    type="button"
                    onClick={() => navigate('/voter/login')} 
                    className="text-blue-600 font-medium hover:underline"
                  >
                    Login here
                  </button>
                </div>
              </form>
            </div>
          )}

          {step === 2 && (
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Smartphone className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-4">OTP Verification</h2>
              <p className="text-slate-600 mb-8">Enter the OTP sent to your registered number.</p>
              
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
                        setOtp(''); // Clear current OTP input
                      } else {
                        setNotificationMessage(data.message || 'Failed to request new OTP.');
                        setNotificationType('error');
                        setShowNotification(true);
                      }
                    } catch (err) {
                      console.error('OTP request error:', err);
                      setNotificationMessage('Failed to connect to the server. Please try again.');
                      setNotificationType('error');
                      setShowNotification(true);
                    }
                  }}
                  className="w-full mt-4 bg-transparent text-green-600 py-2 px-6 rounded-xl font-medium hover:underline transition-colors duration-200"
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
              <h2 className="text-2xl font-bold text-slate-800 mb-4">Biometric Registration</h2>
              
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
              
              <p className="text-slate-600 mb-6">Scan your fingerprint to complete registration.</p>
              
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
                    <span className="font-medium">Verification Failed</span>
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
                <p className="text-blue-600 font-medium">Registering...</p>
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
                  <ShieldAlert className="h-5 w-5 mr-2" />
                  <span className="font-medium">Your data is secure</span>
                </div>
                <p className="text-green-700 text-sm mt-1">
                  All information is encrypted and stored securely
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
      
      {/* Beautiful Modal Notification */}
      {showNotification && (
        <div className="fixed inset-0 flex items-center justify-center z-50 animate-fade-in" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="w-11/12 max-w-md animate-scale-in">
            <div className={`bg-white backdrop-blur-sm border rounded-3xl shadow-2xl overflow-hidden transform transition-all`}>
              {/* Header */}
              <div className={`px-6 py-4 text-white ${
                notificationMessage.includes('OTP is:') ? 'bg-gradient-to-r from-black to-gray-800' :
                notificationType === 'success' ? 'bg-gradient-to-r from-green-500 to-green-600' : 
                notificationType === 'error' ? 'bg-gradient-to-r from-red-500 to-red-600' : 
                'bg-gradient-to-r from-blue-500 to-blue-600'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    {notificationMessage.includes('OTP is:') ? (
                      <Smartphone className="h-6 w-6 mr-3 flex-shrink-0" />
                    ) : notificationType === 'success' ? (
                      <CheckCircle className="h-6 w-6 mr-3 flex-shrink-0" />
                    ) : notificationType === 'error' ? (
                      <AlertCircle className="h-6 w-6 mr-3 flex-shrink-0" />
                    ) : (
                      <Info className="h-6 w-6 mr-3 flex-shrink-0" />
                    )}
                    <h3 className="text-xl font-bold">
                      {notificationMessage.includes('OTP is:') ? (isResend ? 'New OTP Code' : 'OTP Code') :
                       notificationType === 'success' ? 'Success' : 
                       notificationType === 'error' ? 'Error' : 'Information'}
                    </h3>
                  </div>
                  <button 
                    onClick={() => setShowNotification(false)}
                    className="p-1 rounded-full hover:bg-white/20 transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
              
              {/* Content */}
              <div className="px-6 py-6">
                <p className="text-slate-800 text-lg">{notificationMessage}</p>
                
                {/* Copy button for OTP */}
                {notificationMessage.includes('OTP is:') && (
                  <button
                    onClick={() => {
                      // Extract OTP from the message
                      const otpMatch = notificationMessage.match(/\d{6}/);
                      if (otpMatch) {
                        navigator.clipboard.writeText(otpMatch[0])
                          .then(() => {
                            // Show temporary copied message
                            const button = document.getElementById('copy-otp-btn');
                            if (button) {
                              const originalText = button.innerText;
                              button.innerText = 'Copied!';
                              button.classList.add('bg-green-500');
                              button.classList.remove('bg-black');
                              
                              setTimeout(() => {
                                button.innerText = originalText;
                                button.classList.add('bg-black');
                                button.classList.remove('bg-green-500');
                              }, 1500);
                            }
                          })
                          .catch(err => console.error('Failed to copy: ', err));
                      }
                    }}
                    id="copy-otp-btn"
                    className="mt-4 px-4 py-2 bg-black hover:bg-gray-800 text-white rounded-lg flex items-center justify-center transition-all duration-200"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy OTP
                  </button>
                )}
              </div>
              
              {/* Action Button */}
              <div className="px-6 py-4 bg-slate-50 flex justify-end">
                <button
                  onClick={() => {
                    // Check for the special message that requires redirection
                    if (notificationMessage.includes('already registered')) {
                      navigate('/voter/login');
                    } else {
                      setShowNotification(false);
                    }
                  }}
                  className={`px-5 py-2 rounded-xl text-white font-medium ${
                    notificationMessage.includes('OTP is:') ? 'bg-gradient-to-r from-black to-gray-800 hover:from-gray-800 hover:to-black' :
                    notificationType === 'success' ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-500' : 
                    notificationType === 'error' ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-500' : 
                    'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-500'
                  }`}
                >
                  {notificationMessage.includes('already registered') ? 'Go to Login' : 
                   notificationType === 'success' ? 'Got it' : 
                   notificationType === 'error' ? 'Try Again' : 'OK'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VoterRegistration;
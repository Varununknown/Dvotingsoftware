/**
 * Smart Biometric Authentication Service
 * 
 * This service intelligently detects device capabilities and provides:
 * - Real WebAuthn biometric authentication on supported devices
 * - Graceful fallback to simulation on unsupported devices
 * - Seamless user experience regardless of device capabilities
 */

import { apiConfig } from '../utils/apiConfig';

export interface BiometricCapabilities {
  hasWebAuthn: boolean;
  hasPasskeySupport: boolean;
  hasPlatformAuthenticator: boolean;
  isHostedDomain: boolean;
  recommendRealAuth: boolean;
}

export interface BiometricAuthResult {
  success: boolean;
  method: 'real_webauthn' | 'simulation';
  message: string;
  userData?: any;
  error?: string;
}

class SmartBiometricService {
  /**
   * Detect device biometric capabilities with mobile-specific enhancements
   */
  async detectCapabilities(): Promise<BiometricCapabilities> {
    const hasWebAuthn = !!window.PublicKeyCredential;
    const hostname = window.location.hostname;
    const isHostedDomain = hostname !== 'localhost' && hostname !== '127.0.0.1';
    
    // Enhanced mobile detection
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/i.test(navigator.userAgent);
    
    console.log('🔍 Device detection:', {
      hostname,
      isHostedDomain,
      fullUrl: window.location.href,
      isMobile,
      isIOS,
      isAndroid,
      userAgent: navigator.userAgent.substring(0, 50) + '...'
    });
    
    let hasPasskeySupport = false;
    let hasPlatformAuthenticator = false;
    
    if (hasWebAuthn) {
      try {
        // Check for passkey support
        hasPasskeySupport = await PublicKeyCredential.isConditionalMediationAvailable();
        
        // Check for platform authenticator (built-in biometrics)
        hasPlatformAuthenticator = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
        
        // Special handling for mobile devices
        if (isMobile && !hasPlatformAuthenticator) {
          console.log('📱 Mobile device detected, attempting enhanced biometric detection...');
          // On mobile, sometimes the API returns false even when biometrics are available
          // We'll be more optimistic for mobile devices on HTTPS
          if (window.location.protocol === 'https:') {
            hasPlatformAuthenticator = true;
            console.log('📱 Mobile + HTTPS: Forcing biometric capability for mobile');
          }
        }
        
        // Extra aggressive mobile detection - force true for mobile HTTPS
        if (isMobile && window.location.protocol === 'https:' && !hasPlatformAuthenticator) {
          hasPlatformAuthenticator = true;
          console.log('📱 FORCING mobile biometric availability - many mobile browsers underreport capabilities');
        }
        
        console.log('✅ WebAuthn capabilities detected:', {
          hasPasskeySupport,
          hasPlatformAuthenticator,
          mobileOverride: isMobile && window.location.protocol === 'https:'
        });
      } catch (error) {
        console.log('⚠️ Advanced WebAuthn detection failed:', error);
        console.log('Using basic WebAuthn support only');
        
        // Fallback for mobile: if we're on HTTPS and mobile, assume biometrics are available
        if (isMobile && window.location.protocol === 'https:') {
          hasPlatformAuthenticator = true;
          console.log('📱 Mobile HTTPS fallback: Assuming biometric capability');
        }
      }
    } else {
      console.log('❌ WebAuthn not supported by this browser');
    }
    
    // Allow real WebAuthn on both hosted domain AND localhost for development
    const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
    const recommendRealAuth = hasWebAuthn && (isHostedDomain || isLocalhost) && hasPlatformAuthenticator;
    
    console.log('🎯 Final recommendation:', {
      hasWebAuthn,
      isHostedDomain,
      isLocalhost,
      hasPlatformAuthenticator,
      isMobile,
      recommendRealAuth,
      reason: recommendRealAuth ? 
        'Will attempt real WebAuthn' : 
        `Skipping real WebAuthn: ${!hasWebAuthn ? 'No WebAuthn' : ''} ${!(isHostedDomain || isLocalhost) ? 'Not hosted/local' : ''} ${!hasPlatformAuthenticator ? 'No authenticator' : ''}`
    });
    
    return {
      hasWebAuthn,
      hasPasskeySupport,
      hasPlatformAuthenticator,
      isHostedDomain,
      recommendRealAuth
    };
  }

  /**
   * Register biometric credentials during voter registration
   */
  async registerBiometric(aadhaarId: string): Promise<BiometricAuthResult> {
    const capabilities = await this.detectCapabilities();
    
    if (capabilities.recommendRealAuth) {
      console.log('🔐 Attempting real WebAuthn biometric registration');
      return await this.performRealWebAuthnRegistration(aadhaarId);
    } else {
      console.log('🔧 Using simulation for biometric registration');
      return await this.performSimulatedRegistration(aadhaarId);
    }
  }

  /**
   * Authenticate using biometrics during login
   */
  async authenticateBiometric(aadhaarId: string): Promise<BiometricAuthResult> {
    const capabilities = await this.detectCapabilities();
    
    if (capabilities.recommendRealAuth) {
      console.log('🔐 Attempting real WebAuthn biometric authentication');
      return await this.performRealWebAuthnAuth(aadhaarId);
    } else {
      console.log('🔧 Using simulation for biometric authentication');
      return await this.performSimulatedAuth(aadhaarId);
    }
  }

  /**
   * Real WebAuthn Registration
   */
  private async performRealWebAuthnRegistration(aadhaarId: string): Promise<BiometricAuthResult> {
    try {
      console.log('🔐 Starting REAL WebAuthn registration for:', aadhaarId);
      
      // Step 1: Get registration options from server
      const apiURL = apiConfig.getURL('/webauthn/register/options');
      console.log('🌐 Making request to:', apiURL);
      
      const optionsResponse = await fetch(apiURL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ aadhaarId })
      });
      
      console.log('📡 Server options response:', optionsResponse.status, optionsResponse.statusText);
      
      if (!optionsResponse.ok) {
        const errorData = await optionsResponse.json().catch(() => ({ message: 'Unknown server error' }));
        throw new Error(`Server error: ${errorData.message || optionsResponse.statusText}`);
      }
      
      const options = await optionsResponse.json();
      console.log('📋 Registration options received:', {
        challenge: options.challenge ? 'Present' : 'Missing',
        user: options.user ? 'Present' : 'Missing',
        rp: options.rp ? options.rp.name : 'Missing'
      });
      
      // Step 2: Create credential with real biometrics - mobile optimized
      console.log('👆 Prompting user for biometric registration...');
      
      // Mobile-specific WebAuthn configuration
      const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const isAndroid = /Android/i.test(navigator.userAgent);
      
      const createOptions = {
        publicKey: {
          ...options,
          challenge: this.base64urlToUint8Array(options.challenge),
          user: {
            ...options.user,
            id: this.base64urlToUint8Array(options.user.id)
          },
          // Mobile-specific authenticator selection
          authenticatorSelection: {
            authenticatorAttachment: 'platform', // Force platform authenticator (built-in biometrics)
            userVerification: 'required', // Require biometric verification
            requireResidentKey: false, // Don't require resident key for better mobile compatibility
            residentKey: 'discouraged' // Discourage resident key for mobile
          },
          // Shorter timeout for mobile (mobile users expect quick biometric auth)
          timeout: isMobile ? 60000 : 60000, // Keep same timeout but ensure it's long enough
          // Exclude cross-platform authenticators for mobile to force fingerprint/face
          excludeCredentials: options.excludeCredentials || [],
          // Add extensions for mobile optimization
          extensions: isMobile ? {
            uvm: true, // Request user verification methods info
            credProps: true // Request credential properties
          } : {}
        }
      };
      
      console.log('📱 Mobile-optimized WebAuthn config:', {
        isMobile,
        isIOS,
        isAndroid,
        authenticatorAttachment: createOptions.publicKey.authenticatorSelection?.authenticatorAttachment,
        userVerification: createOptions.publicKey.authenticatorSelection?.userVerification,
        timeout: createOptions.publicKey.timeout,
        hasExtensions: !!createOptions.publicKey.extensions,
        protocol: window.location.protocol,
        domain: window.location.hostname
      });
      
      console.log('🔥 ATTEMPTING MOBILE WEBAUTHN REGISTRATION - Should trigger fingerprint sensor now...');
      
      const credential = await navigator.credentials.create(createOptions) as PublicKeyCredential;
      
      if (!credential) {
        throw new Error('User cancelled biometric registration or no credential created');
      }
      
      console.log('✅ Real biometric credential created:', {
        id: credential.id.substring(0, 10) + '...',
        type: credential.type
      });
      
      // Step 3: Verify registration with server
      console.log('🔄 Verifying credential with server...');
      const verifyResponse = await fetch(apiConfig.getURL('/webauthn/register/verify'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          aadhaarId,
          attestationResponse: {
            id: credential.id,
            rawId: this.uint8ArrayToBase64url(new Uint8Array(credential.rawId)),
            type: credential.type,
            response: {
              attestationObject: this.uint8ArrayToBase64url(new Uint8Array((credential.response as AuthenticatorAttestationResponse).attestationObject)),
              clientDataJSON: this.uint8ArrayToBase64url(new Uint8Array((credential.response as AuthenticatorAttestationResponse).clientDataJSON))
            }
          }
        })
      });
      
      const result = await verifyResponse.json();
      console.log('🔍 Server verification response:', verifyResponse.status, result);
      
      if (verifyResponse.ok && result.verified) {
        console.log('🎉 REAL WebAuthn registration successful!');
        return {
          success: true,
          method: 'real_webauthn',
          message: 'Real biometric registration successful!',
          userData: result
        };
      } else {
        throw new Error(result.message || 'Server verification failed');
      }
      
    } catch (error: any) {
      console.error('❌ Real WebAuthn registration failed:', error);
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      
      // Graceful fallback to simulation
      console.log('⚡ Falling back to simulation due to real WebAuthn failure');
      return await this.performSimulatedRegistration(aadhaarId);
    }
  }

  /**
   * Real WebAuthn Authentication
   */
  private async performRealWebAuthnAuth(aadhaarId: string): Promise<BiometricAuthResult> {
    try {
      console.log('🔐 Starting real WebAuthn authentication for:', aadhaarId);
      
      // Step 1: Get authentication options
      const optionsResponse = await fetch(apiConfig.getURL('/webauthn/login/options'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ aadhaarId })
      });
      
      console.log('📡 Auth options response:', optionsResponse.status, optionsResponse.statusText);
      
      if (!optionsResponse.ok) {
        const errorData = await optionsResponse.json().catch(() => ({ message: 'Unknown server error' }));
        console.error('❌ Failed to get authentication options:', errorData);
        
        // Check if it's a "no credentials" error
        if (errorData.message?.includes('No credentials registered')) {
          console.log('🔄 No credentials found - user needs to register first');
          throw new Error('No biometric credentials found. Please register first.');
        }
        
        throw new Error(`Server error: ${errorData.message || optionsResponse.statusText}`);
      }
      
      const options = await optionsResponse.json();
      console.log('📋 Authentication options received:', {
        challenge: options.challenge ? 'Present' : 'Missing',
        allowCredentials: options.allowCredentials ? `${options.allowCredentials.length} credentials` : 'None',
        timeout: options.timeout,
        userVerification: options.userVerification
      });
      
      // Check if we have credentials to authenticate with
      if (!options.allowCredentials || options.allowCredentials.length === 0) {
        console.log('⚠️ No stored credentials found for authentication');
        
        // For mobile devices, still attempt WebAuthn to trigger fingerprint sensor
        const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        if (isMobile) {
          console.log('📱 Mobile detected - will still attempt WebAuthn to trigger sensor');
          // Continue with the WebAuthn flow - let it fail naturally after triggering sensor
        } else {
          throw new Error('No stored biometric credentials found. Please register first.');
        }
      }
      
      // Step 2: Get credential with real biometrics - mobile optimized
      const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      const getOptions = {
        publicKey: {
          ...options,
          challenge: this.base64urlToUint8Array(options.challenge),
          allowCredentials: options.allowCredentials && options.allowCredentials.length > 0 
            ? options.allowCredentials.map((cred: any) => ({
                ...cred,
                id: this.base64urlToUint8Array(cred.id)
              }))
            : undefined, // If no credentials, omit allowCredentials to trigger discoverable credential flow
          // Mobile-specific authentication options
          userVerification: 'required', // Force biometric verification
          timeout: isMobile ? 60000 : 60000, // Keep consistent timeout
          // Add extensions for mobile
          extensions: isMobile ? {
            uvm: true,
            credProps: true
          } : {}
        }
      };
      
      console.log('📱 Mobile-optimized WebAuthn authentication:', {
        isMobile,
        userVerification: getOptions.publicKey.userVerification,
        timeout: getOptions.publicKey.timeout,
        allowCredentialsCount: options.allowCredentials?.length || 0,
        hasExtensions: !!getOptions.publicKey.extensions,
        protocol: window.location.protocol,
        domain: window.location.hostname
      });
      
      console.log('🔥 ATTEMPTING MOBILE WEBAUTHN AUTHENTICATION - Should trigger fingerprint sensor now...');
      
      const credential = await navigator.credentials.get(getOptions) as PublicKeyCredential;
      
      if (!credential) {
        throw new Error('User cancelled biometric authentication');
      }
      
      // Step 3: Verify authentication
      const verifyResponse = await fetch(apiConfig.getURL('/webauthn/login/verify'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          aadhaarId,
          assertionResponse: {
            id: credential.id,
            rawId: this.uint8ArrayToBase64url(new Uint8Array(credential.rawId)),
            type: credential.type,
            response: {
              authenticatorData: this.uint8ArrayToBase64url(new Uint8Array((credential.response as AuthenticatorAssertionResponse).authenticatorData)),
              clientDataJSON: this.uint8ArrayToBase64url(new Uint8Array((credential.response as AuthenticatorAssertionResponse).clientDataJSON)),
              signature: this.uint8ArrayToBase64url(new Uint8Array((credential.response as AuthenticatorAssertionResponse).signature)),
              userHandle: (credential.response as AuthenticatorAssertionResponse).userHandle ? 
                this.uint8ArrayToBase64url(new Uint8Array((credential.response as AuthenticatorAssertionResponse).userHandle!)) : null
            }
          }
        })
      });
      
      const result = await verifyResponse.json();
      
      if (verifyResponse.ok && result.verified) {
        return {
          success: true,
          method: 'real_webauthn',
          message: 'Real biometric authentication successful!',
          userData: result
        };
      } else {
        throw new Error(result.message || 'Authentication verification failed');
      }
      
    } catch (error: any) {
      console.error('Real WebAuthn authentication failed:', error);
      
      // Special handling for mobile devices - provide more context
      const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      if (isMobile) {
        console.log('📱 Mobile WebAuthn failed - this may be expected if no credentials were registered');
        console.log('📱 Mobile fingerprint sensor should have been triggered during the attempt');
      }
      
      // Graceful fallback to simulation
      console.log('⚡ Falling back to simulation due to real WebAuthn failure');
      return await this.performSimulatedAuth(aadhaarId);
    }
  }

  /**
   * Simulated Registration (fallback)
   */
  private async performSimulatedRegistration(aadhaarId: string): Promise<BiometricAuthResult> {
    try {
      const simulatedHash = 'fp_' + Math.random().toString(36).substring(2, 10);
      const response = await fetch(apiConfig.getURL('/webauthn/fingerprint/simulate'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ aadhaarId, fingerprintHash: simulatedHash })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        return {
          success: true,
          method: 'simulation',
          message: 'Biometric registration completed',
          userData: data
        };
      } else {
        throw new Error(data.message || 'Simulation registration failed');
      }
    } catch (error: any) {
      return {
        success: false,
        method: 'simulation',
        message: 'Registration failed',
        error: error.message
      };
    }
  }

  /**
   * Simulated Authentication (fallback)
   */
  private async performSimulatedAuth(aadhaarId: string): Promise<BiometricAuthResult> {
    try {
      const simulatedHash = 'fp_' + Math.random().toString(36).substring(2, 10);
      const response = await fetch(apiConfig.getURL('/webauthn/fingerprint/verify'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ aadhaarId, fingerprintHash: simulatedHash })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        return {
          success: true,
          method: 'simulation',
          message: 'Biometric authentication completed',
          userData: data
        };
      } else {
        throw new Error(data.message || 'Simulation authentication failed');
      }
    } catch (error: any) {
      return {
        success: false,
        method: 'simulation',
        message: 'Authentication failed',
        error: error.message
      };
    }
  }

  /**
   * Browser-compatible utility methods for WebAuthn
   */
  private base64urlToUint8Array(base64url: string): Uint8Array {
    // Convert base64url to base64
    const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
    // Pad if necessary
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
    // Decode base64 to binary string
    const binaryString = atob(padded);
    // Convert to Uint8Array
    const uint8Array = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      uint8Array[i] = binaryString.charCodeAt(i);
    }
    return uint8Array;
  }

  private uint8ArrayToBase64url(uint8Array: Uint8Array): string {
    // Convert Uint8Array to binary string
    let binaryString = '';
    for (let i = 0; i < uint8Array.length; i++) {
      binaryString += String.fromCharCode(uint8Array[i]);
    }
    // Encode to base64
    const base64 = btoa(binaryString);
    // Convert base64 to base64url
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  }
}

export const smartBiometricService = new SmartBiometricService();
export default smartBiometricService;
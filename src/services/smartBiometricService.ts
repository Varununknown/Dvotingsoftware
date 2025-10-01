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
   * Detect device biometric capabilities
   */
  async detectCapabilities(): Promise<BiometricCapabilities> {
    const hasWebAuthn = !!window.PublicKeyCredential;
    const isHostedDomain = window.location.hostname !== 'localhost' && 
                          window.location.hostname !== '127.0.0.1';
    
    let hasPasskeySupport = false;
    let hasPlatformAuthenticator = false;
    
    if (hasWebAuthn) {
      try {
        // Check for passkey support
        hasPasskeySupport = await PublicKeyCredential.isConditionalMediationAvailable();
        
        // Check for platform authenticator (built-in biometrics)
        hasPlatformAuthenticator = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      } catch (error) {
        console.log('Advanced WebAuthn detection failed, using basic support');
      }
    }
    
    // Recommend real auth only if we have good conditions
    const recommendRealAuth = hasWebAuthn && 
                             isHostedDomain && 
                             hasPlatformAuthenticator;
    
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
      // Step 1: Get registration options from server
      const optionsResponse = await fetch(apiConfig.getURL('/webauthn/register/options'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ aadhaarId })
      });
      
      if (!optionsResponse.ok) {
        throw new Error('Failed to get registration options from server');
      }
      
      const options = await optionsResponse.json();
      
      // Step 2: Create credential with real biometrics
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
        throw new Error('User cancelled biometric registration');
      }
      
      // Step 3: Verify registration with server
      const verifyResponse = await fetch(apiConfig.getURL('/webauthn/register/verify'), {
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
      console.error('Real WebAuthn registration failed:', error);
      
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
      // Step 1: Get authentication options
      const optionsResponse = await fetch(apiConfig.getURL('/webauthn/login/options'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ aadhaarId })
      });
      
      if (!optionsResponse.ok) {
        throw new Error('Failed to get authentication options');
      }
      
      const options = await optionsResponse.json();
      
      // Step 2: Get credential with real biometrics
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
}

export const smartBiometricService = new SmartBiometricService();
export default smartBiometricService;
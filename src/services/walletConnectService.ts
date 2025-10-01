import { SignClient } from '@walletconnect/sign-client';
import { getSdkError } from '@walletconnect/utils';
import type { SessionTypes } from '@walletconnect/types';
import { CONTRACT_ABI, CONTRACT_ADDRESS } from '../contracts/contractInfo';

/**
 * WalletConnect Service - Mobile Wallet Integration
 * Adds mobile wallet support alongside existing browser wallet functionality
 * Does NOT interfere with existing MetaMask/browser wallet connections
 */
export class WalletConnectService {
  private signClient: SignClient | null = null;
  private session: SessionTypes.Struct | null = null;
  private isInitialized = false;
  private account: string | null = null;
  private chainId: number = 11155111; // Sepolia testnet

  // Project ID from WalletConnect Cloud - Get your free one at https://cloud.walletconnect.com
  private readonly PROJECT_ID = '2f05a7b3b2c4e5d6f7a8b9c0d1e2f3a4'; // This is a demo ID - replace with real one

  constructor() {
    this.initializeWalletConnect();
  }

  /**
   * Initialize WalletConnect client
   */
  private async initializeWalletConnect(): Promise<void> {
    try {
      console.log('🔗 Initializing WalletConnect for mobile wallets...');
      
      this.signClient = await SignClient.init({
        projectId: this.PROJECT_ID,
        metadata: {
          name: 'E-Voting System',
          description: 'Secure blockchain-based voting system',
          url: window.location.origin,
          icons: ['/favicon.ico']
        }
      });

      // Listen for session events
      this.signClient.on('session_event', (event) => {
        console.log('📱 WalletConnect session event:', event);
      });

      this.signClient.on('session_update', ({ topic, params }) => {
        console.log('📱 WalletConnect session updated:', { topic, params });
        const { namespaces } = params;
        const session = this.signClient?.session.get(topic);
        if (session) {
          this.session = { ...session, namespaces };
        }
      });

      this.signClient.on('session_delete', () => {
        console.log('📱 WalletConnect session deleted');
        this.disconnect();
      });

      this.isInitialized = true;
      console.log('✅ WalletConnect initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize WalletConnect:', error);
      throw new Error('WalletConnect initialization failed');
    }
  }

  /**
   * Connect to mobile wallet via QR code
   */
  async connect(): Promise<{ success: boolean; uri?: string; address?: string }> {
    try {
      if (!this.signClient) {
        throw new Error('WalletConnect not initialized');
      }

      console.log('📱 Starting mobile wallet connection...');

      const { uri, approval } = await this.signClient.connect({
        requiredNamespaces: {
          eip155: {
            methods: [
              'eth_sendTransaction',
              'eth_signTransaction',
              'eth_sign',
              'personal_sign',
              'eth_signTypedData'
            ],
            chains: [`eip155:${this.chainId}`],
            events: ['accountsChanged', 'chainChanged']
          }
        }
      });

      // Return URI for QR code display
      if (uri) {
        console.log('📱 QR Code URI generated:', uri);
        
        // Wait for user to approve in their mobile wallet
        const session = await approval();
        this.session = session;

        // Extract account address
        const accounts = session.namespaces.eip155?.accounts || [];
        if (accounts.length > 0) {
          this.account = accounts[0].split(':')[2]; // Extract address from account string
          console.log('✅ Mobile wallet connected:', this.account);
          
          return {
            success: true,
            address: this.account
          };
        }
      }

      return { success: false };
    } catch (error) {
      console.error('❌ Mobile wallet connection failed:', error);
      return { success: false };
    }
  }

  /**
   * Get current connection status
   */
  getConnectionInfo(): { connected: boolean; address: string | null; type: 'mobile' } {
    return {
      connected: !!this.session && !!this.account,
      address: this.account,
      type: 'mobile'
    };
  }

  /**
   * Sign transaction with mobile wallet
   */
  async signTransaction(transaction: any): Promise<string> {
    if (!this.signClient || !this.session || !this.account) {
      throw new Error('Mobile wallet not connected');
    }

    try {
      console.log('📱 Signing transaction with mobile wallet...');
      
      const result = await this.signClient.request({
        topic: this.session.topic,
        chainId: `eip155:${this.chainId}`,
        request: {
          method: 'eth_signTransaction',
          params: [transaction]
        }
      });

      console.log('✅ Transaction signed with mobile wallet');
      return result;
    } catch (error) {
      console.error('❌ Failed to sign transaction:', error);
      throw error;
    }
  }

  /**
   * Send transaction with mobile wallet
   */
  async sendTransaction(transaction: any): Promise<string> {
    if (!this.signClient || !this.session || !this.account) {
      throw new Error('Mobile wallet not connected');
    }

    try {
      console.log('📱 Sending transaction with mobile wallet...');
      
      const result = await this.signClient.request({
        topic: this.session.topic,
        chainId: `eip155:${this.chainId}`,
        request: {
          method: 'eth_sendTransaction',
          params: [transaction]
        }
      });

      console.log('✅ Transaction sent with mobile wallet');
      return result;
    } catch (error) {
      console.error('❌ Failed to send transaction:', error);
      throw error;
    }
  }

  /**
   * Cast vote using mobile wallet
   */
  async castVote(electionId: string, candidateId: string): Promise<{ success: boolean; txHash?: string; error?: string }> {
    try {
      if (!this.account) {
        throw new Error('Mobile wallet not connected');
      }

      console.log('🗳️ Casting vote with mobile wallet...');

      // Prepare contract transaction
      const ethers = await import('ethers');
      const iface = new ethers.Interface(CONTRACT_ABI);
      const data = iface.encodeFunctionData('vote', [electionId, candidateId]);

      const transaction = {
        to: CONTRACT_ADDRESS,
        data: data,
        from: this.account,
        gasLimit: '0x30d40', // 200000 in hex
        gasPrice: '0x2540be400' // 10 gwei in hex
      };

      const txHash = await this.sendTransaction(transaction);
      
      console.log('✅ Vote cast successfully with mobile wallet!', txHash);
      return { success: true, txHash };
    } catch (error) {
      console.error('❌ Failed to cast vote with mobile wallet:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Disconnect mobile wallet
   */
  async disconnect(): Promise<void> {
    try {
      if (this.signClient && this.session) {
        await this.signClient.disconnect({
          topic: this.session.topic,
          reason: getSdkError('USER_DISCONNECTED')
        });
      }
      
      this.session = null;
      this.account = null;
      console.log('📱 Mobile wallet disconnected');
    } catch (error) {
      console.error('❌ Error disconnecting mobile wallet:', error);
    }
  }

  /**
   * Check if WalletConnect is ready
   */
  isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * Get active sessions
   */
  getActiveSessions(): SessionTypes.Struct[] {
    if (!this.signClient) return [];
    return this.signClient.session.getAll();
  }
}

// Export singleton instance
export const walletConnectService = new WalletConnectService();
export default walletConnectService;
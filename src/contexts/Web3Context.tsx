import React, { createContext, useContext, useState, useEffect } from 'react';
import web3Service from '../services/web3Service';
import { WalletInfo } from '../types/web3';

interface Web3ContextType {
  walletInfo: WalletInfo | null;
  isConnecting: boolean;
  isRealBlockchain: boolean;
  connectWallet: () => Promise<boolean>;
  disconnectWallet: () => void;
  switchNetwork: () => Promise<boolean>;
  getNetworkStatus: () => Promise<{ connected: boolean; network: string }>;
}

const Web3Context = createContext<Web3ContextType | null>(null);

export const useWeb3 = () => {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error('useWeb3 must be used within a Web3Provider');
  }
  return context;
};

export const Web3Provider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [walletInfo, setWalletInfo] = useState<WalletInfo | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isRealBlockchain, setIsRealBlockchain] = useState(false);

  useEffect(() => {
    // Check blockchain mode on mount
    const checkBlockchainMode = () => {
      const isReal = web3Service.isRealBlockchainMode();
      setIsRealBlockchain(isReal);
      
      if (isReal) {
        updateWalletInfo();
      }
    };

    checkBlockchainMode();
    
    // Listen for MetaMask account changes
    if (typeof window !== 'undefined' && window.ethereum) {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length === 0) {
          setWalletInfo(null);
          setIsRealBlockchain(false);
        } else {
          updateWalletInfo();
        }
      };

      const handleChainChanged = () => {
        updateWalletInfo();
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      return () => {
        window.ethereum?.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum?.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, []);

  const updateWalletInfo = async () => {
    try {
      const address = await web3Service.getWalletAddress();
      const networkInfo = await web3Service.getNetworkInfo();
      
      if (address && web3Service.isRealBlockchainMode()) {
        setWalletInfo({
          address,
          balance: '0', // Could fetch actual balance if needed
          chainId: networkInfo.chainId,
          networkName: networkInfo.networkName,
          isConnected: true
        });
      } else {
        setWalletInfo(null);
      }
    } catch (error) {
      console.error('Error updating wallet info:', error);
      setWalletInfo(null);
    }
  };

  const connectWallet = async (): Promise<boolean> => {
    setIsConnecting(true);
    try {
      const connected = await web3Service.reconnectBlockchain();
      
      if (connected) {
        setIsRealBlockchain(true);
        await updateWalletInfo();
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error connecting wallet:', error);
      return false;
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
    setWalletInfo(null);
    setIsRealBlockchain(false);
    // Note: Can't actually disconnect MetaMask programmatically
    // This just clears our app's state
  };

  const switchNetwork = async (): Promise<boolean> => {
    try {
      // This would trigger the network switch in Web3Service
      return await web3Service.reconnectBlockchain();
    } catch (error) {
      console.error('Error switching network:', error);
      return false;
    }
  };

  const getNetworkStatus = async () => {
    try {
      const networkInfo = await web3Service.getNetworkInfo();
      return {
        connected: web3Service.isRealBlockchainMode(),
        network: networkInfo.networkName
      };
    } catch (error) {
      console.error('Error getting network status:', error);
      return { connected: false, network: 'Unknown' };
    }
  };

  const value: Web3ContextType = {
    walletInfo,
    isConnecting,
    isRealBlockchain,
    connectWallet,
    disconnectWallet,
    switchNetwork,
    getNetworkStatus
  };

  return (
    <Web3Context.Provider value={value}>
      {children}
    </Web3Context.Provider>
  );
};
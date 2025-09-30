import React, { useState } from 'react';
import { useWeb3 } from '../contexts/Web3Context';

interface WalletConnectionProps {
  className?: string;
}

export const WalletConnection: React.FC<WalletConnectionProps> = ({ className = '' }) => {
  const { walletInfo, isConnecting, isRealBlockchain, connectWallet, getNetworkStatus } = useWeb3();
  const [showStatus, setShowStatus] = useState(false);
  const [networkStatus, setNetworkStatus] = useState<{ connected: boolean; network: string } | null>(null);

  const handleConnect = async () => {
    const success = await connectWallet();
    if (success) {
      console.log('🎉 Wallet connected successfully!');
    } else {
      console.error('❌ Failed to connect wallet');
    }
  };

  const checkStatus = async () => {
    const status = await getNetworkStatus();
    setNetworkStatus(status);
    setShowStatus(true);
    setTimeout(() => setShowStatus(false), 3000);
  };

  if (!isRealBlockchain) {
    return (
      <div className={`bg-yellow-50 border border-yellow-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center space-x-3">
          <div className="w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></div>
          <div>
            <h3 className="font-medium text-yellow-800">Mock Blockchain Mode</h3>
            <p className="text-sm text-yellow-600">
              Install MetaMask and connect to use REAL blockchain
            </p>
          </div>
          <button
            onClick={handleConnect}
            disabled={isConnecting}
            className="ml-auto px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 text-sm"
          >
            {isConnecting ? 'Connecting...' : 'Connect Wallet'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-green-50 border border-green-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          <div>
            <h3 className="font-medium text-green-800">REAL Blockchain Connected! 🎉</h3>
            <p className="text-sm text-green-600">
              {walletInfo?.address ? 
                `Wallet: ${walletInfo.address.substring(0, 6)}...${walletInfo.address.substring(-4)}` :
                'Connected to Ethereum'
              }
            </p>
            <p className="text-xs text-green-500">
              Network: {walletInfo?.networkName || 'Sepolia Testnet'}
            </p>
          </div>
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={checkStatus}
            className="px-3 py-1 bg-green-100 text-green-700 rounded text-sm hover:bg-green-200"
          >
            Check Status
          </button>
          <a
            href={`https://sepolia.etherscan.io/address/${walletInfo?.address}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200"
          >
            View on Etherscan
          </a>
        </div>
      </div>
      
      {showStatus && networkStatus && (
        <div className="mt-3 p-2 bg-white rounded border">
          <p className="text-sm">
            Status: {networkStatus.connected ? '✅ Connected' : '❌ Disconnected'} | 
            Network: {networkStatus.network}
          </p>
        </div>
      )}
    </div>
  );
};

export default WalletConnection;
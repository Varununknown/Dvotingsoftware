import React, { useState, useEffect } from 'react';
import { X, Smartphone, QrCode, Loader } from 'lucide-react';

interface MobileWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  qrCodeUri?: string;
  isConnecting: boolean;
  onSuccess: (address: string) => void;
  onError: (error: string) => void;
}

/**
 * QR Code Modal for Mobile Wallet Connection
 * Displays QR code for users to scan with their mobile wallet apps
 */
export const MobileWalletModal: React.FC<MobileWalletModalProps> = ({
  isOpen,
  onClose,
  qrCodeUri,
  isConnecting,
  onSuccess,
  onError
}) => {
  const [qrCodeSvg, setQrCodeSvg] = useState<string>('');

  // Generate QR code when URI is available
  useEffect(() => {
    if (qrCodeUri) {
      generateQRCode(qrCodeUri);
    }
  }, [qrCodeUri]);

  const generateQRCode = async (uri: string) => {
    try {
      // Simple QR code generation - you can use a library like qrcode for better QR codes
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = 256;
      canvas.height = 256;
      
      if (ctx) {
        // Simple placeholder - in production, use a proper QR code library
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, 256, 256);
        ctx.fillStyle = '#FFF';
        ctx.font = '12px Arial';
        ctx.fillText('QR Code:', 10, 20);
        ctx.fillText('Scan with your', 10, 40);
        ctx.fillText('mobile wallet', 10, 60);
        
        const dataUrl = canvas.toDataURL();
        setQrCodeSvg(dataUrl);
      }
    } catch (error) {
      console.error('Failed to generate QR code:', error);
      onError('Failed to generate QR code');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-blue-100 rounded-full">
              <Smartphone className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            Connect Mobile Wallet
          </h2>
          <p className="text-gray-600 text-sm">
            Scan the QR code with your mobile wallet app to connect
          </p>
        </div>

        {/* QR Code Section */}
        <div className="flex flex-col items-center space-y-4">
          {isConnecting ? (
            <div className="flex flex-col items-center space-y-4">
              <div className="w-64 h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                {qrCodeSvg ? (
                  <img 
                    src={qrCodeSvg} 
                    alt="QR Code" 
                    className="w-full h-full object-contain rounded-lg"
                  />
                ) : (
                  <div className="flex flex-col items-center space-y-2">
                    <QrCode className="w-16 h-16 text-gray-400" />
                    <span className="text-sm text-gray-500">Generating QR code...</span>
                  </div>
                )}
              </div>
              
              <div className="flex items-center space-x-2 text-blue-600">
                <Loader className="w-4 h-4 animate-spin" />
                <span className="text-sm">Waiting for wallet connection...</span>
              </div>
            </div>
          ) : (
            <div className="w-64 h-64 bg-gray-100 rounded-lg flex items-center justify-center">
              <div className="flex flex-col items-center space-y-2">
                <QrCode className="w-16 h-16 text-gray-400" />
                <span className="text-sm text-gray-500">Preparing connection...</span>
              </div>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="mt-6 space-y-3">
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="font-medium text-blue-800 mb-2">How to connect:</h3>
            <ol className="text-sm text-blue-700 space-y-1">
              <li>1. Open your mobile wallet app</li>
              <li>2. Look for "WalletConnect" or "Scan QR"</li>
              <li>3. Scan the QR code above</li>
              <li>4. Approve the connection in your wallet</li>
            </ol>
          </div>

          {/* Supported wallets */}
          <div className="text-center">
            <p className="text-xs text-gray-500 mb-2">Supported wallets:</p>
            <div className="flex justify-center space-x-4 text-xs text-gray-600">
              <span>MetaMask Mobile</span>
              <span>Trust Wallet</span>
              <span>Coinbase Wallet</span>
              <span>Rainbow</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          
          {qrCodeUri && (
            <button
              onClick={() => {
                // Copy URI to clipboard for manual connection
                navigator.clipboard.writeText(qrCodeUri);
                alert('Connection URI copied to clipboard!');
              }}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Copy URI
            </button>
          )}
        </div>

        {/* Alternative connection note */}
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500">
            Don't have a mobile wallet? 
            <button 
              onClick={onClose}
              className="text-blue-600 hover:underline ml-1"
            >
              Use browser wallet instead
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default MobileWalletModal;
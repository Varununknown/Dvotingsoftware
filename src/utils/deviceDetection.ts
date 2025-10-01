/**
 * Device Detection Utility
 * Safely detects device type for appropriate wallet connection method
 * No breaking changes to existing functionality
 */

export interface DeviceInfo {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  hasMetaMask: boolean;
  platform: 'mobile' | 'tablet' | 'desktop';
  recommendedConnection: 'browser-extension' | 'walletconnect' | 'both';
}

/**
 * Detect current device type and capabilities
 */
export function detectDevice(): DeviceInfo {
  const userAgent = typeof window !== 'undefined' ? window.navigator.userAgent : '';
  
  // Mobile detection
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent) ||
                   (typeof window !== 'undefined' && window.innerWidth <= 768);
  
  // Tablet detection
  const isTablet = /iPad|Android(?=.*\bMobile\b)(?=.*\bSafari\b)|Android(?=.*\bTablet\b)/i.test(userAgent) ||
                   (typeof window !== 'undefined' && window.innerWidth > 768 && window.innerWidth <= 1024);
  
  // Desktop detection
  const isDesktop = !isMobile && !isTablet;
  
  // MetaMask detection
  const hasMetaMask = typeof window !== 'undefined' && 
                     typeof window.ethereum !== 'undefined' && 
                     window.ethereum.isMetaMask === true;
  
  // Platform determination
  let platform: 'mobile' | 'tablet' | 'desktop' = 'desktop';
  if (isMobile) platform = 'mobile';
  else if (isTablet) platform = 'tablet';
  
  // Recommended connection method
  let recommendedConnection: 'browser-extension' | 'walletconnect' | 'both' = 'browser-extension';
  
  if (isMobile) {
    // Mobile: Prefer WalletConnect, but show browser option if MetaMask mobile browser
    recommendedConnection = hasMetaMask ? 'both' : 'walletconnect';
  } else if (isTablet) {
    // Tablet: Show both options
    recommendedConnection = 'both';
  } else {
    // Desktop: Prefer browser extension, but show WalletConnect as alternative
    recommendedConnection = hasMetaMask ? 'browser-extension' : 'both';
  }
  
  return {
    isMobile,
    isTablet,
    isDesktop,
    hasMetaMask,
    platform,
    recommendedConnection
  };
}

/**
 * Check if device supports browser wallet connections
 */
export function supportsBrowserWallet(): boolean {
  return typeof window !== 'undefined' && 
         typeof window.ethereum !== 'undefined';
}

/**
 * Check if device should use WalletConnect
 */
export function shouldUseWalletConnect(): boolean {
  const device = detectDevice();
  return device.isMobile || !device.hasMetaMask;
}

/**
 * Get user-friendly device description
 */
export function getDeviceDescription(): string {
  const device = detectDevice();
  
  if (device.isMobile) {
    return device.hasMetaMask ? 'Mobile (MetaMask Browser)' : 'Mobile Device';
  } else if (device.isTablet) {
    return 'Tablet Device';
  } else {
    return device.hasMetaMask ? 'Desktop (MetaMask Available)' : 'Desktop Browser';
  }
}

/**
 * Get recommended wallet connection message
 */
export function getRecommendedConnectionMessage(): string {
  const device = detectDevice();
  
  if (device.isMobile && !device.hasMetaMask) {
    return 'Use mobile wallet app (Trust Wallet, MetaMask Mobile, etc.)';
  } else if (device.isDesktop && device.hasMetaMask) {
    return 'Use MetaMask browser extension';
  } else {
    return 'Choose your preferred wallet connection method';
  }
}
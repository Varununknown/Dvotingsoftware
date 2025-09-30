// Real Wallet Configuration for College Project
// REAL BLOCKCHAIN: Using actual user wallet on Sepolia testnet
// COMPLETELY FREE: Sepolia testnet ETH costs nothing

export const DEMO_WALLET_CONFIG = {
  // Your actual MetaMask wallet address
  address: "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65",
  network: "sepolia",
  isDemo: false, // This is your real wallet
  
  // Wallet info for UI display
  name: "Your MetaMask Wallet (Sepolia)",
  balance: "0", // Will be fetched from blockchain
  
  // Network configuration for Sepolia testnet
  networkConfig: {
    chainId: 11155111,
    chainName: "Sepolia Testnet",
    rpcUrl: "https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161",
    blockExplorerUrl: "https://sepolia.etherscan.io"
  }
};

// Your wallet on Etherscan: https://sepolia.etherscan.io/address/0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65
// FREE Sepolia ETH Instructions:
// 1. Make sure you're on Sepolia testnet in MetaMask
// 2. If you need more ETH, try: https://www.alchemy.com/faucets/ethereum-sepolia
// 3. All transactions are REAL blockchain but completely FREE
// 4. Every vote will create a real transaction on Ethereum!

export const isDemoMode = () => false; // Using real MetaMask connection
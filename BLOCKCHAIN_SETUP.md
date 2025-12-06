# Enable Real Blockchain Vote Submission

By default, votes are recorded in MongoDB with mock transaction hashes. To make votes actually appear on Etherscan, follow these steps:

## Step 1: Get Sepolia Testnet ETH

Your voting wallet needs ETH to pay for transaction gas. Get free testnet ETH:

1. Go to **Sepolia Faucet**: https://sepolia-faucet.pk910.de/
2. Enter your wallet address (from MetaMask)
3. Request testnet ETH (free!)
4. Wait a few minutes for it to arrive

Or use the official faucet: https://www.alchemy.com/faucets/ethereum-sepolia

## Step 2: Add VOTER_PRIVATE_KEY to .env

The backend needs a private key to sign and submit transactions:

```env
# In backend/.env
VOTER_PRIVATE_KEY=your_private_key_here_without_0x_prefix
MONGO_URI=your_mongodb_connection_string
PORT=5000
```

**How to get your private key:**
1. Open MetaMask
2. Click account menu (top right)
3. Click "Account Details"
4. Click "Show Private Key"
5. Enter your password
6. Copy the private key (starts with "0x")
7. Paste it in .env WITHOUT the "0x" prefix

⚠️ **SECURITY WARNING**: Never share or commit this private key! It gives full access to your wallet.

## Step 3: Restart Backend

```bash
cd backend
npm run dev
```

You should see logs like:
```
✅ Blockchain service initialized
📝 Contract: 0x742d35Cc6638C0532925a3b8D969cf23d83F5677
👛 Signer: 0x1234...
🌐 Network: Sepolia Testnet
```

## Step 4: Cast a Vote and Check Etherscan

1. Go to http://securevoting.vercel.app (or your frontend)
2. Register and login as a voter
3. Cast a vote in an active election
4. Copy the transaction hash from the response
5. Paste it into Etherscan: https://sepolia.etherscan.io/
6. You should see your vote transaction! 🎉

### Example Etherscan URL:
```
https://sepolia.etherscan.io/tx/0x1234567890abcdef...
```

## Verification on Etherscan

Once submitted to Sepolia, you'll see:
- ✅ **Status**: Success (green checkmark)
- **From**: Your wallet address
- **To**: Contract address (0x742d35Cc6638C0532925a3b8D969cf23d83F5677)
- **Function**: castVote
- **Block**: Transaction included in a block
- **Gas Used**: Actual gas consumed

## Troubleshooting

### "Blockchain service not initialized"
- Make sure `VOTER_PRIVATE_KEY` is set in `.env`
- Restart the backend: `npm run dev`

### "Transaction failed: insufficient funds"
- Get more Sepolia ETH from the faucet (see Step 1)
- Each vote needs ~0.01 ETH for gas

### "Transaction pending / not found on Etherscan"
- Wait a few blocks (usually 12-30 seconds)
- Sepolia might be slow during high activity
- Refresh the Etherscan page

### "Invalid private key"
- Make sure you removed the "0x" prefix
- Check there are no extra spaces or characters
- Get a new private key from MetaMask if needed

## View Smart Contract

Your votes are permanently stored on the blockchain!

- **Contract Address**: `0x742d35Cc6638C0532925a3b8D969cf23d83F5677`
- **Network**: Ethereum Sepolia Testnet
- **View Contract**: https://sepolia.etherscan.io/address/0x742d35Cc6638C0532925a3b8D969cf23d83F5677

Click "Read Contract" to view:
- `voterVotes`: All votes cast (immutable record)
- `electionResults`: Vote counts per candidate
- `hasVoted`: Which voters have voted

## For Your College Evaluation

Show your evaluator:

1. **Live vote casting** at your app
2. **Real transaction hash** in response
3. **Etherscan verification** showing the vote on blockchain
4. **Smart contract code** at the contract address
5. **Vote immutability** - votes cannot be deleted or tampered with

This proves your system has real blockchain integration, not just a mock! 🚀

---

**Need Help?**
- Check backend logs: `npm run dev` output
- Verify your private key is correct (no 0x, no spaces)
- Make sure wallet has Sepolia ETH for gas
- Etherscan takes 12-30 seconds to update after transaction

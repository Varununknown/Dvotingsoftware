import { Election, Candidate } from '../contexts/VotingContext';

// Utility function to generate HTML for the PDF receipt
export const generateVoteReceiptHTML = (
  election: Election,
  candidate: Candidate,
  transactionHash: string,
  voterID: string
): string => {
  const now = new Date();
  const formattedDate = now.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const formattedTime = now.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Vote Receipt - ${election.title}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
          color: #333;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
        }
        .logo {
          font-size: 48px;
          margin-bottom: 10px;
        }
        h1 {
          color: #2563eb;
          font-size: 28px;
          margin: 0;
        }
        .subtitle {
          color: #64748b;
          font-size: 16px;
          margin-top: 5px;
        }
        .receipt-box {
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          padding: 30px;
          margin: 20px 0;
          background-color: #f8fafc;
        }
        .election-info {
          margin-bottom: 30px;
        }
        .election-title {
          font-size: 22px;
          font-weight: bold;
          color: #1e293b;
          margin-bottom: 5px;
        }
        .election-desc {
          color: #64748b;
          margin-bottom: 15px;
        }
        .candidate-box {
          display: flex;
          align-items: center;
          margin-bottom: 20px;
          padding: 15px;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          background-color: white;
        }
        .candidate-name {
          font-size: 18px;
          font-weight: bold;
          margin-bottom: 5px;
        }
        .candidate-party {
          color: #64748b;
        }
        .transaction-info {
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px dashed #cbd5e1;
        }
        .transaction-hash {
          font-family: monospace;
          padding: 10px;
          background-color: #f1f5f9;
          border-radius: 6px;
          font-size: 14px;
          word-break: break-all;
        }
        .verification-code {
          margin-top: 20px;
          text-align: center;
          font-size: 24px;
          letter-spacing: 5px;
          font-weight: bold;
          color: #2563eb;
        }
        .footer {
          margin-top: 40px;
          text-align: center;
          font-size: 14px;
          color: #64748b;
        }
        .disclaimer {
          font-style: italic;
          margin-top: 10px;
          font-size: 12px;
        }
        .qr-placeholder {
          width: 100px;
          height: 100px;
          background-color: #e2e8f0;
          margin: 0 auto;
          margin-top: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo">🗳️</div>
        <h1>OFFICIAL VOTE RECEIPT</h1>
        <p class="subtitle">SecureVote Blockchain-Based E-Voting System</p>
      </div>
      
      <div class="receipt-box">
        <div class="election-info">
          <div class="election-title">${election.title} ${election.logo}</div>
          <div class="election-desc">${election.description}</div>
          <div>Election ID: ${election.id}</div>
          <div>Receipt generated: ${formattedDate} at ${formattedTime}</div>
        </div>
        
        <h2>Your Vote:</h2>
        <div class="candidate-box">
          <div style="margin-right: 15px; font-size: 24px;">${candidate.logo}</div>
          <div>
            <div class="candidate-name">${candidate.name}</div>
            <div class="candidate-party">${candidate.party}</div>
          </div>
        </div>
        
        <div class="transaction-info">
          <h3>Blockchain Verification</h3>
          <p>Your vote has been securely recorded on the blockchain with the following transaction:</p>
          <div class="transaction-hash">${transactionHash}</div>
          
          <h3>Vote Verification Code:</h3>
          <div class="verification-code">${Math.floor(Math.random() * 900000) + 100000}</div>
          
          <div style="text-align: center; margin-top: 20px;">
            <p>Voter ID: ****${voterID.slice(-4)}</p>
          </div>
        </div>
      </div>
      
      <div class="footer">
        <p>This receipt is your proof of participation in the election.</p>
        <p>Keep this receipt for your records.</p>
        <p class="disclaimer">This document is automatically generated and requires no signature.</p>
        <p>© SecureVote 2025. All rights reserved.</p>
      </div>
    </body>
    </html>
  `;
};

// Function to trigger PDF download
export const downloadVoteReceipt = (
  election: Election,
  candidate: Candidate,
  transactionHash: string,
  voterID: string
) => {
  const html = generateVoteReceiptHTML(election, candidate, transactionHash, voterID);
  
  // Create a Blob with the HTML content
  const blob = new Blob([html], { type: 'text/html' });
  
  // Create a downloadable link
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `vote-receipt-${election.id}-${Date.now()}.html`;
  
  // Trigger the download
  document.body.appendChild(a);
  a.click();
  
  // Clean up
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 0);
};
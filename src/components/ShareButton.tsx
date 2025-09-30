import React, { useState } from 'react';
import { Share2, MessageCircle, Copy, Check } from 'lucide-react';

interface ShareButtonProps {
  electionTitle: string;
  electionId: string;
  results: {
    winner: {
      name: string;
      party: string;
      votes: number;
      percentage: string;
    };
    totalVotes: number;
    candidates: Array<{
      name: string;
      party: string;
      votes: number;
      percentage: string;
    }>;
  };
  className?: string;
}

const ShareButton: React.FC<ShareButtonProps> = ({ 
  electionTitle, 
  electionId, 
  results, 
  className = "" 
}) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [copied, setCopied] = useState(false);

  const baseUrl = window.location.origin;
  const shareUrl = `${baseUrl}/election-results/${electionId}`;
  
  const shareText = `🗳️ ${electionTitle} Results:\n\n🏆 Winner: ${results.winner.name} (${results.winner.party})\n📊 ${results.winner.votes} votes (${results.winner.percentage}%)\n\nTotal Votes: ${results.totalVotes.toLocaleString()}\n\nView full results: ${shareUrl}`;

  const handleWhatsAppShare = () => {
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
    window.open(whatsappUrl, '_blank');
    setShowDropdown(false);
  };

  const handleTwitterShare = () => {
    const twitterText = `🗳️ ${electionTitle} Results: ${results.winner.name} (${results.winner.party}) wins with ${results.winner.percentage}% of votes! #ElectionResults #Democracy`;
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(twitterText)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(twitterUrl, '_blank');
    setShowDropdown(false);
  };

  const handleFacebookShare = () => {
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`;
    window.open(facebookUrl, '_blank');
    setShowDropdown(false);
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = shareText;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
    setShowDropdown(false);
  };

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center space-x-2 px-4 py-2 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-lg text-sm font-medium transition-colors duration-200"
      >
        <Share2 className="h-4 w-4" />
        <span>Share Results</span>
      </button>

      {showDropdown && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10"
            onClick={() => setShowDropdown(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute top-full right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
            <div className="py-2">
              <button
                onClick={handleWhatsAppShare}
                className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center space-x-3"
              >
                <MessageCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm text-gray-700">WhatsApp</span>
              </button>
              
              <button
                onClick={handleTwitterShare}
                className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center space-x-3"
              >
                <svg className="h-4 w-4 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
                <span className="text-sm text-gray-700">Twitter/X</span>
              </button>
              
              <button
                onClick={handleFacebookShare}
                className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center space-x-3"
              >
                <svg className="h-4 w-4 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                <span className="text-sm text-gray-700">Facebook</span>
              </button>
              
              <button
                onClick={handleCopyLink}
                className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center space-x-3"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4 text-gray-600" />
                )}
                <span className={`text-sm ${copied ? 'text-green-700' : 'text-gray-700'}`}>
                  {copied ? 'Copied!' : 'Copy Text'}
                </span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ShareButton;
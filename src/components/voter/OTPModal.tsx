import React from 'react';
import { X, Smartphone } from 'lucide-react';

interface OTPModalProps {
  otp: string;
  message: string;
  onClose: () => void;
}

const OTPModal: React.FC<OTPModalProps> = ({ otp, message, onClose }) => {

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Content */}
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Smartphone className="h-8 w-8 text-white" />
          </div>
          
          <h3 className="text-xl font-bold text-slate-800 mb-4">
            OTP Generated Successfully
          </h3>
          
          <p className="text-slate-600 mb-6">
            {message.replace(otp, `**${otp}**`).split('**').map((part, i) => (
              <span key={i} className={i % 2 === 1 ? 'font-bold text-xl text-slate-800' : ''}>
                {part}
              </span>
            ))}
          </p>

          <button
            onClick={onClose}
            className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-green-600 hover:to-green-700 transition-colors duration-200"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
};

export default OTPModal;
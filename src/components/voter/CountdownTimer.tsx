import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface CountdownTimerProps {
  targetDate: string;
  isActive?: boolean; // true for active elections (counting down to end), false for upcoming (counting down to start)
}

const CountdownTimer: React.FC<CountdownTimerProps> = ({ targetDate, isActive = false }) => {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  }>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const target = new Date(targetDate);
      const difference = target.getTime() - now.getTime();
      
      if (difference <= 0) {
        setIsExpired(true);
        return {
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0
        };
      }
      
      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((difference % (1000 * 60)) / 1000)
      };
    };

    // Calculate initially
    setTimeLeft(calculateTimeLeft());
    
    // Update every second
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);
    
    // Clean up
    return () => clearInterval(timer);
  }, [targetDate]);
  
  // Pad numbers with leading zeros
  const pad = (num: number) => {
    return num.toString().padStart(2, '0');
  };
  
  return (
    <div className={`rounded-xl p-3 flex items-center space-x-2 ${
      isExpired ? 'bg-slate-100 text-slate-600' : 
      isActive ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700'
    }`}>
      <Clock className={`h-4 w-4 ${
        isExpired ? 'text-slate-500' : 
        isActive ? 'text-red-500' : 'text-blue-500'
      }`} />
      
      {isExpired ? (
        <span className="text-xs font-medium">
          {isActive ? 'Election has ended' : 'Election has started'}
        </span>
      ) : (
        <div className="text-xs font-medium">
          {isActive ? 'Ends in: ' : 'Starts in: '}
          {timeLeft.days > 0 && <span>{timeLeft.days}d </span>}
          <span>{pad(timeLeft.hours)}:{pad(timeLeft.minutes)}:{pad(timeLeft.seconds)}</span>
        </div>
      )}
    </div>
  );
};

export default CountdownTimer;
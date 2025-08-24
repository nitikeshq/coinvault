import React, { useState, useEffect } from 'react';
import { Clock, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface AuctionTimerProps {
  endDate: Date | string;
  onExpiry?: () => void;
  variant?: 'inline' | 'card' | 'detailed';
}

export const AuctionTimer: React.FC<AuctionTimerProps> = ({ 
  endDate, 
  onExpiry, 
  variant = 'inline' 
}) => {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    expired: boolean;
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0, expired: false });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const auctionEnd = new Date(endDate).getTime();
      const difference = auctionEnd - now;

      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, expired: true });
        if (onExpiry) onExpiry();
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds, expired: false });
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [endDate, onExpiry]);

  if (timeLeft.expired) {
    return (
      <div className="flex items-center gap-1 text-red-600">
        <AlertCircle className="h-4 w-4" />
        <Badge variant="destructive" className="text-xs">ENDED</Badge>
      </div>
    );
  }

  const formatTime = () => {
    if (timeLeft.days > 0) {
      return `${timeLeft.days}d ${timeLeft.hours}h ${timeLeft.minutes}m`;
    } else if (timeLeft.hours > 0) {
      return `${timeLeft.hours}h ${timeLeft.minutes}m ${timeLeft.seconds}s`;
    } else {
      return `${timeLeft.minutes}m ${timeLeft.seconds}s`;
    }
  };

  const getVariantClass = () => {
    const isUrgent = timeLeft.days === 0 && timeLeft.hours < 1;
    
    if (variant === 'card') {
      return (
        <div className={`p-3 rounded-lg border ${isUrgent ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'}`}>
          <div className="flex items-center gap-2">
            <Clock className={`h-4 w-4 ${isUrgent ? 'text-red-600' : 'text-blue-600'}`} />
            <span className={`font-medium ${isUrgent ? 'text-red-700' : 'text-blue-700'}`}>
              Auction ends in
            </span>
          </div>
          <div className={`text-lg font-bold mt-1 ${isUrgent ? 'text-red-800' : 'text-blue-800'}`}>
            {formatTime()}
          </div>
        </div>
      );
    }

    if (variant === 'detailed') {
      return (
        <div className={`p-4 rounded-lg ${isUrgent ? 'bg-red-50' : 'bg-blue-50'}`}>
          <div className="flex items-center gap-2 mb-3">
            <Clock className={`h-5 w-5 ${isUrgent ? 'text-red-600' : 'text-blue-600'}`} />
            <span className={`font-semibold ${isUrgent ? 'text-red-700' : 'text-blue-700'}`}>
              Time Remaining
            </span>
          </div>
          <div className="grid grid-cols-4 gap-2 text-center">
            <div className={`p-2 rounded ${isUrgent ? 'bg-red-100' : 'bg-blue-100'}`}>
              <div className={`text-lg font-bold ${isUrgent ? 'text-red-800' : 'text-blue-800'}`}>
                {timeLeft.days}
              </div>
              <div className={`text-xs ${isUrgent ? 'text-red-600' : 'text-blue-600'}`}>
                Days
              </div>
            </div>
            <div className={`p-2 rounded ${isUrgent ? 'bg-red-100' : 'bg-blue-100'}`}>
              <div className={`text-lg font-bold ${isUrgent ? 'text-red-800' : 'text-blue-800'}`}>
                {timeLeft.hours}
              </div>
              <div className={`text-xs ${isUrgent ? 'text-red-600' : 'text-blue-600'}`}>
                Hours
              </div>
            </div>
            <div className={`p-2 rounded ${isUrgent ? 'bg-red-100' : 'bg-blue-100'}`}>
              <div className={`text-lg font-bold ${isUrgent ? 'text-red-800' : 'text-blue-800'}`}>
                {timeLeft.minutes}
              </div>
              <div className={`text-xs ${isUrgent ? 'text-red-600' : 'text-blue-600'}`}>
                Minutes
              </div>
            </div>
            <div className={`p-2 rounded ${isUrgent ? 'bg-red-100' : 'bg-blue-100'}`}>
              <div className={`text-lg font-bold ${isUrgent ? 'text-red-800' : 'text-blue-800'}`}>
                {timeLeft.seconds}
              </div>
              <div className={`text-xs ${isUrgent ? 'text-red-600' : 'text-blue-600'}`}>
                Seconds
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Default inline variant
    return (
      <div className="flex items-center gap-1">
        <Clock className={`h-4 w-4 ${isUrgent ? 'text-red-600' : 'text-blue-600'}`} />
        <Badge variant={isUrgent ? "destructive" : "secondary"} className="text-xs">
          {formatTime()}
        </Badge>
      </div>
    );
  };

  return getVariantClass();
};

export default AuctionTimer;
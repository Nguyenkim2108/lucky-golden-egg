import { useState, useEffect } from "react";

interface CountdownTimerProps {
  deadline: number;
}

// Function to calculate time remaining
const calculateTimeRemaining = (deadline: number) => {
  const now = new Date().getTime();
  const distance = deadline - now;
  
  // Calculate time units
  const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((distance % (1000 * 60)) / 1000);
  
  return {
    hours,
    minutes,
    seconds,
    distance,
  };
};

const CountdownTimer = ({ deadline }: CountdownTimerProps) => {
  const [timeRemaining, setTimeRemaining] = useState(calculateTimeRemaining(deadline));
  
  useEffect(() => {
    const timer = setInterval(() => {
      const remaining = calculateTimeRemaining(deadline);
      setTimeRemaining(remaining);
      
      // Clear interval when time is up
      if (remaining.distance <= 0) {
        clearInterval(timer);
      }
    }, 1000);
    
    // Clean up
    return () => clearInterval(timer);
  }, [deadline]);
  
  // Format numbers to always have two digits
  const formatNumber = (num: number) => num.toString().padStart(2, '0');
  
  return (
    <div className="flex items-center justify-center mb-4">
      <div className="flex items-center space-x-1 bg-black/50 px-3 py-1.5 rounded-lg">
        <span className="text-[hsl(var(--gold-primary))] text-xs mr-1">Thời gian còn lại</span>
        <div className="w-8 h-8 flex items-center justify-center bg-black/70 rounded">
          <span className="text-white text-sm font-bold">
            {formatNumber(timeRemaining.hours)}
          </span>
        </div>
        <span className="text-white animate-pulse">:</span>
        <div className="w-8 h-8 flex items-center justify-center bg-black/70 rounded">
          <span className="text-white text-sm font-bold">
            {formatNumber(timeRemaining.minutes)}
          </span>
        </div>
        <span className="text-white animate-pulse">:</span>
        <div className="w-8 h-8 flex items-center justify-center bg-black/70 rounded">
          <span className="text-white text-sm font-bold">
            {formatNumber(timeRemaining.seconds)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default CountdownTimer;

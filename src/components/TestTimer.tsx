import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Clock } from 'lucide-react';

interface TestTimerProps {
  timeLimit: number; // in seconds
  onTimeUp: () => void;
  isPaused?: boolean;
}

export function TestTimer({ timeLimit, onTimeUp, isPaused = false }: TestTimerProps) {
  const [timeLeft, setTimeLeft] = useState(timeLimit);
  
  useEffect(() => {
    setTimeLeft(timeLimit);
  }, [timeLimit]);

  useEffect(() => {
    if (isPaused || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, onTimeUp, isPaused, timeLimit]);

  const percentage = (timeLeft / timeLimit) * 100;
  const isLow = timeLeft <= 10;
  const isCritical = timeLeft <= 5;

  return (
    <div className="flex items-center gap-3">
      <div className="relative w-16 h-16">
        {/* Background circle */}
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="32"
            cy="32"
            r="28"
            stroke="currentColor"
            strokeWidth="4"
            fill="none"
            className="text-muted"
          />
          {/* Progress circle */}
          <motion.circle
            cx="32"
            cy="32"
            r="28"
            stroke="currentColor"
            strokeWidth="4"
            fill="none"
            strokeLinecap="round"
            className={isCritical ? 'text-destructive' : isLow ? 'text-warning' : 'text-primary'}
            initial={{ strokeDasharray: "176", strokeDashoffset: "0" }}
            animate={{ strokeDashoffset: 176 - (176 * percentage) / 100 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </svg>
        {/* Timer text */}
        <motion.div 
          className={`absolute inset-0 flex items-center justify-center font-display font-bold text-lg ${
            isCritical ? 'text-destructive' : isLow ? 'text-warning' : 'text-foreground'
          }`}
          animate={isCritical ? { scale: [1, 1.1, 1] } : {}}
          transition={{ duration: 0.5, repeat: isCritical ? Infinity : 0 }}
        >
          {timeLeft}
        </motion.div>
      </div>
      <div className="flex flex-col">
        <div className="flex items-center gap-1 text-muted-foreground text-sm">
          <Clock className="w-3.5 h-3.5" />
          <span>seconds left</span>
        </div>
        {isCritical && (
          <motion.span 
            className="text-destructive text-xs font-medium"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            Hurry up!
          </motion.span>
        )}
      </div>
    </div>
  );
}

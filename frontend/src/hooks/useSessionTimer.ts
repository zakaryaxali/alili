import { useState, useEffect, useRef } from 'react';

interface UseSessionTimerParams {
  initialTime: number;
  isPaused: boolean;
  onTimeUp: () => void;
}

export function useSessionTimer({
  initialTime,
  isPaused,
  onTimeUp,
}: UseSessionTimerParams) {
  const [timeRemaining, setTimeRemaining] = useState(initialTime);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!isPaused) {
      timerRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            onTimeUp();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isPaused, onTimeUp]);

  const resetTimer = (newTime: number) => {
    setTimeRemaining(newTime);
  };

  return { timeRemaining, setTimeRemaining, resetTimer };
}

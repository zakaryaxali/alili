import { useState, useEffect, useRef, useCallback } from 'react';

interface UseSessionTimerParams {
  initialTime: number;
  isPaused: boolean;
  isActive: boolean; // Whether the timer should be running (e.g., not during transitions)
  onTimeUp: () => void;
}

export function useSessionTimer({
  initialTime,
  isPaused,
  isActive,
  onTimeUp,
}: UseSessionTimerParams) {
  const [timeRemaining, setTimeRemaining] = useState(initialTime);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onTimeUpRef = useRef(onTimeUp);

  // Keep the callback ref updated
  useEffect(() => {
    onTimeUpRef.current = onTimeUp;
  }, [onTimeUp]);

  useEffect(() => {
    if (!isPaused && isActive) {
      timerRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            onTimeUpRef.current();
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
  }, [isPaused, isActive]);

  const resetTimer = useCallback((newTime: number) => {
    setTimeRemaining(newTime);
  }, []);

  return { timeRemaining, resetTimer };
}

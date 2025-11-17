import { useCallback, useEffect, useRef, useState } from "react";

export function useCountdownTimer(
  initialSeconds: number,
  onComplete?: () => void,
) {
  const [countdown, setCountdown] = useState(initialSeconds);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startTimer = useCallback(() => {
    // Stop any existing timer first
    stopTimer();

    // Reset countdown to initial value
    setCountdown(initialSeconds);

    // Start new timer
    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          stopTimer();

          if (onComplete) {
            onComplete();
          }

          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [initialSeconds, onComplete, stopTimer]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  return {
    countdown,
    isActive: timerRef.current !== null,
    startTimer,
    stopTimer,
  };
}

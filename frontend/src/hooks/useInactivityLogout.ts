import { useEffect, useRef, useState } from 'react';

interface UseInactivityLogoutOptions {
  timeoutMs?: number; // Default 15 minutes (900,000 ms)
  onLogout: () => void;
  enabled?: boolean;
}

export const useInactivityLogout = ({
  timeoutMs = 15 * 60 * 1000,
  onLogout,
  enabled = true,
}: UseInactivityLogoutOptions) => {
  const [isWarningActive, setIsWarningActive] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const resetTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    setIsWarningActive(false);

    if (!enabled) return;

    timerRef.current = setTimeout(() => {
      setIsWarningActive(true);
      onLogout();
    }, timeoutMs);
  };

  useEffect(() => {
    if (!enabled) return;

    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    const handleActivity = () => resetTimer();

    events.forEach((event) => window.addEventListener(event, handleActivity));
    resetTimer();

    return () => {
      events.forEach((event) => window.removeEventListener(event, handleActivity));
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [enabled, timeoutMs]);

  return { isWarningActive, resetTimer };
};

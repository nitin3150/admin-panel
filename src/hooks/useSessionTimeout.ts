import { useEffect, useRef, useCallback } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/hooks/use-toast';

export const useSessionTimeout = (timeoutMinutes: number = 30) => {
  const { logout } = useAuthStore();
  const { toast } = useToast();
  const timeoutRef = useRef<NodeJS.Timeout>();
  const lastResetRef = useRef<number>(0);

  const resetTimer = useCallback(() => {
    // Throttle: only reset if 30+ seconds since last reset
    const now = Date.now();
    if (now - lastResetRef.current < 30000) return;
    lastResetRef.current = now;

    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      logout();
      toast({
        title: "Session Expired",
        description: "Please login again",
        variant: "destructive"
      });
    }, timeoutMinutes * 60 * 1000);
  }, [timeoutMinutes, logout, toast]);

  useEffect(() => {
    const events = ['mousemove', 'keypress', 'click', 'scroll'] as const;
    events.forEach(event => window.addEventListener(event, resetTimer));
    resetTimer();

    return () => {
      clearTimeout(timeoutRef.current);
      events.forEach(event => window.removeEventListener(event, resetTimer));
    };
  }, [resetTimer]);
};

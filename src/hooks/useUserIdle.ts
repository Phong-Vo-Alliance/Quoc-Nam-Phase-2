import { useEffect, useRef, useState } from "react";

const ACTIVITY_EVENTS = [
  "mousedown",
  "mousemove",
  "keydown",
  "touchstart",
  "scroll",
  "wheel",
] as const;

const RESET_THROTTLE_MS = 1000;

interface UseUserIdleOptions {
  idleMs: number;
  enabled?: boolean;
}

export function useUserIdle({
  idleMs,
  enabled = true,
}: UseUserIdleOptions): boolean {
  const [isIdle, setIsIdle] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastResetRef = useRef(0);

  useEffect(() => {
    if (!enabled || typeof window === "undefined") {
      setIsIdle(false);
      return;
    }

    const armTimer = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setIsIdle(true), idleMs);
    };

    const handleActivity = () => {
      setIsIdle((prev) => (prev ? false : prev));
      const now = Date.now();
      if (now - lastResetRef.current < RESET_THROTTLE_MS) return;
      lastResetRef.current = now;
      armTimer();
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (timerRef.current) clearTimeout(timerRef.current);
        return;
      }
      lastResetRef.current = Date.now();
      setIsIdle(false);
      armTimer();
    };

    lastResetRef.current = Date.now();
    armTimer();

    ACTIVITY_EVENTS.forEach((evt) =>
      window.addEventListener(evt, handleActivity, { passive: true }),
    );
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      ACTIVITY_EVENTS.forEach((evt) =>
        window.removeEventListener(evt, handleActivity),
      );
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [enabled, idleMs]);

  return isIdle;
}

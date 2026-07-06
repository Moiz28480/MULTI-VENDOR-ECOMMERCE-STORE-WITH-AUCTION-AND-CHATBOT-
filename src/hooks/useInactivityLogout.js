import { useEffect, useRef } from 'react';
import { account } from '../lib/appwrite.js';

const DEFAULT_ACTIVITY_EVENTS = ['mousedown', 'keydown', 'scroll', 'touchstart', 'mousemove'];

const useInactivityLogout = (timeoutInMinutes, enabled = true) => {
  const timeoutRef = useRef(null);

  useEffect(() => {
    if (!enabled) {
      return undefined;
    }

    const timeoutInMilliseconds = Number(timeoutInMinutes) * 60 * 1000;

    if (!Number.isFinite(timeoutInMilliseconds) || timeoutInMilliseconds <= 0) {
      return undefined;
    }

    const clearInactivityTimer = () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };

    const performLogout = async () => {
      try {
        await account.deleteSession('current');
      } catch (error) {
        // Ignore session deletion errors and still send the user to login.
      } finally {
        window.location.assign('/login');
      }
    };

    const resetInactivityTimer = () => {
      clearInactivityTimer();
      timeoutRef.current = window.setTimeout(performLogout, timeoutInMilliseconds);
    };

    DEFAULT_ACTIVITY_EVENTS.forEach((eventName) => {
      window.addEventListener(eventName, resetInactivityTimer, { passive: true });
    });

    resetInactivityTimer();

    return () => {
      clearInactivityTimer();

      DEFAULT_ACTIVITY_EVENTS.forEach((eventName) => {
        window.removeEventListener(eventName, resetInactivityTimer);
      });
    };
  }, [enabled, timeoutInMinutes]);
};

export default useInactivityLogout;
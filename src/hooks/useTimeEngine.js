/**
 * src/hooks/useTimeEngine.js
 * 
 * Purpose: Provide a shared, aligned time source that emits timezone-adjusted time for all clock consumers.
 * Key responsibility and main functionality: Tick precisely on second boundaries and expose both epoch ms and timezone Date.
 * 
 * Changelog:
 * v1.1.0 - 2026-01-07 - Added visibility-aware ticking with background throttling, 10-minute stop, and resume token for fast snapback.
 * v1.0.0 - 2026-01-07 - Initial implementation with aligned ticks and timezone conversion.
 */

import { useEffect, useRef, useState } from 'react';

const FOREGROUND_INTERVAL_MS = 1000;
const BACKGROUND_INTERVAL_MS = 15000;
const INACTIVITY_STOP_MS = 10 * 60 * 1000;

const createTimezoneDate = (timezone) => new Date(new Date().toLocaleString('en-US', { timeZone: timezone }));

export const useTimeEngine = (timezone) => {
  const [nowEpochMs, setNowEpochMs] = useState(() => Date.now());
  const [nowTime, setNowTime] = useState(() => createTimezoneDate(timezone));
  const [resumeToken, setResumeToken] = useState(0);
  const hiddenAtRef = useRef(null);
  const stoppedRef = useRef(false);

  useEffect(() => {
    let foregroundTimeoutId;
    let foregroundIntervalId;
    let backgroundIntervalId;
    let inactivityTimeoutId;

    const tick = () => {
      const epoch = Date.now();
      setNowEpochMs(epoch);
      setNowTime(createTimezoneDate(timezone));
    };

    const clearForeground = () => {
      if (foregroundTimeoutId) {
        clearTimeout(foregroundTimeoutId);
        foregroundTimeoutId = null;
      }
      if (foregroundIntervalId) {
        clearInterval(foregroundIntervalId);
        foregroundIntervalId = null;
      }
    };

    const clearBackground = () => {
      if (backgroundIntervalId) {
        clearInterval(backgroundIntervalId);
        backgroundIntervalId = null;
      }
    };

    const startForegroundTicker = () => {
      stoppedRef.current = false;
      clearBackground();
      clearForeground();

      tick();

      const now = Date.now();
      const delay = FOREGROUND_INTERVAL_MS - (now % FOREGROUND_INTERVAL_MS);
      foregroundTimeoutId = setTimeout(() => {
        tick();
        foregroundIntervalId = setInterval(tick, FOREGROUND_INTERVAL_MS);
      }, delay);
    };

    const startBackgroundTicker = () => {
      stoppedRef.current = false;
      clearForeground();
      clearBackground();
      tick();
      backgroundIntervalId = setInterval(tick, BACKGROUND_INTERVAL_MS);
    };

    const stopAllTickers = () => {
      clearForeground();
      clearBackground();
      stoppedRef.current = true;
    };

    const clearInactivityTimer = () => {
      if (inactivityTimeoutId) {
        clearTimeout(inactivityTimeoutId);
        inactivityTimeoutId = null;
      }
    };

    const handleVisibilityChange = () => {
      if (typeof document === 'undefined') return;

      if (document.visibilityState === 'hidden') {
        hiddenAtRef.current = Date.now();
        startBackgroundTicker();

        clearInactivityTimer();
        inactivityTimeoutId = setTimeout(() => {
          stopAllTickers();
        }, INACTIVITY_STOP_MS);
      } else {
        const wasStopped = stoppedRef.current;
        const wasHidden = Boolean(hiddenAtRef.current);
        hiddenAtRef.current = null;

        clearInactivityTimer();
        stopAllTickers();
        startForegroundTicker();

        if (wasStopped || wasHidden) {
          setResumeToken((prev) => prev + 1);
        }
      }
    };

    startForegroundTicker();

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibilityChange);
    }

    return () => {
      stopAllTickers();
      clearInactivityTimer();
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      }
    };
  }, [timezone]);

  return { nowEpochMs, nowTime, resumeToken };
};

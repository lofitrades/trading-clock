/**
 * src/hooks/useClock.js
 * 
 * Purpose: Calculate active session metadata for the market clock using a timezone-aware time source.
 * Key responsibility and main functionality: Derive active/next sessions and countdowns from a provided or internal clock tick.
 * 
 * Changelog:
 * v1.1.1 - 2026-02-10 - Rename Market Clock branding in header copy.
 * v1.1.0 - 2026-01-07 - Added optional external time engine and aligned fallback tick to second boundaries for tighter sync.
 * v1.0.0 - 2025-09-15 - Initial implementation
 */

import { useState, useEffect, useMemo } from 'react';

export const useClock = (timezone, sessions, timeEngine = null) => {
  const getTimezoneTime = () => new Date(new Date().toLocaleString('en-US', { timeZone: timezone }));

  const [currentTime, setCurrentTime] = useState(() => (timeEngine?.nowTime ? new Date(timeEngine.nowTime) : getTimezoneTime()));

  const calculateSessionTimes = () => {
    const now = currentTime;
    let activeZones = [];
    let upcomingZones = [];

    sessions.forEach((kz) => {
      if (!kz.startNY || !kz.endNY) return;
      const [sHour, sMin] = kz.startNY.split(':').map(Number);
      const [eHour, eMin] = kz.endNY.split(':').map(Number);

      let startDate = new Date(now);
      startDate.setHours(sHour, sMin, 0, 0);
      let endDate = new Date(now);
      endDate.setHours(eHour, eMin, 0, 0);

      if (endDate <= startDate) {
        endDate.setDate(endDate.getDate() + 1);
      }

      if (now >= startDate && now < endDate) {
        activeZones.push({ session: kz, startDate, endDate });
      } else {
        if (now >= startDate) {
          startDate.setDate(startDate.getDate() + 1);
        }
        upcomingZones.push({ session: kz, startDate });
      }
    });

    activeZones.sort((a, b) => (now - a.startDate) - (now - b.startDate));
    upcomingZones.sort((a, b) => a.startDate - b.startDate);

    const activeSession = activeZones.length > 0 ? activeZones[0].session : null;
    const timeToEnd = activeZones.length > 0 ? Math.floor((activeZones[0].endDate - now) / 1000) : null;
    const nextSession = upcomingZones.length > 0 ? upcomingZones[0].session : null;
    const timeToStart = upcomingZones.length > 0 ? Math.floor((upcomingZones[0].startDate - now) / 1000) : null;

    return { activeSession, timeToEnd, nextSession, timeToStart };
  };

  const { activeSession, timeToEnd, nextSession, timeToStart } = useMemo(() => calculateSessionTimes(), [currentTime, sessions]);

  useEffect(() => {
    if (timeEngine?.nowTime) {
      setCurrentTime(new Date(timeEngine.nowTime));
    }
  }, [timeEngine?.nowEpochMs, timezone]);

  useEffect(() => {
    if (timeEngine) return undefined;

    let timeoutId;
    let intervalId;

    const tick = () => {
      setCurrentTime(getTimezoneTime());
    };

    tick();

    const startAlignedInterval = () => {
      const now = Date.now();
      const delay = 1000 - (now % 1000);
      timeoutId = setTimeout(() => {
        tick();
        intervalId = setInterval(tick, 1000);
      }, delay);
    };

    startAlignedInterval();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (intervalId) clearInterval(intervalId);
    };
  }, [timezone, timeEngine]);

  return { currentTime, activeSession, timeToEnd, nextSession, timeToStart };
};

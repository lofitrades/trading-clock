// src/hooks/useClock.js
import { useState, useEffect, useMemo } from 'react';

export const useClock = (timezone, sessions) => {
  const getTimezoneTime = () => {
    const now = new Date();
    return new Date(now.toLocaleString('en-US', { timeZone: timezone }));
  };

  const [currentTime, setCurrentTime] = useState(getTimezoneTime());

  const calculateSessionTimes = () => {
    const now = currentTime;
    let activeZones = [];
    let upcomingZones = [];

    sessions.forEach(kz => {
      if (!kz.startNY || !kz.endNY) return;
      const [sHour, sMin] = kz.startNY.split(':').map(Number);
      const [eHour, eMin] = kz.endNY.split(':').map(Number);

      // Create Date objects for start and end times (using today's date)
      let startDate = new Date(now);
      startDate.setHours(sHour, sMin, 0, 0);
      let endDate = new Date(now);
      endDate.setHours(eHour, eMin, 0, 0);

      // Adjust for sessions that span midnight
      if (endDate <= startDate) {
        endDate.setDate(endDate.getDate() + 1);
      }

      if (now >= startDate && now < endDate) {
        activeZones.push({ session: kz, startDate, endDate });
      } else {
        // If start time already passed, consider the next occurrence (tomorrow)
        if (now >= startDate) {
          startDate.setDate(startDate.getDate() + 1);
        }
        upcomingZones.push({ session: kz, startDate });
      }
    });

    // Sort active zones: the one that started most recently (least time ago) is “on top.”
    activeZones.sort((a, b) => (now - a.startDate) - (now - b.startDate));
    // Sort upcoming zones by soonest start time
    upcomingZones.sort((a, b) => a.startDate - b.startDate);

    const activeSession = activeZones.length > 0 ? activeZones[0].session : null;
    const timeToEnd = activeZones.length > 0 ? Math.floor((activeZones[0].endDate - now) / 1000) : null;
    const nextSession = upcomingZones.length > 0 ? upcomingZones[0].session : null;
    const timeToStart = upcomingZones.length > 0 ? Math.floor((upcomingZones[0].startDate - now) / 1000) : null;

    return { activeSession, timeToEnd, nextSession, timeToStart };
  };

  const { activeSession, timeToEnd, nextSession, timeToStart } = useMemo(
    () => calculateSessionTimes(),
    [currentTime, sessions]
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(getTimezoneTime());
    }, 1000);

    return () => clearInterval(timer);
  }, [timezone]);

  return { currentTime, activeSession, timeToEnd, nextSession, timeToStart };
};

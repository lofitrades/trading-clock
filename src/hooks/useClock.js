import { useState, useEffect, useMemo } from 'react';

export const useClock = (timezone, killzones) => {
  const [currentTime, setCurrentTime] = useState(() => new Date());
  
  const activeKillzone = useMemo(() => {
    const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
    
    return killzones.find(kz => {
      if (!kz.startNY || !kz.endNY) return false;
      
      const [startHour, startMinute] = kz.startNY.split(':').map(Number);
      const [endHour, endMinute] = kz.endNY.split(':').map(Number);
      const start = startHour * 60 + startMinute;
      const end = endHour * 60 + endMinute;

      return start <= end 
        ? currentMinutes >= start && currentMinutes < end
        : currentMinutes >= start || currentMinutes < end;
    }) || null;
  }, [currentTime, killzones]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date(new Date().toLocaleString('en-US', { timeZone: timezone })));
    }, 1000);

    return () => clearInterval(timer);
  }, [timezone]);

  return { currentTime, activeKillzone };
};
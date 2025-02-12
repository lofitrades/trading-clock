// src/hooks/useSettings.js
import { useState, useEffect } from 'react';

const defaultKillzones = [
  { name: "NY AM", startNY: "07:00", endNY: "11:00", color: "#A8D8B9" },
  { name: "NY PM", startNY: "13:30", endNY: "16:00", color: "#A7C7E7" },
  { name: "Market Closed", startNY: "17:00", endNY: "18:00", color: "#F7C2A3" },
  { name: "Asia", startNY: "20:00", endNY: "00:00", color: "#F8C8D1" },
  { name: "London", startNY: "02:00", endNY: "05:00", color: "#D1B2E1" },
  { name: "", startNY: "", endNY: "", color: "#F9E89D" },
  { name: "", startNY: "", endNY: "", color: "#F6A1A1" },
  { name: "", startNY: "", endNY: "", color: "#D3D3D3" },
];

export function useSettings() {
  const [clockSize, setClockSize] = useState(375);
  const [killzones, setKillzones] = useState([...defaultKillzones]);
  const [selectedTimezone, setSelectedTimezone] = useState('America/New_York');
  const [backgroundColor, setBackgroundColor] = useState("#ffffff");
  const [backgroundBasedOnKillzone, setBackgroundBasedOnKillzone] = useState(false);
  const [showTimeToEnd, setShowTimeToEnd] = useState(true);
  const [showTimeToStart, setShowTimeToStart] = useState(true);

  useEffect(() => {
    const savedSize = localStorage.getItem('clockSize');
    const savedKillzones = localStorage.getItem('killzones');
    const savedTimezone = localStorage.getItem('selectedTimezone');
    const savedBackgroundColor = localStorage.getItem('backgroundColor');
    const savedBackgroundBasedOnKillzone = localStorage.getItem('backgroundBasedOnKillzone');
    const savedShowTimeToEnd = localStorage.getItem('showTimeToEnd');
    const savedShowTimeToStart = localStorage.getItem('showTimeToStart');

    if (savedSize) setClockSize(parseInt(savedSize));
    if (savedKillzones) setKillzones(JSON.parse(savedKillzones));
    if (savedTimezone) setSelectedTimezone(savedTimezone);
    if (savedBackgroundColor) setBackgroundColor(savedBackgroundColor);
    if (savedBackgroundBasedOnKillzone !== null)
      setBackgroundBasedOnKillzone(savedBackgroundBasedOnKillzone === 'true');
    if (savedShowTimeToEnd !== null)
      setShowTimeToEnd(savedShowTimeToEnd === 'true');
    if (savedShowTimeToStart !== null)
      setShowTimeToStart(savedShowTimeToStart === 'true');
  }, []);

  const updateClockSize = (size) => {
    setClockSize(size);
    localStorage.setItem('clockSize', size);
  };

  const updateKillzones = (newKillzones) => {
    setKillzones([...newKillzones]);
    localStorage.setItem('killzones', JSON.stringify(newKillzones));
  };

  const updateBackgroundColor = (color) => {
    setBackgroundColor(color);
    localStorage.setItem('backgroundColor', color);
  };

  const toggleBackgroundBasedOnKillzone = () => {
    setBackgroundBasedOnKillzone(prev => {
      localStorage.setItem('backgroundBasedOnKillzone', !prev);
      return !prev;
    });
  };

  const toggleShowTimeToEnd = () => {
    setShowTimeToEnd(prev => {
      localStorage.setItem('showTimeToEnd', !prev);
      return !prev;
    });
  };

  const toggleShowTimeToStart = () => {
    setShowTimeToStart(prev => {
      localStorage.setItem('showTimeToStart', !prev);
      return !prev;
    });
  };

  return {
    clockSize,
    killzones,
    selectedTimezone,
    updateClockSize,
    updateKillzones,
    setSelectedTimezone,
    backgroundColor,
    updateBackgroundColor,
    backgroundBasedOnKillzone,
    toggleBackgroundBasedOnKillzone,
    showTimeToEnd,
    showTimeToStart,
    toggleShowTimeToEnd,
    toggleShowTimeToStart,
  };
}

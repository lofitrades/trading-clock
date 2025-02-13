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
  // User-selected background color remains independent.
  const [backgroundColor, setBackgroundColor] = useState("#ffffff");
  const [backgroundBasedOnKillzone, setBackgroundBasedOnKillzone] = useState(false);
  // New toggles for the three main clock elements
  const [showHandClock, setShowHandClock] = useState(true);
  const [showDigitalClock, setShowDigitalClock] = useState(true);
  const [showKillzoneLabel, setShowKillzoneLabel] = useState(true);
  // Killzone countdown toggles
  const [showTimeToEnd, setShowTimeToEnd] = useState(true);
  const [showTimeToStart, setShowTimeToStart] = useState(true);

  useEffect(() => {
    const savedSize = localStorage.getItem('clockSize');
    const savedKillzones = localStorage.getItem('killzones');
    const savedTimezone = localStorage.getItem('selectedTimezone');
    const savedBackgroundColor = localStorage.getItem('backgroundColor');
    const savedBackgroundBasedOnKillzone = localStorage.getItem('backgroundBasedOnKillzone');
    const savedShowHandClock = localStorage.getItem('showHandClock');
    const savedShowDigitalClock = localStorage.getItem('showDigitalClock');
    const savedShowKillzoneLabel = localStorage.getItem('showKillzoneLabel');
    const savedShowTimeToEnd = localStorage.getItem('showTimeToEnd');
    const savedShowTimeToStart = localStorage.getItem('showTimeToStart');

    if (savedSize) setClockSize(parseInt(savedSize));
    if (savedKillzones) setKillzones(JSON.parse(savedKillzones));
    if (savedTimezone) setSelectedTimezone(savedTimezone);
    if (savedBackgroundColor) setBackgroundColor(savedBackgroundColor);
    if (savedBackgroundBasedOnKillzone !== null)
      setBackgroundBasedOnKillzone(savedBackgroundBasedOnKillzone === 'true');
    if (savedShowHandClock !== null)
      setShowHandClock(savedShowHandClock === 'true');
    if (savedShowDigitalClock !== null)
      setShowDigitalClock(savedShowDigitalClock === 'true');
    if (savedShowKillzoneLabel !== null)
      setShowKillzoneLabel(savedShowKillzoneLabel === 'true');
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

  // Toggle functions for the three main elements with at-least-one-enabled check
  const canToggleOff = (currentValue, other1, other2) => {
    if (currentValue && !other1 && !other2) {
      return false;
    }
    return true;
  };

  const toggleShowHandClock = () => {
    if (!showHandClock) {
      setShowHandClock(true);
      localStorage.setItem('showHandClock', true);
      return true;
    }
    if (!canToggleOff(showHandClock, showDigitalClock, showKillzoneLabel)) {
      return false;
    }
    setShowHandClock(false);
    localStorage.setItem('showHandClock', false);
    return true;
  };

  const toggleShowDigitalClock = () => {
    if (!showDigitalClock) {
      setShowDigitalClock(true);
      localStorage.setItem('showDigitalClock', true);
      return true;
    }
    if (!canToggleOff(showDigitalClock, showHandClock, showKillzoneLabel)) {
      return false;
    }
    setShowDigitalClock(false);
    localStorage.setItem('showDigitalClock', false);
    return true;
  };

  const toggleShowKillzoneLabel = () => {
    if (!showKillzoneLabel) {
      setShowKillzoneLabel(true);
      localStorage.setItem('showKillzoneLabel', true);
      return true;
    }
    if (!canToggleOff(showKillzoneLabel, showHandClock, showDigitalClock)) {
      return false;
    }
    setShowKillzoneLabel(false);
    localStorage.setItem('showKillzoneLabel', false);
    return true;
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
    // New toggles for main elements:
    showHandClock,
    showDigitalClock,
    showKillzoneLabel,
    toggleShowHandClock,
    toggleShowDigitalClock,
    toggleShowKillzoneLabel,
    // Killzone countdown toggles:
    showTimeToEnd,
    showTimeToStart,
    toggleShowTimeToEnd,
    toggleShowTimeToStart,
  };
}

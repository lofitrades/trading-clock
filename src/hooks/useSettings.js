/* src/hooks/useSettings.js */
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

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
  const { user } = useAuth();

  const [clockSize, setClockSize] = useState(375);
  const [killzones, setKillzones] = useState([...defaultKillzones]);
  const [selectedTimezone, setSelectedTimezone] = useState('America/New_York');
  const [backgroundColor, setBackgroundColor] = useState("#F9F9F9");
  const [backgroundBasedOnKillzone, setBackgroundBasedOnKillzone] = useState(false);
  const [showHandClock, setShowHandClock] = useState(true);
  const [showDigitalClock, setShowDigitalClock] = useState(true);
  const [showKillzoneLabel, setShowKillzoneLabel] = useState(true);
  const [showTimeToEnd, setShowTimeToEnd] = useState(true);
  const [showTimeToStart, setShowTimeToStart] = useState(true);

  useEffect(() => {
    // Remove reliance on localStorage for default settings.
    // When the user logs out, localStorage is cleared.
    // Here we load settings from localStorage only if available.
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
    if (savedShowHandClock !== null) setShowHandClock(savedShowHandClock === 'true');
    if (savedShowDigitalClock !== null) setShowDigitalClock(savedShowDigitalClock === 'true');
    if (savedShowKillzoneLabel !== null) setShowKillzoneLabel(savedShowKillzoneLabel === 'true');
    if (savedShowTimeToEnd !== null) setShowTimeToEnd(savedShowTimeToEnd === 'true');
    if (savedShowTimeToStart !== null) setShowTimeToStart(savedShowTimeToStart === 'true');
  }, []);

  useEffect(() => {
    async function loadUserSettings() {
      if (!user) return;
      const userRef = doc(db, 'users', user.uid);
      const snap = await getDoc(userRef);
      if (snap.exists()) {
        const data = snap.data();
        if (data.settings) {
          if (data.settings.clockSize) setClockSize(data.settings.clockSize);
          if (data.settings.killzones) setKillzones(data.settings.killzones);
          if (data.settings.selectedTimezone) setSelectedTimezone(data.settings.selectedTimezone);
          if (data.settings.backgroundColor) setBackgroundColor(data.settings.backgroundColor);
          if (data.settings.backgroundBasedOnKillzone !== undefined)
            setBackgroundBasedOnKillzone(data.settings.backgroundBasedOnKillzone);
          if (data.settings.showHandClock !== undefined) setShowHandClock(data.settings.showHandClock);
          if (data.settings.showDigitalClock !== undefined) setShowDigitalClock(data.settings.showDigitalClock);
          if (data.settings.showKillzoneLabel !== undefined) setShowKillzoneLabel(data.settings.showKillzoneLabel);
          if (data.settings.showTimeToEnd !== undefined) setShowTimeToEnd(data.settings.showTimeToEnd);
          if (data.settings.showTimeToStart !== undefined) setShowTimeToStart(data.settings.showTimeToStart);
        }
      } else {
        await setDoc(userRef, {
          email: user.email,
          createdAt: serverTimestamp(),
          settings: {
            clockSize,
            killzones,
            selectedTimezone,
            backgroundColor,
            backgroundBasedOnKillzone,
            showHandClock,
            showDigitalClock,
            showKillzoneLabel,
            showTimeToEnd,
            showTimeToStart,
          }
        });
      }
    }
    loadUserSettings();
  }, [user]);

  async function saveSettingsToFirestore(newSettings) {
    if (!user) return;
    const userRef = doc(db, 'users', user.uid);
    await setDoc(userRef, { settings: { ...newSettings } }, { merge: true });
  }

  const updateClockSize = (size) => {
    setClockSize(size);
    localStorage.setItem('clockSize', size);
    if (user) saveSettingsToFirestore({ clockSize: size });
  };

  const updateKillzones = (newKillzones) => {
    setKillzones([...newKillzones]);
    localStorage.setItem('killzones', JSON.stringify(newKillzones));
    if (user) saveSettingsToFirestore({ killzones: newKillzones });
  };

  const updateBackgroundColor = (color) => {
    setBackgroundColor(color);
    localStorage.setItem('backgroundColor', color);
    if (user) saveSettingsToFirestore({ backgroundColor: color });
  };

  const toggleBackgroundBasedOnKillzone = () => {
    setBackgroundBasedOnKillzone(prev => {
      const newValue = !prev;
      localStorage.setItem('backgroundBasedOnKillzone', newValue);
      if (user) saveSettingsToFirestore({ backgroundBasedOnKillzone: newValue });
      return newValue;
    });
  };

  const canToggleOff = (currentValue, other1, other2) => {
    if (currentValue && !other1 && !other2) return false;
    return true;
  };

  const toggleShowHandClock = () => {
    if (!showHandClock) {
      setShowHandClock(true);
      localStorage.setItem('showHandClock', true);
      if (user) saveSettingsToFirestore({ showHandClock: true });
      return true;
    }
    if (!canToggleOff(showHandClock, showDigitalClock, showKillzoneLabel)) return false;
    setShowHandClock(false);
    localStorage.setItem('showHandClock', false);
    if (user) saveSettingsToFirestore({ showHandClock: false });
    return true;
  };

  const toggleShowDigitalClock = () => {
    if (!showDigitalClock) {
      setShowDigitalClock(true);
      localStorage.setItem('showDigitalClock', true);
      if (user) saveSettingsToFirestore({ showDigitalClock: true });
      return true;
    }
    if (!canToggleOff(showDigitalClock, showHandClock, showKillzoneLabel)) return false;
    setShowDigitalClock(false);
    localStorage.setItem('showDigitalClock', false);
    if (user) saveSettingsToFirestore({ showDigitalClock: false });
    return true;
  };

  const toggleShowKillzoneLabel = () => {
    if (!showKillzoneLabel) {
      setShowKillzoneLabel(true);
      localStorage.setItem('showKillzoneLabel', true);
      if (user) saveSettingsToFirestore({ showKillzoneLabel: true });
      return true;
    }
    if (!canToggleOff(showKillzoneLabel, showHandClock, showDigitalClock)) return false;
    setShowKillzoneLabel(false);
    localStorage.setItem('showKillzoneLabel', false);
    if (user) saveSettingsToFirestore({ showKillzoneLabel: false });
    return true;
  };

  const toggleShowTimeToEnd = () => {
    setShowTimeToEnd(prev => {
      const newValue = !prev;
      localStorage.setItem('showTimeToEnd', newValue);
      if (user) saveSettingsToFirestore({ showTimeToEnd: newValue });
      return newValue;
    });
  };

  const toggleShowTimeToStart = () => {
    setShowTimeToStart(prev => {
      const newValue = !prev;
      localStorage.setItem('showTimeToStart', newValue);
      if (user) saveSettingsToFirestore({ showTimeToStart: newValue });
      return newValue;
    });
  };

  // Reset settings: clear localStorage and reinitialize to defaults
  const resetSettings = () => {
    localStorage.clear();
    setClockSize(375);
    setKillzones([...defaultKillzones]);
    setSelectedTimezone('America/New_York');
    setBackgroundColor("#F9F9F9");
    setBackgroundBasedOnKillzone(false);
    setShowHandClock(true);
    setShowDigitalClock(true);
    setShowKillzoneLabel(true);
    setShowTimeToEnd(true);
    setShowTimeToStart(true);
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
    showHandClock,
    showDigitalClock,
    showKillzoneLabel,
    toggleShowHandClock,
    toggleShowDigitalClock,
    toggleShowKillzoneLabel,
    showTimeToEnd,
    showTimeToStart,
    toggleShowTimeToEnd,
    toggleShowTimeToStart,
    resetSettings,
  };
}

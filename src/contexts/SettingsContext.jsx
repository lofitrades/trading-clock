/* src/contexts/SettingsContext.jsx */
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { db } from '../firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

const defaultSessions = [
  { name: "NY AM", startNY: "07:00", endNY: "11:00", color: "#A8D8B9" },
  { name: "NY PM", startNY: "13:30", endNY: "16:00", color: "#A7C7E7" },
  { name: "Market Closed", startNY: "17:00", endNY: "18:00", color: "#F7C2A3" },
  { name: "Asia", startNY: "20:00", endNY: "00:00", color: "#F8C8D1" },
  { name: "London", startNY: "02:00", endNY: "05:00", color: "#D1B2E1" },
  { name: "", startNY: "", endNY: "", color: "#F9E89D" },
  { name: "", startNY: "", endNY: "", color: "#F6A1A1" },
  { name: "", startNY: "", endNY: "", color: "#D3D3D3" },
];

const SettingsContext = createContext();

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}

export function SettingsProvider({ children }) {
  const { user } = useAuth();
  
  // Provider for settings with localStorage and Firestore sync
  const [isLoading, setIsLoading] = useState(true);
  const [clockStyle, setClockStyle] = useState('normal');
  const [canvasSize, setCanvasSize] = useState(75);
  const [clockSize, setClockSize] = useState(375);
  const [sessions, setSessions] = useState([...defaultSessions]);
  const [selectedTimezone, setSelectedTimezone] = useState('America/New_York');
  const [backgroundColor, setBackgroundColor] = useState("#F9F9F9");
  const [backgroundBasedOnSession, setBackgroundBasedOnSession] = useState(false);
  const [showHandClock, setShowHandClock] = useState(true);
  const [showDigitalClock, setShowDigitalClock] = useState(true);
  const [showSessionLabel, setShowSessionLabel] = useState(true);
  const [showTimeToEnd, setShowTimeToEnd] = useState(true);
  const [showTimeToStart, setShowTimeToStart] = useState(true);
  const [showSessionNamesInCanvas, setShowSessionNamesInCanvas] = useState(false);

  useEffect(() => {
    const loadInitialSettings = async () => {
      setIsLoading(true);
      
      const savedClockStyle = localStorage.getItem('clockStyle');
      const savedCanvasSize = localStorage.getItem('canvasSize');
      const savedSize = localStorage.getItem('clockSize');
      const savedSessions = localStorage.getItem('sessions');
      const savedTimezone = localStorage.getItem('selectedTimezone');
      const savedBackgroundColor = localStorage.getItem('backgroundColor');
      const savedBackgroundBasedOnSession = localStorage.getItem('backgroundBasedOnSession');
      const savedShowHandClock = localStorage.getItem('showHandClock');
      const savedShowDigitalClock = localStorage.getItem('showDigitalClock');
      const savedShowSessionLabel = localStorage.getItem('showSessionLabel');
      const savedShowTimeToEnd = localStorage.getItem('showTimeToEnd');
      const savedShowTimeToStart = localStorage.getItem('showTimeToStart');
      const savedShowSessionNamesInCanvas = localStorage.getItem('showSessionNamesInCanvas');

      if (savedClockStyle) setClockStyle(savedClockStyle);
      if (savedCanvasSize) setCanvasSize(parseInt(savedCanvasSize));
      if (savedSize) setClockSize(parseInt(savedSize));
      if (savedSessions) setSessions(JSON.parse(savedSessions));
      if (savedTimezone) setSelectedTimezone(savedTimezone);
      if (savedBackgroundColor) setBackgroundColor(savedBackgroundColor);
      if (savedBackgroundBasedOnSession !== null)
        setBackgroundBasedOnSession(savedBackgroundBasedOnSession === 'true');
      if (savedShowHandClock !== null) setShowHandClock(savedShowHandClock === 'true');
      if (savedShowDigitalClock !== null) setShowDigitalClock(savedShowDigitalClock === 'true');
      if (savedShowSessionLabel !== null) setShowSessionLabel(savedShowSessionLabel === 'true');
      if (savedShowTimeToEnd !== null) setShowTimeToEnd(savedShowTimeToEnd === 'true');
      if (savedShowTimeToStart !== null) setShowTimeToStart(savedShowTimeToStart === 'true');
      if (savedShowSessionNamesInCanvas !== null) setShowSessionNamesInCanvas(savedShowSessionNamesInCanvas === 'true');
      
      // Minimum loading time for smooth UX
      await new Promise(resolve => setTimeout(resolve, 800));
      setIsLoading(false);
    };
    
    loadInitialSettings();
  }, []);

  useEffect(() => {
    async function loadUserSettings() {
      if (!user) return;
      
      setIsLoading(true);
      try {
        const userRef = doc(db, 'users', user.uid);
        const snap = await getDoc(userRef);
        if (snap.exists()) {
          const data = snap.data();
          if (data.settings) {
            if (data.settings.clockStyle) setClockStyle(data.settings.clockStyle);
            if (data.settings.canvasSize !== undefined) setCanvasSize(data.settings.canvasSize);
            if (data.settings.clockSize) setClockSize(data.settings.clockSize);
            if (data.settings.sessions) setSessions(data.settings.sessions);
            if (data.settings.selectedTimezone) setSelectedTimezone(data.settings.selectedTimezone);
            if (data.settings.backgroundColor) setBackgroundColor(data.settings.backgroundColor);
            if (data.settings.backgroundBasedOnSession !== undefined)
              setBackgroundBasedOnSession(data.settings.backgroundBasedOnSession);
            if (data.settings.showHandClock !== undefined) setShowHandClock(data.settings.showHandClock);
            if (data.settings.showDigitalClock !== undefined) setShowDigitalClock(data.settings.showDigitalClock);
            if (data.settings.showSessionLabel !== undefined) setShowSessionLabel(data.settings.showSessionLabel);
            if (data.settings.showTimeToEnd !== undefined) setShowTimeToEnd(data.settings.showTimeToEnd);
            if (data.settings.showTimeToStart !== undefined) setShowTimeToStart(data.settings.showTimeToStart);
            if (data.settings.showSessionNamesInCanvas !== undefined) setShowSessionNamesInCanvas(data.settings.showSessionNamesInCanvas);
          }
        } else {
          await setDoc(userRef, {
            email: user.email,
            createdAt: serverTimestamp(),
            settings: {
              clockStyle,
              canvasSize,
              clockSize,
              sessions,
              selectedTimezone,
              backgroundColor,
              backgroundBasedOnSession,
              showHandClock,
              showDigitalClock,
              showSessionLabel,
              showTimeToEnd,
              showTimeToStart,
              showSessionNamesInCanvas,
            }
          });
        }
      } catch (error) {
        console.error('Error loading user settings:', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadUserSettings();
  }, [user]);

  async function saveSettingsToFirestore(newSettings) {
    if (!user) return;
    const userRef = doc(db, 'users', user.uid);
    await setDoc(userRef, { settings: { ...newSettings } }, { merge: true });
  }

  const updateClockStyle = (style) => {
    setClockStyle(style);
    localStorage.setItem('clockStyle', style);
    if (user) saveSettingsToFirestore({ clockStyle: style });
  };

  const updateCanvasSize = (size) => {
    setCanvasSize(size);
    localStorage.setItem('canvasSize', size);
    if (user) saveSettingsToFirestore({ canvasSize: size });
  };

  const updateClockSize = (size) => {
    setClockSize(size);
    localStorage.setItem('clockSize', size);
    if (user) saveSettingsToFirestore({ clockSize: size });
  };

  const updateSessions = (newSessions) => {
    setSessions([...newSessions]);
    localStorage.setItem('sessions', JSON.stringify(newSessions));
    if (user) saveSettingsToFirestore({ sessions: newSessions });
  };

  const updateBackgroundColor = (color) => {
    setBackgroundColor(color);
    localStorage.setItem('backgroundColor', color);
    if (user) saveSettingsToFirestore({ backgroundColor: color });
  };

  const toggleBackgroundBasedOnSession = () => {
    setBackgroundBasedOnSession(prev => {
      const newValue = !prev;
      localStorage.setItem('backgroundBasedOnSession', newValue);
      if (user) saveSettingsToFirestore({ backgroundBasedOnSession: newValue });
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
    if (!canToggleOff(showHandClock, showDigitalClock, showSessionLabel)) return false;
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
    if (!canToggleOff(showDigitalClock, showHandClock, showSessionLabel)) return false;
    setShowDigitalClock(false);
    localStorage.setItem('showDigitalClock', false);
    if (user) saveSettingsToFirestore({ showDigitalClock: false });
    return true;
  };

  const toggleShowSessionLabel = () => {
    if (!showSessionLabel) {
      setShowSessionLabel(true);
      localStorage.setItem('showSessionLabel', true);
      if (user) saveSettingsToFirestore({ showSessionLabel: true });
      return true;
    }
    if (!canToggleOff(showSessionLabel, showHandClock, showDigitalClock)) return false;
    setShowSessionLabel(false);
    localStorage.setItem('showSessionLabel', false);
    if (user) saveSettingsToFirestore({ showSessionLabel: false });
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

  const toggleShowSessionNamesInCanvas = () => {
    setShowSessionNamesInCanvas(prev => {
      const newValue = !prev;
      localStorage.setItem('showSessionNamesInCanvas', newValue);
      if (user) saveSettingsToFirestore({ showSessionNamesInCanvas: newValue });
      return newValue;
    });
  };

  const resetSettings = async () => {
    // Clear localStorage
    localStorage.clear();
    
    // Reset all state values to defaults
    setClockStyle('normal');
    setCanvasSize(75);
    setClockSize(375);
    setSessions([...defaultSessions]);
    setSelectedTimezone('America/New_York');
    setBackgroundColor("#F9F9F9");
    setBackgroundBasedOnSession(false);
    setShowHandClock(true);
    setShowDigitalClock(true);
    setShowSessionLabel(true);
    setShowTimeToEnd(true);
    setShowTimeToStart(true);
    setShowSessionNamesInCanvas(false);
    
    // Also reset in Firestore if user is logged in
    if (user) {
      const defaultSettings = {
        clockStyle: 'normal',
        canvasSize: 75,
        clockSize: 375,
        sessions: [...defaultSessions],
        selectedTimezone: 'America/New_York',
        backgroundColor: "#F9F9F9",
        backgroundBasedOnSession: false,
        showHandClock: true,
        showDigitalClock: true,
        showSessionLabel: true,
        showTimeToEnd: true,
        showTimeToStart: true,
        showSessionNamesInCanvas: false,
      };
      await saveSettingsToFirestore(defaultSettings);
    }
  };

  const value = {
    isLoading,
    clockStyle,
    canvasSize,
    clockSize,
    sessions,
    selectedTimezone,
    updateClockStyle,
    updateCanvasSize,
    updateClockSize,
    updateSessions,
    setSelectedTimezone,
    backgroundColor,
    updateBackgroundColor,
    backgroundBasedOnSession,
    toggleBackgroundBasedOnSession,
    showHandClock,
    showDigitalClock,
    showSessionLabel,
    toggleShowHandClock,
    toggleShowDigitalClock,
    toggleShowSessionLabel,
    showTimeToEnd,
    showTimeToStart,
    toggleShowTimeToEnd,
    toggleShowTimeToStart,
    showSessionNamesInCanvas,
    toggleShowSessionNamesInCanvas,
    resetSettings,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

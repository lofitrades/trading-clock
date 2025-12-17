/**
 * src/contexts/SettingsContext.jsx
 * 
 * Purpose: Centralized settings provider with localStorage + Firestore persistence for clock, session, and economic event preferences.
 * Supplies clock visibility, styling, timezone, news source, and economic events overlay controls to the app.
 * 
 * Changelog:
 * v1.3.1 - 2025-12-17 - Default news source set to Forex Factory for new users.
 * v1.3.0 - 2025-12-16 - Locked clock style to normal and canvas size to 100% with no persistence or UI controls.
 * v1.2.2 - 2025-12-16 - Added showTimezoneLabel toggle with persistence to show/hide the timezone label in the main clock view.
 * v1.2.1 - 2025-12-12 - Persist favorites-only filter for economic events.
 * v1.2.0 - 2025-12-09 - Added showEventsOnCanvas toggle with persistence to control clock event markers visibility.
 * v1.1.0 - 2025-12-01 - Added newsSource preference and eventFilters persistence for economic events features.
 * v1.0.0 - 2025-09-15 - Initial implementation of settings context with Firestore sync.
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { db } from '../firebase';
import { doc, getDoc, setDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { DEFAULT_NEWS_SOURCE } from '../types/economicEvents';

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
  const clockStyle = 'normal';
  const canvasSize = 100;
  const [clockSize, setClockSize] = useState(375);
  const [sessions, setSessions] = useState([...defaultSessions]);
  const [selectedTimezone, setSelectedTimezone] = useState('America/New_York');
  const [backgroundColor, setBackgroundColor] = useState("#F9F9F9");
  const [backgroundBasedOnSession, setBackgroundBasedOnSession] = useState(false);
  const [showHandClock, setShowHandClock] = useState(true);
  const [showDigitalClock, setShowDigitalClock] = useState(true);
  const [showSessionLabel, setShowSessionLabel] = useState(true);
  const [showTimezoneLabel, setShowTimezoneLabel] = useState(true);
  const [showTimeToEnd, setShowTimeToEnd] = useState(true);
  const [showTimeToStart, setShowTimeToStart] = useState(true);
  const [showSessionNamesInCanvas, setShowSessionNamesInCanvas] = useState(false);
  const [showEventsOnCanvas, setShowEventsOnCanvas] = useState(true);
  
  // News source preference (for economic events calendar)
  const [newsSource, setNewsSource] = useState(DEFAULT_NEWS_SOURCE);
  const [preferredSource, setPreferredSource] = useState('auto');
  
  // Event filters state
  const [eventFilters, setEventFilters] = useState({
    startDate: null,
    endDate: null,
    impacts: [],
    eventTypes: [],
    currencies: [],
    favoritesOnly: false,
  });

  useEffect(() => {
    const loadInitialSettings = async () => {
      setIsLoading(true);
      
      const savedSize = localStorage.getItem('clockSize');
      const savedSessions = localStorage.getItem('sessions');
      const savedTimezone = localStorage.getItem('selectedTimezone');
      const savedBackgroundColor = localStorage.getItem('backgroundColor');
      const savedBackgroundBasedOnSession = localStorage.getItem('backgroundBasedOnSession');
      const savedShowHandClock = localStorage.getItem('showHandClock');
      const savedShowDigitalClock = localStorage.getItem('showDigitalClock');
      const savedShowSessionLabel = localStorage.getItem('showSessionLabel');
      const savedShowTimezoneLabel = localStorage.getItem('showTimezoneLabel');
      const savedShowTimeToEnd = localStorage.getItem('showTimeToEnd');
      const savedShowTimeToStart = localStorage.getItem('showTimeToStart');
      const savedShowSessionNamesInCanvas = localStorage.getItem('showSessionNamesInCanvas');
      const savedShowEventsOnCanvas = localStorage.getItem('showEventsOnCanvas');
      const savedNewsSource = localStorage.getItem('newsSource');
      const savedPreferredSource = localStorage.getItem('preferredSource');
      const savedEventFilters = localStorage.getItem('eventFilters');

      if (savedSize) setClockSize(parseInt(savedSize));
      if (savedSessions) setSessions(JSON.parse(savedSessions));
      if (savedTimezone) setSelectedTimezone(savedTimezone);
      if (savedBackgroundColor) setBackgroundColor(savedBackgroundColor);
      if (savedBackgroundBasedOnSession !== null)
        setBackgroundBasedOnSession(savedBackgroundBasedOnSession === 'true');
      if (savedShowHandClock !== null) setShowHandClock(savedShowHandClock === 'true');
      if (savedShowDigitalClock !== null) setShowDigitalClock(savedShowDigitalClock === 'true');
      if (savedShowSessionLabel !== null) setShowSessionLabel(savedShowSessionLabel === 'true');
      if (savedShowTimezoneLabel !== null) setShowTimezoneLabel(savedShowTimezoneLabel === 'true');
      if (savedShowTimeToEnd !== null) setShowTimeToEnd(savedShowTimeToEnd === 'true');
      if (savedShowTimeToStart !== null) setShowTimeToStart(savedShowTimeToStart === 'true');
      if (savedShowSessionNamesInCanvas !== null) setShowSessionNamesInCanvas(savedShowSessionNamesInCanvas === 'true');
      if (savedShowEventsOnCanvas !== null) setShowEventsOnCanvas(savedShowEventsOnCanvas === 'true');
      if (savedNewsSource) setNewsSource(savedNewsSource);
      if (savedPreferredSource) setPreferredSource(savedPreferredSource);
      
      // Load event filters with date deserialization
      if (savedEventFilters) {
        try {
          const parsed = JSON.parse(savedEventFilters);
          setEventFilters({
            ...parsed,
            startDate: parsed.startDate ? new Date(parsed.startDate) : null,
            endDate: parsed.endDate ? new Date(parsed.endDate) : null,
            favoritesOnly: parsed.favoritesOnly ?? false,
          });
        } catch (error) {
          console.error('❌ Failed to parse saved event filters:', error);
        }
      }
      
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
            if (data.settings.clockSize) setClockSize(data.settings.clockSize);
            if (data.settings.sessions) setSessions(data.settings.sessions);
            if (data.settings.selectedTimezone) setSelectedTimezone(data.settings.selectedTimezone);
            if (data.settings.backgroundColor) setBackgroundColor(data.settings.backgroundColor);
            if (data.settings.backgroundBasedOnSession !== undefined)
              setBackgroundBasedOnSession(data.settings.backgroundBasedOnSession);
            if (data.settings.showHandClock !== undefined) setShowHandClock(data.settings.showHandClock);
            if (data.settings.showDigitalClock !== undefined) setShowDigitalClock(data.settings.showDigitalClock);
            if (data.settings.showSessionLabel !== undefined) setShowSessionLabel(data.settings.showSessionLabel);
            if (data.settings.showTimezoneLabel !== undefined) setShowTimezoneLabel(data.settings.showTimezoneLabel);
            if (data.settings.showTimeToEnd !== undefined) setShowTimeToEnd(data.settings.showTimeToEnd);
            if (data.settings.showTimeToStart !== undefined) setShowTimeToStart(data.settings.showTimeToStart);
            if (data.settings.showSessionNamesInCanvas !== undefined) setShowSessionNamesInCanvas(data.settings.showSessionNamesInCanvas);
            if (data.settings.showEventsOnCanvas !== undefined) setShowEventsOnCanvas(data.settings.showEventsOnCanvas);
            
            // Load news source preference
            if (data.settings.newsSource) setNewsSource(data.settings.newsSource);
            if (data.settings.preferredSource) setPreferredSource(data.settings.preferredSource);
            
            // Load event filters with date deserialization
            if (data.settings.eventFilters) {
              const filters = data.settings.eventFilters;
              setEventFilters({
                ...filters,
                startDate: filters.startDate?.toDate ? filters.startDate.toDate() : (filters.startDate ? new Date(filters.startDate) : null),
                endDate: filters.endDate?.toDate ? filters.endDate.toDate() : (filters.endDate ? new Date(filters.endDate) : null),
                favoritesOnly: filters.favoritesOnly ?? false,
              });
            }
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
              showTimezoneLabel,
              showTimeToEnd,
              showTimeToStart,
              showSessionNamesInCanvas,
              showEventsOnCanvas,
              newsSource, // Default news source preference
                preferredSource: 'auto',
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

  /**
   * Update selected timezone with proper persistence
   * CRITICAL: Must save to both localStorage and Firestore for authenticated users
   */
  const updateSelectedTimezone = (timezone) => {
    setSelectedTimezone(timezone);
    localStorage.setItem('selectedTimezone', timezone);
    if (user) {
      saveSettingsToFirestore({ selectedTimezone: timezone });
    }
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

  const toggleShowTimezoneLabel = () => {
    setShowTimezoneLabel(prev => {
      const newValue = !prev;
      localStorage.setItem('showTimezoneLabel', newValue);
      if (user) saveSettingsToFirestore({ showTimezoneLabel: newValue });
      return newValue;
    });
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

  const toggleShowEventsOnCanvas = () => {
    setShowEventsOnCanvas(prev => {
      const newValue = !prev;
      localStorage.setItem('showEventsOnCanvas', newValue);
      if (user) saveSettingsToFirestore({ showEventsOnCanvas: newValue });
      return newValue;
    });
  };

  /**
   * Update event filters with persistence
   */
  const updateEventFilters = (newFilters) => {
    setEventFilters(newFilters);
    
    // Serialize dates for storage
    const serializedFilters = {
      ...newFilters,
      startDate: newFilters.startDate?.toISOString() || null,
      endDate: newFilters.endDate?.toISOString() || null,
      favoritesOnly: Boolean(newFilters.favoritesOnly),
    };
    
    localStorage.setItem('eventFilters', JSON.stringify(serializedFilters));
    
    if (user) {
      // For Firestore, use Timestamp for dates
      const firestoreFilters = {
        ...newFilters,
        startDate: newFilters.startDate ? Timestamp.fromDate(newFilters.startDate) : null,
        endDate: newFilters.endDate ? Timestamp.fromDate(newFilters.endDate) : null,
      };
      saveSettingsToFirestore({ eventFilters: firestoreFilters });
    }
  };

  /**
   * Update news source preference
   * Saves to both localStorage and Firestore (if authenticated)
   * Note: Components using economic events should invalidate cache when this changes
   */
  const updateNewsSource = (source) => {
    setNewsSource(source);
    localStorage.setItem('newsSource', source);
    if (user) {
      saveSettingsToFirestore({ newsSource: source });
    }
  };

  const updatePreferredSource = (source) => {
    setPreferredSource(source);
    localStorage.setItem('preferredSource', source);
    if (user) {
      saveSettingsToFirestore({ preferredSource: source });
    }
  };

  const resetSettings = async () => {
    // Clear localStorage
    localStorage.clear();
    
    // Create deep copies of default sessions to ensure colors are fully reset
    const resetSessions = defaultSessions.map(session => ({ ...session }));
    
    // Reset all state values to defaults
    setClockSize(375);
    setSessions(resetSessions);
    setSelectedTimezone('America/New_York');
    setBackgroundColor("#F9F9F9");
    setBackgroundBasedOnSession(false);
    setShowHandClock(true);
    setShowDigitalClock(true);
    setShowSessionLabel(true);
    setShowTimezoneLabel(true);
    setShowTimeToEnd(true);
    setShowTimeToStart(true);
    setShowSessionNamesInCanvas(false);
    setShowEventsOnCanvas(true);
    setNewsSource(DEFAULT_NEWS_SOURCE);
    setPreferredSource('auto');
    setEventFilters({
      startDate: null,
      endDate: null,
      impacts: [],
      eventTypes: [],
      currencies: [],
      favoritesOnly: false,
    });
    
    // Also reset in Firestore if user is logged in
    if (user) {
      const defaultSettings = {
        clockStyle: 'normal',
        canvasSize: 100,
        clockSize: 375,
        sessions: defaultSessions.map(session => ({ ...session })),
        selectedTimezone: 'America/New_York',
        backgroundColor: "#F9F9F9",
        backgroundBasedOnSession: false,
        showHandClock: true,
        showDigitalClock: true,
        showSessionLabel: true,
        showTimezoneLabel: true,
        showTimeToEnd: true,
        showTimeToStart: true,
        showSessionNamesInCanvas: false,
        showEventsOnCanvas: true,
        newsSource: DEFAULT_NEWS_SOURCE,
        preferredSource: 'auto',
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
    updateClockSize,
    updateSessions,
    updateSelectedTimezone,  // Proper function with Firestore persistence
    setSelectedTimezone,      // Direct setter (for backward compatibility)
    backgroundColor,
    updateBackgroundColor,
    backgroundBasedOnSession,
    toggleBackgroundBasedOnSession,
    showHandClock,
    showDigitalClock,
    showSessionLabel,
    showTimezoneLabel,
    toggleShowHandClock,
    toggleShowDigitalClock,
    toggleShowSessionLabel,
    toggleShowTimezoneLabel,
    showTimeToEnd,
    showTimeToStart,
    toggleShowTimeToEnd,
    toggleShowTimeToStart,
    showSessionNamesInCanvas,
    toggleShowSessionNamesInCanvas,
    showEventsOnCanvas,
    toggleShowEventsOnCanvas,
    resetSettings,
    eventFilters,
    updateEventFilters,
    newsSource,
    updateNewsSource,
    preferredSource,
    updatePreferredSource,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

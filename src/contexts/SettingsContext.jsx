/**
 * src/contexts/SettingsContext.jsx
 * 
 * Purpose: Centralized settings provider with localStorage + Firestore persistence for clock, session, and economic event preferences.
 * Supplies clock visibility, styling, timezone, news source, and economic events overlay controls to the app.
 * 
 * Changelog:
 * v1.6.1 - 2026-01-17 - ENHANCED LOGOUT: Improved resetSettings to ensure complete user preference cleanup. Fixed showSessionLabel default to false (not true) for consistency. Added try-catch around Firestore reset to prevent logout failures if reset fails. Added detailed step-by-step comments explaining the reset flow. Follows BEP enterprise logout patterns.
 * v1.6.0 - 2026-01-14 - CRITICAL FIX: Replaced one-time getDoc with real-time onSnapshot listener for authenticated users. Settings now sync in real-time across all open tabs/pages. Added save-lock mechanism (isSavingRef) to prevent listener from overwriting local changes during active saves. Refactored settings application into reusable applyFirestoreSettings callback. Enterprise-grade cross-session consistency following Firebase best practices.
 * v1.5.0 - 2026-01-13 - CRITICAL FIX: Added searchQuery to eventFilters schema; fixed updateEventFilters to properly normalize and serialize all filter fields; ensures filter consistency across sessions and page refreshes via proper Firestore/localStorage sync.
 * v1.4.7 - 2026-01-08 - Removed standalone "Background Color" setting; only Session-based Background functionality remains.
 * v1.4.6 - 2026-01-08 - Ensure showClockHands toggle properly propagates to ClockHandsOverlay via prop (seconds hand visibility).
 * v1.4.5 - 2026-01-08 - Added showPastSessionsGray toggle and Firestore persistence; fixed CalendarEmbed clock gray-out toggle not working.
 * v1.4.4 - 2025-12-18 - Swap NY AM/NY PM default colors (NY AM → teal, NY PM → orange) to match BrandGuide direction.
 * v1.4.3 - 2025-12-18 - Enable session names on canvas by default and during reset to keep labels visible across sessions.
 * v1.4.2 - 2025-12-17 - Remove artificial loading delay to shorten first paint and hand-off to clock UI.
 * v1.4.1 - 2025-12-17 - Add default role/subscription when creating user doc from settings to avoid missing role on first login.
 * v1.4.0 - 2025-12-17 - Added showClockNumbers and showClockHands toggles for granular analog clock customization.
 * v1.3.1 - 2025-12-17 - Default news source set to Forex Factory for new users.
 * v1.3.0 - 2025-12-16 - Locked clock style to normal and canvas size to 100% with no persistence or UI controls.
 * v1.2.2 - 2025-12-16 - Added showTimezoneLabel toggle with persistence to show/hide the timezone label in the main clock view.
 * v1.2.1 - 2025-12-12 - Persist favorites-only filter for economic events.
 * v1.2.0 - 2025-12-09 - Added showEventsOnCanvas toggle with persistence to control clock event markers visibility.
 * v1.1.0 - 2025-12-01 - Added newsSource preference and eventFilters persistence for economic events features.
 * v1.0.0 - 2025-09-15 - Initial implementation of settings context with Firestore sync.
 */

import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useAuth } from './AuthContext';
import { db } from '../firebase';
import { doc, setDoc, onSnapshot, serverTimestamp, Timestamp } from 'firebase/firestore';
import { USER_ROLES, SUBSCRIPTION_PLANS, SUBSCRIPTION_STATUS, PLAN_FEATURES } from '../types/userTypes';
import { DEFAULT_NEWS_SOURCE } from '../types/economicEvents';

// Brand-aligned multicolor defaults (per BrandGuide: Secondary Logo — Multicolor)
const SESSION_COLOR_MAP = {
  Asia: '#4E7DFF',
  'NY PM': '#FFA85C',
  London: '#FF6F91',
  'Market Closed': '#8B6CFF',
  'NY AM': '#018786',
};

const baseSessions = [
  { name: "NY AM", startNY: "07:00", endNY: "11:00" },
  { name: "NY PM", startNY: "13:30", endNY: "16:00" },
  { name: "Market Closed", startNY: "17:00", endNY: "18:00" },
  { name: "Asia", startNY: "20:00", endNY: "00:00" },
  { name: "London", startNY: "02:00", endNY: "05:00" },
  { name: "", startNY: "", endNY: "" },
  { name: "", startNY: "", endNY: "" },
  { name: "", startNY: "", endNY: "" },
];

const defaultSessions = baseSessions.map((session, index) => ({
  ...session,
  color: SESSION_COLOR_MAP[session.name] || Object.values(SESSION_COLOR_MAP)[index % Object.values(SESSION_COLOR_MAP).length],
}));

const SettingsContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}

/**
 * Safe version of useSettings that returns a fallback context if provider is not available.
 * Used for components that might render during SSR/prerendering before providers are mounted.
 * BEP: Falls back to default values instead of throwing error during prerender.
 */
export function useSettingsSafe() {
  const context = useContext(SettingsContext);
  
  // Return default settings if context not available (e.g., during SSR/prerendering)
  if (!context) {
    return {
      isLoading: true,
      clockStyle: 'normal',
      canvasSize: 100,
      clockSize: 375,
      sessions: [...defaultSessions],
      selectedTimezone: 'America/New_York',
      backgroundBasedOnSession: false,
      showHandClock: true,
      showDigitalClock: true,
      showSessionLabel: false,
      showTimezoneLabel: true,
      showTimeToEnd: true,
      showTimeToStart: true,
      showSessionNamesInCanvas: true,
      showEventsOnCanvas: true,
      showClockNumbers: true,
      showClockHands: true,
      showPastSessionsGray: false,
      newsSource: DEFAULT_NEWS_SOURCE,
      preferredSource: 'auto',
      eventFilters: {
        startDate: null,
        endDate: null,
        impacts: [],
        currencies: [],
        favoritesOnly: false,
        searchQuery: '',
      },
      updateSelectedTimezone: () => {},
      updateBackgroundBasedOnSession: () => {},
      updateShowHandClock: () => {},
      updateShowDigitalClock: () => {},
      updateShowSessionLabel: () => {},
      updateShowTimezoneLabel: () => {},
      updateShowTimeToEnd: () => {},
      updateShowTimeToStart: () => {},
      updateShowSessionNamesInCanvas: () => {},
      updateShowEventsOnCanvas: () => {},
      updateClockNumbers: () => {},
      updateClockHands: () => {},
      updateShowPastSessionsGray: () => {},
      updateSessions: () => {},
      updateEventFilters: () => {},
      updateNewsSource: () => {},
      resetSettings: () => {},
    };
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
  const [backgroundBasedOnSession, setBackgroundBasedOnSession] = useState(false);
  const [showHandClock, setShowHandClock] = useState(true);
  const [showDigitalClock, setShowDigitalClock] = useState(true);
  const [showSessionLabel, setShowSessionLabel] = useState(false);
  const [showTimezoneLabel, setShowTimezoneLabel] = useState(true);
  const [showTimeToEnd, setShowTimeToEnd] = useState(true);
  const [showTimeToStart, setShowTimeToStart] = useState(true);
  const [showSessionNamesInCanvas, setShowSessionNamesInCanvas] = useState(true);
  const [showEventsOnCanvas, setShowEventsOnCanvas] = useState(true);
  const [showClockNumbers, setShowClockNumbers] = useState(true);
  const [showClockHands, setShowClockHands] = useState(true);
  const [showPastSessionsGray, setShowPastSessionsGray] = useState(false);

  // News source preference (for economic events calendar)
  const [newsSource, setNewsSource] = useState(DEFAULT_NEWS_SOURCE);
  const [preferredSource, setPreferredSource] = useState('auto');

  // Event filters state (includes all filter fields for full persistence)
  const [eventFilters, setEventFilters] = useState({
    startDate: null,
    endDate: null,
    impacts: [],
    eventTypes: [],
    currencies: [],
    favoritesOnly: false,
    searchQuery: '',
  });

  useEffect(() => {
    const loadInitialSettings = async () => {
      setIsLoading(true);

      const savedSize = localStorage.getItem('clockSize');
      const savedSessions = localStorage.getItem('sessions');
      const savedTimezone = localStorage.getItem('selectedTimezone');
      const savedBackgroundBasedOnSession = localStorage.getItem('backgroundBasedOnSession');
      const savedShowHandClock = localStorage.getItem('showHandClock');
      const savedShowDigitalClock = localStorage.getItem('showDigitalClock');
      const savedShowSessionLabel = localStorage.getItem('showSessionLabel');
      const savedShowTimezoneLabel = localStorage.getItem('showTimezoneLabel');
      const savedShowTimeToEnd = localStorage.getItem('showTimeToEnd');
      const savedShowTimeToStart = localStorage.getItem('showTimeToStart');
      const savedShowSessionNamesInCanvas = localStorage.getItem('showSessionNamesInCanvas');
      const savedShowEventsOnCanvas = localStorage.getItem('showEventsOnCanvas');
      const savedShowClockNumbers = localStorage.getItem('showClockNumbers');
      const savedShowClockHands = localStorage.getItem('showClockHands');
      const savedShowPastSessionsGray = localStorage.getItem('showPastSessionsGray');
      const savedNewsSource = localStorage.getItem('newsSource');
      const savedPreferredSource = localStorage.getItem('preferredSource');
      const savedEventFilters = localStorage.getItem('eventFilters');

      if (savedSize) setClockSize(parseInt(savedSize));
      if (savedSessions) setSessions(JSON.parse(savedSessions));
      if (savedTimezone) setSelectedTimezone(savedTimezone);
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
      if (savedShowClockNumbers !== null) setShowClockNumbers(savedShowClockNumbers === 'true');
      if (savedShowClockHands !== null) setShowClockHands(savedShowClockHands === 'true');
      if (savedShowPastSessionsGray !== null) setShowPastSessionsGray(savedShowPastSessionsGray === 'true');
      if (savedNewsSource) setNewsSource(savedNewsSource);
      if (savedPreferredSource) setPreferredSource(savedPreferredSource);

      // Load event filters with date deserialization
      if (savedEventFilters) {
        try {
          const parsed = JSON.parse(savedEventFilters);
          setEventFilters({
            startDate: parsed.startDate ? new Date(parsed.startDate) : null,
            endDate: parsed.endDate ? new Date(parsed.endDate) : null,
            impacts: parsed.impacts || [],
            eventTypes: parsed.eventTypes || [],
            currencies: parsed.currencies || [],
            favoritesOnly: parsed.favoritesOnly ?? false,
            searchQuery: parsed.searchQuery || '',
          });
        } catch (error) {
          console.error('❌ Failed to parse saved event filters:', error);
        }
      }

      // Minimum loading time for smooth UX
      await new Promise(resolve => setTimeout(resolve, 150));
      setIsLoading(false);
    };

    loadInitialSettings();
  }, []);

  // Track if we're currently saving to prevent listener from overwriting local changes
  const isSavingRef = useRef(false);
  const saveTimeoutRef = useRef(null);

  // Helper to apply Firestore settings to local state (used by both initial load and listener)
  const applyFirestoreSettings = useCallback((data) => {
    if (!data?.settings) return;
    const s = data.settings;

    if (s.clockSize !== undefined) setClockSize(s.clockSize);
    if (s.sessions !== undefined) setSessions(s.sessions);
    if (s.selectedTimezone !== undefined) setSelectedTimezone(s.selectedTimezone);
    if (s.backgroundBasedOnSession !== undefined) setBackgroundBasedOnSession(s.backgroundBasedOnSession);
    if (s.showHandClock !== undefined) setShowHandClock(s.showHandClock);
    if (s.showDigitalClock !== undefined) setShowDigitalClock(s.showDigitalClock);
    if (s.showSessionLabel !== undefined) setShowSessionLabel(s.showSessionLabel);
    if (s.showTimezoneLabel !== undefined) setShowTimezoneLabel(s.showTimezoneLabel);
    if (s.showTimeToEnd !== undefined) setShowTimeToEnd(s.showTimeToEnd);
    if (s.showTimeToStart !== undefined) setShowTimeToStart(s.showTimeToStart);
    if (s.showSessionNamesInCanvas !== undefined) setShowSessionNamesInCanvas(s.showSessionNamesInCanvas);
    if (s.showEventsOnCanvas !== undefined) setShowEventsOnCanvas(s.showEventsOnCanvas);
    if (s.showClockNumbers !== undefined) setShowClockNumbers(s.showClockNumbers);
    if (s.showClockHands !== undefined) setShowClockHands(s.showClockHands);
    if (s.showPastSessionsGray !== undefined) setShowPastSessionsGray(s.showPastSessionsGray);
    if (s.newsSource !== undefined) setNewsSource(s.newsSource);
    if (s.preferredSource !== undefined) setPreferredSource(s.preferredSource);

    // Load event filters with date deserialization
    if (s.eventFilters) {
      const filters = s.eventFilters;
      setEventFilters({
        startDate: filters.startDate?.toDate ? filters.startDate.toDate() : (filters.startDate ? new Date(filters.startDate) : null),
        endDate: filters.endDate?.toDate ? filters.endDate.toDate() : (filters.endDate ? new Date(filters.endDate) : null),
        impacts: filters.impacts || [],
        eventTypes: filters.eventTypes || [],
        currencies: filters.currencies || [],
        favoritesOnly: filters.favoritesOnly ?? false,
        searchQuery: filters.searchQuery || '',
      });
    }
  }, []);

  // Real-time Firestore listener for authenticated users - keeps settings in sync across tabs/pages
  useEffect(() => {
    if (!user) return;

    setIsLoading(true);
    const userRef = doc(db, 'users', user.uid);

    // Subscribe to real-time updates
    const unsubscribe = onSnapshot(
      userRef,
      async (snap) => {
        // Skip update if we're currently saving (prevents overwriting local changes)
        if (isSavingRef.current) {
          return;
        }

        if (snap.exists()) {
          const data = snap.data();
          applyFirestoreSettings(data);
        } else {
          // Create new user document with defaults
          const defaultSubscription = {
            plan: SUBSCRIPTION_PLANS.FREE,
            status: SUBSCRIPTION_STATUS.ACTIVE,
            features: PLAN_FEATURES[SUBSCRIPTION_PLANS.FREE],
            startDate: serverTimestamp(),
            endDate: null,
            trialEndsAt: null,
            customerId: null,
            subscriptionId: null,
          };

          await setDoc(userRef, {
            email: user.email,
            role: USER_ROLES.USER,
            subscription: defaultSubscription,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            lastLoginAt: serverTimestamp(),
            settings: {
              clockStyle,
              canvasSize,
              clockSize,
              sessions,
              selectedTimezone,
              backgroundBasedOnSession,
              showHandClock,
              showDigitalClock,
              showSessionLabel,
              showTimezoneLabel,
              showTimeToEnd,
              showTimeToStart,
              showSessionNamesInCanvas,
              showEventsOnCanvas,
              showClockNumbers,
              showClockHands,
              showPastSessionsGray: false,
              newsSource,
              preferredSource: 'auto',
            },
          });
        }
        setIsLoading(false);
      },
      (error) => {
        console.error('Error in settings listener:', error);
        setIsLoading(false);
      }
    );

    // Cleanup listener on unmount or user change
    return () => {
      unsubscribe();
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, applyFirestoreSettings]);

  // Debounced save to Firestore with save-lock to prevent listener from overwriting
  async function saveSettingsToFirestore(newSettings) {
    if (!user) return;

    // Set saving flag to prevent listener from overwriting local changes
    isSavingRef.current = true;

    // Clear any pending timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    const userRef = doc(db, 'users', user.uid);
    try {
      await setDoc(userRef, { settings: { ...newSettings } }, { merge: true });
    } catch (error) {
      console.error('Error saving settings to Firestore:', error);
    }

    // Release save lock after a short delay to let listener settle
    saveTimeoutRef.current = setTimeout(() => {
      isSavingRef.current = false;
    }, 500);
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

  const toggleShowClockNumbers = () => {
    setShowClockNumbers(prev => {
      const newValue = !prev;
      localStorage.setItem('showClockNumbers', newValue);
      if (user) saveSettingsToFirestore({ showClockNumbers: newValue });
      return newValue;
    });
  };

  const toggleShowClockHands = () => {
    setShowClockHands(prev => {
      const newValue = !prev;
      localStorage.setItem('showClockHands', newValue);
      if (user) saveSettingsToFirestore({ showClockHands: newValue });
      return newValue;
    });
  };

  const toggleShowPastSessionsGray = () => {
    setShowPastSessionsGray(prev => {
      const newValue = !prev;
      localStorage.setItem('showPastSessionsGray', newValue);
      if (user) saveSettingsToFirestore({ showPastSessionsGray: newValue });
      return newValue;
    });
  };

  /**
   * Update event filters with persistence
   * CRITICAL: Ensures all filter fields are properly serialized for both localStorage and Firestore
   * to maintain filter consistency across sessions and page refreshes.
   */
  const updateEventFilters = (newFilters) => {
    // Ensure Date objects for internal state
    const normalizedFilters = {
      startDate: newFilters.startDate instanceof Date ? newFilters.startDate : (newFilters.startDate ? new Date(newFilters.startDate) : null),
      endDate: newFilters.endDate instanceof Date ? newFilters.endDate : (newFilters.endDate ? new Date(newFilters.endDate) : null),
      impacts: newFilters.impacts || [],
      eventTypes: newFilters.eventTypes || [],
      currencies: newFilters.currencies || [],
      favoritesOnly: Boolean(newFilters.favoritesOnly),
      searchQuery: newFilters.searchQuery || '',
    };

    setEventFilters(normalizedFilters);

    // Serialize dates for localStorage (ISO string format)
    const serializedFilters = {
      ...normalizedFilters,
      startDate: normalizedFilters.startDate?.toISOString() || null,
      endDate: normalizedFilters.endDate?.toISOString() || null,
    };

    localStorage.setItem('eventFilters', JSON.stringify(serializedFilters));

    if (user) {
      // For Firestore, use Timestamp for dates (primitives for other fields)
      const firestoreFilters = {
        startDate: normalizedFilters.startDate ? Timestamp.fromDate(normalizedFilters.startDate) : null,
        endDate: normalizedFilters.endDate ? Timestamp.fromDate(normalizedFilters.endDate) : null,
        impacts: normalizedFilters.impacts,
        eventTypes: normalizedFilters.eventTypes,
        currencies: normalizedFilters.currencies,
        favoritesOnly: normalizedFilters.favoritesOnly,
        searchQuery: normalizedFilters.searchQuery,
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
    // STEP 1: Reset all state values to defaults immediately
    // This ensures React components see the reset state right away
    const resetSessions = defaultSessions.map(session => ({ ...session }));

    setClockSize(375);
    setSessions(resetSessions);
    setSelectedTimezone('America/New_York');
    setBackgroundBasedOnSession(false);
    setShowHandClock(true);
    setShowDigitalClock(true);
    setShowSessionLabel(false); // Default to hidden per v1.4.3
    setShowTimezoneLabel(true);
    setShowTimeToEnd(true);
    setShowTimeToStart(true);
    setShowSessionNamesInCanvas(true);
    setShowEventsOnCanvas(true);
    setShowClockNumbers(true);
    setShowClockHands(true);
    setShowPastSessionsGray(false);
    setNewsSource(DEFAULT_NEWS_SOURCE);
    setPreferredSource('auto');
    setEventFilters({
      startDate: null,
      endDate: null,
      impacts: [],
      eventTypes: [],
      currencies: [],
      favoritesOnly: false,
      searchQuery: '',
    });

    // STEP 2: Clear localStorage of all keys (guest user cleanup)
    // This removes all stored preferences from the device
    localStorage.clear();

    // STEP 3: Reset Firestore if user is currently authenticated
    // Ensures clean state across all devices when user logs back in
    if (user) {
      try {
        const defaultSettings = {
          clockStyle: 'normal',
          canvasSize: 100,
          clockSize: 375,
          sessions: defaultSessions.map(session => ({ ...session })),
          selectedTimezone: 'America/New_York',
          backgroundBasedOnSession: false,
          showHandClock: true,
          showDigitalClock: true,
          showSessionLabel: false,
          showTimezoneLabel: true,
          showTimeToEnd: true,
          showTimeToStart: true,
          showSessionNamesInCanvas: true,
          showEventsOnCanvas: true,
          showClockNumbers: true,
          showClockHands: true,
          showPastSessionsGray: false,
          newsSource: DEFAULT_NEWS_SOURCE,
          preferredSource: 'auto',
          eventFilters: {
            startDate: null,
            endDate: null,
            impacts: [],
            eventTypes: [],
            currencies: [],
            favoritesOnly: false,
            searchQuery: '',
          },
        };
        await saveSettingsToFirestore(defaultSettings);
      } catch (err) {
        console.error('Failed to reset Firestore settings during logout:', err);
        // Continue with logout even if Firestore reset fails - local state is already clean
      }
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
    showClockNumbers,
    toggleShowClockNumbers,
    showClockHands,
    toggleShowClockHands,
    showPastSessionsGray,
    toggleShowPastSessionsGray,
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

SettingsProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

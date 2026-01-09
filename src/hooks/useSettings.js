/**
 * src/hooks/useSettings.js
 * 
 * Purpose: Legacy settings hook with localStorage and Firestore persistence for clock/session preferences.
 * Primarily kept for backward compatibility with older components; mirrors SettingsContext behavior.
 * 
 * Changelog:
 * v1.1.8 - 2026-01-08 - Removed standalone "Background Color" setting; only Session-based Background functionality remains.
 * v1.1.7 - 2026-01-08 - Add showClockNumbers and showClockHands to useSettings hook for full parity with SettingsContext.
 * v1.1.6 - 2026-01-08 - Backfill missing settings (incl. showPastSessionsGray) on snapshot and sync them to Firestore/localStorage.
 * v1.1.5 - 2026-01-08 - Subscribe to Firestore settings for live preference updates (including showPastSessionsGray) across embeds/tabs.
 * v1.1.4 - 2026-01-08 - Add toggle to gray out completed session donuts on the analog hand clock.
 * v1.1.3 - 2025-12-18 - Swap NY AM/NY PM default colors (NY AM → teal, NY PM → orange) to stay consistent with SettingsContext and BrandGuide.
 * v1.1.2 - 2025-12-18 - Enable session names on canvas by default and during reset to align with SettingsContext defaults.
 * v1.1.1 - 2025-12-17 - Add default role/subscription when creating user doc to prevent missing role on first login.
 * v1.1.0 - 2025-12-16 - Locked clock style to normal and canvas size to 100%; removed mutation for these settings.
 * v1.0.0 - 2025-09-15 - Initial implementation
 */
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { doc, getDoc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore';
import { USER_ROLES, SUBSCRIPTION_PLANS, SUBSCRIPTION_STATUS, PLAN_FEATURES } from '../types/userTypes';

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

export function useSettings() {
  const { user } = useAuth();
  
  // Settings hook with full localStorage and Firestore persistence

  const clockStyle = 'normal';
  const canvasSize = 100;
  const [clockSize, setClockSize] = useState(375); // Legacy - kept for backward compatibility
  const [sessions, setSessions] = useState([...defaultSessions]);
  const [selectedTimezone, setSelectedTimezone] = useState('America/New_York');
  const [backgroundBasedOnSession, setBackgroundBasedOnSession] = useState(false);
  const [showHandClock, setShowHandClock] = useState(true);
  const [showDigitalClock, setShowDigitalClock] = useState(true);
  const [showSessionLabel, setShowSessionLabel] = useState(true);
  const [showTimeToEnd, setShowTimeToEnd] = useState(true);
  const [showTimeToStart, setShowTimeToStart] = useState(true);
  const [showSessionNamesInCanvas, setShowSessionNamesInCanvas] = useState(true);
  const [showClockNumbers, setShowClockNumbers] = useState(true);
  const [showClockHands, setShowClockHands] = useState(true);
  const [showPastSessionsGray, setShowPastSessionsGray] = useState(false);

  useEffect(() => {
    // Remove reliance on localStorage for default settings.
    // When the user logs out, localStorage is cleared.
    // Here we load settings from localStorage only if available.
    const savedSize = localStorage.getItem('clockSize');
    const savedSessions = localStorage.getItem('sessions');
    const savedTimezone = localStorage.getItem('selectedTimezone');
    const savedBackgroundBasedOnSession = localStorage.getItem('backgroundBasedOnSession');
    const savedShowHandClock = localStorage.getItem('showHandClock');
    const savedShowDigitalClock = localStorage.getItem('showDigitalClock');
    const savedShowSessionLabel = localStorage.getItem('showSessionLabel');
    const savedShowTimeToEnd = localStorage.getItem('showTimeToEnd');
    const savedShowTimeToStart = localStorage.getItem('showTimeToStart');
    const savedShowSessionNamesInCanvas = localStorage.getItem('showSessionNamesInCanvas');
    const savedShowPastSessionsGray = localStorage.getItem('showPastSessionsGray');

    if (savedSize) setClockSize(parseInt(savedSize));
    if (savedSessions) setSessions(JSON.parse(savedSessions));
    if (savedTimezone) setSelectedTimezone(savedTimezone);
    if (savedBackgroundBasedOnSession !== null)
      setBackgroundBasedOnSession(savedBackgroundBasedOnSession === 'true');
    if (savedShowHandClock !== null) setShowHandClock(savedShowHandClock === 'true');
    if (savedShowDigitalClock !== null) setShowDigitalClock(savedShowDigitalClock === 'true');
    if (savedShowSessionLabel !== null) setShowSessionLabel(savedShowSessionLabel === 'true');
    if (savedShowTimeToEnd !== null) setShowTimeToEnd(savedShowTimeToEnd === 'true');
    if (savedShowTimeToStart !== null) setShowTimeToStart(savedShowTimeToStart === 'true');
    if (savedShowSessionNamesInCanvas !== null) setShowSessionNamesInCanvas(savedShowSessionNamesInCanvas === 'true');
    const savedShowClockNumbers = localStorage.getItem('showClockNumbers');
    const savedShowClockHands = localStorage.getItem('showClockHands');
    if (savedShowClockNumbers !== null) setShowClockNumbers(savedShowClockNumbers === 'true');
    if (savedShowClockHands !== null) setShowClockHands(savedShowClockHands === 'true');
    if (savedShowPastSessionsGray !== null) setShowPastSessionsGray(savedShowPastSessionsGray === 'true');
  }, []);

  useEffect(() => {
    if (!user) return undefined;

    const userRef = doc(db, 'users', user.uid);
    let unsubscribe;
    let isMounted = true;

    const startListener = () => onSnapshot(userRef, (snap) => {
      if (!snap.exists()) return;
      const data = snap.data();
      if (!data.settings) return;

      const settings = data.settings;
      const backfill = {};

      if (settings.clockSize !== undefined) {
        setClockSize(settings.clockSize);
        localStorage.setItem('clockSize', settings.clockSize);
      }
      if (settings.sessions) {
        setSessions(settings.sessions);
        localStorage.setItem('sessions', JSON.stringify(settings.sessions));
      }
      if (settings.selectedTimezone) {
        setSelectedTimezone(settings.selectedTimezone);
        localStorage.setItem('selectedTimezone', settings.selectedTimezone);
      }
      if (settings.backgroundBasedOnSession !== undefined) {
        setBackgroundBasedOnSession(settings.backgroundBasedOnSession);
        localStorage.setItem('backgroundBasedOnSession', settings.backgroundBasedOnSession);
      }
      if (settings.backgroundBasedOnSession === undefined) {
        backfill.backgroundBasedOnSession = backgroundBasedOnSession;
      }
      if (settings.showHandClock !== undefined) {
        setShowHandClock(settings.showHandClock);
        localStorage.setItem('showHandClock', settings.showHandClock);
      }
      if (settings.showHandClock === undefined) {
        backfill.showHandClock = showHandClock;
      }
      if (settings.showDigitalClock !== undefined) {
        setShowDigitalClock(settings.showDigitalClock);
        localStorage.setItem('showDigitalClock', settings.showDigitalClock);
      }
      if (settings.showDigitalClock === undefined) {
        backfill.showDigitalClock = showDigitalClock;
      }
      if (settings.showSessionLabel !== undefined) {
        setShowSessionLabel(settings.showSessionLabel);
        localStorage.setItem('showSessionLabel', settings.showSessionLabel);
      }
      if (settings.showSessionLabel === undefined) {
        backfill.showSessionLabel = showSessionLabel;
      }
      if (settings.showTimeToEnd !== undefined) {
        setShowTimeToEnd(settings.showTimeToEnd);
        localStorage.setItem('showTimeToEnd', settings.showTimeToEnd);
      }
      if (settings.showTimeToEnd === undefined) {
        backfill.showTimeToEnd = showTimeToEnd;
      }
      if (settings.showTimeToStart !== undefined) {
        setShowTimeToStart(settings.showTimeToStart);
        localStorage.setItem('showTimeToStart', settings.showTimeToStart);
      }
      if (settings.showTimeToStart === undefined) {
        backfill.showTimeToStart = showTimeToStart;
      }
      if (settings.showSessionNamesInCanvas !== undefined) {
        setShowSessionNamesInCanvas(settings.showSessionNamesInCanvas);
        localStorage.setItem('showSessionNamesInCanvas', settings.showSessionNamesInCanvas);
      }
      if (settings.showSessionNamesInCanvas === undefined) {
        backfill.showSessionNamesInCanvas = showSessionNamesInCanvas;
      }
      if (settings.showClockNumbers !== undefined) {
        setShowClockNumbers(settings.showClockNumbers);
        localStorage.setItem('showClockNumbers', settings.showClockNumbers);
      }
      if (settings.showClockNumbers === undefined) {
        backfill.showClockNumbers = showClockNumbers;
      }
      if (settings.showClockHands !== undefined) {
        setShowClockHands(settings.showClockHands);
        localStorage.setItem('showClockHands', settings.showClockHands);
      }
      if (settings.showClockHands === undefined) {
        backfill.showClockHands = showClockHands;
      }
      if (settings.showPastSessionsGray !== undefined) {
        setShowPastSessionsGray(settings.showPastSessionsGray);
        localStorage.setItem('showPastSessionsGray', settings.showPastSessionsGray);
      }
      if (settings.showPastSessionsGray === undefined) {
        backfill.showPastSessionsGray = showPastSessionsGray;
      }

      // If any fields were missing, backfill them to Firestore and localStorage for consistency
      const backfillKeys = Object.keys(backfill);
      if (backfillKeys.length) {
        backfillKeys.forEach((key) => {
          localStorage.setItem(key, backfill[key]);
        });
        saveSettingsToFirestore(backfill);
      }
    });

    const ensureUserDocAndSubscribe = async () => {
      const snap = await getDoc(userRef);
      if (!snap.exists()) {
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
            showTimeToEnd,
            showTimeToStart,
            showSessionNamesInCanvas,
            showClockNumbers: true,
            showClockHands: true,
            showPastSessionsGray: false,
          }
        });
      }

      if (isMounted) {
        unsubscribe = startListener();
      }
    };

    ensureUserDocAndSubscribe();

    return () => {
      isMounted = false;
      if (unsubscribe) unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      if (user) {
        saveSettingsToFirestore({ showSessionNamesInCanvas: newValue });
      }
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

  // Reset settings: clear localStorage and reinitialize to defaults
  const resetSettings = () => {
    localStorage.clear();
    
    // Create deep copy of default sessions to ensure colors are fully reset
    const resetSessions = defaultSessions.map(session => ({ ...session }));
    
    setClockSize(375);
    setSessions(resetSessions);
    setSelectedTimezone('America/New_York');
    setBackgroundBasedOnSession(false);
    setShowHandClock(true);
    setShowDigitalClock(true);
    setShowSessionLabel(true);
    setShowTimeToEnd(true);
    setShowTimeToStart(true);
    setShowSessionNamesInCanvas(true);
    setShowClockNumbers(true);
    setShowClockHands(true);
    setShowPastSessionsGray(false);
  };

  const toggleShowPastSessionsGray = () => {
    setShowPastSessionsGray((prev) => {
      const newValue = !prev;
      localStorage.setItem('showPastSessionsGray', newValue);
      if (user) saveSettingsToFirestore({ showPastSessionsGray: newValue });
      return newValue;
    });
  };

  const returnValue = {
    clockStyle,
    canvasSize,
    clockSize,
    sessions,
    selectedTimezone,
    updateClockSize,
    updateSessions,
    setSelectedTimezone,
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
    showClockNumbers,
    toggleShowClockNumbers,
    showClockHands,
    toggleShowClockHands,
    showPastSessionsGray,
    toggleShowPastSessionsGray,
    resetSettings,
  };
  
  return returnValue;
}

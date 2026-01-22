/**
 * src/services/customEventsService.js
 * 
 * Purpose: Firestore helpers for user custom reminder events with timezone-aware scheduling.
 * Key responsibility and main functionality: Create, update, delete, and query custom events,
 * while normalizing them for calendar + clock rendering and future calendar sync scalability.
 * 
 * Changelog:
 * v1.2.0 - 2026-01-21 - Add impact field to custom reminder payloads.
 * v1.1.0 - 2026-01-21 - Add custom color/icon fields to reminder payloads.
 * v1.0.0 - 2026-01-21 - Initial implementation for custom reminder events with BEP schema.
 */

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from '../firebase';
import { getUtcDateForTimezone } from '../utils/dateUtils';
import { formatRelativeLabel, NOW_WINDOW_MS } from '../utils/eventTimeEngine';
import { DEFAULT_CUSTOM_EVENT_COLOR, DEFAULT_CUSTOM_EVENT_ICON } from '../utils/customEventStyle';

const CUSTOM_EVENTS_COLLECTION = 'customEvents';
const CUSTOM_SOURCE = 'custom';

const normalizeReminderChannels = (channels = {}) => ({
  inApp: Boolean(channels.inApp),
  browser: Boolean(channels.browser),
  email: Boolean(channels.email),
  push: Boolean(channels.push),
});

const normalizeReminders = (reminders = []) => {
  if (!Array.isArray(reminders)) return [];
  return reminders
    .map((reminder) => {
      const minutesBefore = Number(reminder?.minutesBefore);
      if (!Number.isFinite(minutesBefore) || minutesBefore < 0) return null;
      return {
        minutesBefore,
        channels: normalizeReminderChannels(reminder.channels),
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.minutesBefore - b.minutesBefore);
};

const parseLocalDateTime = ({ localDate, localTime, timezone }) => {
  if (!localDate || !localTime || !timezone) return null;
  const [yearStr, monthStr, dayStr] = String(localDate).split('-');
  const [hourStr, minuteStr] = String(localTime).split(':');
  const year = Number(yearStr);
  const month = Number(monthStr) - 1;
  const day = Number(dayStr);
  const hour = Number(hourStr);
  const minute = Number(minuteStr);
  if ([year, month, day, hour, minute].some((value) => Number.isNaN(value))) return null;
  const utcDate = getUtcDateForTimezone(timezone, year, month, day, { hour, minute, second: 0, millisecond: 0 });
  return utcDate.getTime();
};

export const buildCustomEventPayload = (input = {}) => {
  const title = String(input.title || '').trim();
  const description = String(input.description || '').trim();
  const timezone = input.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
  const localDate = input.localDate || null;
  const localTime = input.localTime || null;
  const epochMs = parseLocalDateTime({ localDate, localTime, timezone });
  const customColor = input.customColor || DEFAULT_CUSTOM_EVENT_COLOR;
  const customIcon = input.customIcon || DEFAULT_CUSTOM_EVENT_ICON;
  const impact = input.impact || 'non-economic';

  return {
    title: title || 'Untitled reminder',
    description: description || null,
    timezone,
    localDate,
    localTime,
    epochMs,
    customColor,
    customIcon,
    impact,
    showOnClock: input.showOnClock !== false,
    reminders: normalizeReminders(input.reminders || []),
    source: CUSTOM_SOURCE,
    isCustom: true,
    externalId: input.externalId || null,
    syncProvider: input.syncProvider || null,
    lastSyncedAt: input.lastSyncedAt || null,
    updatedAt: serverTimestamp(),
  };
};

export const decorateCustomEventForDisplay = (event, nowEpochMs = Date.now()) => {
  if (!event) return event;
  const eventEpochMs = Number.isFinite(event.epochMs) ? event.epochMs : null;
  const relativeLabel = eventEpochMs
    ? formatRelativeLabel({ eventEpochMs, nowEpochMs, nowWindowMs: NOW_WINDOW_MS })
    : '';

  return {
    ...event,
    name: event.name || event.title || 'Custom reminder',
    description: event.description || null,
    date: event.date ?? eventEpochMs,
    time: event.time ?? eventEpochMs,
    currency: event.currency || '—',
    impact: event.impact || 'non-economic',
    customColor: event.customColor || DEFAULT_CUSTOM_EVENT_COLOR,
    customIcon: event.customIcon || DEFAULT_CUSTOM_EVENT_ICON,
    source: CUSTOM_SOURCE,
    isCustom: true,
    _displayCache: {
      isSpeech: false,
      actual: '—',
      forecast: '—',
      previous: '—',
      epochMs: eventEpochMs,
      strengthValue: event.impact || 'non-economic',
      relativeLabel,
    },
  };
};

const mapCustomEventDoc = (docSnap, nowEpochMs) => {
  const data = docSnap.data() || {};
  const base = {
    id: docSnap.id,
    title: data.title || 'Custom reminder',
    description: data.description || null,
    timezone: data.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
    localDate: data.localDate || null,
    localTime: data.localTime || null,
    epochMs: data.epochMs || null,
    customColor: data.customColor || DEFAULT_CUSTOM_EVENT_COLOR,
    customIcon: data.customIcon || DEFAULT_CUSTOM_EVENT_ICON,
    impact: data.impact || 'non-economic',
    showOnClock: data.showOnClock !== false,
    reminders: normalizeReminders(data.reminders || []),
    source: CUSTOM_SOURCE,
    isCustom: true,
    externalId: data.externalId || null,
    syncProvider: data.syncProvider || null,
    lastSyncedAt: data.lastSyncedAt || null,
    createdAt: data.createdAt || null,
    updatedAt: data.updatedAt || null,
  };

  return decorateCustomEventForDisplay(base, nowEpochMs);
};

export const subscribeToCustomEventsByRange = (userId, startDate, endDate, onChange, onError) => {
  if (!userId || !startDate || !endDate) return () => {};
  const startMs = startDate.getTime();
  const endMs = endDate.getTime();

  const eventsRef = collection(db, 'users', userId, CUSTOM_EVENTS_COLLECTION);
  const eventsQuery = query(
    eventsRef,
    where('epochMs', '>=', startMs),
    where('epochMs', '<=', endMs),
    orderBy('epochMs', 'asc')
  );

  return onSnapshot(
    eventsQuery,
    (snapshot) => {
      const nowEpochMs = Date.now();
      const events = snapshot.docs.map((docSnap) => mapCustomEventDoc(docSnap, nowEpochMs));
      onChange(events);
    },
    (error) => {
      if (onError) onError(error);
    }
  );
};

export const getCustomEventsByDateRange = async (userId, startDate, endDate) => {
  if (!userId || !startDate || !endDate) {
    return { success: true, data: [] };
  }

  const startMs = startDate.getTime();
  const endMs = endDate.getTime();
  const eventsRef = collection(db, 'users', userId, CUSTOM_EVENTS_COLLECTION);
  const eventsQuery = query(
    eventsRef,
    where('epochMs', '>=', startMs),
    where('epochMs', '<=', endMs),
    orderBy('epochMs', 'asc')
  );

  try {
    const { getDocs } = await import('firebase/firestore');
    const snapshot = await getDocs(eventsQuery);
    const nowEpochMs = Date.now();
    const events = snapshot.docs.map((docSnap) => mapCustomEventDoc(docSnap, nowEpochMs));
    return { success: true, data: events };
  } catch (error) {
    return { success: false, error: error.message || 'Failed to load custom events.' };
  }
};

export const addCustomEvent = async (userId, payload = {}) => {
  if (!userId) throw new Error('User must be authenticated to add a custom event.');
  const eventRef = collection(db, 'users', userId, CUSTOM_EVENTS_COLLECTION);
  const data = buildCustomEventPayload(payload);
  const docRef = await addDoc(eventRef, {
    ...data,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
};

export const updateCustomEvent = async (userId, eventId, payload = {}) => {
  if (!userId || !eventId) throw new Error('User must be authenticated to update a custom event.');
  const eventRef = doc(db, 'users', userId, CUSTOM_EVENTS_COLLECTION, eventId);
  const data = buildCustomEventPayload(payload);
  await updateDoc(eventRef, data);
};

export const deleteCustomEvent = async (userId, eventId) => {
  if (!userId || !eventId) throw new Error('User must be authenticated to delete a custom event.');
  const eventRef = doc(db, 'users', userId, CUSTOM_EVENTS_COLLECTION, eventId);
  await deleteDoc(eventRef);
};

/**
 * src/services/customEventsService.js
 * 
 * Purpose: Firestore helpers for user custom reminder events with timezone-aware scheduling.
 * Key responsibility and main functionality: Create, update, delete, and query custom events,
 * while normalizing them for calendar + clock rendering and future calendar sync scalability.
 * 
 * Changelog:
 * v1.4.1 - 2026-01-23 - Delete reminder doc when custom event reminders are removed.
 * v1.4.0 - 2026-01-23 - Add unified reminders sync to users/{uid}/reminders for custom events.
 * v1.3.0 - 2026-01-22 - Add recurring custom event support with range expansion and recurrence normalization.
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
import { getDatePartsInTimezone, getUtcDateForTimezone } from '../utils/dateUtils';
import { formatRelativeLabel, NOW_WINDOW_MS } from '../utils/eventTimeEngine';
import { DEFAULT_CUSTOM_EVENT_COLOR, DEFAULT_CUSTOM_EVENT_ICON } from '../utils/customEventStyle';
import { sortEventsByTime } from '../utils/newsApi';
import { buildEventKey, normalizeEventForReminder, normalizeReminders, normalizeReminderChannels } from '../utils/remindersRegistry';
import { deleteReminderForUser, upsertReminderForUser } from './remindersService';

const CUSTOM_EVENTS_COLLECTION = 'customEvents';
const CUSTOM_SOURCE = 'custom';
const MAX_OCCURRENCES_PER_RANGE = 5000;

const RECURRENCE_INTERVALS = {
  '5m': { unit: 'minute', step: 5, ms: 5 * 60 * 1000 },
  '15m': { unit: 'minute', step: 15, ms: 15 * 60 * 1000 },
  '30m': { unit: 'minute', step: 30, ms: 30 * 60 * 1000 },
  '1h': { unit: 'hour', step: 1, ms: 60 * 60 * 1000 },
  '4h': { unit: 'hour', step: 4, ms: 4 * 60 * 60 * 1000 },
  '1D': { unit: 'day', step: 1 },
  '1W': { unit: 'week', step: 1 },
  '1M': { unit: 'month', step: 1 },
  '1Q': { unit: 'quarter', step: 1 },
  '1Y': { unit: 'year', step: 1 },
};

const normalizeReminderChannelsWithEmail = (channels = {}) => ({
  ...normalizeReminderChannels(channels),
  email: Boolean(channels.email),
});

const normalizeRemindersWithEmail = (reminders = []) => (
  normalizeReminders(reminders).map((reminder) => ({
    ...reminder,
    channels: normalizeReminderChannelsWithEmail(reminder.channels),
  }))
);

const normalizeRecurrence = (recurrence = {}, timezone, localDate) => {
  const enabled = Boolean(recurrence?.enabled);
  if (!enabled) return { enabled: false };

  const interval = RECURRENCE_INTERVALS[recurrence?.interval] ? recurrence.interval : '1D';
  const endsType = recurrence?.ends?.type || 'never';
  const ends = { type: 'never', untilLocalDate: null, count: null };

  if (endsType === 'onDate') {
    const untilLocalDate = recurrence?.ends?.untilLocalDate || localDate || null;
    ends.type = 'onDate';
    ends.untilLocalDate = /^\d{4}-\d{2}-\d{2}$/.test(untilLocalDate || '') ? untilLocalDate : null;
  }

  if (endsType === 'after') {
    const count = Number(recurrence?.ends?.count);
    ends.type = 'after';
    ends.count = Number.isFinite(count) && count > 0 ? Math.floor(count) : 10;
  }

  return {
    enabled: true,
    interval,
    ends,
  };
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

const parseLocalDateParts = (localDate) => {
  if (!localDate) return null;
  const [yearStr, monthStr, dayStr] = String(localDate).split('-');
  const year = Number(yearStr);
  const month = Number(monthStr) - 1;
  const day = Number(dayStr);
  if ([year, month, day].some((value) => Number.isNaN(value))) return null;
  return { year, month, day };
};

const parseLocalTimeParts = (localTime) => {
  if (!localTime) return null;
  const [hourStr, minuteStr] = String(localTime).split(':');
  const hour = Number(hourStr);
  const minute = Number(minuteStr);
  if ([hour, minute].some((value) => Number.isNaN(value))) return null;
  return { hour, minute };
};

const getLocalTimePartsFromEpoch = (epochMs, timezone) => {
  if (!Number.isFinite(epochMs)) return null;
  try {
    const date = new Date(epochMs);
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    const parts = formatter.formatToParts(date);
    const hour = Number(parts.find((p) => p.type === 'hour')?.value);
    const minute = Number(parts.find((p) => p.type === 'minute')?.value);
    if ([hour, minute].some((value) => Number.isNaN(value))) return null;
    return { hour, minute };
  } catch {
    return null;
  }
};

const buildEpochFromLocalParts = (timezone, { year, month, day, hour, minute }) => {
  const utcDate = getUtcDateForTimezone(timezone, year, month, day, { hour, minute, second: 0, millisecond: 0 });
  return utcDate.getTime();
};

const addDaysToLocalDateParts = ({ year, month, day }, addDays) => {
  const base = new Date(Date.UTC(year, month, day));
  const next = new Date(base.getTime() + addDays * 24 * 60 * 60 * 1000);
  return { year: next.getUTCFullYear(), month: next.getUTCMonth(), day: next.getUTCDate() };
};

const addMonthsToLocalDateParts = ({ year, month, day }, addMonths) => {
  const totalMonths = month + addMonths;
  const nextYear = year + Math.floor(totalMonths / 12);
  const nextMonth = ((totalMonths % 12) + 12) % 12;
  const lastDay = new Date(Date.UTC(nextYear, nextMonth + 1, 0)).getUTCDate();
  return { year: nextYear, month: nextMonth, day: Math.min(day, lastDay) };
};

const getRecurrenceUntilEpoch = (recurrence, timezone, timeParts) => {
  if (recurrence?.ends?.type !== 'onDate') return null;
  const untilParts = parseLocalDateParts(recurrence?.ends?.untilLocalDate);
  if (!untilParts || !timeParts) return null;
  return buildEpochFromLocalParts(timezone, { ...untilParts, ...timeParts });
};

const expandRecurringEvent = ({ baseEvent, rangeStartMs, rangeEndMs, nowEpochMs }) => {
  const recurrence = baseEvent?.recurrence;
  if (!recurrence?.enabled) {
    const epochMs = Number.isFinite(baseEvent?.epochMs) ? baseEvent.epochMs : null;
    if (!epochMs || epochMs < rangeStartMs || epochMs > rangeEndMs) return [];
    return [decorateCustomEventForDisplay(baseEvent, nowEpochMs)];
  }

  const intervalMeta = RECURRENCE_INTERVALS[recurrence.interval];
  if (!intervalMeta) return [];

  const timezone = baseEvent.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
  const baseEpochMs = Number.isFinite(baseEvent?.epochMs)
    ? baseEvent.epochMs
    : parseLocalDateTime({ localDate: baseEvent.localDate, localTime: baseEvent.localTime, timezone });
  if (!baseEpochMs) return [];

  const seriesId = baseEvent.seriesId || baseEvent.id;
  const localDateParts = parseLocalDateParts(baseEvent.localDate)
    || getDatePartsInTimezone(timezone, new Date(baseEpochMs));
  const timeParts = parseLocalTimeParts(baseEvent.localTime)
    || getLocalTimePartsFromEpoch(baseEpochMs, timezone)
    || { hour: 0, minute: 0 };

  const untilEpochMs = getRecurrenceUntilEpoch(recurrence, timezone, timeParts);
  const maxCount = recurrence?.ends?.type === 'after' ? Math.max(1, Number(recurrence?.ends?.count || 1)) : Infinity;

  const occurrences = [];
  let generated = 0;

  if (intervalMeta.unit === 'minute' || intervalMeta.unit === 'hour') {
    const stepMs = intervalMeta.ms;
    const rawStartIndex = Math.ceil((rangeStartMs - baseEpochMs) / stepMs);
    const startIndex = Math.max(0, rawStartIndex);
    let maxIndex = Math.floor((rangeEndMs - baseEpochMs) / stepMs);
    if (untilEpochMs !== null) {
      maxIndex = Math.min(maxIndex, Math.floor((untilEpochMs - baseEpochMs) / stepMs));
    }
    if (Number.isFinite(maxCount)) {
      maxIndex = Math.min(maxIndex, maxCount - 1);
    }

    for (let idx = startIndex; idx <= maxIndex; idx += 1) {
      const occurrenceEpochMs = baseEpochMs + idx * stepMs;
      if (occurrenceEpochMs < rangeStartMs || occurrenceEpochMs > rangeEndMs) continue;
      const occurrenceId = `${seriesId}__${occurrenceEpochMs}`;
      occurrences.push(
        decorateCustomEventForDisplay(
          {
            ...baseEvent,
            id: occurrenceId,
            seriesId,
            occurrenceEpochMs,
            epochMs: occurrenceEpochMs,
            date: occurrenceEpochMs,
            time: occurrenceEpochMs,
          },
          nowEpochMs
        )
      );
      generated += 1;
      if (generated >= MAX_OCCURRENCES_PER_RANGE) break;
    }
    return occurrences;
  }

  const baseDateUtc = new Date(Date.UTC(localDateParts.year, localDateParts.month, localDateParts.day));
  const rangeStartParts = getDatePartsInTimezone(timezone, new Date(rangeStartMs));
  const rangeStartUtc = new Date(Date.UTC(rangeStartParts.year, rangeStartParts.month, rangeStartParts.day));
  const dayMs = 24 * 60 * 60 * 1000;

  let stepDays = 0;
  let stepMonths = 0;
  if (intervalMeta.unit === 'day') stepDays = intervalMeta.step;
  if (intervalMeta.unit === 'week') stepDays = intervalMeta.step * 7;
  if (intervalMeta.unit === 'month') stepMonths = intervalMeta.step;
  if (intervalMeta.unit === 'quarter') stepMonths = intervalMeta.step * 3;
  if (intervalMeta.unit === 'year') stepMonths = intervalMeta.step * 12;

  let startIndex = 0;
  if (stepDays > 0) {
    const diffDays = Math.floor((rangeStartUtc.getTime() - baseDateUtc.getTime()) / dayMs);
    startIndex = diffDays > 0 ? Math.floor(diffDays / stepDays) : 0;
  } else if (stepMonths > 0) {
    const diffMonths = (rangeStartParts.year - localDateParts.year) * 12 + (rangeStartParts.month - localDateParts.month);
    startIndex = diffMonths > 0 ? Math.floor(diffMonths / stepMonths) : 0;
  }

  let currentIndex = Math.max(0, startIndex);
  while (generated < MAX_OCCURRENCES_PER_RANGE) {
    let nextDateParts = localDateParts;
    if (stepDays > 0) {
      nextDateParts = addDaysToLocalDateParts(localDateParts, currentIndex * stepDays);
    }
    if (stepMonths > 0) {
      nextDateParts = addMonthsToLocalDateParts(localDateParts, currentIndex * stepMonths);
    }

    const occurrenceEpochMs = buildEpochFromLocalParts(timezone, { ...nextDateParts, ...timeParts });
    if (occurrenceEpochMs < rangeStartMs) {
      currentIndex += 1;
      continue;
    }
    if (occurrenceEpochMs > rangeEndMs) break;
    if (untilEpochMs !== null && occurrenceEpochMs > untilEpochMs) break;
    if (Number.isFinite(maxCount) && currentIndex >= maxCount) break;

    const occurrenceId = `${seriesId}__${occurrenceEpochMs}`;
    occurrences.push(
      decorateCustomEventForDisplay(
        {
          ...baseEvent,
          id: occurrenceId,
          seriesId,
          occurrenceEpochMs,
          epochMs: occurrenceEpochMs,
          date: occurrenceEpochMs,
          time: occurrenceEpochMs,
        },
        nowEpochMs
      )
    );

    generated += 1;
    currentIndex += 1;
  }

  return occurrences;
};

export const buildCustomEventPayload = (input = {}) => {
  const title = String(input.title || '').trim();
  const description = String(input.description || '').trim();
  const timezone = input.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
  const localDate = input.localDate || null;
  const localTime = input.localTime || null;
    const epochMs = parseLocalDateTime({ localDate, localTime, timezone });
    const reminders = normalizeRemindersWithEmail(input.reminders || []);
  const customColor = input.customColor || DEFAULT_CUSTOM_EVENT_COLOR;
  const customIcon = input.customIcon || DEFAULT_CUSTOM_EVENT_ICON;
  const impact = input.impact || 'non-economic';
  const recurrence = normalizeRecurrence(input.recurrence || {}, timezone, localDate);

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
      reminders,
    recurrence,
    recurrenceEnabled: Boolean(recurrence?.enabled),
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
    recurrence: event.recurrence || { enabled: false },
    seriesId: event.seriesId || event.id || null,
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
  const recurrence = normalizeRecurrence(data.recurrence || {}, data.timezone, data.localDate);
  const base = {
    id: docSnap.id,
    seriesId: docSnap.id,
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
      reminders: normalizeRemindersWithEmail(data.reminders || []),
    recurrence,
    recurrenceEnabled: Boolean(recurrence?.enabled),
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

  const recurringQuery = query(
    eventsRef,
    where('recurrenceEnabled', '==', true)
  );

  let rangeEvents = [];
  let recurringEvents = [];
  let hasRecurringSnapshot = false;

  const emit = () => {
    const nowEpochMs = Date.now();
    const baseEvents = hasRecurringSnapshot
      ? rangeEvents.filter((evt) => !evt.recurrence?.enabled)
      : rangeEvents;
    const recurringOccurrences = hasRecurringSnapshot
      ? recurringEvents.flatMap((evt) => expandRecurringEvent({ baseEvent: evt, rangeStartMs: startMs, rangeEndMs: endMs, nowEpochMs }))
      : [];
    const merged = sortEventsByTime([...(baseEvents || []), ...(recurringOccurrences || [])]);
    onChange(merged);
  };

  const unsubscribeRange = onSnapshot(
    eventsQuery,
    (snapshot) => {
      const nowEpochMs = Date.now();
      rangeEvents = snapshot.docs.map((docSnap) => mapCustomEventDoc(docSnap, nowEpochMs));
      emit();
    },
    (error) => {
      if (onError) onError(error);
    }
  );

  const unsubscribeRecurring = onSnapshot(
    recurringQuery,
    (snapshot) => {
      const nowEpochMs = Date.now();
      recurringEvents = snapshot.docs.map((docSnap) => mapCustomEventDoc(docSnap, nowEpochMs));
      hasRecurringSnapshot = true;
      emit();
    },
    (error) => {
      if (onError) onError(error);
    }
  );

  return () => {
    unsubscribeRange();
    unsubscribeRecurring();
  };
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
  const recurringQuery = query(
    eventsRef,
    where('recurrenceEnabled', '==', true)
  );

  try {
    const { getDocs } = await import('firebase/firestore');
    const [rangeSnapshot, recurringSnapshot] = await Promise.all([
      getDocs(eventsQuery),
      getDocs(recurringQuery),
    ]);
    const nowEpochMs = Date.now();
    const rangeEvents = rangeSnapshot.docs.map((docSnap) => mapCustomEventDoc(docSnap, nowEpochMs));
    const recurringEvents = recurringSnapshot.docs.map((docSnap) => mapCustomEventDoc(docSnap, nowEpochMs));
    const recurringOccurrences = recurringEvents.flatMap((evt) => expandRecurringEvent({ baseEvent: evt, rangeStartMs: startMs, rangeEndMs: endMs, nowEpochMs }));
    const merged = sortEventsByTime([
      ...rangeEvents.filter((evt) => !evt.recurrence?.enabled),
      ...recurringOccurrences,
    ]);
    return { success: true, data: merged };
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
  const reminderPayload = normalizeEventForReminder({
    event: {
      ...data,
      id: docRef.id,
      seriesId: docRef.id,
      isCustom: true,
    },
    source: CUSTOM_SOURCE,
    userId,
    reminders: data.reminders,
    metadata: {
      recurrence: data.recurrence,
      localDate: data.localDate,
      localTime: data.localTime,
      description: data.description,
      customColor: data.customColor,
      customIcon: data.customIcon,
      showOnClock: data.showOnClock,
      isCustom: true,
      seriesId: docRef.id,
    },
  });
  if (data.reminders.length > 0) {
    await upsertReminderForUser(userId, reminderPayload);
  }
  return docRef.id;
};

export const updateCustomEvent = async (userId, eventId, payload = {}) => {
  if (!userId || !eventId) throw new Error('User must be authenticated to update a custom event.');
  const eventRef = doc(db, 'users', userId, CUSTOM_EVENTS_COLLECTION, eventId);
  const data = buildCustomEventPayload(payload);
  await updateDoc(eventRef, data);
  const reminderPayload = normalizeEventForReminder({
    event: {
      ...data,
      id: eventId,
      seriesId: eventId,
      isCustom: true,
    },
    source: CUSTOM_SOURCE,
    userId,
    reminders: data.reminders,
    metadata: {
      recurrence: data.recurrence,
      localDate: data.localDate,
      localTime: data.localTime,
      description: data.description,
      customColor: data.customColor,
      customIcon: data.customIcon,
      showOnClock: data.showOnClock,
      isCustom: true,
      seriesId: eventId,
    },
  });
  if (data.reminders.length > 0) {
    await upsertReminderForUser(userId, reminderPayload);
  } else {
    await deleteReminderForUser(userId, reminderPayload.eventKey);
  }
};

export const deleteCustomEvent = async (userId, eventId) => {
  if (!userId || !eventId) throw new Error('User must be authenticated to delete a custom event.');
  const eventRef = doc(db, 'users', userId, CUSTOM_EVENTS_COLLECTION, eventId);
  await deleteDoc(eventRef);
  const reminderId = buildEventKey({ event: { id: eventId }, eventSource: CUSTOM_SOURCE });
  await deleteReminderForUser(userId, reminderId);
};

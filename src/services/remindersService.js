/**
 * src/services/remindersService.js
 * 
 * Purpose: Firestore helpers for unified reminder records and trigger deduping.
 * Key responsibility and main functionality: Store per-user reminders, update channel settings,
 * and persist notification trigger IDs for client-side reminder firing.
 * 
 * Changelog:
 * v1.2.0 - 2026-02-04 - BEP CRITICAL: Block push triggers in recordNotificationTrigger().
 *                       Server-side FCM exclusively handles push trigger creation. This 
 *                       safeguard ensures even old cached client code can't write push 
 *                       triggers that would block server-side FCM delivery.
 * v1.1.3 - 2026-01-23 - Fix: Encode eventKeys with slashes for safe Firestore document IDs.
 * v1.1.2 - 2026-01-24 - Add completion/error logging to deleteReminderForUser for debugging.
 * v1.1.1 - 2026-01-23 - Preserve reminder eventKey when saving to keep non-custom reminders stable.
 * v1.1.0 - 2026-01-23 - Persist reminder scope and series keys for series matching.
 * v1.0.0 - 2026-01-23 - Unified reminders persistence and trigger recording helpers.
 */

import {
    collection,
    doc,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp,
    setDoc,
    deleteDoc,
} from 'firebase/firestore';
import { db } from '../firebase';
import {
    aggregateReminderChannels,
    normalizeEventForReminder,
    normalizeReminders,
} from '../utils/remindersRegistry';

const REMINDERS_COLLECTION = 'reminders';
const TRIGGERS_COLLECTION = 'notificationTriggers';
const STORAGE_VERSION = 'v1';
const TRIGGERS_KEY = `t2t_unified_notification_triggers_${STORAGE_VERSION}`;

/**
 * Encode eventKey to make it safe for use as a Firestore document ID.
 * Firestore document IDs cannot contain forward slashes.
 * Uses base64url encoding (RFC 4648 §5) for safe, reversible encoding.
 */
const encodeFirestoreDocId = (id) => {
    if (!id) return id;
    try {
        // Base64url encoding with Unicode support (RFC 4648 §5)
        const bytes = new TextEncoder().encode(String(id));
        const binaryString = Array.from(bytes, (byte) => String.fromCharCode(byte)).join('');
        return btoa(binaryString).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
    } catch (error) {
        console.error('Error encoding doc ID:', error);
        // Fallback to URL encoding if btoa fails
        return encodeURIComponent(String(id));
    }
};

/**
 * Decode Firestore document ID back to original eventKey.
 */
const decodeFirestoreDocId = (encodedId) => {
    if (!encodedId) return encodedId;
    try {
        // Reverse base64url encoding with Unicode support
        let base64 = String(encodedId)
            .replace(/-/g, '+')
            .replace(/_/g, '/');
        // Add padding if needed
        while (base64.length % 4) {
            base64 += '=';
        }
        const binaryString = atob(base64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return new TextDecoder().decode(bytes);
    } catch (error) {
        // Fallback 1: Try URL decode
        try {
            return decodeURIComponent(encodedId);
        } catch {
            // Fallback 2: Return original (might be an old unencoded ID)
            return encodedId;
        }
    }
};

const readStore = (key) => {
    if (typeof window === 'undefined') return null;
    try {
        const raw = window.localStorage.getItem(key);
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
};

const writeStore = (key, value) => {
    if (typeof window === 'undefined') return;
    try {
        window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
        // Ignore storage failures
    }
};

const buildUserKey = (userId) => userId || 'guest';

const normalizeReminderDoc = (docSnap) => {
    const data = docSnap.data() || {};
    const reminders = normalizeReminders(data.reminders || []);
    return {
        id: docSnap.id,
        ...data,
        reminders,
        channels: aggregateReminderChannels(reminders),
        enabled: data.enabled !== false,
        scope: data.scope || 'event',
        seriesKey: data.seriesKey || null,
    };
};

export const subscribeToReminders = (userId, onChange, onError) => {
    if (!userId) return () => {};
    const remindersRef = collection(db, 'users', userId, REMINDERS_COLLECTION);
    const remindersQuery = query(remindersRef, orderBy('updatedAt', 'desc'));

    return onSnapshot(
        remindersQuery,
        (snapshot) => {
            const items = snapshot.docs.map((docSnap) => normalizeReminderDoc(docSnap));
            onChange(items);
        },
        (error) => {
            if (onError) onError(error);
        }
    );
};

export const subscribeToReminder = (userId, reminderId, onChange, onError) => {
    if (!userId || !reminderId) return () => {};
    const encodedReminderId = encodeFirestoreDocId(reminderId);
    const reminderRef = doc(db, 'users', userId, REMINDERS_COLLECTION, String(encodedReminderId));
    return onSnapshot(
        reminderRef,
        (snapshot) => {
            if (!snapshot.exists()) {
                onChange(null);
                return;
            }
            onChange(normalizeReminderDoc(snapshot));
        },
        (error) => {
            if (onError) onError(error);
        }
    );
};

export const upsertReminderForUser = async (userId, reminder) => {
    if (!userId) throw new Error('User must be authenticated to save reminders.');
    const normalizedReminders = normalizeReminders(reminder?.reminders ?? []);
    const channels = aggregateReminderChannels(normalizedReminders);
    const normalized = reminder?.eventKey
        ? {
            ...reminder,
            reminders: normalizedReminders,
            channels,
            enabled: reminder?.enabled !== false,
            scope: reminder?.scope || reminder?.metadata?.scope || 'event',
            seriesKey: reminder?.seriesKey || null,
        }
        : normalizeEventForReminder({
            event: reminder,
            source: reminder?.eventSource,
            userId,
            reminders: reminder?.reminders,
            enabled: reminder?.enabled,
            metadata: reminder?.metadata,
        });

    const reminderId = normalized.eventKey;
    if (!reminderId) throw new Error('Unable to determine reminder identifier.');

    const encodedReminderId = encodeFirestoreDocId(reminderId);
    const reminderRef = doc(db, 'users', userId, REMINDERS_COLLECTION, String(encodedReminderId));

    await setDoc(
        reminderRef,
        {
            userId,
            eventKey: normalized.eventKey,
            eventSource: normalized.eventSource,
            eventEpochMs: normalized.eventEpochMs || null,
            title: normalized.title,
            impact: normalized.impact,
            timezone: normalized.timezone,
            reminders: normalized.reminders,
            channels: normalized.channels,
            enabled: normalized.enabled !== false,
            scope: normalized.scope || 'event',
            seriesKey: normalized.seriesKey || null,
            metadata: normalized.metadata || {},
            updatedAt: serverTimestamp(),
            createdAt: reminder?.createdAt || serverTimestamp(),
        },
        { merge: true }
    );

    return reminderId;
};

export const deleteReminderForUser = async (userId, reminderId) => {
    if (!userId || !reminderId) {
        // eslint-disable-next-line no-console
        console.warn('[reminders] deleteReminderForUser skipped - missing userId or reminderId');
        return;
    }
    const encodedReminderId = encodeFirestoreDocId(reminderId);
    const reminderRef = doc(db, 'users', userId, REMINDERS_COLLECTION, String(encodedReminderId));
    try {
        await deleteDoc(reminderRef);
    } catch (err) {
        // eslint-disable-next-line no-console
        console.error('[reminders] deleteReminderForUser FAILED', { reminderId, error: err?.message });
        throw err;
    }
};

export const buildTriggerId = ({ eventKey, occurrenceEpochMs, minutesBefore, channel }) => (
    `${eventKey}__${occurrenceEpochMs}__${minutesBefore}__${channel}`
);

export const loadLocalTriggerIds = (userId) => {
    const store = readStore(TRIGGERS_KEY) || {};
    const list = store[buildUserKey(userId)] || [];
    return new Set(list);
};

export const saveLocalTriggerIds = (userId, triggers) => {
    const store = readStore(TRIGGERS_KEY) || {};
    store[buildUserKey(userId)] = Array.from(triggers);
    writeStore(TRIGGERS_KEY, store);
};

export const recordNotificationTrigger = async (userId, triggerId, payload = {}) => {
    // BEP CRITICAL: NEVER write push triggers from client - server-side FCM handles these
    // This safeguard prevents old cached code from blocking server-side FCM delivery
    if (payload.channel === 'push') {
        console.warn('[recordNotificationTrigger] ⚠️ Blocked push trigger write - server handles push');
        return;
    }

    const nextPayload = {
        ...payload,
        updatedAt: serverTimestamp(),
        createdAt: payload.createdAt || serverTimestamp(),
    };

    if (!userId) return;

    const encodedTriggerId = encodeFirestoreDocId(triggerId);
    const triggerRef = doc(db, 'users', userId, TRIGGERS_COLLECTION, String(encodedTriggerId));
    await setDoc(triggerRef, nextPayload, { merge: true });
};

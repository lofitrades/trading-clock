/**
 * src/services/notificationsService.js
 * 
 * Purpose: Firestore-backed notification persistence for custom reminders.
 * Key responsibility and main functionality: Store, retrieve, and manage notification history
 * with per-user Firestore subcollections, while keeping localStorage fallback for guests.
 * 
 * Changelog:
 * v1.5.0 - 2026-01-23 - Remove console.log statements to avoid production logging noise.
 * v1.4.0 - 2026-01-23 - CLEANUP: Remove debug console.log statements (subscription setup, snapshot count). Keep only console.error for error diagnostics.
 * v1.3.0 - 2026-01-23 - BEP FIX: Add console.log to subscribeToNotifications for debugging session persistence. Logs subscription setup, snapshot count, and detailed error info including index error detection.
 * v1.2.0 - 2026-01-23 - BEP FIX: Add console.error logging to addNotificationForUser, markNotificationReadForUser, markAllNotificationsReadForUser, and clearNotificationsForUser for debugging Firestore failures. Ensures all database errors are visible in console.
 * v1.1.0 - 2026-01-22 - BEP: Move authenticated notification storage to Firestore with read/deleted status management.
 * v1.0.0 - 2026-01-21 - Initial implementation for custom event notification storage.
 */

import {
  collection,
  doc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../firebase';

const STORAGE_VERSION = 'v1';
const NOTIFICATIONS_KEY = `t2t_custom_notifications_${STORAGE_VERSION}`;
const TRIGGERS_KEY = `t2t_custom_notification_triggers_${STORAGE_VERSION}`;
const NOTIFICATIONS_LIMIT = 200;

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
    // Ignore write failures (private mode, quota, etc.)
  }
};

const buildUserKey = (userId) => userId || 'guest';

const toNotificationStatus = (data = {}) => {
  if (data.deleted) return 'deleted';
  if (data.read) return 'read';
  return 'unread';
};

const normalizeNotificationDoc = (docSnap) => {
  const data = docSnap.data() || {};
  return {
    id: docSnap.id,
    ...data,
    read: Boolean(data.read),
    deleted: Boolean(data.deleted),
    status: data.status || toNotificationStatus(data),
  };
};

export const loadLocalNotifications = (userId) => {
  const store = readStore(NOTIFICATIONS_KEY) || {};
  return store[buildUserKey(userId)] || [];
};

export const saveLocalNotifications = (userId, notifications) => {
  const store = readStore(NOTIFICATIONS_KEY) || {};
  store[buildUserKey(userId)] = notifications;
  writeStore(NOTIFICATIONS_KEY, store);
};

export const addLocalNotification = (userId, notification) => {
  const current = loadLocalNotifications(userId);
  const next = [notification, ...current].slice(0, NOTIFICATIONS_LIMIT);
  saveLocalNotifications(userId, next);
  return next;
};

export const markLocalNotificationRead = (userId, notificationId) => {
  const current = loadLocalNotifications(userId);
  const next = current.map((item) =>
    item.id === notificationId ? { ...item, read: true, status: 'read' } : item
  );
  saveLocalNotifications(userId, next);
  return next;
};

export const markAllLocalNotificationsRead = (userId) => {
  const current = loadLocalNotifications(userId);
  const next = current.map((item) => ({ ...item, read: true, status: 'read' }));
  saveLocalNotifications(userId, next);
  return next;
};

export const clearLocalNotifications = (userId) => {
  saveLocalNotifications(userId, []);
  return [];
};

export const subscribeToNotifications = (userId, onChange, onError) => {
  if (!userId) return () => {};
  
  const notificationsRef = collection(db, 'users', userId, 'notifications');
  const notificationsQuery = query(
    notificationsRef,
    orderBy('sentAtMs', 'desc'),
    limit(NOTIFICATIONS_LIMIT)
  );

  return onSnapshot(
    notificationsQuery,
    (snapshot) => {
      const items = snapshot.docs.map((docSnap) => normalizeNotificationDoc(docSnap));
      onChange(items);
    },
    (error) => {
      console.error('❌ Firestore notification subscription error:', {
        code: error?.code,
        message: error?.message,
      });
      if (onError) onError(error);
    }
  );
};

export const addNotificationForUser = async (userId, notification) => {
  if (!userId) throw new Error('User must be authenticated to add notifications.');
  const notificationsRef = collection(db, 'users', userId, 'notifications');
  const docId = notification?.id
    ? String(notification.id)
    : doc(notificationsRef).id;
  const notificationRef = doc(db, 'users', userId, 'notifications', docId);

  try {
    await runTransaction(db, async (transaction) => {
      const existing = await transaction.get(notificationRef);
      if (existing.exists()) {
        return;
      }

      transaction.set(notificationRef, {
        eventId: notification?.eventId || null,
        eventKey: notification?.eventKey || null,
        eventSource: notification?.eventSource || null,
        title: notification?.title || 'Reminder',
        message: notification?.message || null,
        eventTime: notification?.eventTime || null,
        impact: notification?.impact || null,
        impactLabel: notification?.impactLabel || null,
        minutesBefore: Number.isFinite(notification?.minutesBefore) ? notification.minutesBefore : null,
        eventEpochMs: Number.isFinite(notification?.eventEpochMs) ? notification.eventEpochMs : null,
        scheduledForMs: Number.isFinite(notification?.scheduledForMs) ? notification.scheduledForMs : null,
        sentAtMs: Number.isFinite(notification?.sentAtMs) ? notification.sentAtMs : Date.now(),
        channel: notification?.channel || 'inApp',
        read: false,
        deleted: false,
        status: 'unread',
        readAt: null,
        deletedAt: null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    });
  } catch (error) {
    console.error('❌ Failed to save notification to Firestore:', {
      userId,
      docId,
      error: error?.message,
      code: error?.code,
      stack: error?.stack,
    });
    throw error;
  }

  return docId;
};

export const markNotificationReadForUser = async (userId, notificationId) => {
  if (!userId || !notificationId) return;
  const notificationRef = doc(db, 'users', userId, 'notifications', String(notificationId));
  try {
    await updateDoc(notificationRef, {
      read: true,
      status: 'read',
      readAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('❌ Failed to mark notification as read:', {
      userId,
      notificationId,
      error: error?.message,
      code: error?.code,
    });
    throw error;
  }
};

export const markAllNotificationsReadForUser = async (userId) => {
  if (!userId) return;
  const notificationsRef = collection(db, 'users', userId, 'notifications');
  try {
    const snapshot = await getDocs(query(notificationsRef, where('read', '==', false)));
    if (snapshot.empty) {
      return;
    }

    const batch = writeBatch(db);
    snapshot.docs.forEach((docSnap) => {
      batch.update(docSnap.ref, {
        read: true,
        status: 'read',
        readAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    });
    await batch.commit();
  } catch (error) {
    console.error('❌ Failed to mark all notifications as read:', {
      userId,
      error: error?.message,
      code: error?.code,
    });
    throw error;
  }
};

export const clearNotificationsForUser = async (userId) => {
  if (!userId) return;
  const notificationsRef = collection(db, 'users', userId, 'notifications');
  try {
    const snapshot = await getDocs(query(notificationsRef, where('deleted', '==', false)));
    if (snapshot.empty) {
      return;
    }

    const batch = writeBatch(db);
    snapshot.docs.forEach((docSnap) => {
      batch.update(docSnap.ref, {
        deleted: true,
        status: 'deleted',
        deletedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    });
    await batch.commit();
  } catch (error) {
    console.error('❌ Failed to clear notifications:', {
      userId,
      error: error?.message,
      code: error?.code,
    });
    throw error;
  }
};

export const loadTriggers = (userId) => {
  const store = readStore(TRIGGERS_KEY) || {};
  return new Set(store[buildUserKey(userId)] || []);
};

export const saveTriggers = (userId, triggers) => {
  const store = readStore(TRIGGERS_KEY) || {};
  store[buildUserKey(userId)] = Array.from(triggers);
  writeStore(TRIGGERS_KEY, store);
};

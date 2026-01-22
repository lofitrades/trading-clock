/**
 * src/services/notificationsService.js
 * 
 * Purpose: Lightweight in-app notification persistence for custom reminders.
 * Key responsibility and main functionality: Store, retrieve, and manage notification history
 * using localStorage with per-user scoping for custom event alerts.
 * 
 * Changelog:
 * v1.0.0 - 2026-01-21 - Initial implementation for custom event notification storage.
 */

const STORAGE_VERSION = 'v1';
const NOTIFICATIONS_KEY = `t2t_custom_notifications_${STORAGE_VERSION}`;
const TRIGGERS_KEY = `t2t_custom_notification_triggers_${STORAGE_VERSION}`;

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

export const loadNotifications = (userId) => {
  const store = readStore(NOTIFICATIONS_KEY) || {};
  return store[buildUserKey(userId)] || [];
};

export const saveNotifications = (userId, notifications) => {
  const store = readStore(NOTIFICATIONS_KEY) || {};
  store[buildUserKey(userId)] = notifications;
  writeStore(NOTIFICATIONS_KEY, store);
};

export const addNotification = (userId, notification) => {
  const current = loadNotifications(userId);
  const next = [notification, ...current].slice(0, 200);
  saveNotifications(userId, next);
  return next;
};

export const markNotificationRead = (userId, notificationId) => {
  const current = loadNotifications(userId);
  const next = current.map((item) =>
    item.id === notificationId ? { ...item, read: true } : item
  );
  saveNotifications(userId, next);
  return next;
};

export const markAllNotificationsRead = (userId) => {
  const current = loadNotifications(userId);
  const next = current.map((item) => ({ ...item, read: true }));
  saveNotifications(userId, next);
  return next;
};

export const clearNotifications = (userId) => {
  saveNotifications(userId, []);
  return [];
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

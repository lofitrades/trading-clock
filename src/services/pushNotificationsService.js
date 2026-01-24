/**
 * src/services/pushNotificationsService.js
 * 
 * Purpose: Firebase Cloud Messaging helpers for web/PWA push tokens.
 * Key responsibility and main functionality: Request notification permission, register
 * the service worker, obtain/store FCM tokens, and clean up invalid tokens on logout.
 * 
 * Changelog:
 * v1.1.0 - 2026-01-23 - Add detailed token request statuses and resilient service worker readiness.
 * v1.0.0 - 2026-01-23 - Initial FCM token registration and persistence helpers.
 */

import {
  getMessaging,
  getToken,
  isSupported,
  onMessage,
} from 'firebase/messaging';
import { db } from '../firebase';
import { collection, deleteDoc, doc, serverTimestamp, setDoc } from 'firebase/firestore';

const TOKENS_COLLECTION = 'deviceTokens';

const isBrowserSupported = async () => {
  try {
    return await isSupported();
  } catch {
    return false;
  }
};

const waitForServiceWorkerReady = async (timeoutMs = 2500) => {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return null;
  try {
    const ready = await Promise.race([
      navigator.serviceWorker.ready,
      new Promise((resolve) => setTimeout(() => resolve(null), timeoutMs)),
    ]);
    return ready || null;
  } catch {
    return null;
  }
};

const getServiceWorkerRegistration = async () => {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return null;

  try {
    const existing = await navigator.serviceWorker.getRegistration();
    if (existing) return existing;
  } catch {
    // Ignore and attempt to register below
  }

  const isSecure = typeof window !== 'undefined'
    && (window.location.protocol === 'https:' || window.location.hostname === 'localhost');

  if (!isSecure) return null;

  try {
    const registration = await navigator.serviceWorker.register('/sw.js');
    const ready = await waitForServiceWorkerReady();
    return ready || registration || null;
  } catch {
    return null;
  }
};

const getMessagingInstance = async () => {
  const supported = await isBrowserSupported();
  if (!supported) return null;
  try {
    return getMessaging();
  } catch {
    return null;
  }
};

export const requestPushPermission = async () => {
  if (typeof Notification === 'undefined') return 'unsupported';
  if (Notification.permission === 'granted') return 'granted';
  if (Notification.permission === 'denied') return 'denied';

  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch {
    return 'denied';
  }
};

export const requestFcmTokenForUser = async (userId) => {
  if (!userId) return { token: null, status: 'auth-required' };
  if (typeof Notification === 'undefined') return { token: null, status: 'unsupported' };

  const permission = await requestPushPermission();
  if (permission !== 'granted') {
    return { token: null, status: permission === 'default' ? 'permission-default' : permission };
  }

  const messaging = await getMessagingInstance();
  if (!messaging) return { token: null, status: 'unsupported' };

  const registration = await getServiceWorkerRegistration();
  if (!registration) return { token: null, status: 'service-worker' };

  const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
  if (!vapidKey) return { token: null, status: 'missing-vapid' };

  try {
    const token = await getToken(messaging, { vapidKey, serviceWorkerRegistration: registration });
    if (!token) return { token: null, status: 'token-missing' };

    const tokenRef = doc(collection(db, 'users', userId, TOKENS_COLLECTION), token);
    await setDoc(tokenRef, {
      token,
      platform: 'web',
      enabled: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastSeenAt: serverTimestamp(),
    }, { merge: true });

    return { token, status: 'granted' };
  } catch {
    return { token: null, status: 'token-error' };
  }
};

export const registerFcmTokenForUser = async (userId) => {
  const result = await requestFcmTokenForUser(userId);
  return result?.token || null;
};

export const unregisterFcmTokenForUser = async (userId) => {
  if (!userId) return;
  const messaging = await getMessagingInstance();
  if (!messaging) return;

  try {
    const registration = await getServiceWorkerRegistration();
    if (!registration) return;

    const token = await getToken(messaging, {
      vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
      serviceWorkerRegistration: registration,
    });

    if (!token) return;
    const tokenRef = doc(db, 'users', userId, TOKENS_COLLECTION, token);
    await deleteDoc(tokenRef);
  } catch {
    // Silent fail - token cleanup best-effort
  }
};

export const initFcmForegroundListener = async (onMessageReceived) => {
  const messaging = await getMessagingInstance();
  if (!messaging || !onMessageReceived) return () => {};
  return onMessage(messaging, (payload) => {
    onMessageReceived(payload);
  });
};

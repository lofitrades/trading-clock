/* global importScripts */
/**
 * public/sw.js
 * 
 * Purpose: Minimal service worker to meet PWA installability requirements and provide basic offline caching of the app shell and icons.
 * Key responsibility and main functionality: Caches core assets on install, cleans up old caches on activate, and serves cached responses with a network-first strategy.
 * 
 * Changelog:
 * v1.1.0 - 2026-01-23 - Add Firebase Cloud Messaging background notification handling for PWA push.
 * v1.0.0 - 2025-12-17 - Initial service worker with cache priming and network-first fetch handler.
 */

const CACHE_NAME = 't2t-shell-v1';
const CORE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/favicon.ico',
  '/faviconDark.ico',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

let messaging = null;

const ensureMessaging = () => {
  if (messaging) return messaging;
  try {
    importScripts('https://www.gstatic.com/firebasejs/11.10.0/firebase-app-compat.js');
    importScripts('https://www.gstatic.com/firebasejs/11.10.0/firebase-messaging-compat.js');
    importScripts('/__/firebase/init.js');
    if (self.firebase && self.firebase.messaging) {
      messaging = self.firebase.messaging();
    }
  } catch {
    messaging = null;
  }
  return messaging;
};

const handleBackgroundMessage = () => {
  const instance = ensureMessaging();
  if (!instance || !instance.onBackgroundMessage) return;

  instance.onBackgroundMessage((payload) => {
    const notification = payload?.notification || {};
    const data = payload?.data || {};
    const title = notification.title || data.title || 'Reminder';
    const body = notification.body || data.body || '';
    const icon = notification.icon || '/icons/icon-192.png';
    const tag = data.tag || `t2t-${data.eventKey || 'reminder'}`;

    self.registration.showNotification(title, {
      body,
      icon,
      tag,
      data,
    });
  });
};

handleBackgroundMessage();

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(CORE_ASSETS))
      .catch(() => Promise.resolve())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const requestUrl = new URL(event.request.url);

  if (requestUrl.origin !== self.location.origin) {
    event.respondWith(
      fetch(event.request).catch(() => caches.match('/index.html'))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request)
        .then((response) => {
          if (
            !response ||
            response.status !== 200 ||
            response.type !== 'basic'
          ) {
            return response;
          }

          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });

          return response;
        })
        .catch(() => caches.match('/index.html'));
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification?.data?.clickUrl || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes(targetUrl) && 'focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
      return undefined;
    })
  );
});

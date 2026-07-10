// Basic service worker for PWA manifest compliance
// No fetch handler = browser handles all requests normally
self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// No fetch event listener - let the browser handle all requests
// This prevents errors while still satisfying PWA requirements

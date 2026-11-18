/* Daman Fleet P&L — minimal service worker.
   Purpose: PWA installability (Add to Home Screen / mobile app) ONLY.
   NO caching of the app or data — dashboard hamesha live/fresh data dikhaye,
   isliye har request network se jaati hai (stale data ka risk nahi). */
self.addEventListener('install', function(e){ self.skipWaiting(); });
self.addEventListener('activate', function(e){ e.waitUntil(self.clients.claim()); });
self.addEventListener('fetch', function(e){
  // respondWith nahi call karte → browser default (network) fetch karega. Always fresh.
});

importScripts("precache-manifest.ae35934d0e0127203ffb01f64d2bfaba.js", "https://storage.googleapis.com/workbox-cdn/releases/4.3.1/workbox-sw.js");

/* global workbox */

workbox.setConfig({
  debug: false
});
workbox.precaching.precacheAndRoute(self.__precacheManifest);

self.addEventListener("install", event => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", event => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});


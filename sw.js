importScripts("precache-manifest.abe49f1456c3f3dd51dfc4a82883228a.js", "https://storage.googleapis.com/workbox-cdn/releases/4.0.0/workbox-sw.js");

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
            .catch(() => caches.match("index.html"))
    );
});


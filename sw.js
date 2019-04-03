importScripts("precache-manifest.7da8f6f2874ec7e3676252b1bbbcbe49.js", "https://storage.googleapis.com/workbox-cdn/releases/4.1.1/workbox-sw.js");

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


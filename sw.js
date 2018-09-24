importScripts("precache-manifest.85ac23c40ba9d0714b2e5a4642f6fd90.js", "https://storage.googleapis.com/workbox-cdn/releases/3.6.1/workbox-sw.js");

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
    if (event.request.url.startsWith("https://lastfm-img2.akamaized.net")) {
        event.respondWith(cacheRequest(event.request, "local-files-artwork-cache"));
    }
    else if (event.request.url.startsWith("https://i.ytimg.com")) {
        event.respondWith(cacheRequest(event.request, "youtube-thumbnail-cache"));
    }
    else {
        event.respondWith(
            caches.match(event.request)
                .then(response => response || fetch(event.request))
                .catch(() => caches.match("index.html"))
        );
    }
});

function cacheRequest(request, cacheName) {
    return caches.open(cacheName).then(cache => {
        return cache.match(request).then(response => {
            if (response) {
                return response;
            }
            return fetch(request.clone()).then(response => {
                cache.put(request, response.clone());
                return response;
            });
        }).catch(error => {
            console.log(error);
        });
    });
}


const cacheName = "veery-46";
const toCache = [
    "./index.html",
    "./main.css",
    "./main.js",
    "./vendor.js",
    "./ww.js",
    "./0.js",
    "./1.js",
    "./2.js",
    "./3.js",
    "./4.js",
    "./assets/images/album-art-placeholder.png",
    "./assets/images/main-icon.png",
    "./assets/images/ring-alt.svg",
    "./libs/dexie.min.js"
];

self.addEventListener("install", event => {
    event.waitUntil(
        caches.open(cacheName)
            .then(cache => cache.addAll(toCache))
            .then(() => self.skipWaiting())
            .catch(error => console.log(error))
    );
});

self.addEventListener("activate", event => {
    event.waitUntil(self.clients.claim());
    event.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(keys.map(key => {
                if (key.startsWith("veery") && key !== cacheName) {
                    return caches.delete(key);
                }
                return key;
            }));
        })
    );
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

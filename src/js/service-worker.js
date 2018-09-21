import { dispatchCustomEvent } from "./utils.js";

function removeServiceWorkerCache(cacheId) {
    if (!cacheId) {
        return;
    }
    caches.keys().then(keys => {
        keys.forEach(key => {
            if (key === cacheId) {
                caches.delete(key);
            }
        });
    });
}

function registerServiceWorker() {
    navigator.serviceWorker.register("./sw.js").then(reg => {
        reg.onupdatefound = () => {
            const worker = reg.installing;

            worker.onstatechange = () => {
                if (worker.state === "installed" && navigator.serviceWorker.controller) {
                    dispatchCustomEvent("sw-state-change", "update");
                }
            };
        };
    }).catch(console.log);
}

if ("serviceWorker" in navigator) {
    window.addEventListener("load", registerServiceWorker);
}

export {
    removeServiceWorkerCache
}

import { dispatchCustomEvent } from "./utils.js";

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
    registerServiceWorker();
}

import { dispatchCustomEvent } from "./utils.js";

window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").then(reg => {
        reg.onupdatefound = () => {
            const worker = reg.installing;

            worker.onstatechange = () => {
                if (worker.state === "installed") {
                    dispatchCustomEvent("sw-state-change", navigator.serviceWorker.controller ? "update" : "init");
                }
            };
        };
    }).catch(console.log);
});


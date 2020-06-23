import { dispatchCustomEvent } from "./utils.js";

if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
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

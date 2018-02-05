import { dispatchCustomEvent } from "./utils.js";

const routes = [];

function contains(hash) {
    return routes.some(route => route === hash);
}

function isRouteActive(route) {
    return window.location.hash.includes(route);
}

function addRoute(route) {
    if (!contains(route)) {
        routes.push(route);
    }
}

function toggleRoute(route) {
    window.location.hash = `/${route}`;
}

function showCurrentRoute() {
    const hash = window.location.hash.slice(2).replace(/\/+$/g, "");
    let isPlaylistTab = false;
    let tabId = "home";

    if (hash && !contains(hash)) {
        tabId = "not-found";
    }
    else {
        isPlaylistTab = hash.startsWith("playlist/");
        tabId = isPlaylistTab ? hash.split("playlist/")[1] : tabId;
    }
    dispatchCustomEvent("route-change", {
        tabId,
        isPlaylistTab
    });
}

window.addEventListener("hashchange", showCurrentRoute);

export {
    addRoute,
    toggleRoute,
    showCurrentRoute,
    isRouteActive
};

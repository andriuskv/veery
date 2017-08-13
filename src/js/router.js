import { dispatchCustomEvent } from "./utils.js";

const routes = [
    "home"
];

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

function toggleRouteTab(route) {
    if (!contains(route)) {
        toggleRoute("home");
        return;
    }
    const isPlaylistTab = route.startsWith("playlist/");
    const tabId = isPlaylistTab ? route.split("playlist/")[1] : route;

    dispatchCustomEvent("route-change", {
        tabId,
        isPlaylistTab
    });
}

function toggleCurrentRoute() {
    const route = window.location.hash.slice(2);

    toggleRouteTab(route);
}

window.addEventListener("hashchange", () => {
    const route = window.location.hash.slice(2);

    if (route) {
        toggleRouteTab(route);
    }
    else {
        history.back();
    }
});

export {
    addRoute,
    toggleRoute,
    toggleCurrentRoute,
    isRouteActive
};

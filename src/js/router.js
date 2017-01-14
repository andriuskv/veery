import { dispatchCustomEvent } from "./main.js";

const routes = [
    "manage",
    "404"
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
    if (!route) {
        toggleRoute("manage");
        return;
    }
    if (route !== "404" && !contains(route)) {
        toggleRoute("404");
        return;
    }
    const isPlaylistTab = route.startsWith("playlist/");
    const tabId = isPlaylistTab ? route.split("playlist/")[1] : route;

    dispatchCustomEvent("route-change", {
        tabId,
        isPlaylistTab,
        isValid: tabId !== "404"
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

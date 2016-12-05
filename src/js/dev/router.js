import { dispatchEvent } from "./main.js";

const routes = [
    "manage",
    "404"
];

function contains(hash) {
    return routes.some(route => route === hash);
}

function isActive(route) {
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
    const tabName = isPlaylistTab ? route.split("playlist/")[1] : route;

    dispatchEvent("route-change", {
        tabName,
        isPlaylistTab,
        isInvalid: tabName === "404"
    });
}

function toggleCurrentRoute() {
    const route = window.location.hash.slice(2);

    toggleRouteTab(route);
}

window.addEventListener("hashchange", event => {
    const route = event.newURL.split("#/")[1];

    if (route) {
        toggleRouteTab(route);
    }
    else {
        history.back();
    }
});

export {
    addRoute as add,
    toggleRoute as toggle,
    toggleCurrentRoute as toggleCurrent,
    isActive
};

import * as main from "./main.js";

const routes = [
    "add",
    "404"
];

function contains(hash) {
    return routes.some(route => route === hash);
}

function isActive(route) {
    return window.location.hash.includes(route);
}

function isPlaylistRoute(route) {
    return /^playlist\/.+/.test(route);
}

function addRoute(route) {
    if (!contains(route)) {
        routes.push(route);
    }
}

function toggleRoute(route) {
    window.location.hash = `/${route}`;
}

function toggleTab(route) {
    let tab = "";

    if (!route) {
        toggleRoute("add");
        return;
    }
    if (route !== "404" && !contains(route)) {
        toggleRoute("404");
        return;
    }

    if (isPlaylistRoute(route)) {
        tab = route.slice(route.lastIndexOf("/") + 1);
    }
    else {
        tab = route.replace(/\//g, "-");
    }

    if (tab && document.getElementById(`js-tab-${tab}`)) {
        main.toggleTab(tab, tab === "404");
    }
}

function toggleCurrentRoute() {
    const route = window.location.hash.slice(2);

    toggleTab(route);
}

window.addEventListener("hashchange", event => {
    const route = event.newURL.split("#/")[1];

    toggleTab(route);
});

export {
    addRoute as add,
    toggleRoute as toggle,
    toggleCurrentRoute as toggleCurrent,
    isActive
};

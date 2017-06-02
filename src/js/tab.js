/* global gapi */

import { renderPlaylist, changePlaylistType, togglePlaylistTypeBtn } from "./playlist/playlist.view.js";
import { scriptLoader, removeElementClass, getElementById, getElementByAttr, dispatchCustomEvent } from "./utils.js";
import { getSidebarEntry } from "./sidebar.js";
import { togglePanel } from "./panels.js";
import { getPlaylistById } from "./playlist/playlist.js";
import { enableTrackSelection } from "./playlist/playlist.track-selection.js";
import { setSortOptions, createSortPanel, changePlaylistOrder } from "./playlist/playlist.sorting.js";
import { createMoveToPanel } from "./playlist/playlist.move-to.js";
import { resetFilteredPlaylist } from "./playlist/playlist.filter.js";

let visiblePlaylistId = "";
let googleAuthInitialized = false;

function setVisiblePlaylistId(id = "") {
    visiblePlaylistId = id;
}

function getVisiblePlaylistId() {
    return visiblePlaylistId;
}

function updatePlaylistStatus(playlistId) {
    const element = getElementById("js-playlist-status-container");

    if (element) {
        const id = element.getAttribute("data-id");

        if (id === playlistId) {
            element.classList.add("visible");
        }
        else {
            element.classList.remove("visible");
        }
    }
}

function toggleToPlaylistTab(id, isSmallestBreakpoint) {
    const pl = getPlaylistById(id);

    if (!pl.rendered) {
        renderPlaylist(pl);
    }

    if (pl.type === "list" && isSmallestBreakpoint) {
        changePlaylistType("grid", pl);
    }
    else {
        togglePlaylistTypeBtn(pl.type);
    }
    setSortOptions(pl);
    enableTrackSelection(pl.id);
    resetFilteredPlaylist();
    updatePlaylistStatus(pl.id);
    dispatchCustomEvent("track-length-change");
}

function initGoogleAuth() {
    googleAuthInitialized = true;

    scriptLoader.load({ src: "https://apis.google.com/js/api.js" })
    .then(() => {
        gapi.load('client:auth2', () => {
            gapi.client.init({
                apiKey: process.env.YOUTUBE_API_KEY,
                clientId: "293076144560-r5cear7rprgo094u6ibcd6nl3bbg18te.apps.googleusercontent.com",
                discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/youtube/v3/rest"],
                scope: "https://www.googleapis.com/auth/youtube.force-ssl"
            })
            .then(() => {
                if (gapi.auth2.getAuthInstance().isSignedIn.get()) {
                    const btn = document.querySelector(".google-sign-in-or-out-btn");
                    btn.firstElementChild.textContent = "Sign Out";
                }
            });
        });
    });
}

getElementById("js-tab-header").addEventListener("click", ({ target }) => {
    const element = getElementByAttr("data-item", target);

    if (element && element.attrValue === "sidebar-toggle") {
        getElementById("js-sidebar-container").classList.remove("contracted");
    }
});

getElementById("js-playlist-tab-header").addEventListener("click", ({ target }) => {
    const element = getElementByAttr("data-item", target);

    if (!element) {
        return;
    }
    const pl = getPlaylistById(getVisiblePlaylistId());
    const item = element.attrValue;

    if (item === "move-to") {
        togglePanel("js-move-to-panel", createMoveToPanel, { pl });
    }
    else if ((item === "list" || item === "grid") && item !== pl.type) {
        changePlaylistType(item, pl);
    }
    else if (item === "sorting") {
        togglePanel("js-sort-panel", createSortPanel, { pl });
    }
    else if (item === "order" && pl.sortedBy) {
        changePlaylistOrder(pl);
    }
});

window.addEventListener("route-change", ({ detail: { isPlaylistTab, tabId } }) => {
    const entry = getSidebarEntry(tabId);
    const viewportWidth = window.innerWidth;
    const isSmallestBreakpoint = viewportWidth <= 540;
    const isSmallBreakpoint = viewportWidth <= 700;

    removeElementClass("sidebar-btn", "active");
    removeElementClass("tab", "active");
    setVisiblePlaylistId(isPlaylistTab ? tabId: "");

    if (isPlaylistTab) {
        toggleToPlaylistTab(tabId, isSmallestBreakpoint);
        getElementById("js-tab-playlist-container").classList.add("active");
        getElementById("js-tab-container").classList.remove("active");
    }
    else {
        getElementById("js-tab-container").classList.add("active");
        getElementById("js-tab-playlist-container").classList.remove("active");

        if (tabId === "manage" && !googleAuthInitialized) {
            initGoogleAuth();
        }
    }
    getElementById(`js-tab-${tabId}`).classList.add("active");

    if (entry) {
        entry.classList.add("active");
    }

    if (isSmallBreakpoint) {
        getElementById("js-sidebar-container").classList.add("contracted");
    }
});

export {
    setVisiblePlaylistId,
    getVisiblePlaylistId
};

import { renderPlaylist, changePlaylistType, togglePlaylistTypeBtn } from "./playlist/playlist.view.js";
import { removeElementClass, getElementById, getElementByAttr, dispatchCustomEvent } from "./utils.js";
import { getSidebarEntry } from "./sidebar.js";
import { togglePanel } from "./panels.js";
import { getPlaylistById } from "./playlist/playlist.js";
import { enableTrackSelection } from "./playlist/playlist.track-selection.js";
import { setSortOptions, createSortPanel, changePlaylistOrder } from "./playlist/playlist.sorting.js";
import { createMoveToPanel } from "./playlist/playlist.move-to.js";
import { resetFilteredPlaylist } from "./playlist/playlist.filter.js";

let visiblePlaylistId = "";

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

function toggleToPlaylistTab(id) {
    const isSmallestBreakpoint = window.innerWidth <= 540;
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
        togglePanel("js-move-to-panel", createMoveToPanel, {
            playlistId: pl.id,
            element: element.elementRef
        });
    }
    else if ((item === "list" || item === "grid") && item !== pl.type) {
        changePlaylistType(item, pl);
    }
    else if (item === "sorting") {
        togglePanel("js-sort-panel", createSortPanel, {
            sortedBy: pl.sortedBy,
            element: element.elementRef
        });
    }
    else if (item === "order" && pl.sortedBy) {
        changePlaylistOrder(pl);
    }
});

window.addEventListener("route-change", ({ detail: { isPlaylistTab, tabId } }) => {
    const entry = getSidebarEntry(tabId);

    removeElementClass("sidebar-btn", "active");
    removeElementClass("tab", "active");
    setVisiblePlaylistId(isPlaylistTab ? tabId: "");

    if (isPlaylistTab) {
        toggleToPlaylistTab(tabId);
        getElementById("js-tab-playlist-container").classList.add("active");
        getElementById("js-tab-container").classList.remove("active");
    }
    else {
        getElementById("js-tab-container").classList.add("active");
        getElementById("js-tab-playlist-container").classList.remove("active");
    }
    getElementById(`js-tab-${tabId}`).classList.add("active");

    if (entry) {
        entry.classList.add("active");
    }
});

export {
    setVisiblePlaylistId,
    getVisiblePlaylistId
};

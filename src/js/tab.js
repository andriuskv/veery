import { renderPlaylist, changePlaylistType, togglePlaylistTypeBtn } from "./playlist/playlist.view.js";
import { removeElementClass, getElementByAttr } from "./utils.js";
import { getSidebarEntry } from "./sidebar.js";
import { togglePanel } from "./panels.js";
import { getPlaylistById } from "./playlist/playlist.js";
import { updatePlaylistStats } from "./playlist/playlist.entries.js";
import { enableTrackSelection } from "./playlist/playlist.track-selection.js";
import { setSortOptions, createSortPanel, changePlaylistOrder } from "./playlist/playlist.sorting.js";
import { createMoveToPanel } from "./playlist/playlist.move-to.js";
import { resetFilteredPlaylist } from "./playlist/playlist.filter.js";

const headerElement = document.getElementById("js-tab-header");
const playlistHeaderElement = document.getElementById("js-playlist-tab-header");
let visiblePlaylistId = "";

function setVisiblePlaylistId(id = "") {
    visiblePlaylistId = id;
}

function getVisiblePlaylistId() {
    return visiblePlaylistId;
}

function getVisiblePlaylist() {
    return getPlaylistById(getVisiblePlaylistId());
}

function getTab(id) {
    return document.getElementById(`js-tab-${id}`);
}

function updatePlaylistTab(id) {
    const pl = getPlaylistById(id);

    if (!pl.rendered) {
        renderPlaylist(pl);
    }

    if (pl.type === "list" && window.innerWidth <= 540) {
        changePlaylistType("grid", pl);
    }
    else {
        togglePlaylistTypeBtn(pl.type);
    }
    setSortOptions(pl);
    enableTrackSelection(pl);
    resetFilteredPlaylist();
}

headerElement.addEventListener("click", ({ currentTarget, target }) => {
    const element = getElementByAttr("data-item", target, currentTarget);

    if (element && element.attrValue === "sidebar-toggle") {
        document.getElementById("js-sidebar-container").classList.remove("hidden");
    }
});

playlistHeaderElement.addEventListener("click", ({ currentTarget, target }) => {
    const element = getElementByAttr("data-item", target, currentTarget);

    if (!element) {
        return;
    }
    const pl = getVisiblePlaylist();
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
    const containerElement = document.getElementById("js-tab-container");
    const playlistCointainerElement = document.getElementById("js-tab-playlist-container");

    removeElementClass(".sidebar-entry.active", "active");
    removeElementClass(".tab.active", "active");
    setVisiblePlaylistId(isPlaylistTab ? tabId: "");

    if (isPlaylistTab) {
        updatePlaylistTab(tabId);
        playlistCointainerElement.classList.add("active");
        containerElement.classList.remove("active");
    }
    else {
        updatePlaylistStats();
        containerElement.classList.add("active");
        playlistCointainerElement.classList.remove("active");
    }
    getTab(tabId).classList.add("active");
    getSidebarEntry(tabId).classList.add("active");
});

export {
    setVisiblePlaylistId,
    getVisiblePlaylistId,
    getVisiblePlaylist,
    getTab
};

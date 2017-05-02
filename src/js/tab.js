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

function toggleToPlaylistTab(id, isForPhoneOnly) {
    const pl = getPlaylistById(id);

    if (!pl.rendered) {
        renderPlaylist(pl);
    }

    if (pl.type === "list" && isForPhoneOnly) {
        changePlaylistType("grid", pl);
    }
    else {
        togglePlaylistTypeBtn(pl.type);
    }
    setSortOptions(pl);
    enableTrackSelection(pl.id);
    resetFilteredPlaylist();
    dispatchCustomEvent("track-length-change");
}

getElementById("js-tab-header").addEventListener("click", ({ target }) => {
    const element = getElementByAttr(target, "data-header-item");

    if (!element) {
        return;
    }
    const pl = getPlaylistById(getVisiblePlaylistId());
    const item = element.attrValue;

    if (item === "move-to") {
        togglePanel("js-move-to-panel", pl, createMoveToPanel);
    }
    else if ((item === "list" || item === "grid") && item !== pl.type) {
        changePlaylistType(item, pl);
    }
    else if (item === "sorting") {
        togglePanel("js-sort-panel", pl, createSortPanel);
    }
    else if (item === "order" && pl.sortedBy) {
        changePlaylistOrder(pl);
    }
});

window.addEventListener("route-change", ({ detail: { isPlaylistTab, tabId } }) => {
    const entry = getSidebarEntry(tabId);
    const isForPhoneOnly = window.innerWidth < 600;

    removeElementClass("sidebar-btn", "active");
    removeElementClass("tab", "active");
    setVisiblePlaylistId(isPlaylistTab ? tabId: "");

    if (isPlaylistTab) {
        toggleToPlaylistTab(tabId, isForPhoneOnly);
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

    if (isForPhoneOnly) {
        getElementById("js-sidebar-container").classList.add("contracted");
    }
});

export {
    setVisiblePlaylistId,
    getVisiblePlaylistId
};

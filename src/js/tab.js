import { removeElementClass, getElementById, getElementByAttr, isOutsideElement, dispatchCustomEvent } from "./utils.js";
import { getSidebarEntry } from "./sidebar.js";
import { removePresentPanels, togglePanel } from "./panels.js";
import { getPlaylistById, getCurrentTrack } from "./playlist/playlist.js";
import { enableTrackSelection, deselectTrackElements } from "./playlist/playlist.track-selection.js";
import { setSortOptions, createSortPanel, changePlaylistOrder } from "./playlist/playlist.sorting.js";
import { createMoveToPanel } from "./playlist/playlist.move-to.js";
import * as playlistView from "./playlist/playlist.view.js";

let activePlaylistTabId = "";

function setVisiblePlaylistId(id = "") {
    activePlaylistTabId = id;
}

function getVisiblePlaylistId() {
    return activePlaylistTabId;
}

function toggleTabContent(action) {
    const tabContainer = getElementById("js-tab-container");
    const tabHeaderElement = getElementById("js-tab-header");
    const tabFooterElement = getElementById("js-tab-footer");

    tabContainer.classList[action]("is-playlist-tab-visible");
    tabHeaderElement.classList[action]("visible");
    tabFooterElement.classList[action]("visible");
}

function toggleToPlaylistTab(id) {
    const pl = getPlaylistById(id);
    const track = getCurrentTrack();

    if (!pl.rendered) {
        playlistView.renderPlaylist(pl);
    }

    if (track && track.playlistId === id && track.index !== -1) {
        playlistView.showPlayingTrack(track.index, id);
    }

    if (pl.type === "list" && window.innerWidth < 600) {
        playlistView.changePlaylistType("grid", pl);
    }
    else {
        playlistView.togglePlaylistTypeBtn(pl.type);
    }
    setVisiblePlaylistId(id);
    setSortOptions(pl);
    enableTrackSelection(pl.id);
    playlistView.resetFilteredPlaylist();
    toggleTabContent("add");
    getElementById(`js-tab-${id}`).classList.add("active");
    dispatchCustomEvent("track-length-change", {
        id: pl.id,
        tracks: pl.tracks,
        type: pl.type
    });
}

function toggleToNonPlaylistTab(id) {
    setVisiblePlaylistId();
    toggleTabContent("remove");
    getElementById(`js-tab-${id}`).classList.add("active");
}

window.addEventListener("click", event => {
    const headerElement = getElementByAttr(event.target, "data-header-item");
    const id = getVisiblePlaylistId();
    const pl = getPlaylistById(id);
    const element = playlistView.getPlaylistElement(id);
    const item = headerElement && headerElement.attrValue;
    let panelId = "";

    if (item === "filter") {
        getElementById("js-filter-input").classList.toggle("visible");
    }
    else if (item === "move-to") {
        panelId = "js-move-to-panel";
        togglePanel(panelId, pl, createMoveToPanel);
    }
    else if ((item === "list" || item === "grid") && item !== pl.type) {
        playlistView.changePlaylistType(item, pl);
    }
    else if (item === "sorting") {
        panelId = "js-sort-panel";
        togglePanel(panelId, pl, createSortPanel);
    }
    else if (item === "order" && pl.sortedBy) {
        changePlaylistOrder(pl);
    }
    const targetElement = getElementById("js-move-to-panel-container");

    if (isOutsideElement(event.target, targetElement) && isOutsideElement(event.target, element)) {
        deselectTrackElements();
    }
    removePresentPanels(event, panelId);
}, true);

window.addEventListener("route-change", ({ detail: { isPlaylistTab, tabId, isValid } }) => {
    removeElementClass("sidebar-btn", "active");
    removeElementClass("tab", "active");

    if (isPlaylistTab) {
        toggleToPlaylistTab(tabId);
    }
    else {
        toggleToNonPlaylistTab(tabId);
    }

    if (isValid) {
        const entry = getSidebarEntry(tabId);

        entry.classList.add("active");
    }
    getElementById("js-sidebar-container").classList.add("contracted");
});

export {
    setVisiblePlaylistId,
    getVisiblePlaylistId
};

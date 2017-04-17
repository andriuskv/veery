import { removeElementClass, getElementById, getElementByAttr, dispatchCustomEvent } from "./utils.js";
import { getSidebarEntry } from "./sidebar.js";
import { togglePanel } from "./panels.js";
import { getPlaylistById, getCurrentTrack } from "./playlist/playlist.js";
import { enableTrackSelection } from "./playlist/playlist.track-selection.js";
import { setSortOptions, createSortPanel, changePlaylistOrder } from "./playlist/playlist.sorting.js";
import { createMoveToPanel } from "./playlist/playlist.move-to.js";
import * as playlistView from "./playlist/playlist.view.js";

let visiblePlaylistId = "";

function setVisiblePlaylistId(id = "") {
    visiblePlaylistId = id;
}

function getVisiblePlaylistId() {
    return visiblePlaylistId;
}

function toggleToPlaylistTab(id, isForPhoneOnly) {
    const pl = getPlaylistById(id);
    const track = getCurrentTrack();

    if (!pl.rendered) {
        playlistView.renderPlaylist(pl);
    }

    if (track && track.playlistId === id && track.index !== -1) {
        playlistView.showPlayingTrack(track.index, id);
    }

    if (pl.type === "list" && isForPhoneOnly) {
        playlistView.changePlaylistType("grid", pl);
    }
    else {
        playlistView.togglePlaylistTypeBtn(pl.type);
    }
    setSortOptions(pl);
    enableTrackSelection(pl.id);
    playlistView.resetFilteredPlaylist();
    dispatchCustomEvent("track-length-change", {
        id: pl.id,
        tracks: pl.tracks,
        type: pl.type
    });
}

getElementById("js-tab-header").addEventListener("click", ({ target }) => {
    const element = getElementByAttr(target, "data-header-item");

    if (!element) {
        return;
    }
    const pl = getPlaylistById(getVisiblePlaylistId());
    const item = element.attrValue;

    if (item === "filter") {
        getElementById("js-filter-input").classList.toggle("visible");
    }
    else if (item === "move-to") {
        togglePanel("js-move-to-panel", pl, createMoveToPanel);
    }
    else if ((item === "list" || item === "grid") && item !== pl.type) {
        playlistView.changePlaylistType(item, pl);
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
    let playlistId = tabId;

    removeElementClass("sidebar-btn", "active");
    removeElementClass("tab", "active");

    if (isPlaylistTab) {
        toggleToPlaylistTab(playlistId, isForPhoneOnly);
        getElementById("js-tab-playlist-container").classList.add("active");
        getElementById("js-tab-container").classList.remove("active");
    }
    else {
        playlistId = "";
        getElementById("js-tab-container").classList.add("active");
        getElementById("js-tab-playlist-container").classList.remove("active");
    }
    setVisiblePlaylistId(playlistId);
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
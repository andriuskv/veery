import { removeElementClass, isOutsideElement, dispatchEvent } from "./main.js";
import { getSidebarEntry } from "./sidebar.js";
import { removePresentPanels, togglePanel } from "./panels.js";
import { getPlaylistById, getCurrentTrack } from "./playlist/playlist.js";
import { renderPlaylist } from "./playlist/playlist.view.js";
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
    const tabContainer = document.getElementById("js-tab-container");
    const tabHeaderElement = document.getElementById("js-tab-header");
    const tabFooterElement = document.getElementById("js-tab-footer");

    tabContainer.classList[action]("is-playlist-tab-visible");
    tabHeaderElement.classList[action]("visible");
    tabFooterElement.classList[action]("visible");
}

function toggleTab(id, playlistTab, ignoreSidebar) {
    removeElementClass("sidebar-btn", "active");
    removeElementClass("tab", "active");

    if (playlistTab) {
        const pl = getPlaylistById(id);
        const track = getCurrentTrack();

        if (!pl.rendered) {
            renderPlaylist(pl);
        }
        if (track && track.playlistId === id) {
            playlistView.showPlayingTrack(track.index, id);
        }
        setVisiblePlaylistId(id);
        playlistView.togglePlaylistTypeBtn(pl.type);
        setSortOptions(pl);
        enableTrackSelection(pl.id);
        toggleTabContent("add");
        dispatchEvent("track-length-change", { tracks: pl.tracks });
    }
    else {
        setVisiblePlaylistId();
        toggleTabContent("remove");
    }
    playlistView.resetFilteredPlaylist();
    document.getElementById(`js-tab-${id}`).classList.add("active");

    if (!ignoreSidebar) {
        const entry = getSidebarEntry(id);

        entry.classList.add("active");
    }
}

window.addEventListener("click", event => {
    const item = event.target.getAttribute("data-header-item");
    const pl = getPlaylistById(getVisiblePlaylistId());
    let panelId = "";

    if (item === "move-to") {
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
    deselectTrackElements(event.target);
    removePresentPanels(event, panelId);
}, true);

window.addEventListener("route-change", ({ detail }) => {
    toggleTab(detail.tabName, detail.isPlaylistTab, detail.isInvalid);

    if (detail.isPlaylistTab) {
        const id = detail.tabName;
        const { type } = getPlaylistById(id);

        playlistView.addMarginToPlaylistHeader(id, type);
    }
});

export {
    setVisiblePlaylistId,
    getVisiblePlaylistId
};

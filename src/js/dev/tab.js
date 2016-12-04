import { removeElementClass, dispatchEvent } from "./main.js";
import { getSidebarEntry } from "./sidebar.js";
import { removePresentPanels, togglePanel } from "./panels.js";
import { getPlaylistById } from "./playlist/playlist.js";
import { renderPlaylist } from "./playlist/playlist.view.js";
import { changePlaylistType, togglePlaylistTypeBtn, resetFilteredPlaylist } from "./playlist/playlist.view.js";
import { enableTrackSelection, deselectTrackElements } from "./playlist/playlist.track-selection.js";
import { setSortOptions, createSortPanel, changePlaylistOrder } from "./playlist/playlist.sorting.js";
import { createMoveToPanel } from "./playlist/playlist.move-to.js";

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

        if (!pl.rendered) {
            renderPlaylist(pl);
        }
        setVisiblePlaylistId(id);
        togglePlaylistTypeBtn(pl.type);
        setSortOptions(pl);
        enableTrackSelection(pl.id);
        toggleTabContent("add");
        dispatchEvent("track-length-change", pl.tracks);
    }
    else {
        setVisiblePlaylistId();
        toggleTabContent("remove");
    }
    resetFilteredPlaylist();
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
        changePlaylistType(item, pl);
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
});

export {
    toggleTab,
    setVisiblePlaylistId,
    getVisiblePlaylistId
};

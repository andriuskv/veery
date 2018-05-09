import { renderPlaylist, changePlaylistType, togglePlaylistTypeBtn, showCurrentTrack } from "./playlist/playlist.view.js";
import { removeElementClass, getElementByAttr } from "./utils.js";
import { getSidebarEntry } from "./sidebar.js";
import { togglePanel } from "./panels.js";
import { getPlaylistById } from "./playlist/playlist.js";
import { enableTrackSelection } from "./playlist/playlist.track-selection.js";
import { setSortOptions, createSortPanel, changePlaylistOrder } from "./playlist/playlist.sorting.js";
import { createMoveToPanel } from "./playlist/playlist.move-to.js";
import { resetFilteredPlaylist } from "./playlist/playlist.filter.js";
import { playTrackFromElement } from "./player/player.js";

const headerElement = document.getElementById("js-tab-header");
const media = matchMedia("(max-width: 540px)");
let visiblePlaylistId = "";

function setVisiblePlaylistId(id = "") {
    visiblePlaylistId = id;
}

function getVisiblePlaylistId() {
    return visiblePlaylistId;
}

function getVisiblePlaylist() {
    return getPlaylistById(visiblePlaylistId);
}

function getTab(id) {
    return document.getElementById(`js-tab-${id}`);
}

function updatePlaylistTab(id) {
    const pl = getPlaylistById(id);

    if (!pl.rendered) {
        renderPlaylist(pl);
    }
    else {
        showCurrentTrack(id);
    }

    if (pl.type === "list" && media.matches) {
        changePlaylistType("grid", pl);
    }
    else {
        togglePlaylistTypeBtn(pl.type);
    }
    setSortOptions(pl);
    enableTrackSelection(pl);
    resetFilteredPlaylist();

    if (pl.tracks.length) {
        getTab(id).addEventListener("click", playTrackFromElement);
    }
}

headerElement.addEventListener("click", ({ currentTarget, target }) => {
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
    else if (item === "sidebar") {
        document.getElementById("js-sidebar-container").classList.remove("hidden");
    }
});

window.addEventListener("route-change", ({ detail: { isPlaylistTab, tabId } }) => {
    const id = visiblePlaylistId;
    const element = getTab(id);

    removeElementClass(".sidebar-entry.active", "active");
    removeElementClass(".tab.active", "active");
    setVisiblePlaylistId(isPlaylistTab ? tabId : "");

    if (element) {
        element.removeEventListener("click", playTrackFromElement);
    }

    if (isPlaylistTab) {
        updatePlaylistTab(tabId);
        headerElement.classList.add("playlist-tab-active");
    }
    else {
        headerElement.classList.remove("playlist-tab-active");
    }
    getTab(tabId).classList.add("active");

    if (tabId !== "not-found") {
        getSidebarEntry(tabId).classList.add("active");
    }
});

media.onchange = function({ matches }) {
    const pl = getVisiblePlaylist();

    if (matches && pl && pl.type === "list") {
        changePlaylistType("grid", pl);
    }
};

export {
    setVisiblePlaylistId,
    getVisiblePlaylistId,
    getVisiblePlaylist,
    getTab
};

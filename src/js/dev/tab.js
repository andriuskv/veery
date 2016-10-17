import { removeElementClass } from "./main.js";
import { getSidebarEntry } from "./sidebar.js";
import { removePresentPanels, togglePanel } from "./panels.js";
import { getPlaylistById } from "./playlist/playlist.js";
import { changePlaylistType, togglePlaylistTypeBtn } from "./playlist/playlist.view.js";
import { enableTrackSelection, deselectTrackElements } from "./playlist/playlist.track-selection.js";
import { setSortOptions, createSortPanel, changePlaylistOrder } from "./playlist/playlist.sorting.js";
import { createMoveToPanel } from "./playlist/playlist.move-to.js";

let activeTabId = "manage";

function setActiveTabId(id) {
    activeTabId = id;
}

function getActiveTabId() {
    return activeTabId;
}

function toggleTab(id, playlistTab, ignoreSidebar) {
    const tabHeaderElement = document.getElementById("js-tab-header");

    removeElementClass("sidebar-btn", "active");
    removeElementClass("tab", "active");

    if (playlistTab) {
        const pl = getPlaylistById(id);

        togglePlaylistTypeBtn(pl.type);
        setSortOptions(pl);
        enableTrackSelection(pl.id);
        tabHeaderElement.classList.add("visible");
    }
    else {
        tabHeaderElement.classList.remove("visible");
    }
    setActiveTabId(id);
    document.getElementById(`js-tab-${id}`).classList.add("active");

    if (!ignoreSidebar) {
        const entry = getSidebarEntry(id);

        entry.classList.add("active");
    }
}

window.addEventListener("click", event => {
    const item = event.target.getAttribute("data-header-item");
    const pl = getPlaylistById(getActiveTabId());
    let panelId = "";

    if (item === "move-to") {
        panelId = "js-move-to-panel";
        togglePanel(panelId, pl, createMoveToPanel);
    }
    else if ((item === "list" || item === "grid") && item !== pl.type) {
        changePlaylistType(item, pl);
    }
    else if (item === "sorting") {
        panelId = "js-playlist-sort-panel";
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
    setActiveTabId,
    getActiveTabId
};

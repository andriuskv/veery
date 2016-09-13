import * as settings from "./settings.js";
import { removeElementClass } from "./main.js";
import { removePresentPanels, togglePanel } from "./panels.js";
import { getPlaylistById } from "./playlist/playlist.js";
import { changePlaylistType, togglePlaylistTypeBtn } from "./playlist/playlist.view.js";
import { enableTrackSelection, deselectTrackElements } from "./playlist/playlist.track-selection.js";
import { setSortOptions, createSortPanel, changePlaylistOrder } from "./playlist/playlist.sorting.js";
import { createMoveToPanel } from "./playlist/playlist.move-to.js";

const tabHeaderElement = document.getElementById("js-tab-header");

function toggleTab(id, ignoreSidebar) {
    removeElementClass("sidebar-btn", "active");
    removeElementClass("tab", "active");

    if (id.startsWith("playlist-")) {
        const pl = getPlaylistById(id.split("playlist-")[1]);

        settings.set("activeTabId", pl.id);
        togglePlaylistTypeBtn(pl.type);
        setSortOptions(pl);
        enableTrackSelection(pl.id);
        tabHeaderElement.classList.add("visible");
    }
    else {
        settings.set("activeTabId", id);
        tabHeaderElement.classList.remove("visible");
    }
    document.getElementById(`js-tab-${id}`).classList.add("active");

    if (!ignoreSidebar) {
        document.querySelector(`[data-tab-item=${id}]`).classList.add("active");
    }
}

window.addEventListener("click", event => {
    const item = event.target.getAttribute("data-header-item");
    const pl = getPlaylistById(settings.get("activeTabId"));
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
    toggleTab as toggle
};

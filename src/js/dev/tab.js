import * as settings from "./settings.js";
import { removeElementClass } from "./main.js";
import { setSortOptions } from "./playlist/playlist.sorting.js";
import { enableTrackSelection } from "./playlist/playlist.track-selection.js";

function toggleTab(id, ignoreSidebar) {
    const tabHeaderElement = document.getElementById("js-tab-header");

    removeElementClass("sidebar-btn", "active");
    removeElementClass("tab", "active");

    if (id.startsWith("playlist-")) {
        const playlistId = id.split("playlist-")[1];

        settings.set("activeTabId", playlistId);
        tabHeaderElement.classList.add("visible");
        setSortOptions(playlistId);
        removeElementClass("track", "selected");
        enableTrackSelection(playlistId);
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

export {
    toggleTab as toggle
};

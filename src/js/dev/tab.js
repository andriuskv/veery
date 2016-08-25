import * as settings from "./settings.js";
import * as playlist from "./playlist/playlist.js";
import * as sorting from "./playlist/playlist.sorting.js";
import { removeElementClass } from "./main.js";
import { enableTrackSelection } from "./playlist/playlist.track-selection.js";
import { togglePlaylistTypeBtn, changePlaylistType } from "./playlist/playlist.view.js";

const tabHeaderElement = document.getElementById("js-tab-header");

function toggleTab(id, ignoreSidebar) {
    removeElementClass("sidebar-btn", "active");
    removeElementClass("tab", "active");

    if (id.startsWith("playlist-")) {
        const pl = playlist.get(id.split("playlist-")[1]);

        settings.set("activeTabId", pl.id);
        togglePlaylistTypeBtn(pl.type);
        sorting.setSortOptions(pl);
        removeElementClass("track", "selected");
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

tabHeaderElement.addEventListener("click", ({ target }) => {
    const item = target.getAttribute("data-header-item");
    const pl = playlist.get(settings.get("activeTabId"));

    if ((item === "list" || item === "grid") && item !== pl.type) {
        changePlaylistType(item, pl);
    }
    else if (item === "sorting") {
        sorting.toggleSortOptions(pl);
    }
    else if (item === "order" && pl.sortedBy) {
        sorting.changePlaylistOrder(pl);
    }
    else {
        const sortBy = target.getAttribute("data-sort");

        if (sortBy) {
            sorting.selectSortOption(sortBy, target, pl);
        }
    }
});

export {
    toggleTab as toggle
};

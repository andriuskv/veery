import * as settings from "./settings.js";
import { removeClassFromElement } from "./main.js";
import { setSortOptions } from "./playlist/playlist.sorting.js";

function toggleTab(id, ignoreSidebar) {
    removeClassFromElement("sidebar-btn", "active");
    removeClassFromElement("tab", "active");

    if (id.startsWith("playlist-")) {
        const tabId = id.split("playlist-")[1];

        settings.set("activeTabId", tabId);
        document.getElementById("js-tab-header").classList.add("show");
        setSortOptions(tabId);
    }
    else {
        settings.set("activeTabId", id);
        document.getElementById("js-tab-header").classList.remove("show");
    }
    document.getElementById(`js-tab-${id}`).classList.add("active");

    if (!ignoreSidebar) {
        document.querySelector(`[data-tab-item=${id}]`).classList.add("active");
    }
}

export {
    toggleTab as toggle
};

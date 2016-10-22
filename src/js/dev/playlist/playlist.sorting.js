import { capitalize } from "./../main.js";
import { getActiveTabId } from "./../tab.js";
import { removePresentPanels } from "./../panels.js";
import { postMessageToWorker } from "./../worker.js";
import { getPlaylistById } from "./playlist.js";
import { refreshPlaylist } from "./playlist.manage.js";
import { filterTracks } from "./playlist.view.js";

function setSortBtnText(text = "Sorting") {
    document.getElementById("js-sort-toggle").textContent = text;
}

function toggleOrderBtn(order = 1) {
    const btn = document.getElementById("js-order-toggle");

    if (order === 1) {
        btn.classList.remove("icon-up-big");
        btn.classList.add("icon-down-big");
    }
    else {
        btn.classList.remove("icon-down-big");
        btn.classList.add("icon-up-big");
    }
}

function sortTracks(tracks, sortBy, order) {
    tracks.sort((a, b) => {
        const aValue = sortBy === "duration" ? a.durationInSeconds : a[sortBy].toLowerCase();
        const bValue = sortBy === "duration" ? b.durationInSeconds : b[sortBy].toLowerCase();

        if (aValue < bValue) {
            return -1 * order;
        }
        if (aValue > bValue) {
            return order;
        }
        return 0;
    });
}

function sortPlaylist(pl, sortBy) {
    pl.order = pl.sortedBy === sortBy && pl.order === 1 ? -1 : 1;
    pl.sortedBy = sortBy;
    sortTracks(pl.tracks, sortBy, pl.order);
}

function changePlaylistSorting(pl, sortBy) {
    const query = document.getElementById("js-filter-input").value;

    sortPlaylist(pl, sortBy);
    refreshPlaylist(pl);
    postMessageToWorker({
        action: "put",
        playlist: pl
    });

    if (query) {
        const trackElements = document.getElementById(`js-${pl.id}`).children;

        filterTracks(pl.tracks, trackElements, query);
    }
}

function setSortOptions({ sortedBy, order }) {
    let btnTitle = "Sorting";

    if (sortedBy) {
        btnTitle = capitalize(sortedBy);
    }
    setSortBtnText(btnTitle);
    toggleOrderBtn(order);
}

function getSupportedSortOptions(playlistType) {
    if (playlistType === "list") {
        return ["title", "artist", "album", "duration"];
    }
    return ["name", "duration"];
}

function resetPlaylistSort(pl) {
    pl.sortedBy = "";
    pl.order = 0;
    setSortBtnText();
    toggleOrderBtn();
}

function getSortOtions(supportedOptions, sortedBy) {
    return supportedOptions.map(option => {
        const activeClass = option === sortedBy ? "active" : "";

        return `
            <li class="playlist-sort-option">
                <button class="btn btn-transparent ${activeClass}" data-sort="${option}">
                    ${capitalize(option)}
                </button>
            </li>
        `;
    }).join("");
}

function createSortPanel(panelId, { type, sortedBy }) {
    const supportedOptions = getSupportedSortOptions(type);
    const sortOptions = getSortOtions(supportedOptions, sortedBy);
    const sortPanelElement = `
        <ul id="${panelId}" class="playlist-sort-panel">${sortOptions}</ul>
    `;

    document.getElementById("js-playlist-sort-panel-container").insertAdjacentHTML("beforeend", sortPanelElement);
    document.getElementById(panelId).addEventListener("click", selectSortOption);
}

function changePlaylistOrder(pl) {
    changePlaylistSorting(pl, pl.sortedBy);
    toggleOrderBtn(pl.order);
}

function selectSortOption({ target }) {
    const sortBy = target.getAttribute("data-sort");

    if (sortBy) {
        const pl = getPlaylistById(getActiveTabId());

        this.removeEventListener("click", selectSortOption);
        removePresentPanels();

        if (sortBy === pl.sortedBy) {
            return;
        }
        setSortBtnText(capitalize(sortBy));
        toggleOrderBtn();
        changePlaylistSorting(pl, sortBy);
    }
}

export {
    setSortOptions,
    createSortPanel,
    sortTracks,
    changePlaylistOrder,
    resetPlaylistSort
};

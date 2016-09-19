import { getActiveTabId } from "./../tab.js";
import { removePresentPanels } from "./../panels.js";
import { postMessageToWorker } from "./../worker.js";
import { getPlaylistById } from "./playlist.js";
import { updatePlaylist } from "./playlist.manage.js";
import { filterTracks } from "./playlist.view.js";

const sortToggleBtn = document.getElementById("js-sort-toggle");

function capitalize(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
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

function getDurationInSeconds(duration) {
    const durationArray = duration.split(":");

    return Number.parseInt(durationArray[0], 10) * 60 + Number.parseInt(durationArray[1], 10);
}

function sortTracks(tracks, sortBy, order) {
    tracks.sort((a, b) => {
        const aValue = sortBy === "duration" ? getDurationInSeconds(a[sortBy]) : a[sortBy].toLowerCase();
        const bValue = sortBy === "duration" ? getDurationInSeconds(b[sortBy]) : b[sortBy].toLowerCase();

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
    updatePlaylist(pl);
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
    sortToggleBtn.textContent = btnTitle;
    toggleOrderBtn(order);
}

function getSupportedSortOptions(playlistType) {
    if (playlistType === "list") {
        return ["title", "artist", "album", "duration"];
    }
    return ["name", "duration"];
}

function resetPlaylistSort(pl) {
    sortToggleBtn.textContent = "Sorting";
    pl.sortedBy = "";
    pl.order = 0;
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
    document.getElementById(panelId).addEventListener("click", selectSortOption, { once: true });
}

function changePlaylistOrder(pl) {
    changePlaylistSorting(pl, pl.sortedBy);
    toggleOrderBtn(pl.order);
}

function selectSortOption({ target }) {
    const pl = getPlaylistById(getActiveTabId());
    const sortBy = target.getAttribute("data-sort");

    removePresentPanels();

    if (!sortBy || pl.sortedby === sortBy) {
        return;
    }
    toggleOrderBtn();
    sortToggleBtn.textContent = capitalize(sortBy);
    changePlaylistSorting(pl, sortBy);
}

export {
    setSortOptions,
    createSortPanel,
    sortTracks,
    changePlaylistOrder,
    resetPlaylistSort
};

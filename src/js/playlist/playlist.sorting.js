import { capitalize, getElementById } from "./../utils.js";
import { getVisiblePlaylistId } from "./../tab.js";
import { removePanel } from "./../panels.js";
import { getPlaylistById, resetTrackIndexes } from "./playlist.js";
import { updateCurrentTrack, updatePlaylist } from "./playlist.manage.js";
import { getPlaylistTrackElements, updatePlaylistView } from "./playlist.view.js";
import { filterTracks } from "./playlist.filter.js";

function setSortBtnText(text = "Sorting") {
    getElementById("js-sort-toggle").textContent = text;
}

function toggleOrderBtn(order = 1) {
    const icon = getElementById("js-order-toggle").querySelector(".btn-icon");

    icon.setAttribute("href", `#${order === 1 ? "down" : "up"}-arrow-icon`);
}

function getSortingValue(sortBy, track) {
    if (sortBy === "duration") {
        return track.durationInSeconds;
    }
    if (sortBy === "age") {
        return track.createdAt;
    }
    return track[sortBy].toLowerCase();
}

function sortTracks(tracks, sortBy, order) {
    tracks.sort((a, b) => {
        const aValue = getSortingValue(sortBy, a);
        const bValue = getSortingValue(sortBy, b);

        if (aValue < bValue) {
            return -1 * order;
        }
        if (aValue > bValue) {
            return order;
        }
        return 0;
    });
}

function changePlaylistSorting(pl, sortBy) {
    const query = getElementById("js-filter-input").value;
    const order = pl.sortedBy === sortBy && pl.order === 1 ? -1 : 1;

    sortTracks(pl.tracks, sortBy, order);
    updatePlaylist(pl.id, {
        order,
        sortedBy: sortBy,
        tracks: resetTrackIndexes(pl.tracks)
    });
    updatePlaylistView(pl);
    updateCurrentTrack(pl);

    if (query) {
        const elements = getPlaylistTrackElements(pl.id);

        filterTracks(pl.tracks, elements, query);
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

function getSortOtions(sortedBy) {
    return ["name", "title", "artist", "album", "duration", "age"].map(option => {
        const activeClass = option === sortedBy ? "active" : "";

        return `
            <li class="sort-option">
                <button class="btn btn-transparent ${activeClass}" data-sort="${option}">
                    ${capitalize(option)}
                </button>
            </li>
        `;
    }).join("");
}

function createSortPanel(panelId, { sortedBy }) {
    const sortOptions = getSortOtions(sortedBy);
    const sortPanelElement = `<ul id="${panelId}" class="sort-panel">${sortOptions}</ul>`;

    getElementById("js-sort-panel-container").insertAdjacentHTML("beforeend", sortPanelElement);
    getElementById(panelId).addEventListener("click", selectSortOption);
}

function changePlaylistOrder(pl) {
    changePlaylistSorting(pl, pl.sortedBy);
    toggleOrderBtn(pl.order);

    if (getElementById("js-sort-panel")) {
        removePanel();
    }
}

function selectSortOption({ target }) {
    const sortBy = target.getAttribute("data-sort");

    if (sortBy) {
        const pl = getPlaylistById(getVisiblePlaylistId());

        this.removeEventListener("click", selectSortOption);
        removePanel();

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
    changePlaylistOrder
};

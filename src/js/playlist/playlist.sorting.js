import { capitalize, getElementById } from "./../utils.js";
import { getVisiblePlaylistId } from "./../tab.js";
import { removePanel } from "./../panels.js";
import { postMessageToWorker } from "../worker.js";
import { getPlaylistById, resetTrackIndexes, updatePlaylist } from "./playlist.js";
import { updateCurrentTrack } from "./playlist.manage.js";
import { getPlaylistTrackElements, updatePlaylistView } from "./playlist.view.js";
import { filterTracks } from "./playlist.filter.js";

function setSortBtnText(text) {
    getElementById("js-sort-toggle").textContent = capitalize(text);
}

function toggleOrderBtn(order) {
    const icon = getElementById("js-order-toggle").querySelector(".js-icon");

    icon.setAttribute("href", `#${order === 1 ? "down" : "up"}-arrow`);
}

function getSortingValue(sortBy, track) {
    if (sortBy === "index") {
        return track.primaryIndex;
    }

    if (sortBy === "duration") {
        return track.durationInSeconds;
    }
    return track[sortBy].toLowerCase();
}

function sortTracks(tracks, sortBy, order) {
    tracks.sort((a, b) => {
        const aValue = getSortingValue(sortBy, a);
        const bValue = getSortingValue(sortBy, b);

        if (aValue < bValue) {
            return -order;
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
    postMessageToWorker({
        action: "change-sorting",
        playlist: {
            order,
            _id: pl._id,
            sortedBy: sortBy
        }
    });
    updatePlaylistView(pl);
    updateCurrentTrack(pl);

    if (query) {
        const elements = getPlaylistTrackElements(pl.id);

        filterTracks(pl.tracks, elements, query);
    }
}

function setSortOptions({ sortedBy, order }) {
    setSortBtnText(sortedBy);
    toggleOrderBtn(order);
}

function getSortOtions(sortedBy) {
    return ["index", "name", "title", "artist", "album", "duration"].map(option => {
        const activeClass = option === sortedBy ? " active" : "";

        return `
            <li>
                <button class="btn sort-option-btn${activeClass}" data-sort="${option}">
                    ${capitalize(option)}
                </button>
            </li>
        `;
    }).join("");
}

function createSortPanel(id, { sortedBy }) {
    const sortOptions = getSortOtions(sortedBy);

    getElementById("js-sort-panel-container").insertAdjacentHTML("beforeend", `
        <ul id="${id}" class="panel sort-panel">${sortOptions}</ul>
    `);
    getElementById(id).addEventListener("click", selectSortOption);
}

function changePlaylistOrder(pl) {
    changePlaylistSorting(pl, pl.sortedBy);
    toggleOrderBtn(pl.order);
}

function selectSortOption({ currentTarget, target }) {
    const sortBy = target.getAttribute("data-sort");
    const pl = getPlaylistById(getVisiblePlaylistId());

    currentTarget.removeEventListener("click", selectSortOption);
    removePanel();

    if (sortBy === pl.sortedBy) {
        return;
    }
    setSortOptions({
        sortedBy: sortBy,
        order: 1
    });
    changePlaylistSorting(pl, sortBy);
}

export {
    setSortOptions,
    createSortPanel,
    sortTracks,
    changePlaylistOrder
};

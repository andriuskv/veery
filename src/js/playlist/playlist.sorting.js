import { capitalize, getElementById } from "./../utils.js";
import { getVisiblePlaylistId } from "./../tab.js";
import { removePanel } from "./../panels.js";
import { postMessageToWorker } from "../worker.js";
import { getPlaylistById, resetTrackIndexes, updatePlaylist } from "./playlist.js";
import { updateCurrentTrack } from "./playlist.manage.js";
import { getPlaylistTrackElements, updatePlaylistView } from "./playlist.view.js";
import { filterTracks } from "./playlist.filter.js";

function setSortBtnText(text) {
    getElementById("js-sort-toggle").textContent = text;
}

function toggleOrderBtn(order = 1) {
    const icon = getElementById("js-order-toggle").querySelector(".js-icon");

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
    const btnTitle = sortedBy ? capitalize(sortedBy) : "Sorting";

    setSortBtnText(btnTitle);
    toggleOrderBtn(order);
}

function getSortOtions(sortedBy) {
    return ["name", "title", "artist", "album", "duration", "age"].map(option => {
        const activeClass = option === sortedBy ? " active" : "";

        return `
            <li class="sort-option">
                <button class="btn btn-transparent${activeClass}" data-sort="${option}">
                    ${capitalize(option)}
                </button>
            </li>
        `;
    }).join("");
}

function createSortPanel(id, { pl: { sortedBy } }) {
    const sortOptions = getSortOtions(sortedBy);
    const sortPanelElement = `<ul id="${id}" class="panel sort-panel">${sortOptions}</ul>`;

    getElementById("js-sort-panel-container").insertAdjacentHTML("beforeend", sortPanelElement);
    getElementById(id).addEventListener("click", selectSortOption);
}

function changePlaylistOrder(pl) {
    changePlaylistSorting(pl, pl.sortedBy);
    toggleOrderBtn(pl.order);

    if (getElementById("js-sort-panel")) {
        removePanel();
    }
}

function selectSortOption({ currentTarget, target }) {
    const sortBy = target.getAttribute("data-sort");

    if (sortBy) {
        const pl = getPlaylistById(getVisiblePlaylistId());

        currentTarget.removeEventListener("click", selectSortOption);
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

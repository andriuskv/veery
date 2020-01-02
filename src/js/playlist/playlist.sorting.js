import { getVisiblePlaylist } from "./../tab.js";
import { removePanel } from "./../panels.js";
import { postMessageToWorker } from "../web-worker.js";
import { updateCurrentTrackIndex, setSortOrder } from "./playlist.js";
import { getPlaylistElement, updatePlaylistView } from "./playlist.view.js";
import { filterTracks } from "./playlist.filter.js";

function setSortBtnText(text) {
    document.getElementById("js-sort-toggle").textContent = text;
}

function toggleOrderBtn(order) {
    const icon = document.getElementById("js-order-toggle").querySelector("use");

    icon.setAttribute("href", `#${order === 1 ? "down" : "up"}-arrow`);
}

function changePlaylistSorting(pl, sortBy) {
    const { value } = document.getElementById("js-filter-input");
    pl.order = pl.sortedBy === sortBy && pl.order === 1 ? -1 : 1;
    pl.sortedBy = sortBy;

    setSortOrder(pl);
    updateCurrentTrackIndex(pl.id);
    updatePlaylistView(pl);

    if (value) {
        const { children } = getPlaylistElement(pl.id);

        filterTracks(pl.id, pl.tracks, children, value);
    }

    if (pl.storePlaylist) {
        postMessageToWorker({
            action: "change-sorting",
            playlist: {
                order : pl.order,
                id: pl.id,
                sortedBy: sortBy
            }
        });
    }
}

function setSortOptions({ sortedBy, order }) {
    setSortBtnText(sortedBy);
    toggleOrderBtn(order);
}

function getSortPanel(id, sortedBy) {
    const options = getSortOtions(sortedBy);

    return `<ul id="${id}" class="panel sort-panel">${options}</ul>`;
}

function getSortOtions(sortedBy) {
    const options = ["index", "title", "artist", "album", "duration"];

    return options.reduce((str, option) => {
        const activeClass = option === sortedBy ? " active" : "";

        return `
            ${str}
            <li>
                <button class="btn btn-icon sort-option-btn${activeClass}" data-sort="${option}">
                    ${option}
                </button>
            </li>
        `;
    }, "");
}

function createSortPanel(id, { sortedBy }) {
    const element = document.getElementById("js-sort-panel-container");

    element.insertAdjacentHTML("beforeend", getSortPanel(id, sortedBy));
    document.getElementById(id).addEventListener("click", selectSortOption);
}

function changePlaylistOrder(pl) {
    changePlaylistSorting(pl, pl.sortedBy);
    toggleOrderBtn(pl.order);
}

function selectSortOption({ currentTarget, target }) {
    const sortBy = target.getAttribute("data-sort");
    const pl = getVisiblePlaylist();

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
    changePlaylistOrder
};

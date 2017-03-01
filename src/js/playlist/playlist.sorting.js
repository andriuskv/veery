import { capitalize, getElementById } from "./../utils.js";
import { getVisiblePlaylistId } from "./../tab.js";
import { removePresentPanels } from "./../panels.js";
import { getPlaylistById } from "./playlist.js";
import { refreshPlaylist, updatePlaylist } from "./playlist.manage.js";
import { getPlaylistTrackElements, filterTracks } from "./playlist.view.js";

function setSortBtnText(text = "Sorting") {
    getElementById("js-sort-toggle").textContent = text;
}

function toggleOrderBtn(order = 1) {
    const btn = getElementById("js-order-toggle");
    const icon = btn.querySelector(".btn-icon");

    icon.removeAttribute("href");
    icon.setAttribute("href", order === 1 ? "#down-arrow-icon" : "#up-arrow-icon");
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

    updatePlaylist(pl.id, {
        order,
        sortedBy: sortBy
    });
    sortTracks(pl.tracks, sortBy, order);
    refreshPlaylist(pl);

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
    const sortPanelElement = `
        <ul id="${panelId}" class="sort-panel">${sortOptions}</ul>
    `;

    getElementById("js-sort-panel-container").insertAdjacentHTML("beforeend", sortPanelElement);
    getElementById(panelId).addEventListener("click", selectSortOption);
}

function changePlaylistOrder(pl) {
    changePlaylistSorting(pl, pl.sortedBy);
    toggleOrderBtn(pl.order);
}

function selectSortOption({ target }) {
    const sortBy = target.getAttribute("data-sort");

    if (sortBy) {
        const pl = getPlaylistById(getVisiblePlaylistId());

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
    changePlaylistOrder
};

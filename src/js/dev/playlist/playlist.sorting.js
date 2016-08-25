import * as playlist from "./playlist.js";
import { updatePlaylist } from "./playlist.manage.js";
import { filterTracks } from "./playlist.view.js";

const sortToggleBtn = document.getElementById("js-sort-toggle");
const optionsElement = document.getElementById("js-playlist-sort-options");
let currentActiveOption = null;

function capitalize(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function resetSelection() {
    sortToggleBtn.classList.remove("active");
    optionsElement.classList.remove("visible");
}

function resetCurrentActiveOption() {
    if (currentActiveOption) {
        currentActiveOption.classList.remove("active");
        currentActiveOption = null;
    }
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

function sortPlaylist(pl, sortBy) {
    const query = document.getElementById("js-filter-input").value;

    playlist.sort(pl, sortBy);
    updatePlaylist(pl);
    playlist.save(pl);

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
    resetSelection();
}

function isSortOptionSupported(sortOption, playlistType) {
    let supportedOptions = [];

    if (playlistType === "list") {
        supportedOptions = ["title", "artist", "album", "duration"];
    }
    else {
        supportedOptions = ["name", "duration"];
    }
    return supportedOptions.includes(sortOption);
}

function resetPlaylistSort(pl) {
    sortToggleBtn.textContent = "Sorting";
    pl.sortedBy = "";
    pl.order = 0;
    toggleOrderBtn();
}

function toggleSortOptions({ type, sortedBy }) {
    sortToggleBtn.classList.toggle("active");
    optionsElement.classList.toggle("visible");

    if (optionsElement.classList.contains("visible")) {
        resetCurrentActiveOption();
        Array.from(optionsElement.children).forEach(option => {
            const sortOptionBtn = option.firstElementChild;
            const sortBy = sortOptionBtn.getAttribute("data-sort");

            if (sortBy === sortedBy) {
                sortOptionBtn.classList.add("active");
                currentActiveOption = sortOptionBtn;
            }

            if (type === "grid" && (sortBy === "duration" || sortBy === "name")) {
                option.classList.remove("hidden");
            }
            else if (type === "list" && sortBy !== "name") {
                option.classList.remove("hidden");
            }
            else {
                option.classList.add("hidden");
            }
        });
    }
}

function changePlaylistOrder(pl) {
    sortPlaylist(pl, pl.sortedBy);
    toggleOrderBtn(pl.order);
}

function selectSortOption(sortBy, optionElement, pl) {
    resetSelection();

    if (currentActiveOption === optionElement) {
        return;
    }
    resetCurrentActiveOption();
    toggleOrderBtn();
    optionElement.classList.add("active");
    currentActiveOption = optionElement;
    sortToggleBtn.textContent = capitalize(sortBy);
    sortPlaylist(pl, sortBy);
}

export {
    setSortOptions,
    toggleSortOptions,
    selectSortOption,
    changePlaylistOrder,
    isSortOptionSupported,
    resetPlaylistSort
};

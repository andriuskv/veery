import * as settings from "./../settings.js";
import * as playlist from "./playlist.js";
import * as playlistManage from "./playlist.manage.js";
import { filterTracks } from "./playlist.view.js";

const sortToggleBtn = document.getElementById("js-sort-toggle");
const orderToggleBtn = document.getElementById("js-order-toggle");
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

function toggleBtnClasses(btn, order = 1) {
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
    playlistManage.update(pl);
    playlist.save(pl);

    if (query) {
        const trackElements = document.getElementById(`js-${pl.id}`).children;

        filterTracks(pl.tracks, trackElements, query);
    }
}

function setSortOptions(id) {
    const pl = playlist.get(id);
    let btnTitle = "Sorting";

    if (pl.sortedBy) {
        btnTitle = capitalize(pl.sortedBy);
    }
    sortToggleBtn.textContent = btnTitle;
    toggleBtnClasses(orderToggleBtn, pl.order);
    resetSelection();
}

sortToggleBtn.addEventListener("click", () => {
    sortToggleBtn.classList.toggle("active");
    optionsElement.classList.toggle("visible");

    if (optionsElement.classList.contains("visible")) {
        const options = Array.from(optionsElement.children);
        const id = settings.get("activeTabId");
        const pl = playlist.get(id);

        resetCurrentActiveOption();
        options.forEach(option => {
            const sortOptionBtn = option.firstElementChild;
            const sortBy = sortOptionBtn.getAttribute("data-sort");

            if (sortBy === pl.sortedBy) {
                sortOptionBtn.classList.add("active");
                currentActiveOption = sortOptionBtn;
            }

            if (id === "local-files") {
                option.classList.remove("hidden");
            }
            else if (sortBy === "artist" || sortBy === "album") {
                option.classList.add("hidden");
            }
        });
    }
});

orderToggleBtn.addEventListener("click", () => {
    const id = settings.get("activeTabId");
    const pl = playlist.get(id);

    if (!pl.sortedBy) {
        return;
    }
    sortPlaylist(pl, pl.sortedBy);
    toggleBtnClasses(orderToggleBtn, pl.order);
});

optionsElement.addEventListener("click", ({ target }) => {
    const sortBy = target.getAttribute("data-sort");

    if (!sortBy) {
        return;
    }
    if (currentActiveOption === target) {
        resetSelection();
        return;
    }
    const id = settings.get("activeTabId");
    const pl = playlist.get(id);
    const btnTitle = capitalize(sortBy);

    resetSelection();
    resetCurrentActiveOption();
    toggleBtnClasses(orderToggleBtn);
    target.classList.add("active");
    currentActiveOption = target;
    sortToggleBtn.textContent = btnTitle;
    sortPlaylist(pl, sortBy);
});

export {
    setSortOptions
};

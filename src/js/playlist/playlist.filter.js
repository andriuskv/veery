import { getElementById, getElementByAttr, isOutsideElement } from "../utils.js";
import { getVisiblePlaylistId } from "../tab.js";
import { getPlaylistById } from "./playlist.js";
import { getPlaylistTrackElements } from "./playlist.view.js";

const filterInput = getElementById("js-filter-input");
const filterInputContainer = filterInput.parentElement;
let timeout = 0;
let filteredPlaylistId = "";

function filterTracks(tracks, trackElements, query) {
    tracks.forEach(track => {
        const element = trackElements[track.index];
        const regex = new RegExp(query, "gi");
        const filterString = `
            ${track.title}
            ${track.artist}
            ${track.album}
        `;

        if (regex.test(filterString)) {
            element.classList.remove("hidden");
        }
        else {
            element.classList.add("hidden");
        }
    });
}

function toggleFilterInputCleanBtn(inputValue) {
    const btn = getElementById("js-clear-input-btn");

    if (inputValue) {
        btn.classList.add("visible");
    }
    else {
        btn.classList.remove("visible");
    }
}

function filterPlaylist(id, query = "") {
    const { tracks } = getPlaylistById(id);
    const elements = getPlaylistTrackElements(id);

    filteredPlaylistId = query ? id : "";
    filterTracks(tracks, elements, query);
    toggleFilterInputCleanBtn(query);
}

function resetFilteredPlaylist() {
    if (filteredPlaylistId) {
        filterInput.value = "";
        filterPlaylist(filteredPlaylistId);
    }
}

function resetInput() {
    filterInput.classList.remove("active");
    filterInput.removeEventListener("keyup", handleKeyup);
    window.removeEventListener("click", blurInput);
}

function blurInput({ target }) {
    if (isOutsideElement(target, filterInputContainer)) {
        resetInput();
    }
}

function handleKeyup({ target }) {
    const id = getVisiblePlaylistId();
    const filter = target.value.trim().toLowerCase();

    clearTimeout(timeout);
    timeout = setTimeout(filterPlaylist, 400, id, filter);
}

filterInput.addEventListener("focus", ({ currentTarget }) => {
    currentTarget.classList.add("active");
    currentTarget.addEventListener("keyup", handleKeyup);
    window.addEventListener("click", blurInput);
});

filterInputContainer.addEventListener("click", ({ target }) => {
    const element = getElementByAttr(target, "data-filter-item");

    if (!element) {
        return;
    }
    const item = element.attrValue;

    if (item === "icon") {
        filterInput.focus();
    }
    else if (item === "button") {
        resetFilteredPlaylist();
        resetInput();
    }
});

export {
    filterTracks,
    resetFilteredPlaylist
};

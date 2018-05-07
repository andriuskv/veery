import { getElementByAttr } from "../utils.js";
import { getVisiblePlaylistId } from "../tab.js";
import { getPlaylistById } from "./playlist.js";
import { getPlaylistTrackElements } from "./playlist.view.js";

const filterInput = document.getElementById("js-filter-input");
const filterInputContainer = filterInput.parentElement;
let timeout = 0;
let filteredPlaylistId = "";

function filterTracks(tracks, trackElements, query) {
    const regex = new RegExp(query, "i");

    tracks.forEach(track => {
        const element = trackElements[track.index];
        const filterString = `
            ${track.title}
            ${track.artist}
            ${track.album}
        `;

        element.classList.toggle("hidden", !regex.test(filterString));
    });
}

function toggleClearInputBtn(value) {
    document.getElementById("js-clear-input-btn").classList.toggle("visible", value);
}

function filterPlaylist(id, query = "") {
    const { tracks } = getPlaylistById(id);

    if (!tracks.length) {
        return;
    }
    const elements = getPlaylistTrackElements(id);

    filteredPlaylistId = query ? id : "";
    filterTracks(tracks, elements, query);
    toggleClearInputBtn(query);
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
    filterInput.removeEventListener("blur", resetInput);
}

function handleKeyup({ target }) {
    const id = getVisiblePlaylistId();

    clearTimeout(timeout);
    timeout = setTimeout(filterPlaylist, 400, id, target.value);
}

filterInput.addEventListener("focus", ({ currentTarget }) => {
    currentTarget.classList.add("active");
    currentTarget.addEventListener("keyup", handleKeyup);
    currentTarget.addEventListener("blur", resetInput);
});

filterInputContainer.addEventListener("click", ({ target }) => {
    const element = getElementByAttr("data-filter-item", target);

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

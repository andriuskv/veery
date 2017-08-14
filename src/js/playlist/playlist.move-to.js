import { getElementById, getElementByAttr, removeElement } from "./../utils.js";
import { getVisiblePlaylistId } from "./../tab.js";
import { getPlaylistById, getAllPlaylists, findTrack } from "./playlist.js";
import { getSelectedTrackElements, getSelectedTrackIndexes } from "./playlist.track-selection.js";
import { onNewPlaylistFormSubmit, createNewPlaylistForm, addTracksToPlaylist } from "./playlist.manage.js";

function showMoveToBtn() {
    const panelContainerId = "js-move-to-panel-container";

    if (getElementById(panelContainerId)) {
        return;
    }
    getElementById("js-playlist-type-btns").insertAdjacentHTML("beforebegin", `
        <div id="${panelContainerId}" class="playlist-tab-header-item">
            <button class="btn btn-icon" data-item="move-to" title="Move to">
                <svg viewBox="0 0 24 24">
                    <path d="M2,16H10V14H2M18,14V10H16V14H12V16H16V20H18V16H22V14M14,6H2V8H14M14,10H2V12H14V10Z" />
                </svg>
            </button>
        </div>
    `);
}

function handleSubmit(event) {
    const element = getElementById("js-move-to-list");

    onNewPlaylistFormSubmit(event);
    element.classList.remove("hidden");
    element.innerHTML = createPlaylistList(getVisiblePlaylistId());
}

function showForm({ currentTarget }) {
    createNewPlaylistForm("move-to", currentTarget, handleSubmit);
    currentTarget.classList.add("hidden");
}

function moveTracks(playlistId) {
    const elements = getSelectedTrackElements();
    const trackIndexes = getSelectedTrackIndexes(elements);
    const { tracks } = getPlaylistById(getVisiblePlaylistId());
    const pl = getPlaylistById(playlistId);
    const createdAt = new Date().getTime();
    const selectedTracks = tracks
        .filter(track => trackIndexes.includes(track.index) && !findTrack(playlistId, track.name))
        .map(track => Object.assign({}, track, { playlistId, createdAt }));

    addTracksToPlaylist(pl, selectedTracks, true);
}

function onListClick({ target }) {
    const element = getElementByAttr("data-item", target);

    if (!element) {
        return;
    }
    moveTracks(element.attrValue);
    getElementById("js-move-to-list").removeEventListener("click", onListClick);
    removeElement(getElementById("js-move-to-panel-container"));
}

function createPlaylistList(playlistId) {
    const playlists = getAllPlaylists();

    return Object.keys(playlists)
        .filter(id => id !== playlistId)
        .map(id => {
            const { title } = playlists[id];

            return `
                <li data-item="${id}">
                    <button class="btn move-to-list-item-btn">${title}</button>
                </li>
            `;
        }).join("");
}

function createMoveToPanel(panelId, { playlistId }) {
    const listContent = createPlaylistList(playlistId);
    const className = !listContent ? "hidden" : "";

    getElementById("js-move-to-panel-container").insertAdjacentHTML("beforeend", `
        <div id="${panelId}" class="panel move-to-panel">
            <h2 class="move-to-panel-title">Move to</h2>
            <ul id="js-move-to-list" class="move-to-list ${className}">${listContent}</ul>
            <button id="js-move-to-new-pl-btn" class="btn btn-icon move-to-new-pl-btn">
                <svg viewBox="0 0 24 24">
                    <use href="#plus"></use>
                </svg>
                <span>Create new playlist</span>
            </button>
        </div>
    `);
    getElementById("js-move-to-list").addEventListener("click", onListClick);
    getElementById("js-move-to-new-pl-btn").addEventListener("click", showForm, { once: true });
}

export {
    showMoveToBtn,
    createMoveToPanel
};

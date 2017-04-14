import { getElementById, getElementByAttr, removeElement } from "./../utils.js";
import { getVisiblePlaylistId } from "./../tab.js";
import { getPlaylistById, getAllPlaylists, findTrack } from "./playlist.js";
import * as playlistManage from "./playlist.manage.js";

function showMoveToBtn() {
    const panelContainerId = "js-move-to-panel-container";

    if (getElementById(panelContainerId)) {
        return;
    }
    const element = `
        <div id="${panelContainerId}" class="tab-header-item">
            <button class="btn" data-header-item="move-to">Move to</button>
        </div>
    `;

    getElementById("js-list-toggle-btn").insertAdjacentHTML("beforebegin", element);
}

function handleSubmit(event) {
    const element = getElementById("js-move-to-list");

    playlistManage.onNewPlaylistFormSubmit(event);
    element.classList.remove("hidden");
    element.innerHTML = createPlaylistList(getVisiblePlaylistId());
}

function showInputContainer() {
    playlistManage.createNewPlaylistInputForm("move-to", this, handleSubmit);
    this.classList.add("hidden");
}

function moveTracks(playlistId) {
    const elements = playlistManage.getSelectedTrackElements();
    const trackIndexes = playlistManage.getSelectedTrackIndexes(elements);
    const { tracks } = getPlaylistById(getVisiblePlaylistId());
    const pl = getPlaylistById(playlistId);
    const createdAt = new Date().getTime();
    const selectedTracks = tracks
        .filter(track => trackIndexes.includes(track.index) && !findTrack(playlistId, track.name))
        .map(track => Object.assign({}, track, { playlistId, createdAt }));

    playlistManage.addTracksToPlaylist(pl, selectedTracks, true);
}

function onListClick(event) {
    const item = getElementByAttr(event.target, "data-item");

    if (item) {
        const playlistId = item.attrValue;

        moveTracks(playlistId);
        getElementById("js-move-to-list").removeEventListener("click", onListClick);
        removeElement(getElementById("js-move-to-panel-container"));
    }
}

function createPlaylistList(playlistId) {
    const playlists = getAllPlaylists();

    return Object.keys(playlists)
    .filter(id => id !== playlistId)
    .map(id => {
        const { title } = playlists[id];

        return `
            <li class="move-to-list-item" data-item="${id}">
                <button class="btn">${title}</button>
            </li>
        `;
    }).join("");
}

function createMoveToPanel(panelId, { id }) {
    const listContent = createPlaylistList(id);
    const className = !listContent ? "hidden" : "";
    const moveToPanelElement = `
        <div id="${panelId}" class="move-to-panel">
            <h2 class="move-to-panel-title">Move to</h2>
            <ul id="js-move-to-list" class="move-to-list ${className}">${listContent}</ul>
            <button id="js-move-to-new-pl-btn" class="btn move-to-new-pl-btn">Create new playlist</button>
        </div>
    `;

    getElementById("js-move-to-panel-container").insertAdjacentHTML("beforeend", moveToPanelElement);
    getElementById("js-move-to-list").addEventListener("click", onListClick);
    getElementById("js-move-to-new-pl-btn").addEventListener("click", showInputContainer, { once: true });
}

export {
    showMoveToBtn,
    createMoveToPanel
};

import { removeElement, getElementByAttr } from "./../main.js";
import { getVisiblePlaylistId } from "./../tab.js";
import { removePresentPanels } from "./../panels.js";
import { getPlaylistById, getAllPlaylists, findTrack } from "./playlist.js";
import * as playlistManage from "./playlist.manage.js";

const panelContainerElement = document.getElementById("js-move-to-panel-container");

function showMoveToBtn() {
    if (document.getElementById("js-move-to-btn")) {
        return;
    }
    const moveToButton = `
        <button id="js-move-to-btn" class="btn" data-header-item="move-to" title="Move to">Move to</button>
    `;

    panelContainerElement.insertAdjacentHTML("beforeend", moveToButton);
}

function hideMoveToBtn() {
    const moveToButton = document.getElementById("js-move-to-btn");

    if (moveToButton) {
        removeElement(moveToButton);
    }
}

function handleSubmit(event) {
    const moveToList = document.getElementById("js-move-to-list");

    playlistManage.onNewPlaylistFormSubmit(event);
    moveToList.classList.remove("hidden");
    moveToList.innerHTML = createPlaylistList(getVisiblePlaylistId());
}

function showInputContainer() {
    playlistManage.createNewPlaylistInputForm("move-to", this, handleSubmit);
    removeElement(this);
}

function moveTracks(playlistId) {
    const selectedTrackElements = playlistManage.getSelectedTrackElements();
    const trackIndexes = playlistManage.getSelectedTrackIndexes(selectedTrackElements);
    const { tracks } = getPlaylistById(getVisiblePlaylistId());
    const pl = getPlaylistById(playlistId);
    const selectedTracks = tracks
        .filter(track => trackIndexes.includes(track.index) && !findTrack(playlistId, track.name))
        .map(track => {
            track.playlistId = playlistId;
            return track;
        });

    playlistManage.updatePlaylist(pl, selectedTracks, true);
}

function onListClick(event) {
    const item = getElementByAttr(event.target, "data-item");

    if (item) {
        const playlistId = item.attrValue;

        moveTracks(playlistId);
        document.getElementById("js-move-to-list").removeEventListener("click", onListClick);
        removePresentPanels();
    }
}

function createPlaylistList(playlistId) {
    const playlists = getAllPlaylists();

    return Object.keys(playlists)
    .filter(id => id !== playlistId)
    .map(id => {
        const pl = playlists[id];

        return `
            <li class="move-to-list-item" data-item="${pl.id}">
                <button class="btn">${pl.title}</button>
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

    panelContainerElement.insertAdjacentHTML("beforeend", moveToPanelElement);
    document.getElementById("js-move-to-list").addEventListener("click", onListClick);
    document.getElementById("js-move-to-new-pl-btn").addEventListener("click", showInputContainer, { once: true });
}

export {
    showMoveToBtn,
    hideMoveToBtn,
    createMoveToPanel
};

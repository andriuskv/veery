import { removeElement, getElementByAttr } from "./../main.js";
import { getVisiblePlaylistId } from "./../tab.js";
import { removePresentPanels, removePanel } from "./../panels.js";
import { getPlaylistById, getAllPlaylists, findTrack } from "./playlist.js";
import * as playlistManage from "./playlist.manage.js";

function showMoveToBtn() {
    const panelContainerId = "js-move-to-panel-container";

    if (document.getElementById(panelContainerId)) {
        return;
    }
    const div = document.createElement("div");
    const button = document.createElement("button");

    div.id = panelContainerId;
    div.classList.add("tab-header-item");
    button.classList.add("btn");
    button.setAttribute("data-header-item", "move-to");
    button.title = "Move to";
    button.textContent = "Move to";
    div.appendChild(button);

    document.getElementById("js-tab-header").insertBefore(div, document.getElementById("js-list-toggle-btn"));
}

function removeMoveToPanelContainer() {
    const panelId = "js-move-to-panel";
    const panelContainer = document.getElementById(`${panelId}-container`);

    if (panelContainer) {
        removePanel(panelId);
        removeElement(panelContainer);
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

    playlistManage.addTracksToPlaylist(pl, selectedTracks, true);
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

    document.getElementById("js-move-to-panel-container").insertAdjacentHTML("beforeend", moveToPanelElement);
    document.getElementById("js-move-to-list").addEventListener("click", onListClick);
    document.getElementById("js-move-to-new-pl-btn").addEventListener("click", showInputContainer, { once: true });
}

export {
    showMoveToBtn,
    removeMoveToPanelContainer,
    createMoveToPanel
};

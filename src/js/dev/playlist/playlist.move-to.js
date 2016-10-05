import { getElementByAttr } from "./../main.js";
import { getActiveTabId } from "./../tab.js";
import { removePresentPanels } from "./../panels.js";
import { postMessageToWorker } from "./../worker.js";
import { initPlaylist, appendToPlaylist } from "./playlist.manage.js";
import { getPlaylistById, getAllPlaylists, createPlaylist, findTrack, resetTrackIndexes } from "./playlist.js";

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
        moveToButton.parentElement.removeChild(moveToButton);
    }
}

function showInputContainer(event) {
    document.getElementById("js-move-to-form").classList.add("visible");
    event.target.parentElement.removeChild(event.target);
    event.stopPropagation();
}

function moveTracks(playlistId) {
    const selectedTrackElements = Array.from(document.querySelectorAll(".track.selected"));
    const trackIndexes = selectedTrackElements.map(element => Number.parseInt(element.getAttribute("data-index"), 10));
    const pl = getPlaylistById(getActiveTabId());
    const destinationPlaylist = getPlaylistById(playlistId);
    const selectedTracks = [];

    pl.tracks.forEach(track => {
        if (trackIndexes.includes(track.index) && !findTrack(playlistId, track.name)) {
            selectedTracks.push(track);
        }
    });
    destinationPlaylist.tracks.push(...selectedTracks);
    destinationPlaylist.tracks = resetTrackIndexes(destinationPlaylist.tracks);
    appendToPlaylist(destinationPlaylist, selectedTracks, true);
    postMessageToWorker({
        action: "put",
        playlist: destinationPlaylist
    });
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

function onFormSubmit(event) {
    const moveToList = document.getElementById("js-move-to-list");
    const form = event.target;
    const pl = createPlaylist({
        id: Math.random().toString(36).slice(2),
        title: form.title.value,
        type: "list"
    });

    initPlaylist(pl);
    postMessageToWorker({
        action: "put",
        playlist: pl
    });
    moveToList.classList.remove("hidden");
    moveToList.innerHTML = createPlaylistList(getActiveTabId());
    event.preventDefault();
    form.reset();
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
            <form id="js-move-to-form" class="move-to-form">
                <input type="text" class="input" name="title" autocomplete="off" required>
                <button class="btn">Create</button>
            </form>
        </div>
    `;

    panelContainerElement.insertAdjacentHTML("beforeend", moveToPanelElement);
    document.getElementById("js-move-to-list").addEventListener("click", onListClick);
    document.getElementById("js-move-to-new-pl-btn").addEventListener("click", showInputContainer, { once: true });
    document.getElementById("js-move-to-form").addEventListener("submit", onFormSubmit, { once: true });
}

export {
    showMoveToBtn,
    hideMoveToBtn,
    createMoveToPanel
};

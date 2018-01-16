import { getElementByAttr, removeElement } from "./../utils.js";
import { getVisiblePlaylistId, getVisiblePlaylist } from "./../tab.js";
import { removePanel } from "./../panels.js";
import { getPlaylistById, getPlaylistArray, findTrack } from "./playlist.js";
import { getSelectedElements, getElementIndexes, deselectTrackElements } from "./playlist.track-selection.js";
import { onNewPlaylistFormSubmit, createNewPlaylistForm, addTracksToPlaylist } from "./playlist.manage.js";

function createMoveToContainer() {
    const id = "js-move-to-panel-container";
    const element = document.getElementById("js-playlist-type-btns");

    element.insertAdjacentHTML("beforebegin", `
        <div id="${id}" class="playlist-tab-header-item" data-move-to>
            <button class="btn btn-icon" data-item="move-to" title="Move to">
                <svg viewBox="0 0 24 24">
                    <path d="M2,16H10V14H2M18,14V10H16V14H12V16H16V20H18V16H22V14M14,6H2V8H14M14,10H2V12H14V10Z" />
                </svg>
            </button>
        </div>
    `);
    document.getElementById(id).addEventListener("click", handleClick);
}

function removeMoveToContainer() {
    const element = document.getElementById("js-move-to-panel-container");

    element.removeEventListener("click", handleClick);
    removeElement(element);
}

function handleClick({ currentTarget, target }) {
    const element = getElementByAttr("data-panel-item", target, currentTarget);

    if (!element) {
        return;
    }
    const { attrValue, elementRef } = element;

    if (attrValue === "btn") {
        createNewPlaylistForm("move-to", elementRef.parentElement, "beforeend", handleSubmit);
        removeElement(elementRef);
    }
    else {
        currentTarget.removeEventListener("click", handleClick);
        moveTracks(attrValue);
        removePanel();
        deselectTrackElements();
    }
}

function handleSubmit(event) {
    const element = document.getElementById("js-move-to-list");
    const id = getVisiblePlaylistId();

    onNewPlaylistFormSubmit(event);

    if (element) {
        element.innerHTML = getPlaylistItems(id);
    }
    else {
        event.target.insertAdjacentHTML("beforebegin", getPlaylistList(id));
    }
}

function moveTracks(playlistId) {
    const indexes = getElementIndexes(getSelectedElements());
    const { tracks } = getVisiblePlaylist();
    const pl = getPlaylistById(playlistId);
    const selectedTracks = tracks
        .filter(track => indexes.includes(track.index) && !findTrack(playlistId, track.name))
        .map(track => Object.assign({}, track, { playlistId }));

    addTracksToPlaylist(pl, selectedTracks, true);
}

function getPlaylistItems(id) {
    return getPlaylistArray().reduce((str, pl) => {
        if (pl.id !== id) {
            str += `
                <li data-panel-item="${pl.id}">
                    <button class="btn move-to-list-item-btn">${pl.title}</button>
                </li>
            `;
        }
        return str;
    }, "");
}

function getPlaylistList(playlistId) {
    const items = getPlaylistItems(playlistId);

    return items ? `<ul id="js-move-to-list" class="move-to-list">${items}</ul>` : "";
}

function createMoveToPanel(panelId, { playlistId }) {
    const element = document.getElementById("js-move-to-panel-container");

    element.insertAdjacentHTML("beforeend", `
        <div id="${panelId}" class="panel move-to-panel">
            <h3 class="move-to-panel-title">Move to</h3>
            ${getPlaylistList(playlistId)}
            <button class="btn btn-icon move-to-new-pl-btn" data-panel-item="btn">
                <svg viewBox="0 0 24 24">
                    <use href="#plus"></use>
                </svg>
                <span>Create new playlist</span>
            </button>
        </div>
    `);
}

export {
    createMoveToContainer,
    removeMoveToContainer,
    createMoveToPanel
};

import { getElementByAttr, removeElement, getIcon } from "./../utils.js";
import { toggleRoute } from "../router.js";
import { getVisiblePlaylistId, getVisiblePlaylist } from "./../tab.js";
import { removePanel } from "./../panels.js";
import { getPlaylistById, getPlaylistArray, findTrack } from "./playlist.js";
import { getSelectedElementIndexes, deselectTrackElements } from "./playlist.track-selection.js";
import { onNewPlaylistFormSubmit, createNewPlaylistForm, addTracksToPlaylist } from "./playlist.manage.js";

function createMoveToContainer() {
    const id = "js-move-to-panel-container";
    const element = document.getElementById("js-playlist-tab-header-items");

    element.insertAdjacentHTML("afterbegin", `
        <div id="${id}" class="playlist-tab-header-item" data-move-to>
            <button class="btn btn-icon" data-item="move-to" title="Move to">
                ${getIcon({ iconId: "move-to" })}
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
    const indexes = getSelectedElementIndexes();
    const { tracks } = getVisiblePlaylist();
    const pl = getPlaylistById(playlistId);
    const selectedTracks = tracks
        .filter(track => indexes.includes(track.index) && !findTrack(playlistId, track.name));

    addTracksToPlaylist(pl, selectedTracks);
    toggleRoute(`playlist/${pl.id}`);
}

function getPlaylistItems(id) {
    return getPlaylistArray().reduce((str, pl) => {
        if (pl.id !== id) {
            str += `
                <li data-panel-item="${pl.id}">
                    <button class="btn btn-icon move-to-list-item-btn">${pl.title}</button>
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
            <h3 class="panel-title move-to-panel-title">Move to</h3>
            ${getPlaylistList(playlistId)}
            <button class="btn btn-icon move-to-new-pl-btn" data-panel-item="btn">
                ${getIcon({ iconId: "plus" })}
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

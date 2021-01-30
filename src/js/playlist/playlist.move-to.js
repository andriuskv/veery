import { toggleRoute } from "../router.js";
import { getVisiblePlaylistId, getVisiblePlaylist } from "./../tab.js";
import { getPlaylistById, getPlaylistArray, findTrack } from "./playlist.js";
import { getSelectedElementIndexes, deselectTrackElements } from "./playlist.track-selection.js";
import { onNewPlaylistFormSubmit, createNewPlaylistForm, addTracksToPlaylist } from "./playlist.manage.js";

function createMoveToForm(id, element, insertPoint) {
  createNewPlaylistForm(id, element, insertPoint, handleSubmit);
  element.remove();
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
    .filter(track => indexes.includes(track.index) && !findTrack(playlistId, track.name))
    .map(track => ({ ...track }));

  addTracksToPlaylist(pl, selectedTracks);
  deselectTrackElements();
  toggleRoute(`playlist/${pl.id}`);
}

function getPlaylistItems(id) {
  return getPlaylistArray().reduce((str, pl) => {
    if (pl.id !== id) {
      str += `
        <li data-panel-item="${pl.id}">
          <button class="btn btn-icon selection-panel-btn selection-panel-move-to-list-item-btn">${pl.title}</button>
        </li>
      `;
    }
    return str;
  }, "");
}

function getPlaylistList(playlistId) {
  const items = getPlaylistItems(playlistId);

  return items ? `<ul id="js-move-to-list" class="selection-panel-move-to-list">${items}</ul>` : "";
}

function getMoveToSection(id) {
  return `
    <h3 class="panel-title selection-panel-title">Move to...</h3>
    ${getPlaylistList(id)}
    <button class="btn btn-icon selection-panel-btn" data-panel-item="form-btn">Create New Playlist</button>
  `;
}

export {
  createMoveToForm,
  moveTracks,
  getMoveToSection
};

import { getElementByAttr, getIcon } from "../utils.js";
import { getVisiblePlaylistId } from "./../tab.js";
import { togglePlayPauseBtn } from "./player.controls.js";
import { togglePlaying, playNextTrack, playTrackAtIndex } from "./player.js";
import { getPlaylistById, getNextTrack, getCurrentTrack } from "../playlist/playlist.js";
import { getSelectedElementIndexes } from "../playlist/playlist.track-selection.js";
import { getTrackInfo, getPlayPauseIcon } from "../playlist/playlist.view.js";
import { getArtwork } from "../artworks";

const queueElement = document.getElementById("js-queue");
const clearBtnElement = document.getElementById("js-queue-clear-btn");
const queueTracksElement = queueElement.querySelector(".queue-tracks");
const messageElement = queueElement.querySelector(".queue-message");
let queue = [];
let queueTrack = null;

function getQueueTrack() {
  queueTrack = queue.shift();

  if (!queueTrack) {
    return {};
  }
  const pl = getPlaylistById(queueTrack.playlistId);

  queueTracksElement.firstElementChild.remove();
  cleanupQueue();

  return {
    track: pl.tracks[queueTrack.index],
    playlistId: queueTrack.playlistId
  };
}

function addSelectedTracksToQueue() {
  const trackIndexes = getSelectedElementIndexes();
  const id = getVisiblePlaylistId();
  const pl = getPlaylistById(id);
  const uniqueTracks = trackIndexes.map(index => {
    const track = pl.tracks[index];

    return {
      index: track.index,
      name: track.name,
      playlistId: id
    };
  }).filter(({ name }) => !queue.find(track => track.name === name));

  queue = queue.concat(uniqueTracks);
  addTracksToQueueView(uniqueTracks);
}

function removeQueueTracks(tracks) {
  const [queueTracks, elements] = queue.reduce(([queueTracks, elements], queueTrack, index) => {
    if (tracks.find(track => track.name === queueTrack.name)) {
      elements.push(queueTracksElement.children[index]);
    }
    else {
      queueTracks.push(queueTrack);
    }
    return [queueTracks, elements];
  }, [[], []]);

  queue = queueTracks;
  elements.forEach(element => element.remove());
  cleanupQueue();
}

function removeQueuePlaylistTracks(id) {
  const [queueTracks, elements] = queue.reduce(([queueTracks, elements], queueTrack, index) => {
    if (queueTrack.playlistId === id) {
      elements.push(queueTracksElement.children[index]);
    }
    else {
      queueTracks.push(queueTrack);
    }
    return [queueTracks, elements];
  }, [[], []]);

  queue = queueTracks;
  elements.forEach(element => element.remove());
  cleanupQueue();
}

function updateQueueView(track, playlistId) {
  const currentTrackElement = document.getElementById("queue-now-playing");
  const nextTrackElement = document.getElementById("queue-next-in-playlist");
  const nextTrack = getNextTrack(playlistId, 1);

  if (currentTrackElement) {
    currentTrackElement.children[1].innerHTML = getQueueTrackView(track, "current");
  }
  else {
    queueTracksElement.parentElement.insertAdjacentHTML("beforebegin", `
      <div id="queue-now-playing" class="queue-section">
        <h4 class="queue-section-title">Now playing</h4>
        <div class="grid-item queue-track">${getQueueTrackView(track, "current")}</div>
      </div>
    `);
  }

  if (nextTrackElement) {
    nextTrackElement.children[1].innerHTML = getQueueTrackView(nextTrack, "next");
  }
  else {
    queueTracksElement.parentElement.insertAdjacentHTML("afterend", `
      <div id="queue-next-in-playlist" class="queue-section">
        <h4 class="queue-section-title">Next in playlist</h4>
        <div class="grid-item queue-track">${getQueueTrackView(nextTrack, "next")}</div>
      </div>
    `);
  }

  messageElement.classList.add("hidden");
}

function addTracksToQueueView(tracks) {
  clearBtnElement.disabled = false;
  messageElement.classList.add("hidden");
  queueTracksElement.parentElement.classList.add("visible");
  queueTracksElement.insertAdjacentHTML("beforeend", tracks.map(queueTrack => {
    const pl = getPlaylistById(queueTrack.playlistId);
    const track = pl.tracks[queueTrack.index];

    return `
      <li class="grid-item queue-track removable" data-id="${queueTrack.name}" data-pl-id="${pl.id}" data-index="${queueTrack.index}">
        ${getQueueTrackView(track, "queued", true)}
      </li>
    `;
  }).join(""));
}

function getQueueTrackView(track, attr, removable) {
  const { title, id } = getPlayPauseIcon(track.index);

  return `
    <div class="artwork-container grid-item-thumbnail">
      <button class="btn btn-icon track-play-pause-btn artwork-container-btn" data-btn=${attr} title="${title}">
        ${getIcon({ iconId: id, className: "grid-item-btn-icon" })}
      </button>
      <img src="${getArtwork(track.artworkId).image.small.url}" class="artwork" alt="">
    </div>
    ${getTrackInfo(track)}
    ${removable ? `
      <button class="btn btn-icon btn-icon-alt queue-track-remove-btn" data-remove-btn data-btn="remove" title="Remove">
        ${getIcon({ iconId: "trash" })}
      </button>
    ` : ""}
    <div class="grid-item-duration">${track.duration}</div>
  `;
}

function toggleQueue(toggleButton) {
  toggleButton.classList.toggle("active");
  queueElement.classList.toggle("visible");
}

function resetQueue() {
  const currentTrackElement = document.getElementById("queue-now-playing");
  const nextTrackElement = document.getElementById("queue-next-in-playlist");

  if (currentTrackElement) {
    currentTrackElement.remove();
  }

  if (nextTrackElement) {
    nextTrackElement.remove();
  }

  if (!queue.length) {
    messageElement.classList.remove("hidden");
  }
}

function cleanupQueue() {
  if (queue.length) {
    return;
  }
  clearBtnElement.disabled = true;
  queueTracksElement.parentElement.classList.remove("visible");

  if (!getCurrentTrack()) {
    messageElement.classList.remove("hidden");
  }
}

function clearQueuedTracks() {
  queue.length = 0;
  queueTracksElement.innerHTML = "";

  cleanupQueue();
}

function toggleQueuedTrackBtn(paused) {
  const element = queueElement.querySelector("[data-btn='current']");

  if (element) {
    togglePlayPauseBtn(element, paused);
  }
}

function removeQueuedTrack(element) {
  queue = queue.filter(track => track.name !== element.attrValue);
  element.elementRef.remove();
  cleanupQueue();
}

queueElement.addEventListener("click", event => {
  const buttonElement = getElementByAttr("data-btn", event.target);

  if (!buttonElement) {
    return;
  }

  if (buttonElement.attrValue === "current") {
    const track = getCurrentTrack();

    togglePlaying(track);
  }
  else if (buttonElement.attrValue === "next") {
    playNextTrack({ ignoreQueue: true });
  }
  else if (buttonElement.attrValue === "queued") {
    const trackElement = getElementByAttr("data-id", event.target);
    const index = trackElement.elementRef.getAttribute("data-index");
    const playlistId = trackElement.elementRef.getAttribute("data-pl-id");

    playTrackAtIndex(index, playlistId);
    removeQueuedTrack(trackElement);
  }
  else if (buttonElement.attrValue === "remove") {
    const trackElement = getElementByAttr("data-id", event.target);

    removeQueuedTrack(trackElement);
  }
});

clearBtnElement.addEventListener("click", clearQueuedTracks);

export {
  getQueueTrack,
  addSelectedTracksToQueue,
  removeQueueTracks,
  removeQueuePlaylistTracks,
  updateQueueView,
  toggleQueue,
  resetQueue,
  toggleQueuedTrackBtn
};





import { getElementByAttr, getIcon } from "../utils.js";
import { getVisiblePlaylistId } from "./../tab.js";
import { getPlaylistById } from "../playlist/playlist.js";
import { getSelectedElementIndexes } from "../playlist/playlist.track-selection.js";
import { getTrackInfo } from "../playlist/playlist.view.js";
import { getArtwork } from "../artworks";

const queueElement = document.getElementById("js-queue");
const queueTracksElement = queueElement.querySelector(".queue-tracks");
let queue = [];
let queueTrack = null;

function getQueueTrack() {
  queueTrack = queue.shift();

  if (!queueTrack) {
    return {};
  }
  const pl = getPlaylistById(queueTrack.playlistId);

  queueTracksElement.firstElementChild.remove();

  if (!queue.length) {
    queueTracksElement.classList.remove("visible");
  }
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
  updateQueueView(uniqueTracks);
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
}

function updateQueueView(queueTracks) {
  queueTracksElement.classList.add("visible");
  queueTracksElement.insertAdjacentHTML("beforeend", queueTracks.map(queueTrack => {
    const pl = getPlaylistById(queueTrack.playlistId);
    const track = pl.tracks[queueTrack.index];

    return `
      <li class="grid-item queue-track" data-id="${queueTrack.name}">
        <div class="artwork-container grid-item-thumbnail">
          <button class="btn btn-icon track-play-pause-btn artwork-container-btn" data-remove-btn title="Remove">
            ${getIcon({ iconId: "close" })}
          </button>
          <img src="${getArtwork(track.artworkId).image.small.url}" class="artwork" alt="">
        </div>
        ${getTrackInfo(track)}
        <div class="grid-item-duration">${track.duration}</div>
      </li>
    `;
  }).join(""));
}

function toggleQueue(toggleButton) {
  toggleButton.classList.toggle("active");
  queueElement.classList.toggle("visible");
}

function clearQueue() {
  queue.length = 0;
  queueTracksElement.innerHTML = "";
  queueTracksElement.classList.remove("visible");
}

queueElement.addEventListener("click", event => {
  const buttonElement = getElementByAttr("data-remove-btn", event.target);

  if (!buttonElement) {
    return;
  }
  const trackElement = getElementByAttr("data-id", event.target);
  queue = queue.filter(track => track.name !== trackElement.attrValue);
  trackElement.elementRef.remove();

  if (!queue.length) {
    queueTracksElement.classList.remove("visible");
  }
});

document.getElementById("js-queue-clear-btn").addEventListener("click", clearQueue);

export {
  getQueueTrack,
  addSelectedTracksToQueue,
  removeQueueTracks,
  removeQueuePlaylistTracks,
  updateQueueView,
  toggleQueue
};





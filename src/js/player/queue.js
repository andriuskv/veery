import { getElementByAttr, getIcon } from "../utils.js";
import { getVisiblePlaylistId } from "./../tab.js";
import { getPlaylistById, getNextTrack } from "../playlist/playlist.js";
import { getSelectedElementIndexes } from "../playlist/playlist.track-selection.js";
import { getTrackInfo } from "../playlist/playlist.view.js";
import { getArtwork } from "../artworks";

const queueElement = document.getElementById("js-queue");
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

  if (!queue.length) {
    queueTracksElement.parentElement.classList.remove("visible");
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

function updateQueueView(track, playlistId) {
  const currentTrackElement = document.getElementById("queue-now-playing");
  const nextTrackElement = document.getElementById("queue-next-in-playlist");
  const nextTrack = getNextTrack(playlistId, 1);

  if (currentTrackElement) {
    currentTrackElement.children[1].innerHTML = getQueueTrackView(track);
  }
  else {
    queueTracksElement.parentElement.insertAdjacentHTML("beforebegin", `
      <div id="queue-now-playing" class="queue-section">
        <h4 class="queue-section-title">Now playing</h4>
        <div class="grid-item queue-track">${getQueueTrackView(track)}</div>
      </div>
    `);
  }

  if (nextTrackElement) {
    nextTrackElement.children[1].innerHTML = getQueueTrackView(nextTrack);
  }
  else {
    queueTracksElement.parentElement.insertAdjacentHTML("afterend", `
      <div id="queue-next-in-playlist" class="queue-section">
        <h4 class="queue-section-title">Next in playlist</h4>
        <div class="grid-item queue-track">${getQueueTrackView(nextTrack)}</div>
      </div>
    `);
  }

  messageElement.classList.add("hidden");
}

function addTracksToQueueView(tracks) {
  queueTracksElement.parentElement.classList.add("visible");
  queueTracksElement.insertAdjacentHTML("beforeend", tracks.map(queueTrack => {
    const pl = getPlaylistById(queueTrack.playlistId);
    const track = pl.tracks[queueTrack.index];

    return `
      <li class="grid-item queue-track removable" data-id="${queueTrack.name}">
        ${getQueueTrackView(track, true)}
      </li>
    `;
  }).join(""));
}

function getQueueTrackView(track, removable) {
  return `
    <div class="artwork-container grid-item-thumbnail">
      ${removable ? `
        <button class="btn btn-icon track-play-pause-btn artwork-container-btn" data-remove-btn title="Remove">
          ${getIcon({ iconId: "close" })}
        </button>
      ` : ""}
      <img src="${getArtwork(track.artworkId).image.small.url}" class="artwork" alt="">
    </div>
    ${getTrackInfo(track)}
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

  if (queue.length === 0) {
    messageElement.classList.remove("hidden");
  }
}

function clearQueue() {
  queue.length = 0;
  queueTracksElement.innerHTML = "";
  queueTracksElement.parentElement.classList.remove("visible");
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
    queueTracksElement.parentElement.classList.remove("visible");
  }
});

document.getElementById("js-queue-clear-btn").addEventListener("click", clearQueue);

export {
  getQueueTrack,
  addSelectedTracksToQueue,
  removeQueueTracks,
  removeQueuePlaylistTracks,
  updateQueueView,
  toggleQueue,
  resetQueue
};





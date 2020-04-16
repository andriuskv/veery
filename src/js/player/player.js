import {
  updateTrackSlider,
  showTrackDuration,
  togglePlayPauseBtn,
  elapsedTime,
  resetTrackSlider,
  showPlayPauseBtnSpinner,
  hidePlayPauseBtnSpinner,
  showTrackSlider,
  hideTrackSlider
} from "./player.controls.js";
import {
  getPlaylistById,
  getActivePlaylistId,
  getPlaylistState,
  setPlaylistAsActive,
  setPlaybackOrder,
  findTrack,
  setCurrentTrack,
  getCurrentTrack,
  swapFirstPlaybackOrderItem,
  setPlaybackIndex,
  getPlaybackIndex,
  getPlaybackOrder,
  getNextTrack
} from "../playlist/playlist.js";
import { getElementByAttr } from "../utils.js";
import { getVisiblePlaylistId } from "../tab.js";
import { getSetting } from "../settings.js";
import { showActiveIcon, removeActiveIcon } from "../sidebar.js";
import { scrollTrackIntoView, toggleTrackPlayPauseBtn, resetCurrentTrackElement, setTrackElement } from "../playlist/playlist.view.js";
import { isMediaVisible, showTrackInfo, resetTrackInfo } from "./player.now-playing.js";
import { showPlayerMessage } from "./player.view.js";
import { updateCurrentTrackWithMetadata } from "../local";
import * as nPlayer from "./player.native.js";
import * as ytPlayer from "./player.youtube.js";

let isPaused = true;

const storedTrack = (function() {
  function getTrack() {
    return JSON.parse(localStorage.getItem("track")) || {};
  }

  function saveTrack(track) {
    localStorage.setItem("track", JSON.stringify(track));
  }

  function updateTrack(track) {
    saveTrack(Object.assign(getTrack(), track));
  }

  function removeTrack() {
    localStorage.removeItem("track");
  }

  function initTrack() {
    const storedTrack = getTrack();

    if (!storedTrack) {
      return;
    }
    const { playlistId, currentTime, name } = storedTrack;
    const track = findTrack(playlistId, name);

    if (!track) {
      removeTrack();
      return;
    }
    setPlaybackOrder(playlistId, getSetting("shuffle"), track.index);
    playNewTrack(track, playlistId, { startTime: currentTime });
    updateTrackSlider(track, currentTime);
  }

  return {
    getTrack,
    removeTrack,
    saveTrack,
    updateTrack,
    initTrack
  };
})();

function getPlayerState() {
  return isPaused;
}

function updatePlayerState(state) {
  isPaused = typeof state === "boolean" ? state : !isPaused;

  if (isPaused) {
    removeActiveIcon();
    elapsedTime.stop();
  }
  togglePlayPauseBtns(isPaused);
  updateDocumentTitle();
}

async function beforeTrackStart(track, playlistId, { scrollToTrack, startTime }) {
  const { rendered } = getPlaylistState(playlistId);

  if (track.needsMetadata || track.needsAlbum || track.picture) {
    showPlayPauseBtnSpinner();
    await updateCurrentTrackWithMetadata(track);
  }
  showTrackInfo(track);
  showTrackDuration(track.duration, track.durationInSeconds);
  showTrackSlider();
  setPlaylistAsActive(playlistId);
  setPlaybackIndex(track.index, playlistId);
  setCurrentTrack(track);

  if (rendered && track.index !== -1) {
    setTrackElement(track.index, playlistId);

    if (scrollToTrack) {
      scrollTrackIntoView(playlistId);
    }
  }

  if (typeof startTime === "undefined") {
    isPaused = false;

    updateDocumentTitle();
    showPlayPauseBtnSpinner();
    togglePlayPauseBtns(isPaused);
  }
  else {
    isPaused = true;
  }
}

function togglePlayPauseBtns(isPaused) {
  const element = document.getElementById("js-play-btn");

  togglePlayPauseBtn(element, isPaused);
  toggleTrackPlayPauseBtn(isPaused);
}

function togglePlaying({ player }) {
  if (player === "native") {
    nPlayer.togglePlaying(isPaused);
  }
  else if (player === "youtube") {
    ytPlayer.togglePlaying(isPaused);
  }
  updatePlayerState();
}

async function playNewTrack(track, playlistId, options = {}) {
  const volume = getSetting("volume");

  await beforeTrackStart(track, playlistId, options);

  if (track.player === "native") {
    nPlayer.playTrack(track, volume, options.startTime);
  }
  else if (track.player === "youtube") {
    ytPlayer.playTrack(track.id, volume, options.startTime);
  }
}

function playTrack() {
  const track = getCurrentTrack();

  if (track) {
    togglePlaying(track);
  }
  else {
    play("direction", 0, getVisiblePlaylistId());
  }
}

function play(source, sourceValue, id, mode) {
  if (!id) {
    return;
  }
  const shuffle = getSetting("shuffle");
  const currentTrack = getCurrentTrack();
  const { shuffled } = getPlaylistState(id);

  if (currentTrack) {
    toggleTrackPlayPauseBtn(true);
    resetCurrentTrackElement();
    resetTrackSlider();
    stopTrack(currentTrack);
  }

  if (source === "index") {
    const { tracks } = getPlaylistById(id);
    const track = tracks[sourceValue];

    setPlaybackOrder(id, shuffle, track.index);
    playNewTrack(track, id);
  }
  else if (source === "direction") {
    let track = null;
    let swapFirstTrack = false;

    if (!getPlaybackOrder().length || shuffled !== shuffle) {
      setPlaybackOrder(id, shuffle);

      if (shuffle) {
        swapFirstTrack = true;
      }
    }

    if (!navigator.onLine) {
      const checkedTracks = [];

      while (true) {
        const tempTrack = getNextTrack(id, sourceValue === 0 ? 1 : sourceValue);

        if (checkedTracks.includes(tempTrack.index)) {
          showPlayerMessage({
            body: "Can't play tracks from YouTube white offline"
          });
          break;
        }

        if (tempTrack.player === "youtube") {
          checkedTracks.push(tempTrack.index);
          setPlaybackIndex(tempTrack.index, id);
        }
        else {
          track = tempTrack;
          break;
        }
      }
    }
    else {
      track = getNextTrack(id, sourceValue);
    }

    if (track) {
      if (swapFirstTrack) {
        swapFirstPlaybackOrderItem(track.index);
      }
      playNewTrack(track, id, {
        scrollToTrack: mode !== "auto" && !isMediaVisible()
      });
    }
    else {
      // If playlist is empty reset player
      resetPlayer(currentTrack);
    }
  }
}

function playNextTrack(mode) {
  play("direction", 1, getActivePlaylistId(), mode);
}

function playPreviousTrack() {
  play("direction", -1, getActivePlaylistId());
}

function playTrackFromElement({ currentTarget, detail, target }) {
  const id = getVisiblePlaylistId();
  const element = getElementByAttr("data-btn", target, currentTarget);
  const trackElement = getElementByAttr("data-index", target, currentTarget);

  if (trackElement && trackElement.elementRef.classList.contains("disabled")) {
    return;
  }

  if (detail === 2 && trackElement && !element) {
    play("index", trackElement.attrValue, id);
  }
  else if (element) {
    const index = parseInt(trackElement.attrValue, 10);
    const track = getCurrentTrack();
    const playlistId = getActivePlaylistId();

    if (!track || playlistId !== id || index !== track.index) {
      play("index", index, id);
    }
    else {
      togglePlaying(track);
    }
  }
}

function stopTrack({ player }) {
  if (player === "native") {
    nPlayer.stopTrack();
  }
  else if (player === "youtube") {
    ytPlayer.stopTrack();
  }
}

function stopPlayer(track) {
  if (track) {
    stopTrack(track);
  }
  resetPlayer(track);
}

function resetPlayer(track) {
  isPaused = true;
  storedTrack.removeTrack();
  showTrackDuration();
  hideTrackSlider();
  resetTrackInfo();
  setCurrentTrack();
  setPlaylistAsActive();
  removeActiveIcon();

  if (track) {
    togglePlayPauseBtns(isPaused);
    resetCurrentTrackElement();
    resetTrackSlider();
    hidePlayPauseBtnSpinner();
  }
}

function setVolume(volume) {
  const track = getCurrentTrack() || {};

  if (track.player === "native") {
    nPlayer.setVolume(volume);
  }
  else if (track.player === "youtube") {
    ytPlayer.setVolume(volume);
  }
}

function seekTo(player, currentTime) {
  elapsedTime.stop();

  if (player === "native") {
    nPlayer.seekTo(currentTime);
  }
  else if (player === "youtube") {
    ytPlayer.seekTo(currentTime);
  }
}

function updateDocumentTitle(id = getVisiblePlaylistId()) {
  const isPlayerPaused = getPlayerState();
  const pl = getPlaylistById(id);
  let documentTitle = "Veery";

  if (!isPlayerPaused) {
    const { artist, name, title } = getCurrentTrack();
    documentTitle = `${artist && title ? `${artist} - ${title}` : name} | ${documentTitle}`;
  }
  else if (pl) {
    documentTitle = `${pl.title} | ${documentTitle}`;
  }
  document.title = documentTitle;
}

window.addEventListener("track-start", ({ detail: startTime }) => {
  const id = getActivePlaylistId();
  const { name, duration, durationInSeconds } = getCurrentTrack();

  showActiveIcon(id);
  storedTrack.saveTrack({
    name,
    playlistId: id
  });
  elapsedTime.start({
    currentTime: Math.floor(startTime),
    duration,
    durationInSeconds
  });
  hidePlayPauseBtnSpinner();
});

window.addEventListener("track-end", () => {
  const track = getCurrentTrack();
  const mode = getSetting("playback");

  if (mode === "track-once") {
    stopPlayer(track);
    return;
  }

  if (mode === "playlist-once" && getPlaybackIndex() === getPlaybackOrder().length - 1) {
    stopPlayer(track);
    return;
  }
  storedTrack.removeTrack();

  if (mode === "repeat") {
    playNewTrack(track, getActivePlaylistId());
    return;
  }
  playNextTrack("auto");
});

if ("mediaSession" in navigator) {
  navigator.mediaSession.setActionHandler("play", playTrack);
  navigator.mediaSession.setActionHandler("pause", playTrack);
  navigator.mediaSession.setActionHandler("previoustrack", playPreviousTrack);
  navigator.mediaSession.setActionHandler("nexttrack", playNextTrack);
}

export {
  getPlayerState,
  updatePlayerState,
  togglePlaying,
  playPreviousTrack,
  playTrack,
  playNextTrack,
  playTrackFromElement,
  stopPlayer,
  setVolume,
  seekTo,
  storedTrack,
  updateDocumentTitle
};

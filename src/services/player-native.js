import { dispatchCustomEvent } from "../utils.js";

let audioBlobURL;
let audio;
let currentTime = 0;

function playTrack(track, volume, startTime) {
  currentTime = startTime || 0;
  audioBlobURL = URL.createObjectURL(track.audioTrack);
  audio = new Audio(audioBlobURL);

  audio.onplaying = function() {
    dispatchCustomEvent("player-state", { loading: false });
  };

  audio.ontimeupdate = function() {
    if (audio.currentTime - currentTime >= 1) {
      currentTime = Math.round(audio.currentTime);
      dispatchCustomEvent("current-time-update", currentTime);
    }
  };

  audio.onended = function() {
    dispatchCustomEvent("track-end");
  };

  setVolume(volume);

  if (typeof startTime === "number") {
    seekTo(startTime);
    return;
  }
  audio.play();
}

function togglePlay(paused) {
  if (paused) {
    audio.play();
  }
  else {
    audio.pause();
  }
}

function stopTrack() {
  audio.pause();
  audio.ontimeupdate = null;
  audio.onended = null;
  audio.onplaying = null;
  audio.currentTime = 0;
  audio = null;

  if (audioBlobURL) {
    URL.revokeObjectURL(audioBlobURL);
    audioBlobURL = null;
  }
}

function setVolume(volume) {
  audio.volume = volume;
}

function seekTo(time) {
  audio.currentTime = time;
  currentTime = time;
}

export {
  playTrack,
  stopTrack,
  togglePlay,
  seekTo,
  setVolume
};

/* global YT */

import { scriptLoader, dispatchCustomEvent } from "../utils.js";
import { updatePlayerState, playNextTrack, stopPlayer } from "./player.js";
import { showPlayerMessage } from "./player.view.js";
import { elapsedTime, showPlayPauseBtnSpinner, hidePlayPauseBtnSpinner } from "./player.controls.js";
import { getActivePlaylistId, getCurrentTrack, getNextTrack } from "../playlist/playlist.js";

const PLAYING = 1;
const PAUSED = 2;
const BUFFERING = 3;
let initialized = false;
let ytPlayer = null;
let videoCued = false;
let args = null;
let stateUpdated = false;
let playState = false;

function onPlayerStateChange({ data: state }) {
  const track = getCurrentTrack();

  if (!track || track.player !== "youtube") {
    return;
  }

  if (state === PLAYING) {
    if (!stateUpdated) {
      updatePlayerState(false);
    }
    stateUpdated = false;
    dispatchCustomEvent("track-start", ytPlayer.getCurrentTime());
  }
  else if (state === PAUSED) {
    if (!stateUpdated) {
      updatePlayerState(true);
    }
    stateUpdated = false;
    hidePlayPauseBtnSpinner();
  }
  else if (state === BUFFERING) {
    elapsedTime.stop();
    showPlayPauseBtnSpinner();
  }
  else {
    hidePlayPauseBtnSpinner();
  }
}

function onPlayerReady() {
  const { id, volume, startTime } = args;
  initialized = true;

  if (typeof startTime === "number") {
    setVolume(volume);

    if (playState) {
      ytPlayer.loadVideoById(id, startTime);
    }
    else {
      ytPlayer.cueVideoById(id, startTime);
      videoCued = true;
    }
  }
  else {
    playTrack(id, volume);
  }
}

function onError(error) {
  let body = "";

  if (error.data === 100) {
    body = "Video is either removed or marked as private";
  }
  else if (error.data === 101 || error.data === 150) {
    body = "The owner of the requested video does not allow it to be played in embedded players";
  }
  console.log(error);

  if (body) {
    const id = getActivePlaylistId();
    const track = getCurrentTrack();
    const { name } = getNextTrack(id, 1);

    if (track.name === name) {
      stopPlayer(track);
    }
    else {
      playNextTrack();
    }
    showPlayerMessage({
      title: `Cannot play ${track.name}`,
      body
    });
  }
}

function initPlayer() {
  ytPlayer = new YT.Player("js-yt-player", {
    playerVars: {
      autoplay: 0,
      disablekb: 1,
      controls: 0,
      fs: 0,

      // Hide annotations
      iv_load_policy: 3
    },
    events: {
      onReady: onPlayerReady,
      onStateChange: onPlayerStateChange,
      onError
    }
  });
}

function togglePlaying(paused) {
  if (!initialized) {
    playState = paused;
    return;
  }
  stateUpdated = true;
  videoCued = false;

  if (paused) {
    ytPlayer.playVideo();
  }
  else {
    ytPlayer.pauseVideo();
  }
}

function playTrack(id, volume, startTime) {
  if (initialized) {
    setVolume(volume);
    ytPlayer.loadVideoById(id, startTime);
    return;
  }
  args = { id, volume, startTime };
  window.onYouTubeIframeAPIReady = initPlayer;
  scriptLoader.load({ src: "https://www.youtube.com/iframe_api" });
}

function stopTrack() {
  if (initialized) {
    hidePlayPauseBtnSpinner();
    ytPlayer.stopVideo();
    videoCued = false;
  }
}

function setVolume(volume) {
  if (initialized) {
    ytPlayer.setVolume(volume * 100);
  }
}

function seekTo(currentTime) {
  if (initialized) {
    if (videoCued) {
      // Cue video again at the different timestamp to prevent it from playing
      ytPlayer.cueVideoById(args.id, currentTime);
    }
    else {
      ytPlayer.seekTo(currentTime, true);
    }
  }
}

export {
  playTrack,
  stopTrack,
  togglePlaying,
  seekTo,
  setVolume
};

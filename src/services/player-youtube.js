import { scriptLoader, dispatchCustomEvent } from "../utils";
import { getNextPlayableTrack, getActivePlaylistId, stopPlayer } from "./player";

const PLAYING = 1;
const PAUSED = 2;
const BUFFERING = 3;
let player = null;
let initArgs = null;
let initialized = false;
let videoCued = false;
let playState = false;
let timeoutId = 0;
let seekedTime = 0;
let currentTrack = null;

function onPlayerStateChange({ data: state }) {
  let playerState = null;

  clearTimeout(timeoutId);

  if (state === BUFFERING) {
    playerState = { loading: true };
  }
  else if (state === PLAYING) {
    playerState = { loading: false, paused: false };
    startCounting();
  }
  else if (state === PAUSED) {
    playerState = { loading: false, paused: true };
  }

  if (playerState) {
    dispatchCustomEvent("player-state", playerState);
  }
}

function onPlayerReady() {
  const { track, volume, startTime } = initArgs;
  const currentTime = seekedTime || startTime;
  seekedTime = 0;
  initialized = true;

  setVolume(volume);

  if (currentTime > 0) {
    if (playState) {
      initArgs = null;
      player.loadVideoById(track.id, currentTime);
    }
    else {
      videoCued = true;
      player.cueVideoById(track.id, currentTime);
    }
  }
  else {
    playTrack(track, volume);
  }
}

function onError(error) {
  let message = "";

  if (error.data === 100) {
    message = "Video is either removed or marked as private";
  }
  else if (error.data === 101 || error.data === 150) {
    message = "The owner of the requested video does not allow it to be played in embedded players";
  }
  console.log(error);

  if (message) {
    const playlistId = getActivePlaylistId();
    const { id } = getNextPlayableTrack(1, playlistId);

    if (currentTrack.id === id) {
      stopPlayer();
    }
    else {
      dispatchCustomEvent("track-end");
    }
    dispatchCustomEvent("notification", { value: message });
  }
}

function startCounting() {
  update(performance.now(), Math.round(player.getCurrentTime()));
}

function update(startTime, currentTime, elapsed = 0) {
  const ideal = performance.now() - startTime;
  const diff = ideal - elapsed;

  if (currentTime < currentTrack.durationInSeconds) {
    currentTime += 1;

    dispatchCustomEvent("current-time-update", currentTime);
  }
  else {
    dispatchCustomEvent("track-end");
  }
  timeoutId = setTimeout(() => {
    update(startTime, currentTime, elapsed + 1000);
  }, 1000 - diff);
}

function initPlayer() {
  /* global YT */
  player = new YT.Player("js-youtube-player", {
    // https://developers.google.com/youtube/player_parameters#Parameters
    playerVars: {
      autoplay: 0,
      modestbranding: 1,
      disablekb: 1,
      controls: 0,
      fs: 0,
      rel: 0,
      iv_load_policy: 3
    },
    events: {
      onReady: onPlayerReady,
      onStateChange: onPlayerStateChange,
      onError
    }
  });
}

function togglePlay(paused) {
  if (!initialized) {
    playState = paused;
    return;
  }
  videoCued = false;

  if (paused) {
    player.playVideo();
  }
  else {
    player.pauseVideo();
  }
}

function playTrack(track, volume, startTime) {
  currentTrack = track;

  if (initialized) {
    player.loadVideoById(track.id, startTime);
    return;
  }
  document.getElementById("js-youtube-player-container").insertAdjacentHTML("beforeend", `
    <div id="js-youtube-player" class="youtube-player"></div>
  `);

  initArgs = { track, volume, startTime };
  window.onYouTubeIframeAPIReady = initPlayer;
  scriptLoader.load({ src: "https://www.youtube.com/iframe_api" });
}

function stopTrack() {
  if (!initialized) {
    return;
  }
  videoCued = false;
  initArgs = null;
  currentTrack = null;
  player.stopVideo();
}

function setVolume(volume) {
  if (!initialized) {
    return;
  }
  player.setVolume(volume * 100);
}

function seekTo(currentTime) {
  if (!initialized) {
    seekedTime = currentTime;
    return;
  }

  if (videoCued) {
    // Cue video again at the different timestamp to prevent it from playing
    player.cueVideoById(initArgs.track.id, currentTime);
  }
  else {
    clearTimeout(timeoutId);
    player.seekTo(currentTime, true);
  }
}

export {
  playTrack,
  stopTrack,
  togglePlay,
  seekTo,
  setVolume
};

import { dispatchCustomEvent, shuffleArray } from "../utils";
import { getSetting } from "services/settings";

import * as savedTrackService from "services/savedTrack";
import { setPlaylistViewActiveTrack, resetPlaylistViewActiveTrack } from "services/playlist-view";
import { getPlaylistById, getPlaylistState } from "services/playlist";
import { getArtwork } from "services/artwork";
import { getQueueStart, setQueueStart } from "services/queue";
import * as nativePlayer from "services/player-native";
import * as youtubePlayer from "services/player-youtube";

let activePlaylistId = "";
let activeTrack = null;
let paused = true;
let playbackOrder = [];
let playbackIndex = -1;
const excludedPlaybackItems = [];

function removeTrackFromPlayback(trackIndex) {
  excludedPlaybackItems.push(trackIndex);
}

function getExcludedPlaybackItems() {
  return excludedPlaybackItems;
}

function getPlaybackTrack(index, playlistId) {
  const playlist = getPlaylistById(playlistId);
  return playlist.tracks[playbackOrder[index]];
}

function setActivePlaylistId(playlistId) {
  activePlaylistId = playlistId;
}

function getActivePlaylistId() {
  return activePlaylistId;
}

function setActiveTrack(track) {
  activeTrack = track;
}

function getActiveTrack() {
  return activeTrack;
}

function updateActiveTrackIndex(tracks, id) {
  if (activeTrack && id === activePlaylistId) {
    const track = tracks.find(({ id }) => id === activeTrack.id);
    const index = track ? track.index : -1;

    activeTrack.index = index;
    setPlaybackIndex(index, id);
  }
}

function getPlaybackIndex() {
  return playbackIndex;
}

function setPlaybackIndex(trackIndex, playlistId) {
  let index = -1;

  // We don't have to follow sort order if playlist is shuffled.
  if (getSetting("shuffle")) {
    index = trackIndex;
  }
  else {
    const { sortOrder } = getPlaylistState(playlistId);
    index = sortOrder.indexOf(trackIndex);
  }
  playbackIndex = playbackOrder.indexOf(index);
  playbackIndex = playbackIndex < 0 ? -1 : playbackIndex;
}

function getPlayerState() {
  return paused;
}

function setPlayerState(state) {
  paused = state;

  if (paused) {
    navigator.mediaSession.playbackState = "paused";
  }
  else {
    navigator.mediaSession.playbackState = "playing";
  }
}

function swapFirstPlaybackOrderItem(index) {
  for (let i = 0; i < playbackOrder.length; i++) {
    if (playbackOrder[i] === index) {
      [playbackOrder[0], playbackOrder[i]] = [index, playbackOrder[0]];
      break;
    }
  }
}

function getPlaybackOrder() {
  return playbackOrder;
}

function setPlaybackOrder(id, trackIndex = -1) {
  if (!id) {
    return;
  }
  const shuffle = getSetting("shuffle");
  const { tracks } = getPlaylistById(id);
  const trackIndexes = tracks.map(({ index }) => index);

  playbackOrder = shuffle ? shuffleArray(trackIndexes) : trackIndexes;
  excludedPlaybackItems.length = 0;

  // Make track appear first in playback order when playlist is shuffled.
  if (shuffle && trackIndex >= 0) {
    swapFirstPlaybackOrderItem(trackIndex);
  }
  updateActiveTrackIndex(tracks, id);
}

function cleanupPreviousTrack() {
  dispatchCustomEvent("current-time-update", 0);
  resetPlaylistViewActiveTrack();
  stopTrack(activeTrack.player);
}

function playPlaylist(playlistId, { scrollToTrack } = {}) {
  if (activeTrack) {
    cleanupPreviousTrack();
  }
  setPlaybackOrder(playlistId);

  const track = getNextTrack(0, playlistId);

  if (track) {
    startTrack(track, playlistId, { scrollToTrack });
  }
  else {
    stopPlayer();
  }
}

function playAtIndex(index, playlistId) {
  if (activeTrack) {
    cleanupPreviousTrack();
  }
  const start = getQueueStart();

  if (start) {
    setQueueStart(null);
  }
  setPlaybackOrder(playlistId, index);

  const playlist = getPlaylistById(playlistId);
  const track = playlist.tracks[index];

  startTrack(track, playlistId);
}

function playQueueTrack(track, playlistId) {
  if (activeTrack) {
    const start = getQueueStart();

    if (!start) {
      setQueueStart({
        playlistId: activePlaylistId,
        playbackIndex,
        track: activeTrack
      });
    }
    cleanupPreviousTrack();
  }
  startTrack(track, playlistId, { scrollToTrack: true });
}

function playPrevious({ scrollToTrack } = {}) {
  if (activeTrack) {
    cleanupPreviousTrack();
  }
  const queueStart = getQueueStart();

  if (queueStart) {
    const { track, playlistId } = queueStart;

    startTrack(track, playlistId, { scrollToTrack });
    setQueueStart(null);
    return;
  }

  const track = getNextPlayableTrack(-1, activePlaylistId);

  if (track) {
    startTrack(track, activePlaylistId, { scrollToTrack: true });
  }
}

function playNext(queueItem, { scrollToTrack } = {}) {
  const queueStart = getQueueStart();

  if (activeTrack) {
    if (!queueStart && queueItem) {
      setQueueStart({
        playlistId: activePlaylistId,
        playbackIndex,
        track: activeTrack
      });
    }
    cleanupPreviousTrack();
  }

  if (queueItem) {
    const { track, playlistId } = queueItem;

    startTrack(track, playlistId, { queueStart, scrollToTrack });
    return;
  }

  if (queueStart) {
    activePlaylistId = queueStart.playlistId;
    playbackIndex = queueStart.playbackIndex;
    setQueueStart(null);
  }

  const track = getNextPlayableTrack(1, activePlaylistId);

  if (track) {
    startTrack(track, activePlaylistId, { scrollToTrack });
  }
  else {
    stopPlayer();
  }
}

async function startTrack(track, playlistId, { queueStart, currentTime, scrollToTrack, willPlay = true } = {}) {
  if (track.needsMetadata) {
    dispatchCustomEvent("player-state", { loading: true });

    const { updateTrackWithMetadata } = await import("services/local");
    track = await updateTrackWithMetadata(track);
  }

  if (!queueStart) {
    setPlaybackIndex(track.index, playlistId);
  }
  setActiveTrack(track);
  setPlaylistViewActiveTrack(track.index, playlistId, scrollToTrack);

  if (willPlay) {
    dispatchCustomEvent("track-start", { track, playlistId });
  }
  setGlobalMediaSession(track);
  playTrack(track, currentTime);

  if (queueStart) {
    savedTrackService.updateTrack({
      trackId: queueStart.track.id,
      currentTime: 0,
      playlistId: queueStart.playlistId
    });
  }
  else {
    savedTrackService.updateTrack({
      trackId: track.id,
      currentTime: currentTime || 0,
      playlistId
    });
  }
}

function repeatPlay() {
  const playlist = getPlaylistById(activePlaylistId);
  const track = playlist.tracks[activeTrack.index];

  startTrack(track, activePlaylistId);
}

function playTrack(track, currentTime) {
  const volume = getSetting("volume");

  if (track.player === "native") {
    nativePlayer.playTrack(track, volume, currentTime);
  }
  else if (track.player === "youtube") {
    youtubePlayer.playTrack(track, volume, currentTime);
  }
}

function togglePlay() {
  const { player } = activeTrack;

  if (player === "native") {
    nativePlayer.togglePlay(paused);
  }
  else if (player === "youtube") {
    youtubePlayer.togglePlay(paused);
  }
}

function stopTrack(player) {
  if (player === "native") {
    nativePlayer.stopTrack();
  }
  else if (player === "youtube") {
    youtubePlayer.stopTrack();
  }
}

function stopPlayer() {
  if (activeTrack) {
    cleanupPreviousTrack();
  }
  activePlaylistId = "";
  activeTrack = null;
  paused = true;

  navigator.mediaSession.playbackState = "none";
  navigator.mediaSession.setPositionState(null);

  savedTrackService.removeTrack();
  dispatchCustomEvent("reset-player");
}

function seekTo(currentTime) {
  if (!activeTrack) {
    return;
  }

  if (activeTrack.player === "native") {
    nativePlayer.seekTo(currentTime);
  }
  if (activeTrack.player === "youtube") {
    youtubePlayer.seekTo(currentTime);
  }
}

function setVolume(volume) {
  if (!activeTrack) {
    return;
  }

  if (activeTrack.player === "native") {
    nativePlayer.setVolume(volume);
  }
  else if (activeTrack.player === "youtube") {
    youtubePlayer.setVolume(volume);
  }
}

function canPlay(id) {
  const playlist = getPlaylistById(id);

  return playlist?.tracks.length > 0;
}

function isLastTrackInPlayback() {
  return playbackIndex === playbackOrder.length - 1;
}

function setGlobalMediaSession(track) {
  if (track.player !== "youtube") {
    const { original, small, type } = getArtwork(track.artworkId);

    navigator.mediaSession.metadata = new MediaMetadata({
      title: track.title,
      artist: track.artist,
      album: track.album,
      artwork: [
        { src: original.url, sizes: "512x512", type },
        { src: small.url, sizes: "256x256", type },
        { src: small.url, sizes: "128x128", type }
      ]
    });

    navigator.mediaSession.setPositionState({
      duration: track.durationInSeconds
    });
  }
}

function getNextPlayableTrack(direction, playlistId) {
  let track = getNextTrack(direction, playlistId, true);

  if (!track) {
    return null;
  }
  let i = direction;

  while (excludedPlaybackItems.includes(track.index)) {
    i += direction;
    track = getNextTrack(i, playlistId, true);
  }
  return track;
}

function getNextTrackIndex(direction, wrapAround = false) {
  const start = getQueueStart();
  let index = start ? start.playbackIndex : playbackIndex;
  index += direction;

  if (direction === 0) {
    index = 0;
  }
  else if (index >= playbackOrder.length) {
    if (wrapAround) {
      index = index - playbackOrder.length;
    }
    else {
      index = 0;
    }
  }
  else if (index < 0) {
    index = playbackOrder.length - 1;
  }
  return playbackOrder[index];
}

function getNextTrack(direction, playlistId, wrap) {
  const playlist = getPlaylistById(playlistId);

  if (!playlist) {
    return null;
  }
  const trackIndex = getNextTrackIndex(direction, wrap);

  // We don't have to follow sort order if playlist is shuffled.
  if (getSetting("shuffle")) {
    return playlist.tracks[trackIndex];
  }
  const { sortOrder } = getPlaylistState(playlistId);
  const sortIndex = sortOrder[trackIndex];

  return playlist.tracks[sortIndex];
}

export {
  getPlaybackTrack,
  getExcludedPlaybackItems,
  getPlaybackIndex,
  getPlaybackOrder,
  removeTrackFromPlayback,
  setActivePlaylistId,
  getActivePlaylistId,
  getActiveTrack,
  setPlayerState,
  getPlayerState,
  playAtIndex,
  playPrevious,
  playNext,
  togglePlay,
  playPlaylist,
  playQueueTrack,
  repeatPlay,
  stopTrack,
  stopPlayer,
  seekTo,
  setVolume,
  getNextTrack,
  updateActiveTrackIndex,
  isLastTrackInPlayback,
  setPlaybackOrder,
  canPlay,
  startTrack,
  getNextPlayableTrack
};

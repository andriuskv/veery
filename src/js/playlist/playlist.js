import { shuffleArray } from "../utils";

const playlists = {};
const playlistState = {};
let activePlaylistId = "";
let currentTrack = null;
let playbackIndex = -1;
let playbackOrder = [];

function getPlaylistArray() {
  return Object.keys(playlists).map(getPlaylistById);
}

function getPlaylistById(id) {
  return playlists[id];
}

function createPlaylist(pl) {
  playlistState[pl.id] = {
    shuffled: false,
    sortOrder: []
  };
  playlists[pl.id] = {
    sortedBy: "index",
    order: 1,
    tracks: [],
    ...pl
  };
  return playlists[pl.id];
}

function updatePlaylist(id, data) {
  Object.assign(playlists[id], data);
}

function removePlaylist(id) {
  delete playlists[id];
  delete playlistState[id];
}

function getPlaylistState(id) {
  return playlistState[id];
}

function setPlaylistState(id, state) {
  Object.assign(playlistState[id], state);
}

function getPlaylistDuration(tracks) {
  return tracks.reduce((total, track) => {
    total += track.durationInSeconds;
    return total;
  }, 0);
}

function setPlaylistAsActive(id = "") {
  activePlaylistId = id;
}

function getActivePlaylistId() {
  return activePlaylistId;
}

function isPlaylistActive(id) {
  return id === activePlaylistId;
}

function setCurrentTrack(track) {
  currentTrack = track;
}


function getCurrentTrack() {
  return currentTrack;
}

function updateCurrentTrackIndex(playlistId) {
  const currentTrack = getCurrentTrack();

  if (currentTrack && isPlaylistActive(playlistId)) {
    const track = findTrack(playlistId, currentTrack.name);
    const index = track ? track.index : -1;

    currentTrack.index = index;
    setPlaybackIndex(index, playlistId);
  }
}

function findTrack(id, trackId) {
  const pl = playlists[id];

  return pl ? pl.tracks.find(track => track.name === trackId) : null;
}

function setPlaybackIndex(trackIndex, id) {
  const { sortOrder } = playlistState[id];
  const index = sortOrder.indexOf(trackIndex);
  playbackIndex = playbackOrder.indexOf(index);
  playbackIndex = playbackIndex < 0 ? 0 : playbackIndex;
}

function getPlaybackIndex() {
  return playbackIndex;
}

function getPlaybackOrder() {
  return playbackOrder;
}

function swapFirstPlaybackOrderItem(index) {
  for (let i = 0; i < playbackOrder.length; i++) {
    if (playbackOrder[i] === index) {
      [playbackOrder[0], playbackOrder[i]] = [index, playbackOrder[0]];
      break;
    }
  }
}

function setPlaybackOrder(id, shuffle, firstTrackIndex = -1) {
  const currentTrack = getCurrentTrack();
  const { tracks } = playlists[id];
  const trackIndexes = tracks.map(({ index }) => index);
  playlistState[id].shuffled = shuffle;
  playbackOrder = shuffle ? shuffleArray(trackIndexes) : trackIndexes;

  if (shuffle && firstTrackIndex >= 0) {
    swapFirstPlaybackOrderItem(firstTrackIndex);
  }

  if (currentTrack) {
    setPlaybackIndex(currentTrack.index, id);
  }
}

function getNextTrackIndex(direction) {
  let index = playbackIndex;
  index += direction;

  if (!direction || index >= playbackOrder.length) {
    index = 0;
  }
  else if (index === -1) {
    index = playbackOrder.length - 1;
  }
  return playbackOrder[index];
}

function getNextTrack(id, direction) {
  const trackIndex = getNextTrackIndex(direction);
  const { tracks } = playlists[id];
  const { sortOrder } = playlistState[id];
  const sortIndex = sortOrder[trackIndex];

  return tracks[sortIndex];
}

function resetTrackIndexes(pl) {
  pl.tracks = pl.tracks.map((track, index) => {
    track.index = index;
    return track;
  });
}

function getSortingValue(sortBy, track) {
  if (sortBy === "index") {
    return track.index;
  }

  if (sortBy === "duration") {
    return track.durationInSeconds;
  }
  return track[sortBy].toLowerCase();
}

function sortTracks(tracks, sortBy, order) {
  return [...tracks].sort((a, b) => {
    const aValue = getSortingValue(sortBy, a);
    const bValue = getSortingValue(sortBy, b);

    if (aValue < bValue) {
      return -order;
    }

    if (aValue > bValue) {
      return order;
    }
    return 0;
  }).map(({ index }) => index);
}

function setSortOrder(pl) {
  playlistState[pl.id].sortOrder = sortTracks(pl.tracks, pl.sortedBy, pl.order);
}

export {
  setPlaylistAsActive,
  getPlaylistById,
  removePlaylist,
  getPlaylistState,
  setPlaylistState,
  getPlaylistArray,
  createPlaylist,
  updatePlaylist,
  getPlaylistDuration,
  isPlaylistActive,
  getActivePlaylistId,
  setCurrentTrack,
  getCurrentTrack,
  updateCurrentTrackIndex,
  findTrack,
  getNextTrack,
  swapFirstPlaybackOrderItem,
  setPlaybackIndex,
  getPlaybackIndex,
  getPlaybackOrder,
  setPlaybackOrder,
  resetTrackIndexes,
  setSortOrder
};

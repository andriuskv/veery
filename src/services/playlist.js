import { syncArtworks, getPlaylistThumbnailImages } from "services/artwork";

const playlists = {};
const playlistState = {};
let db = null;

async function initPlaylists(idb) {
  const playlistArray = await idb.getAll("playlists");
  const sortedPlaylists = playlistArray.sort((a, b) => a.createdAt - b.createdAt);
  db = idb;

  for (const playlist of sortedPlaylists) {
    playlists[playlist.id] = playlist;
    playlistState[playlist.id] = {};

    if (playlist.tracks.length) {
      playlistState[playlist.id].duration = parsePlaylistDuration(playlist.tracks);
      playlistState[playlist.id].thumbnail = getPlaylistThumbnailImages(playlist.tracks);

      setSortOrder(playlist);
    }
    else {
      playlistState[playlist.id].duration = "0 hr 0 min";
      playlistState[playlist.id].thumbnail = ["assets/images/album-art-placeholder.png"];
      playlistState[playlist.id].sortOrder = [];
    }
  }
}

function getPlaylists() {
  return { ...playlists };
}

function getPlaylistById(id) {
  return playlists[id];
}

function getPlaylistState(id) {
  return playlistState[id];
}

function createPlaylist(playlist) {
  const pl = {
    tracks: [],
    createdAt: Date.now(),
    sortBy: "index",
    sortOrder: 1,
    ...playlist
  };

  playlistState[pl.id] = {
    thumbnail: ["assets/images/album-art-placeholder.png"],
    duration: "0 hr 0 min",
    sortOrder: []
  };

  if (pl.tracks.length) {
    playlistState[pl.id].duration = parsePlaylistDuration(pl.tracks);
    playlistState[pl.id].thumbnail = getPlaylistThumbnailImages(pl.tracks);

    if (pl.id !== "search") {
      pl.tracks = setTrackIndexes(pl.tracks);
    }
    setSortOrder(pl);
  }
  playlists[pl.id] = pl;

  if (pl.id !== "local-files" && pl.id !== "search") {
    db.put("playlists", pl);
  }
  return pl;
}

function updatePlaylist(id, data, shouldUpdateThumbnail = true) {
  playlists[id] = { ...playlists[id], ...data };

  if (data.tracks) {
    playlistState[id].duration = parsePlaylistDuration(data.tracks);

    if (shouldUpdateThumbnail) {
      playlistState[id].thumbnail = getPlaylistThumbnailImages(data.tracks);
    }
    setSortOrder(playlists[id]);
  }

  if (id !== "local-files" && id !== "search") {
    updateIDBPlaylist(id, data);
    syncArtworks(playlists);
  }
  return playlists[id];
}

async function updateIDBPlaylist(id, data) {
  const pl = await db.get("playlists", id);

  Object.keys(data).forEach(key => {
    pl[key] = data[key];
  });

  db.put("playlists", pl);
}

function addTracks(id, newTracks, save = true) {
  const playlist = playlists[id];
  const startIndex = playlist.tracks.length;
  const newIndexedTracks = setTrackIndexes(newTracks, startIndex);
  const indexes = newIndexedTracks.map(track => track.index);

  playlist.tracks = playlist.tracks.concat(newIndexedTracks);
  playlistState[id].sortOrder = playlistState[id].sortOrder.concat(indexes);


  if (save && id !== "local-files") {
    updateIDBPlaylist(id, { tracks: playlist.tracks });
  }
  return playlist.tracks;
}

function removePlaylist(id) {
  delete playlists[id];
  delete playlistState[id];

  if (id !== "local-files" && id !== "search") {
    syncArtworks(playlists);
    db.delete("playlists", id);
  }
  return playlists;
}

function getPlaylistDuration(tracks) {
  return tracks.reduce((total, track) => {
    total += track.durationInSeconds;
    return total;
  }, 0);
}

function parsePlaylistDuration(tracks) {
  const duration = getPlaylistDuration(tracks);
  let hours = Math.floor(duration / 3600);
  let minutes = Math.ceil(duration / 60 % 60);

  if (minutes === 60) {
    minutes = 0;
    hours += 1;
  }
  return `${hours} hr ${minutes} min`;
}

function setTrackIndexes(tracks, startIndex = 0) {
  return tracks.map((track, index) => {
    track.index = startIndex + index;
    return track;
  });
}

function getSortingValue(sortBy, track) {
  if (sortBy === "index") {
    return track.index;
  }
  else if (sortBy === "duration") {
    return track.durationInSeconds;
  }
  // Remove special characters.
  return track[sortBy].toLowerCase().replace(/[^\w\s]/gi, "");
}

function sortTracks(tracks, sortBy, order) {
  return [...tracks].sort((a, b) => {
    const aValue = getSortingValue(sortBy, a);
    const bValue = getSortingValue(sortBy, b);

    if (aValue < bValue) {
      return -order;
    }
    else if (aValue > bValue) {
      return order;
    }
    return 0;
  }).map(({ index }) => index);
}

function setSortOrder({ id, tracks, sortBy, sortOrder }) {
  playlistState[id].sortOrder = sortTracks(tracks, sortBy, sortOrder);
}

export {
  initPlaylists,
  getPlaylists,
  getPlaylistById,
  getPlaylistState,
  createPlaylist,
  updatePlaylist,
  addTracks,
  removePlaylist,
  parsePlaylistDuration,
  setSortOrder,
  setTrackIndexes
};

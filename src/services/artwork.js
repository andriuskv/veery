import { shuffleArray } from "../utils.js";
import { getActiveTrack } from "services/player";

const artworks = {};
let db = null;
let dbUpdateTimeoutId = 0;

async function initArtworks(idb) {
  const artworkArray = await idb.getAll("artworks");
  db = idb;

  for (const artwork of artworkArray) {
    artworks[artwork.id] = artwork;
  }
}

function getArtworks() {
  return artworks;
}

function setArtwork(id, value, save) {
  if (!artworks[id]) {
    value.id = id;
    artworks[id] = value;

    if (save) {
      clearTimeout(dbUpdateTimeoutId);
      dbUpdateTimeoutId = setTimeout(() => {
        addArtworks(artworks);
      }, 2000);
    }
  }
}

async function addArtworks(artworks) {
  const tx = db.transaction("artworks", "readwrite");

  await Promise.all([...Object.keys(artworks).map(key => {
    const artwork = artworks[key];

    if (artwork.original.blob || artwork.small.blob) {
      return null;
    }
    return tx.store.put(artwork);
  }), tx.done]);
}

function getArtwork(id) {
  if (id) {
    const artwork = artworks[id];

    if (!artwork) {
      return getPlaceholder();
    }
    const { original, small } = artwork;

    if (original.blob && !original.url) {
      original.url = URL.createObjectURL(original.blob);
    }

    if (!small) {
      artwork.small = { url: original.url };
    }
    else if (small.blob && !small.url) {
      small.url = URL.createObjectURL(small.blob);
    }
    return artwork;
  }
  return getPlaceholder();
}

function getPlaceholder() {
  const placeholder = "assets/images/album-art-placeholder.png";

  return {
    isPlaceholder: true,
    original: { url: placeholder },
    small: { url: placeholder }
  };
}

function getPlaylistThumbnailImages(tracks) {
  const placeholder = "assets/images/album-art-placeholder.png";

  if (!tracks.length) {
    return [placeholder];
  }
  const tracksWithArtwork = tracks.reduce((tracks, track) => {
    if (track.artworkId) {
      tracks.push(track);
    }
    return tracks;
  }, []);

  if (!tracksWithArtwork.length) {
    return [placeholder];
  }
  const ids = [];

  for (const track of shuffleArray(tracksWithArtwork)) {
    if (ids.length === 4) {
      break;
    }
    else if (!ids.includes(track.artworkId)) {
      ids.push(track.artworkId);
    }
  }

  return ids.map(id => getArtwork(id).small.url);
}

async function syncArtworks(playlists) {
  const occurrences = Object.values(playlists).reduce((tracks, pl) => tracks.concat(pl.tracks), [])
    .map(track => track.artworkId)
    .reduce((occurrences, id) => {
      occurrences[id] = occurrences[id] ? occurrences[id] + 1 : 1;
      return occurrences;
    }, {});
  const track = getActiveTrack();
  const tx = db.transaction("artworks", "readwrite");
  const promises = [];

  for (const id of Object.keys(artworks)) {
    if (!occurrences[id]) {
      if (track?.artworkId !== id) {
        delete artworks[id];
      }
      promises.push(tx.store.delete(id));
    }
  }
  Promise.all([...promises, tx.done]);
}

export {
  initArtworks,
  getArtworks,
  setArtwork,
  getArtwork,
  getPlaylistThumbnailImages,
  syncArtworks
};

/* global Dexie */

importScripts("./libs/dexie.min.js");

const db = new Dexie("veery");
db.version(1).stores({ playlists: "id", artworks: "id" });

(async function init() {
  const [playlists, artworks] = await Promise.all([db.playlists.toArray(), db.artworks.toArray()]);

  postMessage({ artworks, playlists });
})();

function getPlaylist(id) {
  return db.playlists.where("id").equals(id);
}

function createPlaylist(playlist) {
  db.playlists.put(playlist);
}

function addTracks({ id, tracks }) {
  getPlaylist(id).modify((_, ref) => {
    ref.value.tracks = ref.value.tracks.concat(tracks);
  });
}

function updateTracks({ id, tracks }) {
  getPlaylist(id).modify((_, ref) => {
    ref.value.tracks = tracks;
  });
}

function removeTracks({ id, tracks }) {
  getPlaylist(id).modify((_, ref) => {
    ref.value.tracks = ref.value.tracks.filter(track => {
      return !tracks.some(({ name }) => name === track.name);
    });
  });
}

function updatePlaylistProps(playlist) {
  getPlaylist(playlist.id).modify((_, ref) => {
    Object.keys(playlist).forEach(key => {
      ref.value[key] = playlist[key];
    });
  });
}

async function syncArtworks() {
  const [artworks, playlists] = await Promise.all([ db.artworks.toArray(), db.playlists.toArray()]);
  const occurences = playlists.reduce((tracks, pl) => tracks.concat(pl.tracks), [])
    .map(track => track.artworkId)
    .reduce((occurences, id) => {
      occurences[id] = occurences[id] ? occurences[id] + 1 : 1;
      return occurences;
    }, {});
  const orphans = artworks.filter(artwork => !occurences[artwork.id]).map(artwork => artwork.id);

  db.artworks.bulkDelete(orphans);
}

self.onmessage = function({ data: { action, artworks, playlist } }) {
  db.transaction("rw", db.artworks, db.playlists, () => {
    if (action === "create-playlist") {
      createPlaylist(playlist);
    }
    else if (action === "delete-playlist") {
      getPlaylist(playlist.id).delete();
    }
    else if (action === "add-tracks") {
      addTracks(playlist);
    }
    else if (action === "update-tracks") {
      updateTracks(playlist);
    }
    else if (action === "remove-tracks") {
      removeTracks(playlist);
    }
    else {
      updatePlaylistProps(playlist);
    }

    if (artworks) {
      db.artworks.bulkPut(Object.keys(artworks).map(key => {
        const item = artworks[key];

        if (item.file) {
          delete item.url;
        }
        return item;
      }));
    }
    syncArtworks();
  }).catch(e => {
    console.log(e);
  });
};

/* global idb */

importScripts("./idb-min.js");

(async function() {
  const db = await idb.openDB("veery", 1, {
    upgrade(db) {
      db.createObjectStore("playlists", { keyPath: "id" });
      db.createObjectStore("artworks", { keyPath: "id" });
    }
  });
  const [playlists, artworks] = await Promise.all([db.getAll("playlists"), db.getAll("artworks")]);

  postMessage({
    artworks,
    playlists: playlists.sort((a, b) => a.createdAt - b.createdAt)
  });

  self.onmessage = async function({ data: { action, artworks, playlist } }) {
    if (action === "create-playlist") {
      await db.put("playlists", playlist);
    }
    else if (action === "delete-playlist") {
      await db.delete("playlists", playlist.id);
    }
    else if (action === "add-tracks") {
      const pl = await db.get("playlists", playlist.id);
      pl.tracks = pl.tracks.concat(playlist.tracks);
      await db.put("playlists", pl);
    }
    else if (action === "update-tracks") {
      const pl = await db.get("playlists", playlist.id);
      pl.tracks = playlist.tracks;
      await db.put("playlists", pl);
    }
    else if (action === "remove-tracks") {
      const pl = await db.get("playlists", playlist.id);
      pl.tracks = pl.tracks.filter(track => !playlist.tracks.some(({ name }) => name === track.name));
      await db.put("playlists", pl);
    }
    else {
      const pl = await db.get("playlists", playlist.id);
      Object.keys(playlist).forEach(key => {
        pl[key] = playlist[key];
      });
      await db.put("playlists", pl);
    }

    if (artworks) {
      await addArtworks(artworks, db);
    }
    syncArtworks(db);
  };
})();

async function addArtworks(artworks, db) {
  const tx = db.transaction("artworks", "readwrite");
  await Promise.all([...Object.keys(artworks).map(key => {
    const item = artworks[key];

    if (item.image.original.blob) {
      delete item.image.original.url;
    }

    if (item.image.small) {
      if (item.image.small.blob) {
        delete item.image.small.url;
      }
      else {
        delete item.image.small;
      }
    }
    return tx.store.put(item);
  }), tx.done]);
}

async function syncArtworks(db) {
  const [playlists, artworks] = await Promise.all([db.getAll("playlists"), db.getAll("artworks")]);
  const occurrences = playlists.reduce((tracks, pl) => tracks.concat(pl.tracks), [])
    .map(track => track.artworkId)
    .reduce((occurrences, id) => {
      occurrences[id] = occurrences[id] ? occurrences[id] + 1 : 1;
      return occurrences;
    }, {});
  const tx = db.transaction("artworks", "readwrite");
  await Promise.all([
    ...artworks.filter(artwork => !occurrences[artwork.id]).map(artwork => tx.store.delete(artwork.id)),
    tx.done
  ]);
}

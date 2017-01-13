/* global importScripts, Dexie, postMessage */

importScripts("./../libs/dexie.min.js");

const db = new Dexie("playlists");

db.version(1).stores({
    playlists: "++_id"
});

db.playlists.toArray()
.then(playlists => {
    postMessage({
        action: "init",
        payload: playlists
    });
})
.catch(e => {
    console.log(e);
});

self.onmessage = function({ data: { action, playlist } }) {
    const playlistTable = db.playlists;

    if (action === "put") {
        playlistTable.put(playlist)
        .then(() => {
            postMessage({
                action: "update",
                payload: {
                    _id: playlist._id,
                    id: playlist.id
                }
            });
        })
        .catch(e => {
            console.log(e);
        });
    }
    else if (action === "update") {
        playlistTable.update(playlist._id, playlist)
        .catch(e => {
            console.log(e);
        });
    }
    else if (action === "remove") {
        playlistTable.delete(playlist._id)
        .catch(e => {
            console.log(e);
        });
    }
};

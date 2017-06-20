/* global importScripts, Dexie, postMessage */

importScripts("./libs/dexie.min.js");

const db = new Dexie("playlists");

db.version(1).stores({
    playlists: "++_id"
});

db.playlists.toArray().then(playlists => {
    postMessage({
        action: "init",
        payload: playlists
    });
})
.catch(e => {
    console.log(e);
});

function updatePlaylist(id, cb) {
    db.playlists.where("_id").equals(id).modify(cb).catch(e => {
        console.log(e);
    });
}

self.onmessage = function({ data: { action, playlist } }) {
    if (action === "put") {
        db.playlists.put(playlist).then(() => {
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
    else if (action === "change-sorting") {
        updatePlaylist(playlist._id, (value, ref) => {
            ref.value.sortedBy = playlist.sortedBy;
            ref.value.order = playlist.order;
        });
    }
    else if (action === "change-title") {
        updatePlaylist(playlist._id, (value, ref) => {
            ref.value.title = playlist.title;
        });
    }
    else if (action === "change-type") {
        updatePlaylist(playlist._id, (value, ref) => {
            ref.value.type = playlist.type;
        });
    }
    else if (action === "remove-tracks") {
        updatePlaylist(playlist._id, (value, ref) => {
            ref.value.tracks = ref.value.tracks.filter(track => {
                for (const localTrack of playlist.tracks) {
                    if (localTrack.name === track.name) {
                        return false;
                    }
                }
                return true;
            });
        });
    }
    else if (action === "remove") {
        db.playlists.delete(playlist._id).catch(e => {
            console.log(e);
        });
    }
};

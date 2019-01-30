/* global Dexie */

importScripts("./libs/dexie.min.js");

const db = new Dexie("playlists");

db.version(1).stores({ playlists: "++_id" });

db.playlists.toArray().then(playlists => {
    postMessage({
        action: "init",
        payload: playlists
    });
});

function getPlaylist(id) {
    return db.playlists.where("_id").equals(id);
}

function addPlaylist(playlist) {
    db.playlists.put(playlist).then(() => {
        postMessage({
            action: "update",
            payload: {
                _id: playlist._id,
                id: playlist.id
            }
        });
    });
}

function addTracks({ _id, tracks }) {
    getPlaylist(_id).modify((_, ref) => {
        ref.value.tracks = ref.value.tracks.concat(tracks);
    });
}

function removeTracks(id, tracks) {
    getPlaylist(id).modify((_, ref) => {
        ref.value.tracks = ref.value.tracks.filter(track => {
            for (const localTrack of tracks) {
                if (localTrack.name === track.name) {
                    return false;
                }
            }
            return true;
        });
    });
}

function updatePlaylistProps(id, props) {
    getPlaylist(id).modify((value, ref) => {
        Object.keys(props).forEach(key => {
            ref.value[key] = props[key];
        });
    });
}

self.onmessage = function({ data: { action, playlist } }) {
    db.transaction("rw", db.playlists, () => {
        if (action === "add") {
            addPlaylist(playlist);
        }
        else if (action === "remove") {
            getPlaylist(playlist._id).delete();
        }
        else if (action === "add-tracks") {
            addTracks(playlist);
        }
        else if (action === "remove-tracks") {
            removeTracks(playlist._id, playlist.tracks);
        }
        else {
            updatePlaylistProps(playlist._id, playlist);
        }
    }).catch(e => {
        console.log(e);
    });
};

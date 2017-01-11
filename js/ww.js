"use strict";

/* global importScripts, Dexie, postMessage */

importScripts("./libs/dexie.min.js");

var db = new Dexie("playlists");

db.version(1).stores({
    playlists: "++_id"
});

db.playlists.toArray().then(function (playlists) {
    postMessage({
        action: "init",
        payload: playlists
    });
}).catch(function (e) {
    console.log(e);
});

self.onmessage = function (_ref) {
    var _ref$data = _ref.data,
        action = _ref$data.action,
        playlist = _ref$data.playlist;

    var playlistTable = db.playlists;

    if (action === "put") {
        playlistTable.put(playlist).then(function () {
            postMessage({
                action: "update",
                payload: {
                    _id: playlist._id,
                    id: playlist.id
                }
            });
        }).catch(function (e) {
            console.log(e);
        });
    } else if (action === "update") {
        playlistTable.update(playlist._id, playlist).catch(function (e) {
            console.log(e);
        });
    } else if (action === "remove") {
        playlistTable.delete(playlist._id).catch(function (e) {
            console.log(e);
        });
    }
};

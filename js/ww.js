"use strict";

/* global importScripts, db, onmessage, postMessage */

window = self;

importScripts("./libs/db.min.js");

var server = null;

(function initDb() {
    db.open({
        server: "playlists",
        version: 1,
        noServerMethods: true,
        schema: {
            playlists: {
                key: { keyPath: "_id", autoIncrement: true }
            }
        }
    }).then(function (s) {
        server = s;
        s.query("playlists").all().execute().then(function (playlists) {
            postMessage({
                action: "init-playlist",
                payload: playlists
            });
        });
    });
})();

function getPlaylist(playlistId) {
    return server.query("playlists").filter("id", playlistId).execute();
}

function updatePlaylist(playlist) {
    server.update("playlists", playlist).then(function (results) {
        postMessage({
            "action": "update-playlist",
            payload: {
                id: results[0].id,
                _id: results[0]._id
            }
        });
    });
}

onmessage = function onmessage(_ref) {
    var data = _ref.data;

    if (data.action === "put") {
        updatePlaylist(data.playlist);
    } else if (data.action === "update") {
        getPlaylist(data.playlist.id).then(function (results) {
            updatePlaylist(Object.assign(results[0], data.playlist));
        }).catch(function (error) {
            console.log(error);
        });
    } else if (data.action === "remove") {
        getPlaylist(data.playlistId).then(function (results) {
            server.remove("playlists", results[0]._id);
        }).catch(function (error) {
            console.log(error);
        });
    }
};

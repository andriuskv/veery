/* global importScripts, db, onmessage, postMessage */

"use strict";

const window = self;

importScripts("../libs/db.min.js");

let server = null;

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
    })
    .then(s => {
        server = s;
        s.query("playlists")
        .all()
        .execute()
        .then(postMessage);
    });
})();

onmessage = function({ data }) {
    if (data.action === "update-playlist") {
        server.update("playlists", data.playlist)
        .catch(error => {
            console.log(error);
        });
    }
    else if (data.action === "remove-playlist") {
        server.query("playlists")
        .filter("id", data.playlistId)
        .execute()
        .then(results => {
            server.remove("playlists", results[0]._id);
        })
        .catch(error => {
            console.log(error);
        });
    }
};

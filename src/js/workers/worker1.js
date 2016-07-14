/* global importScripts, db, onmessage, postMessage */

"use strict";

const window = self;

importScripts("../libs/db.min.js");

let server = null;

(function init() {
    initDb()
    .then(loadTracks);
})();

function initDb() {
    return db.open({
        server: "local-playlist",
        version: 1,
        noServerMethods: true,
        schema: {
            tracks: {
                key: { keyPath: "_id", autoIncrement: true }
            }
        }
    })
    .then(s => {
        server = s;
    });
}

function loadTracks() {
    server.query("tracks")
    .all()
    .execute()
    .then(storedTracks => {
        if (!storedTracks.length) {
            return;
        }
        const tracks = storedTracks.map((track, index) => {
            track.index = index;
            return track;
        });

        // postMessage({ tracks });
        postMessage(tracks);
    });
}

onmessage = function(event) {
    const data = event.data;

    if (data.action === "add") {
        if (server) {
            server.add("tracks", data.tracks);
        }
        else {
            initDb()
            .then(() => {
                server.add("tracks", data.tracks);
            });
        }
    }
    else if (data.action === "remove") {
        server.query("tracks")
        .filter("name", data.name)
        .execute()
        .then(results => {
            if (results.length) {
                server.remove("tracks", results[0]._id);
            }
        })
        .catch(error => {
            console.log(error);
        });
    }
    else if (data.action === "clear") {
        server.clear("tracks")
        .then(() => {

            // close db connection
            server.close();
            server = null;
            indexedDB.deleteDatabase("local-playlist");
        })
        .catch(error => {
            console.log(error);
        });
    }
};

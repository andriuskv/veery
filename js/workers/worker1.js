/* global importScripts, db, onmessage, postMessage */

"use strict";

var window = self;

importScripts("../libs/db.min.js");

var server = null;

(function init() {
    initDb().then(loadTracks);
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
    }).then(function (s) {
        server = s;
    });
}

function loadTracks() {
    server.query("tracks").all().execute().then(function (storedTracks) {
        if (!storedTracks.length) {
            return;
        }
        var tracks = storedTracks.map(function (track, index) {
            track.index = index;
            return track;
        });

        postMessage(tracks);
    });
}

onmessage = function onmessage(event) {
    var data = event.data;

    if (data.action === "add") {
        if (server) {
            server.add("tracks", data.tracks);
        } else {
            initDb().then(function () {
                server.add("tracks", data.tracks);
            });
        }
    } else if (data.action === "remove") {
        server.query("tracks").filter("name", data.name).execute().then(function (results) {
            if (results.length) {
                server.remove("tracks", results[0]._id);
            }
        }).catch(function (error) {
            console.log(error);
        });
    } else if (data.action === "clear") {
        server.clear("tracks").then(function () {

            // close db connection
            server.close();
            server = null;
            indexedDB.deleteDatabase("local-playlist");
        }).catch(function (error) {
            console.log(error);
        });
    }
};

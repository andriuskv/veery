/* global importScripts, db, onmessage, postMessage */

"use strict";

const window = self;

importScripts("../libs/db.min.js");

let server = null;

db.open({
    server: "local-playlist",
    version: 1,
    noServerMethods: true,
    schema: {
        track: {
            key: { keyPath: "index", autoIncrement: false }
        }
    }
}).then(s => {
    server = s;

    s.query("track")
    .all()
    .execute()
    .then(tracks => {
        if (tracks.length) {
            tracks = tracks.map((track, index) => {
                track.index = index;
                return track;
            });
            postMessage({ tracks });
        }
    })
    .catch(error => {
        console.log(error);
    });
});

onmessage = function(event) {
    const data = event.data;

    if (data.action === "update") {
        server.clear("track")
        .then(function() {
            server.add("track", data.playlist);
        })
        .catch(error => {
            console.log(error);
        });
    }
    else if (data.action === "remove") {
        console.log(data.action, data.name);

        server.query("track")
        .filter("name", data.name)
        .execute()
        .then(results => {
            if (results.length) {
                results.forEach(result => {
                    server.remove("track", result.index);
                });
            }
        });
    }
    else if (data.action === "clear") {
        if (!server) {
            return;
        }
        server.clear("track")
        .then(() => {
            postMessage({ action: "init" });
            console.log("cleared");
            server.close();
            self.close();
            indexedDB.deleteDatabase("local-playlist");
        })
        .catch(error => {
            console.log(error);
        });
    }
};

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
        tracks: {
            key: { keyPath: "_id", autoIncrement: true }
        }
    }
})
.then(s => {
    server = s;

    s.query("tracks")
    .all()
    .execute()
    .then(storedTracks => {
        if (storedTracks.length) {
            const tracks = storedTracks.map((track, index) => {
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

    if (data.action === "add") {
        server.add("tracks", data.tracks)
        .catch(error => {
            console.log(error);
        });
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
            postMessage({ action: "init" });

            // close db connection
            server.close();

            // close worker
            self.close();

            // remove db
            indexedDB.deleteDatabase("local-playlist");
        })
        .catch(error => {
            console.log(error);
        });
    }
};

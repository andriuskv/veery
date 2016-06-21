/* global importScripts, db, onmessage, postMessage */

"use strict";

var window = self;

importScripts("../libs/db.min.js");

var server = null;

db.open({
    server: "local-playlist",
    version: 1,
    noServerMethods: true,
    schema: {
        track: {
            key: { keyPath: "index", autoIncrement: false }
        }
    }
}).then(function (s) {
    server = s;

    s.query("track").all().execute().then(function (tracks) {
        if (tracks.length) {
            tracks = tracks.map(function (track, index) {
                track.index = index;
                return track;
            });
            postMessage({ tracks: tracks });
        }
    }).catch(function (error) {
        console.log(error);
    });
});

onmessage = function onmessage(event) {
    var data = event.data;

    if (data.action === "update") {
        server.clear("track").then(function () {
            server.add("track", data.playlist);
        }).catch(function (error) {
            console.log(error);
        });
    } else if (data.action === "remove") {
        console.log(data.action, data.name);

        server.query("track").filter("name", data.name).execute().then(function (results) {
            if (results.length) {
                results.forEach(function (result) {
                    server.remove("track", result.index);
                });
            }
        });
    } else if (data.action === "clear") {
        if (!server) {
            return;
        }
        server.clear("track").then(function () {
            postMessage({ action: "init" });
            console.log("cleared");
            server.close();
            self.close();
            indexedDB.deleteDatabase("local-playlist");
        }).catch(function (error) {
            console.log(error);
        });
    }
};

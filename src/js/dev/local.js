/* global parse_audio_metadata */

import { formatTime } from "./main.js";
import * as playlist from "./playlist/playlist.js";
import * as playlistManage from "./playlist/playlist.manage.js";
import * as playlistAdd from "./playlist/playlist.add.js";

const progress = (function() {
    const progress = document.getElementById("js-file-progress");

    function setAttrValue(attr, value) {
        progress.setAttribute(attr, value);
    }

    function toggleElement() {
        progress.classList.toggle("show");
        document.getElementById("js-local-notice").classList.toggle("show");
    }

    return {
        toggle: toggleElement,
        setAttrValue
    };
})();

const worker = (function initWorker() {
    let worker = null;
    let initialized = false;

    function init() {
        worker = new Worker("js/workers/worker1.js");
        initialized = true;

        worker.onmessage = function(event) {
            const tracks = event.data;
            const pl = getPlaylist();

            pl.tracks.push(...tracks);
            playlistManage.appendTo(pl, tracks, false);
        };
        worker.onerror = function(event) {
            console.log(event);
        };
    }

    function postMessage(message) {
        worker.postMessage(message);
    }

    function isInitialized() {
        return initialized;
    }

    return {
        post: postMessage,
        isInitialized,
        init
    };
})();

function getPlaylist() {
    const localPlaylist = playlist.get("local-files");

    if (localPlaylist) {
        return localPlaylist;
    }
    return playlist.create({
        id: "local-files",
        title: "Local files"
    });
}

function getTrackDuration(track) {
    return new Promise(resolve => {
        let audioBlobURL = URL.createObjectURL(track);
        let audio = new Audio(audioBlobURL);

        audio.preload = "metadata";
        audio.addEventListener("loadedmetadata", function onMetadata() {
            const duration = formatTime(audio.duration);

            audio.removeEventListener("loadedmetadata", onMetadata);
            audio = null;
            audioBlobURL = URL.revokeObjectURL(audioBlobURL);
            resolve(duration);
        });
    });
}

function removeFileType(fileName) {
    return fileName.slice(0, fileName.lastIndexOf("."));
}

function filterUnsupportedFiles(files) {
    const audio = new Audio();

    return files.filter(file => audio.canPlayType(file.type));
}

function filterDuplicateTracks(tracks, existingTracks) {
    return tracks.reduce((tracks, track) => {
        const name = removeFileType(track.name.trim());
        const duplicate = existingTracks.some(track => track.name === name);

        if (!duplicate) {
            tracks.push({
                audioTrack: track,
                name
            });
        }
        return tracks;
    }, []);
}

function parseTrackMetadata(track) {
    return new Promise(resolve => {
        parse_audio_metadata(track, data => {
            resolve(data);
        });
    });
}

function parseTracks(tracks, parsedTracks, startIndex) {
    return Promise.all([
        parseTrackMetadata(tracks[0].audioTrack),
        getTrackDuration(tracks[0].audioTrack)
    ])
    .then(data => {
        parsedTracks.push({
            index: startIndex + parsedTracks.length,
            title: data[0].title.trim(),
            artist: data[0].artist ? data[0].artist.trim() : "",
            album: data[0].album ? data[0].album.trim() : "",
            name: tracks[0].name,
            thumbnail: data[0].picture,
            audioTrack: tracks[0].audioTrack,
            duration: data[1]
        });
        tracks.splice(0, 1);
        progress.setAttrValue("value", parsedTracks.length);
        if (tracks.length) {
            return parseTracks(tracks, parsedTracks, startIndex);
        }
        return parsedTracks;
    });
}

function processNewTracks(pl, newTracks) {
    progress.setAttrValue("max", newTracks.length);
    progress.toggle();

    parseTracks(newTracks, [], pl.tracks.length)
    .then(tracks => {
        progress.toggle();
        pl.tracks.push(...tracks);

        if (document.getElementById(`js-${pl.id}`)) {
            playlistManage.appendTo(pl, tracks, true);
        }
        else {
            playlistManage.init(pl, true);
        }
        worker.post({
            action: "add",
            tracks
        });
    })
    .catch(error => {
        console.log(error);
    });
}

function addNewTracks(files) {
    const supportedTracks = filterUnsupportedFiles(files);

    if (!supportedTracks.length) {
        playlistAdd.showNotice("No valid audio files found");
        return;
    }

    const pl = getPlaylist();
    const tracks = filterDuplicateTracks(supportedTracks, pl.tracks);

    if (!tracks.length) {
        playlistAdd.showNotice("Tracks already exist");
        return;
    }
    if (!worker.isInitialized()) {
        worker.init();
    }
    processNewTracks(pl, tracks);
}

export {
    addNewTracks as addTracks,
    worker
};

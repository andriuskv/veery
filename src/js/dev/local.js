/* global parse_audio_metadata */

import { formatTime } from "./main.js";
import * as playlistManage from "./playlist/playlist.manage.js";
import * as playlist from "./playlist/playlist.js";

let worker = initWorker();

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

function initWorker() {
    const dbWorker = new Worker("js/workers/worker1.js");

    dbWorker.onmessage = function(event) {
        const data = event.data;

        if (data.action === "init") {
            worker = initWorker();
            return;
        }
        const pl = getPlaylist();

        pl.tracks.push(...data.tracks);
        playlistManage.init(pl, "list", false);
    };
    dbWorker.onerror = function(event) {
        console.log(event);
    };
    return dbWorker;
}

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

function filterInvalidTracks(newTracks, playlistTracks) {
    const audio = new Audio();

    return newTracks.reduce((tracks, track) => {
        const name = removeFileType(track.name.trim());
        const duplicate = playlistTracks.some(track => track.name === name);

        if (!duplicate && audio.canPlayType(track.type)) {
            tracks.push({
                name: name,
                audioTrack: track
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
            artist: data[0].artist.trim(),
            album: data[0].album.trim(),
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

function addLocalTracks(localTracks) {
    const pl = getPlaylist();
    const playlistTracks = pl.tracks;
    const tracks = filterInvalidTracks([...localTracks], playlistTracks);

    progress.setAttrValue("max", tracks.length);
    progress.toggle();

    parseTracks(tracks, [], playlistTracks.length)
    .then(tracks => {
        progress.toggle();
        pl.tracks.push(...tracks);

        if (document.getElementById(`js-${pl.id}`)) {
            playlistManage.appendTo(pl, tracks, "list", true);
        }
        else {
            playlistManage.init(pl, "list", true);
        }
        worker.postMessage({
            action: "update",
            playlist: playlistTracks
        });
    });
}

export {
    addLocalTracks as addTracks,
    worker
};

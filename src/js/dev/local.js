/* global parse_audio_metadata */

import { formatTime } from "./main.js";
import { postMessageToWorker } from "./worker.js";
import { getPlaylistById, createPlaylist } from "./playlist/playlist.js";
import { initPlaylist, appendToPlaylist } from "./playlist/playlist.manage.js";
import { showNotice } from "./playlist/playlist.add.js";

const progress = (function() {
    const progress = document.getElementById("js-file-progress");

    function setAttrValue(attr, value) {
        progress.setAttribute(attr, value);
    }

    function toggleElement() {
        progress.classList.toggle("visible");
        document.getElementById("js-local-notice").classList.toggle("visible");
    }

    return {
        toggle: toggleElement,
        setAttrValue
    };
})();

function getPlaylist() {
    return getPlaylistById("local-files") || createPlaylist({
        id: "local-files",
        title: "Local files",
        type: "list"
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

function getTrackMetadata(track) {
    return new Promise(resolve => {
        parse_audio_metadata(track, data => {
            resolve(data);
        });
    });
}

function parseTracks(tracks, parsedTracks, startIndex) {
    return Promise.all([
        getTrackMetadata(tracks[0].audioTrack),
        getTrackDuration(tracks[0].audioTrack)
    ])
    .then(data => {
        parsedTracks.push({
            index: startIndex + parsedTracks.length,
            title: data[0].title.trim(),
            artist: data[0].artist ? data[0].artist.trim() : "",
            album: data[0].album ? data[0].album.trim() : "",
            name: tracks[0].name,
            thumbnail: data[0].picture || "assets/images/album-art-placeholder.png",
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
            appendToPlaylist(pl, tracks, true);
        }
        else {
            initPlaylist(pl, true);
        }
        postMessageToWorker({
            action: "update-playlist",
            playlist: pl
        });
    })
    .catch(error => {
        console.log(error);
    });
}

function addTracks(files) {
    const supportedTracks = filterUnsupportedFiles(files);

    if (!supportedTracks.length) {
        showNotice("No valid audio files found");
        return;
    }

    const pl = getPlaylist();
    const tracks = filterDuplicateTracks(supportedTracks, pl.tracks);

    if (!tracks.length) {
        showNotice("Tracks already exist");
        return;
    }
    processNewTracks(pl, tracks);
}

export { addTracks };

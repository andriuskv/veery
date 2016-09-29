/* global parse_audio_metadata */

import { formatTime } from "./main.js";
import { postMessageToWorker } from "./worker.js";
import { getPlaylistById, createPlaylist } from "./playlist/playlist.js";
import { initPlaylist, appendToPlaylist } from "./playlist/playlist.manage.js";
import { showNotice } from "./playlist/playlist.add.js";

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
            duration: data[1],
            player: "native"
        });
        tracks = tracks.slice(1);
        return tracks.length ? parseTracks(tracks, parsedTracks, startIndex) : parsedTracks;
    });
}

function processNewTracks(pl, newTracks, parseTracks) {
    parseTracks(newTracks, [], pl.tracks.length)
    .then(tracks => {
        pl.tracks.push(...tracks);

        if (document.getElementById(`js-${pl.id}`)) {
            appendToPlaylist(pl, tracks, true);
        }
        else {
            initPlaylist(pl, true);
        }
        postMessageToWorker({
            action: "put",
            playlist: pl
        });
    })
    .catch(error => {
        console.log(error);
    });
}

function addTracks(pl, newTracks, parseTracks) {
    const tracks = filterDuplicateTracks(newTracks, pl.tracks);

    if (!tracks.length) {
        showNotice("Tracks already exist");
        return;
    }
    processNewTracks(pl, tracks, parseTracks);
}

function selectLocalFiles(files) {
    const supportedTracks = filterUnsupportedFiles(files);

    if (!supportedTracks.length) {
        showNotice("No valid audio files found");
        return;
    }
    const pl = getPlaylistById("local-files") || createPlaylist({
        id: "local-files",
        title: "Local files",
        type: "list"
    });
    addTracks(pl, supportedTracks, parseTracks);
}

export {
    getTrackDuration,
    addTracks,
    selectLocalFiles
};

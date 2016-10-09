/* global parse_audio_metadata */

import { formatTime } from "./main.js";
import { getPlaylistById, createPlaylist } from "./playlist/playlist.js";
import { updatePlaylist } from "./playlist/playlist.manage.js";
import { createImportOptionMask, showNotice } from "./playlist/playlist.add.js";

function getTrackDuration(track) {
    return new Promise(resolve => {
        let audioBlobURL = URL.createObjectURL(track);
        let audio = new Audio(audioBlobURL);

        audio.preload = "metadata";
        audio.addEventListener("loadedmetadata", function onMetadata() {
            resolve(Math.floor(audio.duration));
            audio.removeEventListener("loadedmetadata", onMetadata);
            audio = null;
            audioBlobURL = URL.revokeObjectURL(audioBlobURL);
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
            durationInSeconds: data[1],
            duration: formatTime(data[1]),
            player: "native"
        });
        tracks = tracks.slice(1);
        return tracks.length ? parseTracks(tracks, parsedTracks, startIndex) : parsedTracks;
    });
}

function processNewTracks(pl, newTracks, parseTracks, importOption) {
    return parseTracks(newTracks, [], pl.tracks.length)
    .then(tracks => {
        updatePlaylist(pl, tracks, importOption);
    })
    .catch(error => {
        console.log(error);
    });
}

function addTracks(importOption, pl, newTracks, parseTracks) {
    const tracks = filterDuplicateTracks(newTracks, pl.tracks);

    createImportOptionMask(importOption);

    if (!newTracks.length) {
        showNotice(importOption, "No valid audio files found");
        return;
    }
    if (!tracks.length) {
        showNotice(importOption, "Tracks already exist");
        return;
    }
    processNewTracks(pl, tracks, parseTracks);
}

function selectLocalFiles(files) {
    const supportedTracks = filterUnsupportedFiles(files);
    const pl = getPlaylistById("local-files") || createPlaylist({
        id: "local-files",
        title: "Local files",
        type: "list"
    });

    addTracks("local", pl, supportedTracks, parseTracks);
}

export {
    getTrackDuration,
    addTracks,
    selectLocalFiles
};

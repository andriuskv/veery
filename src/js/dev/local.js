/* global parse_audio_metadata */

import { scriptLoader, formatTime } from "./main.js";
import { getPlaylistById, createPlaylist } from "./playlist/playlist.js";
import { addTracksToPlaylist } from "./playlist/playlist.manage.js";
import { createImportOptionMask, removeImportOptionMask, showNotice } from "./playlist/playlist.import.js";

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
        parse_audio_metadata(track, resolve);
    });
}

async function parseTracks(id, tracks, parsedTracks = []) {
    const track = tracks[parsedTracks.length];
    const audioTrack = track.audioTrack;
    const [data, durationInSeconds] = await Promise.all([
        getTrackMetadata(audioTrack),
        getTrackDuration(audioTrack)
    ]);

    parsedTracks.push({
        audioTrack,
        durationInSeconds,
        index: parsedTracks.length,
        title: data.artist ? data.title.trim(): track.name,
        artist: data.artist ? data.artist.trim() : "",
        album: data.album ? data.album.trim() : "",
        name: track.name,
        thumbnail: data.picture || "assets/images/album-art-placeholder.png",
        duration: formatTime(durationInSeconds),
        player: "native",
        playlistId: id
    });

    if (parsedTracks.length !== tracks.length) {
        return await parseTracks(id, tracks, parsedTracks);
    }
    return parsedTracks;
}

async function addTracks(importOption, pl, newTracks, parseTracks) {
    createImportOptionMask(importOption, "Adding");

    if (!newTracks.length) {
        showNotice(importOption, "No valid audio files found");
        return;
    }
    const tracks = filterDuplicateTracks(newTracks, pl.tracks);

    if (!tracks.length) {
        showNotice(importOption, "Tracks already exist");
        return;
    }
    await scriptLoader.load({ src: "js/libs/metadata-audio-parser.min.js" });
    const parsedTracks = await parseTracks(pl.id, tracks);

    addTracksToPlaylist(pl, parsedTracks);
    removeImportOptionMask(importOption);
}

function selectLocalFiles(files) {
    const supportedTracks = filterUnsupportedFiles(files);
    const pl = getPlaylistById("local-files") || createPlaylist({
        id: "local-files",
        title: "Local files",
        type: "list",
        player: "native"
    });

    addTracks("local", pl, supportedTracks, parseTracks);
}

export {
    getTrackDuration,
    addTracks,
    selectLocalFiles
};

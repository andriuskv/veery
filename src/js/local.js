/* global parse_audio_metadata */

import parseFlacMetadata from "../libs/parseFlacMetadata.js";
import { scriptLoader, formatTime } from "./utils.js";
import { getPlaylistById, createPlaylist } from "./playlist/playlist.js";
import { addTracksToPlaylist, showStatusIndicator, hideStatusIndicator } from "./playlist/playlist.manage.js";
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

async function getTrackMetadata(track) {
    let data = {};

    if (track.type === "audio/flac") {
        data = await parseFlacMetadata(track);
    }
    else {
        [data, data.duration] = await Promise.all([
            new Promise(resolve => { parse_audio_metadata(track, resolve); }),
            getTrackDuration(track)
        ]);
    }
    return data;
}

async function parseTracks(tracks, id, timeStamp, parsedTracks = []) {
    const { audioTrack, name } = tracks[parsedTracks.length];
    const { artist, title, album, duration, picture } = await getTrackMetadata(audioTrack);

    parsedTracks.push({
        audioTrack,
        name,
        title: artist ? title.trim(): name,
        artist: artist ? artist.trim() : "",
        album: album ? album.trim() : "",
        thumbnail: picture || "assets/images/album-art-placeholder.png",
        durationInSeconds: duration,
        duration: formatTime(duration),
        player: "native",
        playlistId: id,
        createdAt: timeStamp
    });

    if (parsedTracks.length !== tracks.length) {
        return await parseTracks(tracks, id, timeStamp, parsedTracks);
    }
    return parsedTracks;
}

async function addTracks(importOption, pl, newTracks, parseTracks) {
    createImportOptionMask(importOption, "Adding");

    if (!newTracks.length) {
        showNotice(importOption, "No valid audio files found");
        hideStatusIndicator(pl.id);
        return;
    }
    const tracks = filterDuplicateTracks(newTracks, pl.tracks);

    if (!tracks.length) {
        showNotice(importOption, "Tracks already exist");
        hideStatusIndicator(pl.id);
        return;
    }

    try {
        await scriptLoader.load({ src: "libs/metadata-audio-parser.min.js" });
        const timeStamp = new Date().getTime();
        const parsedTracks = await parseTracks(tracks, pl.id, timeStamp);

        addTracksToPlaylist(pl, parsedTracks);
        removeImportOptionMask(importOption);
    }
    catch (error) {
        console.log(error);
        hideStatusIndicator(pl.id);
    }
}

function selectLocalFiles(files) {
    const supportedTracks = filterUnsupportedFiles(files);
    const id = "local-files";
    let pl = getPlaylistById(id);

    if (pl) {
        showStatusIndicator(pl.id);
    }
    else {
        pl = createPlaylist({
            id,
            title: "Local files",
            type: "list",
            player: "native"
        });
    }
    addTracks("local", pl, supportedTracks, parseTracks);
}

export {
    getTrackDuration,
    addTracks,
    selectLocalFiles
};

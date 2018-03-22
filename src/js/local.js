/* global parse_audio_metadata */

import { scriptLoader, formatTime } from "./utils.js";
import { getPlaylistById, createPlaylist } from "./playlist/playlist.js";
import { addTracksToPlaylist, showStatusIndicator, hideStatusIndicator } from "./playlist/playlist.manage.js";
import { disableImportOption, enableImportOption } from "./playlist/playlist.import.js";
import { showPlayerMessage } from "./player/player.view.js";

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
    if (track.type === "audio/flac") {
        const { default: parse } = await import("../modules/parseFlacMetadata.js");

        return parse(track);
    }
    else if (track.type === "audio/ogg") {
        const { default: parse } = await import("../modules/parseOggOpusMetadata.js");

        return parse(track);
    }
    let data = {};

    [data, data.duration] = await Promise.all([
        new Promise(resolve => { parse_audio_metadata(track, resolve); }),
        getTrackDuration(track)
    ]);
    return data;
}

async function parseTracks(tracks, id, parsedTracks = []) {
    const { audioTrack, name } = tracks[parsedTracks.length];
    const { artist, title, album, duration, picture } = await getTrackMetadata(audioTrack);

    parsedTracks.push({
        audioTrack,
        name,
        title: artist ? title.trim() : name,
        artist: artist ? artist.trim() : "",
        album: album ? album.trim() : "",
        thumbnail: picture || "assets/images/album-art-placeholder.png",
        durationInSeconds: duration,
        duration: formatTime(duration),
        player: "native",
        playlistId: id
    });

    if (parsedTracks.length !== tracks.length) {
        return await parseTracks(tracks, id, parsedTracks);
    }
    return parsedTracks;
}

function updateStatus(importOption, message, { initialized, id }) {
    showPlayerMessage({
        title: `${importOption} files`,
        body: message
    });
    enableImportOption(importOption);

    if (initialized) {
        hideStatusIndicator(id);
    }
}

async function addTracks(importOption, pl, files, parseTracks) {
    disableImportOption(importOption);

    if (!files.length) {
        updateStatus(importOption, "No valid audio file found", pl);
        return;
    }
    const newTracks = filterDuplicateTracks(files, pl.tracks);

    if (!newTracks.length) {
        updateStatus(importOption, `Track${files.length > 1 ? "s" : ""} already exist`, pl);
        return;
    }

    try {
        await scriptLoader.load({ src: "libs/metadata-audio-parser.min.js" });
        const parsedTracks = await parseTracks(newTracks, pl.id);

        addTracksToPlaylist(pl, parsedTracks);
    }
    catch (error) {
        console.log(error);
        hideStatusIndicator(pl.id);
    }
    finally {
        enableImportOption(importOption);
    }
}

function selectLocalFiles(files) {
    const supportedFiles = filterUnsupportedFiles(files);
    const id = "local-files";
    let pl = getPlaylistById(id);

    if (pl && pl.initialized) {
        showStatusIndicator(id);
    }
    else {
        pl = createPlaylist({
            id,
            title: "Local files",
            type: "list",
            player: "native"
        });
    }
    addTracks("local", pl, supportedFiles, parseTracks);
}

export {
    getTrackDuration,
    addTracks,
    selectLocalFiles
};

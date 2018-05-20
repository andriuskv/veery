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

async function parseAudioMetadata(track) {
    await scriptLoader.load({ src: "libs/metadata-audio-parser.min.js" });

    return Promise.all([
        new Promise(resolve => { parse_audio_metadata(track, resolve); }),
        getTrackDuration(track)
    ]).then(([data, duration]) => ({ ...data, duration }));
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
    return parseAudioMetadata(track);
}

async function parseTracks(tracks, id, parsedTracks = []) {
    const { audioTrack, name } = tracks[parsedTracks.length];
    const { artist, title, album, duration, picture } = await getTrackMetadata(audioTrack);

    parsedTracks.push({
        audioTrack,
        name,
        title: artist ? title : name,
        artist: artist || "",
        album: album || "",
        thumbnail: picture || "assets/images/album-art-placeholder.png",
        durationInSeconds: duration,
        duration: formatTime(duration),
        player: "native",
        playlistId: id
    });

    if (parsedTracks.length !== tracks.length) {
        return parseTracks(tracks, id, parsedTracks);
    }
    return parsedTracks;
}

async function addTracks(importOption, pl, files, parseTracks) {
    disableImportOption(importOption);
    showStatusIndicator(pl.id);

    try {
        if (!files.length) {
            throw new Error("No valid audio file found");
        }
        const newTracks = filterDuplicateTracks(files, pl.tracks);

        if (!newTracks.length) {
            throw new Error(`Track${files.length > 1 ? "s" : ""} already exist`);
        }
        const tracks = await parseTracks(newTracks, pl.id);

        addTracksToPlaylist(pl, tracks);
    }
    catch (e) {
        showPlayerMessage({
            title: `${importOption} files`,
            body: e.message
        });
        console.log(e);
    }
    finally {
        enableImportOption(importOption);
        hideStatusIndicator(pl.id);
    }
}

function selectLocalFiles(files) {
    const supportedFiles = filterUnsupportedFiles(files);
    const id = "local-files";
    const pl = getPlaylistById(id) || createPlaylist({
        id,
        title: "Local files",
        type: "list",
        player: "native"
    });

    addTracks("local", pl, supportedFiles, parseTracks);
}

export {
    getTrackDuration,
    addTracks,
    selectLocalFiles
};

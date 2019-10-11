import parseAudioMetadata from "parse-audio-metadata";
import { formatTime, dispatchCustomEvent } from "./utils.js";
import { getPlaylistById, createPlaylist, getCurrentTrack } from "./playlist/playlist.js";
import { addTracksToPlaylist } from "./playlist/playlist.manage.js";
import { importSettings } from "./playlist/playlist.import.js";
import { creatItemContent, getTrackElement } from "./playlist/playlist.view.js";
import { updatePlaylistEntry } from "./playlist/playlist.entries.js";
import { showPlayerMessage } from "./player/player.view.js";
import { showTrackInfo } from "./player/player.now-playing.js";
import { getVisiblePlaylistId } from "./tab.js";
import { postMessageToWorker } from "./web-worker.js";

const placeholderImgUrl = "assets/images/album-art-placeholder.png";

function removeFileType(fileName) {
    return fileName.slice(0, fileName.lastIndexOf("."));
}

function filterUnsupportedFiles(files) {
    const audio = new Audio();
    const unsupportedTypes = [];

    files = files.reduce((files, file) => {
        if (audio.canPlayType(file.type)) {
            files.push(file);
        }
        else if (file.type.startsWith("audio")) {
            const { name } = file;

            unsupportedTypes.push(name.slice(name.lastIndexOf(".")));
        }
        return files;
    }, []);

    if (unsupportedTypes.length) {
        showPlayerMessage({
            title: "Local files",
            body: `Can't play audio files with type: ${unsupportedTypes.join(", ")}`
        });
    }
    return files;
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

async function fetchTrackAlbum(track) {
    const isPlaceholder = track.picture === placeholderImgUrl;

    if (track.album && !isPlaceholder) {
        return;
    }
    try {
        const key = process.env.LAST_FM_API_KEY;
        const apiRootURL = "https://ws.audioscrobbler.com/2.0/";
        const params = `?method=track.getInfo&api_key=${key}&artist=${track.artist}&track=${track.title}&format=json`;
        const json = await fetch(apiRootURL + params).then(response => response.json());

        if (json.track && json.track.album) {
            const { title, image } = json.track.album;

            if (!track.album && title) {
                track.album = title;
            }

            if (isPlaceholder && image) {
                const url = image[image.length - 1]["#text"];

                if (url) {
                    const { origin, pathname } = new URL(url);
                    const [imageName] = pathname.split("/").slice(-1);

                    track.picture = `${origin}/i/u/${imageName}`;
                }
            }
        }
    } catch(e) {
        console.log(e);
    }
}

function parseTracks(tracks) {
    return tracks.map(track => ({
        needsMetadata: true,
        audioTrack: track.audioTrack,
        name: track.name,
        title: track.name,
        artist: "",
        album: "",
        picture: placeholderImgUrl,
        durationInSeconds: 0,
        duration: "",
        player: "native"
    }));
}

async function addTracks(importOption, pl, files, parseTracks) {
    if (!files.length) {
        showPlayerMessage({
            title: `${importOption} files`,
            body: "No valid audio file found"
        });
        return;
    }
    const newTracks = filterDuplicateTracks(files, pl.tracks);

    if (!newTracks.length) {
        showPlayerMessage({
            title: `${importOption} files`,
            body: `Track${files.length > 1 ? "s" : ""} already exist`
        });
        return;
    }
    dispatchCustomEvent("import", {
        importing: true,
        option: importOption,
        playlistId: pl.id
    });

    try {
        const tracks = await parseTracks(newTracks);

        addTracksToPlaylist(pl, tracks);

        if (requestIdleCallback) {
            requestIdleCallback(updateTrackInfo);
        }
    }
    catch (e) {
        console.log(e);
    }
    finally {
        dispatchCustomEvent("import", {
            importing: false,
            option: importOption,
            playlistId: pl.id
        });
    }
}

async function parseMetadata(track) {
    const { artist, title, album, duration, picture } = await parseAudioMetadata(track.audioTrack);

    track.title = title || track.name;
    track.artist = artist || "";
    track.album = album || "";
    track.durationInSeconds = duration;
    track.picture = picture || placeholderImgUrl;
    track.duration = formatTime(duration);
    await fetchTrackAlbum(track);
}

async function updateTrackInfo() {
    const pl = getPlaylistById("local-files");

    if (!pl) {
        return;
    }
    const track = pl.tracks.find(track => track.needsMetadata);
    const { _id, id, tracks, type } = pl;

    if (!track) {
        updatePlaylistEntry(id, tracks);
        postMessageToWorker({
            action: "update-tracks",
            playlist: { _id, tracks }
        });
        return;
    }
    try {
        await parseMetadata(track);

        if (id === getVisiblePlaylistId()) {
            const element = getTrackElement(track.index, id);
            const currentTrack = getCurrentTrack();

            if (element) {
                element.innerHTML = creatItemContent(track, id, type);
            }

            if (currentTrack && currentTrack.name === track.name) {
                showTrackInfo(track);
            }
        }
    }
    catch (error) {
        console.log(error);
    }
    finally {
        delete track.needsMetadata;
        requestIdleCallback(updateTrackInfo);
    }
}

function selectLocalFiles(files) {
    const supportedFiles = filterUnsupportedFiles(files);
    const id = "local-files";
    const pl = getPlaylistById(id) || createPlaylist({
        id,
        title: "Local files",
        type: "list",
        storePlaylist: importSettings.getSetting(id, "storePlaylist")
    });

    addTracks("local", pl, supportedFiles, parseTracks);
}

window.addEventListener("drop", event => {
    const { files } = event.dataTransfer;

    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";

    if (files.length) {
        selectLocalFiles([...files]);
    }
});

window.addEventListener("dragover", event => {
    event.preventDefault();
});

export {
    addTracks,
    selectLocalFiles,
    parseMetadata
};

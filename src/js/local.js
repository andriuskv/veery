import parseAudioMetadata from "parse-audio-metadata";
import { formatTime, dispatchCustomEvent } from "./utils.js";
import { getPlaylistById, createPlaylist, getCurrentTrack } from "./playlist/playlist.js";
import { addTracksToPlaylist } from "./playlist/playlist.manage.js";
import { updateProgress, importSettings } from "./playlist/playlist.import.js";
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
        else {
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

async function fetchTrackAlbum({ artist, title, album, picture }) {
    const isPlaceholder = picture === placeholderImgUrl;

    if (album && !isPlaceholder) {
        return { album, picture };
    }
    try {
        const key = process.env.LAST_FM_API_KEY;
        const apiRootURL = "https://ws.audioscrobbler.com/2.0/";
        const params = `?method=track.getInfo&api_key=${key}&artist=${artist}&track=${title}&format=json`;
        const json = await fetch(apiRootURL + params).then(response => response.json());

        if (json.track && json.track.album) {
            const { title, image } = json.track.album;

            if (!album && title) {
                album = title;
            }

            if (isPlaceholder && image) {
                const url = image[image.length - 1]["#text"];

                if (url) {
                    const { origin, pathname } = new URL(url);
                    const [imageName] = pathname.split("/").slice(-1);

                    picture = `${origin}/i/u/${imageName}`;
                }
            }
        }
    } catch(e) {
        console.log(e);
    }
    return { album, picture };
}

async function parseTracks(tracks, parsedTracks = []) {
    const index = parsedTracks.length;
    const { audioTrack, name } = tracks[index];

    updateProgress(`Processing: ${name}`, index + 1, tracks.length);
    const { artist, title, album, duration, picture } = await parseAudioMetadata(audioTrack);

    parsedTracks.push({
        eligibleForMoreInfo: Boolean(artist && title),
        audioTrack,
        name,
        title: artist ? title : name,
        artist: artist || "",
        album: album || "",
        picture: picture || placeholderImgUrl,
        durationInSeconds: duration,
        duration: formatTime(duration),
        player: "native"
    });

    if (index + 1 === tracks.length) {
        return parsedTracks;
    }
    return parseTracks(tracks, parsedTracks);
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

async function updateTrackInfo() {
    const pl = getPlaylistById("local-files");

    if (!pl) {
        return;
    }
    const track = pl.tracks.find(track => track.eligibleForMoreInfo);
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
        const { album, picture } = await fetchTrackAlbum(track);
        track.album = album;
        track.picture = picture;

        if (id === getVisiblePlaylistId()) {
            const element = getTrackElement(track.index, id);
            const currentTrack = getCurrentTrack();

            element.innerHTML = creatItemContent(track, id, type);

            if (currentTrack && currentTrack.name === track.name) {
                showTrackInfo(track);
            }
        }
    }
    catch (error) {
        console.log(error);
    }
    finally {
        delete track.eligibleForMoreInfo;
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
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
    selectLocalFiles([...event.dataTransfer.files]);
});

window.addEventListener("dragover", event => {
    event.preventDefault();
});

export {
    addTracks,
    selectLocalFiles
};

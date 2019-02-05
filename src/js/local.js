import parseAudioMetadata from "parse-audio-metadata";
import { formatTime, dispatchCustomEvent } from "./utils.js";
import { getPlaylistById, createPlaylist } from "./playlist/playlist.js";
import { addTracksToPlaylist } from "./playlist/playlist.manage.js";
import { updateProgress, importSettings } from "./playlist/playlist.import.js";
import { showPlayerMessage } from "./player/player.view.js";

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

async function getTrackAlbum(artist, title, album, picture) {
    if (album && picture) {
        return { album, picture };
    }
    const key = process.env.LAST_FM_API_KEY;
    const apiRootURL = "https://ws.audioscrobbler.com/2.0/";
    const params = `?method=track.getInfo&api_key=${key}&artist=${artist}&track=${title}&format=json`;
    const json = await fetch(apiRootURL + params).then(response => response.json());

    if (json.track && json.track.album) {
        const { title, image } = json.track.album;

        if (!album && title) {
            album = title;
        }

        if (!picture && image) {
            const url = image[image.length - 1]["#text"];

            if (url) {
                const { origin, pathname } = new URL(url);
                const [imageName] = pathname.split("/").slice(-1);

                picture = `${origin}/i/u/${imageName}`;
            }
        }
    }
    return { album, picture };
}

async function parseTracks(tracks, id, parsedTracks = []) {
    const index = parsedTracks.length;
    const { audioTrack, name } = tracks[index];

    updateProgress(`Processing: ${name}`, index + 1, tracks.length);
    let { artist, title, album, duration, picture } = await parseAudioMetadata(audioTrack);

    if (navigator.onLine && artist && title) {
        ({ album, picture } = await getTrackAlbum(artist, title, album, picture));
    }
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

    if (index + 1 === tracks.length) {
        return parsedTracks;
    }
    return parseTracks(tracks, id, parsedTracks);
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
        const tracks = await parseTracks(newTracks, pl.id);

        addTracksToPlaylist(pl, tracks);
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

export {
    addTracks,
    selectLocalFiles
};

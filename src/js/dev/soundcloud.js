/* global SC */

import { scriptLoader, formatTime } from "./main.js";
import { addImportedPlaylist, showNotice } from "./playlist/playlist.import.js";

let initialized = false;

function initSoundCloud() {
    if (initialized) {
        return Promise.resolve();
    }
    initialized = true;

    return scriptLoader.load({ src: "js/libs/sdk.min.js" })
        .then(() => SC.initialize({ client_id: "" }));
}

function parseTracks(tracks) {
    return tracks.map((track, index) => {
        const duration = Math.floor(track.duration / 1000);

        return {
            index,
            durationInSeconds: duration,
            duration: formatTime(duration),
            id: track.id,
            name: track.title,
            title: track.title,
            artist: "",
            album: "",
            thumbnail: track.artwork_url || "assets/images/album-art-placeholder.png",
            player: "soundcloud"
        };
    });
}

function parsePlaylist(playlist, url) {
    return {
        url,
        id: playlist.id ? playlist.id.toString() : playlist[0].user_id.toString(),
        title: playlist.title || playlist[0].user.username,
        tracks: playlist.tracks ? parseTracks(playlist.tracks) : parseTracks(playlist),
        player: "soundcloud",
        type: "grid"
    };
}


function fetchPlaylist(url) {
    initSoundCloud()
    .then(() => SC.resolve(url))
    .then(playlist => parsePlaylist(playlist, url))
    .then(addImportedPlaylist)
    .catch(error => {
        console.log(error);
        if (error.status === 404) {
            showNotice("soundcloud", "Playlist was not found");
        }
    });
}

export {
    initSoundCloud,
    fetchPlaylist
};

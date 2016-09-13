/* global SC */

import { formatTime } from "./main.js";
import { addRemotePlaylist, showNotice, importBtn } from "./playlist/playlist.add.js";
import { storedTrack } from "./player/player.js";

function init() {
    SC.initialize({
        client_id: ""
    });
    storedTrack.setPlayerAsReady("soundcloud");
}

function parseTracks(tracks) {
    return tracks.map((track, index) => ({
        index,
        duration: formatTime(track.duration / 1000),
        id: track.id,
        name: track.title,
        title: track.title,
        artist: "",
        album: "",
        thumbnail: track.artwork_url || "assets/images/album-art-placeholder.png"
    }));
}

function fetchPlaylist(url) {
    SC.resolve(url).then(playlist => {
        const newPlaylist = {
            type: "grid"
        };

        if (Array.isArray(playlist)) {
            return Object.assign(newPlaylist, {
                id: `sc-pl-${playlist[0].user_id}`,
                title: `${playlist[0].user.username} playlist`,
                tracks: parseTracks(playlist)
            });
        }
        return Object.assign(newPlaylist, {
            id: `sc-pl-${playlist.id}`,
            title: playlist.title,
            tracks: parseTracks(playlist.tracks)
        });
    })
    .then(addRemotePlaylist)
    .then(importBtn.toggle)
    .catch(error => {
        console.log(error);
        if (error.status === 404) {
            showNotice("Playlist was not found");
            importBtn.toggle();
        }
    });
}

export { init, fetchPlaylist };

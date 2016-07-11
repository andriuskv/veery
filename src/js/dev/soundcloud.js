/* global SC */

import { formatTime } from "./main.js";
import * as playlistAdd from "./playlist/playlist.add.js";

function init() {
    SC.initialize({
        client_id: ""
    });
}

function parseTracks(tracks) {
    return tracks.map((track, index) => ({
        index,
        duration: formatTime(track.duration / 1000),
        id: track.id,
        thumbnail: track.artwork_url || "assets/images/album-art-placeholder.png",
        title: track.title
    }));
}

function fetchPlaylist(url) {
    SC.resolve(url).then(playlist => {
        if (Array.isArray(playlist)) {
            return {
                id: `sc-pl-${playlist[0].user_id}`,
                title: `${playlist[0].user.username} tracks`,
                tracks: parseTracks(playlist)
            };
        }
        return {
            id: `sc-pl-${playlist.id}`,
            title: playlist.title,
            tracks: parseTracks(playlist.tracks)
        };
    })
    .then(playlistAdd.add)
    .catch(error => {
        console.log(error);
        if (error.status === 404) {
            playlistAdd.showNotice("Playlist was not found");
            playlistAdd.importBtn.toggle();
        }
    });
}

export { init, fetchPlaylist };

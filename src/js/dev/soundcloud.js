import { initialize, resolve } from "soundcloud";
import { formatTime } from "./main.js";
import { addImportedPlaylist, showNotice } from "./playlist/playlist.import.js";
import { storedTrack } from "./player/player.js";

(function() {
    initialize({
        client_id: ""
    });
    storedTrack.setPlayerAsReady("soundcloud");
})();

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

function addPlaylist(playlist) {
    addImportedPlaylist("soundcloud", playlist);
}

function fetchPlaylist(url) {
    resolve(url)
    .then(playlist => ({
        url,
        id: playlist.id ? playlist.id.toString() : playlist[0].user_id.toString(),
        title: playlist.title || playlist[0].user.username,
        tracks: playlist.tracks ? parseTracks(playlist.tracks) : parseTracks(playlist)
    }))
    .then(addPlaylist)
    .catch(error => {
        console.log(error);
        if (error.status === 404) {
            showNotice("soundcloud", "Playlist was not found");
        }
    });
}

export {
    fetchPlaylist
};

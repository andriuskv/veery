/* global Dropbox */

import { scriptLoader, formatTime } from "./utils.js";
import { getTrackDuration, addTracks } from "./local.js";
import { getPlaylistById, createPlaylist } from "./playlist/playlist.js";

function getTrackBlob(link) {
    return fetch(link).then(response => response.blob());
}

async function parseTracks(tracks, id, parsedTracks = []) {
    const track = tracks[parsedTracks.length];
    const audioTrack = await getTrackBlob(track.audioTrack.link);
    const durationInSeconds = await getTrackDuration(audioTrack);

    parsedTracks.push({
        audioTrack,
        durationInSeconds,
        title: track.name,
        artist: "",
        album: "",
        name: track.name,
        duration: formatTime(durationInSeconds),
        thumbnail: "assets/images/album-art-placeholder.png",
        player: "native",
        playlistId: id
    });

    if (parsedTracks.length === tracks.length) {
        return parsedTracks;
    }
    return parseTracks(tracks, id, parsedTracks);
}

function showDropboxChooser() {
    Dropbox.choose({
        success(files) {
            const id = "dropbox";
            const pl = getPlaylistById(id) || createPlaylist({
                id,
                title: "Dropbox",
                type: "grid",
                player: "native"
            });

            addTracks(id, pl, files, parseTracks);
        },
        linkType: "direct",
        multiselect: true,
        extensions: ["audio"]
    });
}

function initDropbox({ currentTarget }) {
    scriptLoader.load({
        src: "https://www.dropbox.com/static/api/2/dropins.js",
        id: "dropboxjs",
        "data-app-key": process.env.DROPBOX_API_KEY
    });
    currentTarget.removeEventListener("mouseenter", initDropbox);
}

document.getElementById("js-dropbox-option").addEventListener("mouseenter", initDropbox);

export {
    showDropboxChooser
};

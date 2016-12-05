/* global Dropbox */

import { formatTime } from "./main.js";
import { getTrackDuration, addTracks } from "./local.js";
import { getPlaylistById, createPlaylist } from "./playlist/playlist.js";
import { setOption } from "./playlist/playlist.import.js";

function getTrackBlob(link) {
    return fetch(link).then(response => response.blob());
}

async function parseTracks(id, tracks, parsedTracks = []) {
    const track = tracks[parsedTracks.length];
    const audioTrack = await getTrackBlob(track.audioTrack.link);
    const durationInSeconds = await getTrackDuration(audioTrack);

    parsedTracks.push({
        audioTrack,
        durationInSeconds,
        index: parsedTracks.length,
        title: track.name,
        artist: "",
        album: "",
        name: track.name,
        duration: formatTime(durationInSeconds),
        thumbnail: "assets/images/album-art-placeholder.png",
        player: "native",
        playlistId: id
    });

    if (parsedTracks.length !== tracks.length) {
        return await parseTracks(id, tracks, parsedTracks);
    }
    return parsedTracks;
}

function showDropboxChooser() {
    Dropbox.choose({
        success(files) {
            const pl = getPlaylistById("dropbox-tracks") || createPlaylist({
                id: "dropbox-tracks",
                title: "Dropbox tracks",
                type: "grid",
                player: "native"
            });

            setOption();
            addTracks("dropbox", pl, files, parseTracks);
        },
        cancel() {
            setOption();
        },
        linkType: "direct",
        multiselect: true,
        extensions: ["audio"]
    });
}

export {
    showDropboxChooser
};

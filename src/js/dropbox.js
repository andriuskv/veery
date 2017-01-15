/* global Dropbox */
import "whatwg-fetch";

import { formatTime } from "./main.js";
import { getTrackDuration, addTracks } from "./local.js";
import { getPlaylistById, createPlaylist } from "./playlist/playlist.js";

function getTrackBlob(link) {
    return fetch(link).then(response => response.blob());
}

async function parseTracks(tracks, id, timeStamp, parsedTracks = []) {
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
        playlistId: id,
        createdAt: timeStamp
    });

    if (parsedTracks.length !== tracks.length) {
        return await parseTracks(tracks, id, timeStamp, parsedTracks);
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

            addTracks("dropbox", pl, files, parseTracks);
        },
        linkType: "direct",
        multiselect: true,
        extensions: ["audio"]
    });
}

export {
    showDropboxChooser
};

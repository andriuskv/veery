/* global Dropbox */

import { formatTime } from "./main.js";
import { getTrackDuration, addTracks } from "./local.js";
import { getPlaylistById, createPlaylist } from "./playlist/playlist.js";
import { setOption } from "./playlist/playlist.import.js";

function getTrackBlob(link) {
    return fetch(link).then(response => response.blob());
}

function parseTracks(tracks, parsedTracks, index) {
    const track = {
        index: index + parsedTracks.length,
        title: tracks[0].name,
        artist: "",
        album: "",
        name: tracks[0].name,
        thumbnail: "assets/images/album-art-placeholder.png",
        player: "native"
    };

    return getTrackBlob(tracks[0].audioTrack.link)
    .then(blob => {
        track.audioTrack = blob;
        return getTrackDuration(blob);
    })
    .then(durationInSeconds => {
        track.durationInSeconds = durationInSeconds;
        track.duration = formatTime(durationInSeconds);
        parsedTracks.push(track);
        tracks = tracks.slice(1);
        return tracks.length ? parseTracks(tracks, parsedTracks, index) : parsedTracks;
    });
}

function showDropboxChooser() {
    Dropbox.choose({
        success(files) {
            const pl = getPlaylistById("dropbox-tracks") || createPlaylist({
                id: "dropbox-tracks",
                title: "Dropbox tracks",
                type: "grid"
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

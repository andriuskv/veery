import { shuffleArray } from "../utils";

const playlists = {};
const playlistState = {};
let activePlaylistId = "";
let currentTrack = null;
let playbackIndex = -1;
let playbackOrder = [];

function getPlaylistArray() {
    return Object.keys(playlists).map(getPlaylistById);
}

function getPlaylistById(id) {
    return playlists[id];
}

function createPlaylist(pl) {
    playlistState[pl.id] = {};
    playlists[pl.id] = {
        sortedBy: "index",
        order: 1,
        tracks: [],
        lastTrackIndex: 0,
        ...pl
    };
    return playlists[pl.id];
}

function updatePlaylist(id, data) {
    Object.assign(playlists[id], data);
}

function removePlaylist(id) {
    delete playlists[id];
    delete playlistState[id];
}

function getPlaylistState(id) {
    return playlistState[id];
}

function setPlaylistState(id, state) {
    playlistState[id] = { ...playlistState[id], ...state };
    return playlistState[id];
}

function getPlaylistDuration(tracks) {
    return tracks.reduce((total, track) => {
        total += track.durationInSeconds;
        return total;
    }, 0);
}

function setPlaylistAsActive(id = "") {
    activePlaylistId = id;
}

function getActivePlaylistId() {
    return activePlaylistId;
}

function isPlaylistActive(id) {
    return id === activePlaylistId;
}

function cloneTrack(track) {
    return track ? { ...track } : null;
}

function setCurrentTrack(track) {
    currentTrack = track;
}

function updateCurrentTrack(data) {
    Object.assign(currentTrack, data);
}

function getCurrentTrack() {
    return currentTrack;
}

function updateCurrentTrackIndex(playlistId) {
    const currentTrack = getCurrentTrack();

    if (currentTrack && isPlaylistActive(playlistId)) {
        const track = findTrack(playlistId, currentTrack.name);
        let index = -1;

        if (track) {
            index = track.index;
        }
        updateCurrentTrack({ index });
        setPlaybackIndex(index);
    }
}

function findTrack(id, trackId) {
    const pl = playlists[id];

    return pl ? pl.tracks.find(track => track.name === trackId) : null;
}

function setPlaybackIndex(index) {
    playbackIndex = playbackOrder.indexOf(index);
    playbackIndex = playbackIndex < 0 ? 0 : playbackIndex;
}

function resetPlaybackIndex() {
    const currentTrack = getCurrentTrack();

    if (currentTrack) {
        setPlaybackIndex(currentTrack.index);
    }
}

function getPlaybackOrder(tracks, shuffle) {
    const playbackOrder = tracks.map((_, index) => index);

    return shuffle ? shuffleArray(playbackOrder) : playbackOrder;
}

function setPlaybackOrder(id, shuffle) {
    const { tracks } = playlists[id];
    playlistState[id].shuffled = shuffle;
    playbackOrder = getPlaybackOrder(tracks, shuffle);

    resetPlaybackIndex();
}

function getNextTrackIndex(direction) {
    let index = playbackIndex;
    index += direction;

    if (!direction || index >= playbackOrder.length) {
        index = 0;
    }
    else if (index === -1) {
        index = playbackOrder.length - 1;
    }
    return playbackOrder[index];
}

function getNextTrack(id, direction) {
    const index = getNextTrackIndex(direction);
    const { tracks } = playlists[id];

    return cloneTrack(tracks[index]);
}

function resetTrackIndexes(tracks) {
    return tracks.map((track, index) => {
        track.index = index;
        return track;
    });
}

export {
    setPlaylistAsActive,
    getPlaylistById,
    removePlaylist,
    getPlaylistState,
    setPlaylistState,
    getPlaylistArray,
    createPlaylist,
    updatePlaylist,
    getPlaylistDuration,
    isPlaylistActive,
    getActivePlaylistId,
    cloneTrack,
    setCurrentTrack,
    getCurrentTrack,
    updateCurrentTrack,
    updateCurrentTrackIndex,
    findTrack,
    getNextTrack,
    setPlaybackIndex,
    getPlaybackOrder,
    setPlaybackOrder,
    resetTrackIndexes
};

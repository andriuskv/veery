import { shuffleArray } from "../utils";

const playlists = {};
const playlistState = {};
let activePlaylistId = "";
let currentTrack = null;

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
        playbackIndex: 0,
        lastTrackIndex: 0,
        playbackOrder: [],
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

function getActivePlaylist() {
    return playlists[activePlaylistId];
}

function getTrack(track) {
    return track ? { ...track } : null;
}

function setCurrentTrack(track) {
    currentTrack = getTrack(track);
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
    const pl = getPlaylistById(id);
    const track = pl ? pl.tracks.find(track => track.name === trackId) : null;

    return getTrack(track);
}

function setPlaybackIndex(index) {
    const { id, playbackOrder } = getActivePlaylist();
    const playbackIndex = playbackOrder.indexOf(parseInt(index, 10));

    playlists[id].playbackIndex = playbackIndex < 0 ? 0 : playbackIndex;
}

function resetPlaybackIndex() {
    const currentTrack = getCurrentTrack();

    if (currentTrack) {
        setPlaybackIndex(currentTrack.index);
    }
}

function getPlaybackOrder(tracks, shuffle) {
    const playbackOrder = tracks.map((track, index) => index);

    return shuffle ? shuffleArray(playbackOrder) : playbackOrder;
}

function setPlaybackOrder({ id, tracks }, shuffle) {
    playlistState[id].shuffled = shuffle;
    playlists[id].playbackOrder = getPlaybackOrder(tracks, shuffle);

    resetPlaybackIndex();
}

function getNextTrackIndex({ playbackIndex, playbackOrder }, direction) {
    playbackIndex += direction;

    if (!direction || playbackIndex >= playbackOrder.length) {
        playbackIndex = 0;
    }
    else if (playbackIndex === -1) {
        playbackIndex = playbackOrder.length - 1;
    }
    return playbackOrder[playbackIndex];
}

function getNextTrack(pl, direction) {
    const index = getNextTrackIndex(pl, direction);

    return getTrack(pl.tracks[index]);
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
    getTrack,
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

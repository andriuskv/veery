const playlists = {};
let activePlaylistId = "";
let currentTrack = null;

function getPlaylistArray() {
    return Object.keys(playlists).map(getPlaylistById);
}

function getPlaylistById(id) {
    return playlists[id];
}

function createPlaylist(pl) {
    const defaultProperties = {
        sortedBy: "index",
        order: 1,
        shuffled: false,
        tracks: [],
        playbackIndex: 0,
        playbackOrder: [],
        duration: 0
    };
    const defaultState = {
        rendered: false,
        initialized: false
    };

    if (pl.tracks) {
        pl.duration = getPlaylistDuration(pl.tracks);
    }
    playlists[pl.id] = Object.assign(defaultProperties, pl, defaultState);
    return playlists[pl.id];
}

function updatePlaylist(id, data) {
    Object.assign(playlists[id], data);
}

function removePlaylist(id) {
    delete playlists[id];
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

function findTrack(id, trackId) {
    const pl = getPlaylistById(id);
    const track = pl ? pl.tracks.find(track => track.name === trackId) : null;

    return getTrack(track);
}

function setPlaybackIndex(index) {
    const { id, playbackOrder } = getActivePlaylist();

    updatePlaylist(id, {
        playbackIndex: playbackOrder.indexOf(parseInt(index, 10))
    });
}

function resetPlaybackIndex() {
    const currentTrack = getCurrentTrack();

    if (currentTrack) {
        setPlaybackIndex(currentTrack.index);
    }
}

function shuffleArray(array) {
    let index = array.length;

    while (index) {
        const randomIndex = Math.floor(Math.random() * index);

        index -= 1;
        [array[index], array[randomIndex]] = [array[randomIndex], array[index]];
    }
    return array;
}

function getPlaybackOrder(tracks, shuffle) {
    const playbackOrder = tracks.map((track, index) => index);

    return shuffle ? shuffleArray(playbackOrder) : playbackOrder;
}

function setPlaybackOrder({ id, tracks }, shuffle) {
    updatePlaylist(id, {
        shuffled: shuffle,
        playbackOrder: getPlaybackOrder(tracks, shuffle)
    });
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
    getPlaylistArray,
    createPlaylist,
    updatePlaylist,
    getPlaylistDuration,
    isPlaylistActive,
    getActivePlaylist,
    getActivePlaylistId,
    getTrack,
    setCurrentTrack,
    getCurrentTrack,
    updateCurrentTrack,
    findTrack,
    getNextTrack,
    setPlaybackIndex,
    getPlaybackOrder,
    setPlaybackOrder,
    resetTrackIndexes
};

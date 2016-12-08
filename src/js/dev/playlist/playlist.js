const playlists = {};
let activePlaylistId = "";
let currentTrack = null;

function getAllPlaylists() {
    return playlists;
}

function getPlaylistById(id) {
    return playlists[id];
}

function createPlaylist(pl) {
    const defaultProperties = {
        sortedBy: "",
        order: 0,
        shuffled: false,
        tracks: [],
        playbackIndex: 0,
        playbackOrder: []
    };
    const defaultState = {
        rendered: false,
        initialized: false
    };

    playlists[pl.id] = Object.assign(defaultProperties, pl, defaultState);
    return playlists[pl.id];
}

function removePlaylist(id) {
    delete playlists[id];
}

function setPlaylistAsActive(id = "") {
    activePlaylistId = id;
}

function getActivePlaylistId() {
    return activePlaylistId;
}

function isActive(id) {
    return id === activePlaylistId;
}

function getActivePlaylist() {
    return playlists[activePlaylistId];
}

function getTrack(track) {
    return track ? Object.assign({}, track): null;
}

function setCurrentTrack(track) {
    currentTrack = getTrack(track);
}

function getCurrentTrack() {
    return currentTrack;
}

function updateCurrentTrackIndex(newIndex) {
    currentTrack.index = newIndex;
}

function findTrack(id, trackId) {
    const pl = getPlaylistById(id);
    const track = pl ? pl.tracks.find(track => track.name === trackId) : null;

    return getTrack(track);
}

function setPlaybackIndex(index) {
    const pl = getActivePlaylist();

    pl.playbackIndex = pl.playbackOrder.indexOf(Number.parseInt(index, 10));
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
    const playbackOrder = tracks.map(track => track.index);

    return shuffle ? shuffleArray(playbackOrder) : playbackOrder;
}

function shufflePlaybackOrder(pl, shuffle) {
    pl.shuffled = shuffle;
    pl.playbackOrder = getPlaybackOrder(pl.tracks, shuffle);
    resetPlaybackIndex();
}

function getNextTrackIndex(pl, direction = 0) {
    pl.playbackIndex += direction;
    if (pl.playbackIndex >= pl.playbackOrder.length) {
        pl.playbackIndex = 0;
    }
    else if (pl.playbackIndex === -1) {
        pl.playbackIndex = pl.playbackOrder.length - 1;
    }
    return pl.playbackOrder[pl.playbackIndex];
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
    getAllPlaylists,
    createPlaylist,
    isActive,
    getActivePlaylist,
    getActivePlaylistId,
    getTrack,
    setCurrentTrack,
    getCurrentTrack,
    updateCurrentTrackIndex,
    findTrack,
    getNextTrack,
    setPlaybackIndex,
    shufflePlaybackOrder,
    resetTrackIndexes
};

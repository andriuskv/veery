const playlists = {};
let activePlaylistId = "";
let currentTrack = null;
let playbackIndex = 0;

function getAllPlaylists() {
    return playlists;
}

function getPlaylistById(id) {
    return playlists[id];
}

function createPlaylist(pl) {
    playlists[pl.id] = Object.assign({
        sortedBy: "",
        order: 0,
        shuffled: false,
        tracks: pl.tracks || [],
        type: pl.type,
        playbackOrder: []
    }, pl);
    return playlists[pl.id];
}

function removePlaylist(id) {
    delete playlists[id];
}

function setPlaylistAsActive(id) {
    if (playlists.hasOwnProperty(id)) {
        activePlaylistId = id;
    }
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

function setCurrentTrack(track) {
    currentTrack = track ? Object.assign({}, track): track;
}

function getCurrentTrack() {
    return currentTrack;
}

function updateCurrentTrackIndex(newIndex) {
    currentTrack.index = newIndex;
    setCurrentTrack(currentTrack);
}

function findTrack(id, trackId) {
    const { tracks } = getPlaylistById(id);
    const track = tracks.find(track => track.name === trackId);

    return track ? Object.assign({}, track): null;
}

function setPlaybackIndex(index) {
    const playlist = getActivePlaylist();

    playbackIndex = playlist.playbackOrder.indexOf(Number.parseInt(index, 10));
}

function resetPlaybackIndex() {
    const currentTrack = getCurrentTrack();

    if (currentTrack) {
        setPlaybackIndex(currentTrack.index);
    }
}

function setPlaybackOrder(pl, shuffle) {
    pl.playbackOrder = pl.tracks.map(track => track.index);

    if (shuffle) {
        shufflePlaybackOrder(pl, shuffle);
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

function shufflePlaybackOrder(pl, shuffle) {
    pl.shuffled = shuffle;
    if (shuffle) {
        pl.playbackOrder = shuffleArray(pl.playbackOrder);
    }
    else {
        pl.playbackOrder.sort((a, b) => a - b);
    }
}

function getNextTrackIndex(direction) {
    const { playbackOrder } = getActivePlaylist();

    playbackIndex += direction;
    if (playbackIndex >= playbackOrder.length) {
        playbackIndex = 0;
    }
    if (playbackIndex === -1) {
        playbackIndex = playbackOrder.length - 1;
    }
    return playbackOrder[playbackIndex];
}

function getTrackAtIndex(index) {
    const playlist = getActivePlaylist();

    return playlist.tracks[index];
}

function getNextTrack(direction) {
    const index = getNextTrackIndex(direction);
    const track = getTrackAtIndex(index);

    if (track) {
        setCurrentTrack(track);
        setPlaybackIndex(track.index);
        return Object.assign({}, track);
    }
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
    getActivePlaylistId,
    setCurrentTrack,
    getCurrentTrack,
    updateCurrentTrackIndex,
    findTrack,
    getNextTrackIndex,
    getNextTrack,
    setPlaybackIndex,
    resetPlaybackIndex,
    getTrackAtIndex,
    setPlaybackOrder,
    shufflePlaybackOrder,
    resetTrackIndexes
};

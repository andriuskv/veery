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

function getSavedPlaylists() {
    return JSON.parse(localStorage.getItem("playlists")) || {};
}

function savePlaylists(playlists) {
    localStorage.setItem("playlists", JSON.stringify(playlists));
}

function savePlaylist(pl) {
    const savedPlaylists = getSavedPlaylists();
    const toSave = {
        id: pl.id,
        order: pl.order,
        sortedBy: pl.sortedBy,
        title: pl.title
    };

    if (pl.id.startsWith("yt-pl-") || pl.id.startsWith("sc-pl-")) {
        toSave.tracks = pl.tracks;
    }
    savedPlaylists[pl.id] = toSave;
    savePlaylists(savedPlaylists);
}

function createPlaylist(pl) {
    playlists[pl.id] = Object.assign({
        sortedBy: "",
        order: 0,
        shuffled: false,
        tracks: pl.tracks || [],
        type: pl.id === "local-files" ? "list": "grid",
        playbackOrder: []
    }, pl);
    return playlists[pl.id];
}

function setAsInitialized(id) {
    playlists[id].initialized = true;
    return Object.keys(playlists).every(id => playlists[id].initialized);
}

function removePlaylist(id) {
    const savedPlaylists = getSavedPlaylists();

    delete playlists[id];
    delete savedPlaylists[id];
    savePlaylists(savedPlaylists);
}

function setActivePlaylist(id) {
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

    return tracks.find(track => track.title === trackId || track.name === trackId);
}

function setPlaybackIndex(index) {
    const playlist = getActivePlaylist();

    playbackIndex = playlist.playbackOrder.indexOf(Number.parseInt(index, 10));
}

function setDefaultPlaybackIndex() {
    playbackIndex = 0;
}

function resetPlaybackIndex() {
    const currentTrack = getCurrentTrack();

    if (currentTrack) {
        setPlaybackIndex(currentTrack.index);
    }
}

function setTrackIndexes(pl, shuffle) {
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
        return track;
    }
}

function sortTracks(tracks, sort, order) {
    tracks.sort((a, b) => {
        const aValue = a[sort].toLowerCase();
        const bValue = b[sort].toLowerCase();

        if (aValue < bValue) {
            return -1 * order;
        }
        if (aValue > bValue) {
            return 1 * order;
        }
        return 0;
    });
}

function sortPlaylist(pl, sortBy) {
    if (pl.sortedBy === sortBy && pl.order === 1) {
        pl.order = -1;
    }
    else {
        pl.order = 1;
    }
    pl.sortedBy = sortBy;
    sortTracks(pl.tracks, sortBy, pl.order);
}

export {
    getPlaylistById as get,
    createPlaylist as create,
    removePlaylist as remove,
    savePlaylist as save,
    sortPlaylist as sort,
    getAllPlaylists as getAll,
    getActivePlaylist as getActive,
    setActivePlaylist as setActive,
    sortTracks,
    setAsInitialized,
    getSavedPlaylists,
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
    setDefaultPlaybackIndex,
    getTrackAtIndex,
    setTrackIndexes,
    shufflePlaybackOrder
};

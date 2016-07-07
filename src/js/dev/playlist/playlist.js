const playlists = {};
let activePlaylistId = "";
let currentTrack = null;
let currentIndex = 0;

function getAllPlaylists() {
    return playlists;
}

function getPlaylistById(id) {
    return playlists[id];
}

function savePlaylist(pl) {
    const toSave = {
        id: pl.id,
        order: -pl.order,
        shuffled: pl.shuffled,
        sortedBy: pl.sortedBy,
        playbackOrder: pl.playbackOrder,
        title: pl.title
    };

    if (pl.id.startsWith("yt-pl-") || pl.id.startsWith("sc-pl-")) {
        toSave.tracks = pl.tracks;
    }

    localStorage.setItem(pl.id, JSON.stringify(toSave));
}

function createPlaylist(pl) {
    playlists[pl.id] = Object.assign({
        sortedBy: "",
        order: 0,
        shuffled: false,
        tracks: pl.tracks || [],
        playbackOrder: []
    }, pl, JSON.parse(localStorage.getItem(pl.id)) || {});
    return playlists[pl.id];
}

function removePlaylist(id) {
    delete playlists[id];
    localStorage.removeItem(id);
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
    currentTrack = track;
}

function getCurrentTrack() {
    return currentTrack;
}

function setCurrentIndex(index) {
    const playlist = getActivePlaylist();

    currentIndex = playlist.playbackOrder.indexOf(Number.parseInt(index, 10));
}

function resetCurrentIndex() {
    const currentTrack = getCurrentTrack();

    if (currentTrack) {
        setCurrentIndex(currentTrack.index);
    }
}

function getCurrentTrackIndex() {
    const playlist = getActivePlaylist();

    return playlist.playbackOrder[currentIndex];
}

function setTrackIndexes(pl, shuffle) {
    if (!getPlaylistById(pl.id)) {
        pl = createPlaylist(pl);
    }

    pl.playbackOrder = pl.tracks.map(track => track.index);

    if (shuffle) {
        shufflePlaybackOrder(true, pl);
        resetCurrentIndex();
    }
    else {
        savePlaylist(pl);
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

function shufflePlaybackOrder(shuffle, pl) {
    pl.shuffled = shuffle;
    if (shuffle) {
        pl.playbackOrder = shuffleArray(pl.playbackOrder);
    }
    else {
        pl.playbackOrder.sort((a, b) => a - b);
    }
    savePlaylist(pl);
}

function decrementIndex() {
    currentIndex -= 1;
}

function getNextTrackIndex(direction) {
    const { playbackOrder } = getActivePlaylist();

    currentIndex += direction;
    if (currentIndex === playbackOrder.length) {
        currentIndex = 0;
    }
    if (currentIndex === -1) {
        currentIndex = playbackOrder.length - 1;
    }
    return playbackOrder[currentIndex];
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
        setCurrentIndex(track.index);
        return track;
    }
}

function sortArray(tracks, sort, order) {
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
    sortArray(pl.tracks, sortBy, pl.order);
    savePlaylist(pl);
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
    isActive,
    getActivePlaylistId,
    setCurrentTrack,
    getCurrentTrack,
    getNextTrackIndex,
    getNextTrack,
    setCurrentIndex,
    resetCurrentIndex,
    getCurrentTrackIndex,
    getTrackAtIndex,
    setTrackIndexes,
    shufflePlaybackOrder,
    decrementIndex
};

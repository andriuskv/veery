import { removeClassFromElement } from "./../main.js";

function createListItem(track) {
    return `
        <li class="list-item track" data-index="${track.index}">
            <span>${track.title}</span>
            <span>${track.artist}</span>
            <span>${track.album}</span>
            <span>${track.duration}</span>
        </li>
    `;
}

function createList(id, items) {
    return `
        <ul class="list-view-header">
            <li class="list-view-header-item">TITLE</li>
            <li class="list-view-header-item">ARTIST</li>
            <li class="list-view-header-item">ALBUM</li>
            <li class="list-view-header-item">LENGTH</li>
        </ul>
        <ul id="js-${id}" class="list-view">${items}</ul>
    `;
}

function createGridItem(item) {
    let title = item.title;

    if (title.length > 64) {
        title = `${title.slice(0, 64)}...`;
    }
    return `
        <li class="grid-item track" data-index="${item.index}">
            <div class="grid-item-thumb-container">
                <div class="grid-item-duration">${item.duration}</div>
                <img src="${item.thumbnail}" class="grid-item-thumb">
            </div>
            <div title="${item.title}">${title}</div>
        </li>
    `;
}

function createGrid(id, items) {
    return `<ul id="js-${id}" class="grid-view">${items}</ul>`;
}

function createItems(cb, tracks) {
    return tracks.map(item => cb(item)).join("");
}

function createPlaylistTab(pl) {
    let playlist = "";

    if (pl.type === "list") {
        playlist = createList(pl.id, createItems(createListItem, pl.tracks));
    }
    else if (pl.type === "grid") {
        playlist = createGrid(pl.id, createItems(createGridItem, pl.tracks));
    }
    return `<div id="js-tab-playlist-${pl.id}" class="tab playlist-tab">${playlist}</div>`;
}

function addPlaylistTab(pl) {
    const tab = createPlaylistTab(pl);
    const container = document.getElementById("js-tab-container");

    container.insertAdjacentHTML("beforeend", tab);
}

function appendToPlaylist(pl, tracks) {
    const playlist = document.getElementById(`js-${pl.id}`);
    let cb = null;

    if (pl.type === "list") {
        cb = createListItem;
    }
    else if (pl.type === "grid") {
        cb = createGridItem;
    }
    playlist.insertAdjacentHTML("beforeend", createItems(cb, tracks));
}

function updateTrackListView(track, trackElement) {
    trackElement[0].textContent = track.title;
    trackElement[1].textContent = track.artist;
    trackElement[2].textContent = track.album;
    trackElement[3].textContent = track.duration;
}

function updateTrackGridView(track, trackElement) {
    const title = track.title.length > 64 ? `${track.title.slice(0, 64)}...` : track.title;

    trackElement[0].children[0].textContent = track.duration;
    trackElement[0].children[1].setAttribute("src", track.thumbnail);
    trackElement[1].setAttribute("title", track.title);
    trackElement[1].textContent = title;
}

function updatePlaylist(pl) {
    const trackElements = document.getElementById(`js-${pl.id}`).children;
    let cb = null;

    if (pl.id === "local-files") {
        cb = updateTrackListView;
    }
    else {
        cb = updateTrackGridView;
    }

    pl.tracks.forEach((track, index) => {
        const trackElement = trackElements[index].children;

        track.index = index;
        cb(track, trackElement);
    });
}

function removePlaylistTab(id) {
    const playlistTab = document.getElementById(`js-tab-playlist-${id}`);

    playlistTab.parentElement.removeChild(playlistTab);
}

function scrollToTrack(trackElement, playlistElement) {
    const elementHeight = trackElement.offsetHeight;
    const trackTop = trackElement.offsetTop;
    const playlistScrollTop = playlistElement.scrollTop;
    const playlistClientHeight = playlistElement.clientHeight;
    const visiblePlaylistOffset = playlistScrollTop + playlistClientHeight;

    if (trackTop - elementHeight < playlistScrollTop || trackTop > visiblePlaylistOffset) {
        playlistElement.scrollTop = trackTop - playlistClientHeight / 2;
    }
}

function showPlayingTrack(index, id, manual) {
    const container = document.getElementById(`js-${id}`);
    const track = container.children[index];

    removeClassFromElement("track", "playing");
    track.classList.add("playing");

    if (!manual) {
        scrollToTrack(track, container);
    }
}

export {
    addPlaylistTab as add,
    removePlaylistTab as remove,
    updatePlaylist as update,
    appendToPlaylist as append,
    scrollToTrack,
    showPlayingTrack
};

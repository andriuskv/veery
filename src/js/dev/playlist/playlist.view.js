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
        <ul class="list list-view-header">
            <li class="list-view-header-item">
                <span data-sort="title">TITLE</span>
            </li>
            <li class="list-view-header-item">
                <span data-sort="artist">ARTIST</span>
            </li>
            <li class="list-view-header-item">
                <span data-sort="album">ALBUM</span>
            </li>
            <li class="list-view-header-item">
                <span data-sort="duration">LENGTH</span>
            </li>
        </ul>
        <ul id="js-${id}" class="list list-view">${items}</ul>
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
    return `
        <div class="grid-view-sort-select">
            <button class="font-btn" data-sort="title">Title</button>
            <button class="font-btn" data-sort="duration">Duration</button>
        </div>
        <ul id="js-${id}" class="list grid-view">${items}</ul>
    `;
}

function createItems(cb, tracks) {
    return tracks.map(item => cb(item)).join("");
}

function createPlaylistTab({ id, tracks }, view) {
    let playlist = "";

    if (view === "list") {
        playlist = createList(id, createItems(createListItem, tracks));
    }
    else if (view === "grid") {
        playlist = createGrid(id, createItems(createGridItem, tracks));
    }

    return `
        <div id="js-tab-${id}" class="tab">
            <div class="playlist-header">
                <input type="text" class="input filter-input"
                    id="js-${id}-filter-input"
                    placeholder="Filter">
            </div>
            <div class="playlist-container">${playlist}</div>
        </div>
    `;
}

function addPlaylistTab(pl, view) {
    const tab = createPlaylistTab(pl, view);
    const container = document.getElementById("js-tab-container");

    container.insertAdjacentHTML("beforeend", tab);
}

function appendToPlaylist(id, tracks, view) {
    const playlist = document.getElementById(`js-${id}`);
    let cb = null;

    if (view === "list") {
        cb = createListItem;
    }
    else if (view === "grid") {
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
    const playlistTab = document.getElementById(`js-tab-${id}`);

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

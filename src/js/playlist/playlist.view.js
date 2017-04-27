import { getElementById, replaceElement, removeElement, removeElementClass, getTrackArt } from "./../utils.js";
import { getVisiblePlaylistId } from "./../tab.js";
import { getPlaylistById, isPlaylistActive, getCurrentTrack } from "./playlist.js";
import { updatePlaylist } from "./playlist.manage.js";
import { enableTrackSelection } from "./playlist.track-selection.js";

function getPlaylistElement(id) {
    return getElementById(`js-${id}`);
}

function getPlaylistTrackElements(id) {
    const { children } = getPlaylistElement(id);

    return children;
}

function createListItem(item) {
    return `
        <li class="list-item track" data-index="${item.index}">
            <span>${item.title}</span>
            <span>${item.artist}</span>
            <span>${item.album}</span>
            <span>${item.duration}</span>
        </li>
    `;
}

function createList(id, items) {
    return `
        <ul class="list-view-header">
            <li class="list-view-header-item">Title</li>
            <li class="list-view-header-item">Artist</li>
            <li class="list-view-header-item">Album</li>
            <li class="list-view-header-item">Duration</li>
        </ul>
        <ul id="js-${id}" class="playlist-items list-view">${items}</ul>
    `;
}

function createGridItem(item) {
    const thumbnail = getTrackArt(item.thumbnail);
    let trackNameTemp = `<div class="grid-item-title">${item.title}</div>`;

    if (item.artist && item.title) {
        trackNameTemp += `
            <div class="grid-item-artist">${item.artist} ${item.album ? `- ${item.album}` : ""}</div>
        `;
    }

    return `
        <li class="grid-item track" data-index="${item.index}">
            <div class="grid-item-thumb-container">
                <div class="grid-item-duration">${item.duration}</div>
                <img src="${thumbnail}" class="grid-item-thumb" alt="">
            </div>
            <div>${trackNameTemp}</div>
        </li>
    `;
}

function createGrid(id, items) {
    return `<ul id="js-${id}" class="playlist-items grid-view">${items}</ul>`;
}

function createItems(tracks, cb) {
    return tracks.map(cb).join("");
}

function createPlaylist({ id, type, tracks }) {
    if (type === "list") {
        return createList(id, createItems(tracks, createListItem));
    }
    return createGrid(id, createItems(tracks, createGridItem));
}

function createPlaylistTab(pl) {
    const playlist = createPlaylist(pl);

    return `<div id="js-tab-${pl.id}" class="tab">${playlist}</div>`;
}

function renderPlaylist(pl) {
    const tab = createPlaylistTab(pl);
    const container = getElementById("js-playlist-tabs");

    pl.rendered = true;
    container.insertAdjacentHTML("beforeend", tab);
}

function updatePlaylistView({ id, type, tracks }) {
    const playlistElement = getPlaylistElement(id);
    const elements = playlistElement.children;
    const cb = type === "list" ? createListItem: createGridItem;

    tracks.forEach((track, index) => {
        if (elements[index]) {
            const div = document.createElement("div");

            div.innerHTML = cb(track);
            replaceElement(div.firstElementChild, elements[index]);
        }
        else {
            playlistElement.insertAdjacentHTML("beforeend", cb(track));
        }
    });
}

function removePlaylistTab(id) {
    const { parentElement } = getPlaylistElement(id);

    removeElement(parentElement);
}

function scrollToTrackElement(trackElement, playlistElement) {
    const elementHeight = trackElement.offsetHeight;
    const trackTop = trackElement.offsetTop;
    const playlistScrollTop = playlistElement.scrollTop;
    const playlistClientHeight = playlistElement.clientHeight;
    const visiblePlaylistOffset = playlistScrollTop + playlistClientHeight;

    if (trackTop - elementHeight < playlistScrollTop || trackTop > visiblePlaylistOffset) {
        playlistElement.scrollTop = trackTop - playlistClientHeight / 2;
    }
}

function showTrack(id, index, scrollToTrack) {
    const element = getPlaylistElement(id);
    const trackElement = element.children[index];

    removeElementClass("track", "playing");
    trackElement.classList.add("playing");

    if (scrollToTrack) {
        scrollToTrackElement(trackElement, element);
    }
}

function togglePlaylistTypeBtn(type) {
    const listToggleBtn = getElementById("js-list-toggle-btn");
    const gridToggleBtn = getElementById("js-grid-toggle-btn");

    if (type === "list") {
        listToggleBtn.classList.add("active");
        gridToggleBtn.classList.remove("active");
    }
    else {
        gridToggleBtn.classList.add("active");
        listToggleBtn.classList.remove("active");
    }
}

function changePlaylistType(type, pl) {
    updatePlaylist(pl.id, { type });
    getElementById(`js-tab-${pl.id}`).innerHTML = createPlaylist(pl);
    enableTrackSelection(pl.id);
    togglePlaylistTypeBtn(type);

    if (isPlaylistActive(pl.id)) {
        const track = getCurrentTrack();

        if (track) {
            showTrack(pl.id, track.index);
        }
    }
}

window.addEventListener("track-length-change", () => {
    const { duration, tracks } = getPlaylistById(getVisiblePlaylistId());
    const hours = Math.floor(duration / 3600);
    const minutes = Math.ceil(duration / 60 % 60);

    getElementById("js-tab-footer").textContent = `${tracks.length} tracks, ${hours} hr ${minutes} min`;
});

window.addEventListener("resize", ({ target }) => {
    const id = getVisiblePlaylistId();

    if (id) {
        const pl = getPlaylistById(id);

        if (pl.type === "list" && target.innerWidth < 600) {
            changePlaylistType("grid", pl);
        }
    }
});

export {
    getPlaylistElement,
    getPlaylistTrackElements,
    removePlaylistTab,
    updatePlaylistView,
    renderPlaylist,
    showTrack,
    togglePlaylistTypeBtn,
    changePlaylistType
};

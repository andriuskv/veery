import { removeElement, removeElementClass, getImage } from "../utils.js";
import { getTab } from "../tab.js";
import { postMessageToWorker } from "../web-worker.js";
import { getPlayerState } from "../player/player.js";
import { togglePlayPauseBtn } from "../player/player.controls.js";
import { getPlaylistById, getCurrentTrack, updatePlaylist } from "./playlist.js";
import { enableTrackSelection } from "./playlist.track-selection.js";
import { observePlaylist, reObservePlaylist, removePlaylistObserver, observeElements } from "./playlist.element-observer.js";

function getPlaylistElement(id) {
    return document.getElementById(`js-${id}`);
}

function getPlaylistTrackElements(id) {
    return getPlaylistElement(id).children;
}

function getPlaylistElementAtIndex(id, index) {
    return getPlaylistTrackElements(id)[index];
}

function getTrackPlayPauseBtn(track) {
    const pl = getPlaylistById(track.playlistId);

    if (track.index === -1 || !pl.rendered) {
        return;
    }
    const element = getPlaylistElementAtIndex(track.playlistId, track.index);

    return element.querySelector(".btn-icon");
}

function createListItem(item) {
    const content = createListItemContent(item, { id: "play", title: "Play" });
    return createListItemContainer(item, content);
}

function createListItemContainer({ index }, content = "") {
    return `<li class="list-item track" data-index="${index}" tabindex="0">${content}</li>`;
}

function createListItemContent(item, { title, id }) {
    return `
        <span class="list-item-first-col">
            <span class="list-item-index">${item.index + 1}</span>
            <button class="btn-icon track-play-pause-btn" data-btn="play" title="${title}">
                <svg viewBox="0 0 24 24">
                    <use class="js-icon" href="#${id}"></use>
                </svg>
            </button>
        </span>
        <span class="list-item-col">${item.title}</span>
        <span class="list-item-col">${item.artist}</span>
        <span class="list-item-col">${item.album}</span>
        <span class="list-item-last-col">${item.duration}</span>
    `;
}

function createList(id, items) {
    return `
        <ul class="list-view-header">
            <li class="list-item-first-col">#</li>
            <li class="list-item-col">Title</li>
            <li class="list-item-col">Artist</li>
            <li class="list-item-col">Album</li>
            <li class="list-item-last-col">Duration</li>
        </ul>
        <ul id="js-${id}" class="playlist-view">${items}</ul>
    `;
}

function createGridItem(item) {
    const content = createGridItemContent(item, { id: "play", title: "Play" });
    return createGridItemContainer(item, content);
}

function createGridItemContainer({ index }, content = "") {
    return `<li class="grid-item track" data-index="${index}" tabindex="0">${content}</li>`;
}

function createGridItemContent(item, { title, id }) {
    return `
        <div class="artwork-container grid-item-first-col" tabindex="-1">
            <button class="btn-icon track-play-pause-btn artwork-container-btn" data-btn="play" title="${title}">
                <svg viewBox="0 0 24 24">
                    <use class="js-icon" href="#${id}"></use>
                </svg>
            </button>
            <img src="${getImage(item.thumbnail)}" class="artwork" alt="">
        </div>
        ${getTrackName(item)}
        <div class="grid-item-duration">${item.duration}</div>
    `;
}

function getItemCreationCallback() {
    let listItemCb = createListItem;
    let gridItemCb = createGridItem;

    if ("IntersectionObserver" in window) {
        listItemCb = createListItemContainer;
        gridItemCb = createGridItemContainer;
    }
    return { listItemCb, gridItemCb };
}

function createGrid(id, items) {
    return `<ul id="js-${id}" class="playlist-view grid-view">${items}</ul>`;
}

function createItems(tracks, cb) {
    return tracks.map(track => cb(track)).join("");
}

function createPlaylist({ id, type, tracks }) {
    const { listItemCb, gridItemCb } = getItemCreationCallback();

    if (type === "list") {
        return createList(id, createItems(tracks, listItemCb));
    }
    return createGrid(id, createItems(tracks, gridItemCb));
}

function getPlaylistTemplate(pl) {
    if (!pl.tracks.length) {
        return `<p class="playlist-message">This playlist is empty</p>`;
    }
    return createPlaylist(pl);
}

function createPlaylistTab(pl) {
    const template = getPlaylistTemplate(pl);

    return `<div id="js-tab-${pl.id}" class="tab">${template}</div>`;
}

function getTrackName(track, id = "") {
    let trackName = track.name;

    if (track.artist && track.title) {
        trackName = `
            <div class="track-title">${track.title}</div>
            <div class="track-artist">${track.artist} ${track.album ? `- ${track.album}` : ""}</div>
        `;
    }
    return `<div id="${id}" class="track-name">${trackName}</div>`;
}

function showCurrentTrack(id) {
    const track = getCurrentTrack();

    if (track && track.playlistId === id && track.index !== -1) {
        requestAnimationFrame(() => {
            showTrack(id, track.index, {
                scrollToTrack: true
            });
            toggleTrackPlayPauseBtn(track, getPlayerState());
        });
    }
}

function renderPlaylist(pl) {
    const tab = createPlaylistTab(pl);
    const element = document.getElementById("js-tabs");

    element.insertAdjacentHTML("beforeend", tab);
    pl.rendered = true;

    if (pl.tracks.length) {
        showCurrentTrack(pl.id);
        observePlaylist(pl.id);
    }
}

function updatePlaylistView(pl) {
    const element = getTab(pl.id);

    element.innerHTML = getPlaylistTemplate(pl);

    if (pl.tracks.length) {
        reObservePlaylist(pl.id);
        showCurrentTrack(pl.id);
    }
    else {
        removePlaylistObserver(pl.id);
    }
}

function addTracks(pl, tracks) {
    const element = getPlaylistElement(pl.id);

    if (element) {
        const { listItemCb, gridItemCb } = getItemCreationCallback();
        const items = createItems(tracks, pl.type === "list" ? listItemCb : gridItemCb);

        element.insertAdjacentHTML("beforeend", items);

        // Add newly created elements to intersection observer
        observeElements(pl.id, [...element.children].slice(-tracks.length));
    }
    else {
        const element = getTab(pl.id);

        element.innerHTML = getPlaylistTemplate(pl);
        reObservePlaylist(pl.id);
    }
}

function removePlaylistTab(id) {
    removePlaylistObserver(id);
    removeElement(getTab(id));
}

function showTrack(id, index, { scrollToTrack } = {}) {
    const element = getPlaylistElementAtIndex(id, index);

    removeElementClass(".track.playing", "playing");
    element.classList.add("playing");

    if (scrollToTrack) {
        scrollToTrackElement(element, id);
    }
}

function scrollToTrackElement(element, id) {
    const containerElement = getTab(id);
    const { offsetHeight, offsetTop } = element;
    const { clientHeight, scrollTop } = containerElement;
    const offset = scrollTop + clientHeight;

    if (offsetTop - offsetHeight < scrollTop || offsetTop > offset) {
        containerElement.scrollTop = offsetTop - clientHeight / 2;
    }
}

function toggleTrackPlayPauseBtn(track, paused) {
    const element = getTrackPlayPauseBtn(track);

    if (element) {
        togglePlayPauseBtn(element, paused);
    }
}

function togglePlaylistTypeBtn(type) {
    const listToggleBtn = document.getElementById("js-list-toggle-btn");
    const gridToggleBtn = document.getElementById("js-grid-toggle-btn");

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
    postMessageToWorker({
        action: "change-type",
        playlist: {
            _id: pl._id,
            type
        }
    });
    updatePlaylistView(pl);
    enableTrackSelection(pl);
    togglePlaylistTypeBtn(type);
}

export {
    getPlaylistElement,
    getPlaylistTrackElements,
    getTrackPlayPauseBtn,
    createListItemContent,
    createGridItemContent,
    removePlaylistTab,
    updatePlaylistView,
    getTrackName,
    showCurrentTrack,
    renderPlaylist,
    addTracks,
    showTrack,
    toggleTrackPlayPauseBtn,
    togglePlaylistTypeBtn,
    changePlaylistType
};

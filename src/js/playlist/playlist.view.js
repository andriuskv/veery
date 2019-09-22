import { removeElement, getImage, getIcon } from "../utils.js";
import { getTab, getVisiblePlaylistId } from "../tab.js";
import { postMessageToWorker } from "../web-worker.js";
import { togglePlayPauseBtn, getPlayPauseButtonIcon } from "../player/player.controls.js";
import { getPlayerState } from "../player/player.js";
import { getCurrentTrack, setPlaylistState, getPlaylistState, getActivePlaylistId } from "./playlist.js";
import { observePlaylist, reObservePlaylist, removePlaylistObserver } from "./playlist.element-observer.js";

let trackElement = null;

function getPlaylistElement(id) {
    return document.getElementById(`js-${id}`);
}

function getTrackPlayPauseBtn() {
    if (trackElement) {
        return trackElement.querySelector(".btn-icon");
    }
}

function getPlayPauseIcon(index) {
    const visibleId = getVisiblePlaylistId();
    const activeId = getActivePlaylistId();

    if (visibleId !== activeId) {
        return getPlayPauseButtonIcon(true);
    }
    const currentTrack = getCurrentTrack();
    const paused = getPlayerState();

    return currentTrack && currentTrack.index === index ?
        getPlayPauseButtonIcon(paused) :
        getPlayPauseButtonIcon(true);
}

function creatItemContent(item, id, type) {
    return type === "list" ? createListItemContent(item, id) : createGridItemContent(item, id);
}

function createListItemContainer({ index }) {
    return `<li class="list-item track" data-index="${index}" tabindex="0"></li>`;
}

function createListItemContent(item, playlistId) {
    const { sortOrder } = getPlaylistState(playlistId);
    const index = sortOrder.indexOf(item.index);
    const { title, id } = getPlayPauseIcon(item.index);

    return `
        <span class="list-item-first-col">
            <span class="list-item-index">${index + 1}</span>
            <button class="btn btn-icon track-play-pause-btn" data-btn="play" title="${title}">
                ${getIcon({ iconId: id })}
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
            <li>Title</li>
            <li>Artist</li>
            <li>Album</li>
            <li class="list-item-last-col">Duration</li>
        </ul>
        <ul id="js-${id}" class="playlist-view">${items}</ul>
    `;
}

function createGridItemContainer({ index }) {
    return `<li class="grid-item track" data-index="${index}" tabindex="0"></li>`;
}

function createGridItemContent(item) {
    const { title, id } = getPlayPauseIcon(item.index);

    return `
        <div class="artwork-container grid-item-thumbnail" tabindex="-1">
            <button class="btn btn-icon track-play-pause-btn artwork-container-btn" data-btn="play" title="${title}">
                ${getIcon({ iconId: id })}
            </button>
            <img src="${getImage(item.picture)}" class="artwork" alt="">
        </div>
        ${getTrackInfo(item)}
        <div class="grid-item-duration">${item.duration}</div>
    `;
}

function createGrid(id, items) {
    return `<ul id="js-${id}" class="playlist-view grid-view">${items}</ul>`;
}

function createItemContainers(tracks, sortOrder, cb) {
    return sortOrder.reduce((items, index) => items + cb(tracks[index]), "");
}

function createPlaylist({ id, type, tracks }) {
    const { sortOrder } = getPlaylistState(id);
    if (type === "list") {
        return createList(id, createItemContainers(tracks, sortOrder, createListItemContainer));
    }
    return createGrid(id, createItemContainers(tracks, sortOrder, createGridItemContainer));
}

function getPlaylistTemplate(pl) {
    if (pl.tracks.length) {
        return createPlaylist(pl);
    }
    return `<p class="playlist-message">This playlist is empty</p>`;
}

function createPlaylistTab(pl) {
    const template = getPlaylistTemplate(pl);

    return `<div id="js-tab-${pl.id}" class="tab">${template}</div>`;
}

function getTrackInfo(track) {
    let trackName = track.name;

    if (track.artist && track.title) {
        trackName = `
            <div class="track-title">${track.title}</div>
            <div>${track.artist} ${track.album ? `- ${track.album}` : ""}</div>
        `;
    }
    return `<div class="track-info">${trackName}</div> `;
}

function showCurrentTrack(id) {
    const playlistId = getActivePlaylistId();

    if (playlistId !== id) {
        return;
    }
    const track = getCurrentTrack();

    if (track && track.index !== -1) {
        setTrackElement(track.index, id);
        scrollTrackIntoView(id);
    }
}

function renderPlaylist(pl) {
    const tab = createPlaylistTab(pl);
    const element = document.getElementById("js-tabs");

    element.insertAdjacentHTML("beforeend", tab);
    setPlaylistState(pl.id, { rendered: true });

    if (pl.tracks.length) {
        showCurrentTrack(pl.id);
        observePlaylist(pl.id);
    }
}

function updatePlaylistView(pl) {
    const element = getTab(pl.id);

    element.innerHTML = getPlaylistTemplate(pl);

    if (pl.tracks.length) {
        showCurrentTrack(pl.id);
        reObservePlaylist(pl.id);
    }
    else {
        removePlaylistObserver(pl.id);
    }
}

function removePlaylistTab(id) {
    const element = getTab(id);

    if (element) {
        removePlaylistObserver(id);
        removeElement(element);
    }
}

function getTrackElement(index, playlistId) {
    const { sortOrder } = getPlaylistState(playlistId);
    const elementIndex = sortOrder.indexOf(index);

    return document.getElementById(`js-${playlistId}`).children[elementIndex];
}

function setTrackElement(index, playlistId) {
    trackElement = getTrackElement(index, playlistId);
    trackElement.classList.add("playing");
}

function resetCurrentTrackElement() {
    if (trackElement) {
        trackElement.classList.remove("playing");
        trackElement = null;
    }
}

function scrollCurrentTrackIntoView(id) {
    const playlistId = getActivePlaylistId();

    if (playlistId !== id) {
        return;
    }

    if (trackElement) {
        scrollTrackIntoView(id);
    }
}

function scrollTrackIntoView(id) {
    requestAnimationFrame(() => {
        const containerElement = getTab(id);
        const { offsetHeight, offsetTop } = trackElement;
        const { clientHeight, scrollTop } = containerElement;
        const offset = scrollTop + clientHeight;

        if (offsetTop - offsetHeight < scrollTop || offsetTop > offset) {
            containerElement.scrollTop = offsetTop - clientHeight / 2;
        }
    });
}

function toggleTrackPlayPauseBtn(paused) {
    const element = getTrackPlayPauseBtn();

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

function changePlaylistType(pl, type) {
    pl.type = type;

    postMessageToWorker({
        action: "change-type",
        playlist: {
            _id: pl._id,
            type
        }
    });
    updatePlaylistView(pl);
    togglePlaylistTypeBtn(type);
}

export {
    getPlaylistElement,
    getTrackPlayPauseBtn,
    creatItemContent,
    removePlaylistTab,
    updatePlaylistView,
    renderPlaylist,
    resetCurrentTrackElement,
    setTrackElement,
    scrollCurrentTrackIntoView,
    scrollTrackIntoView,
    getTrackElement,
    toggleTrackPlayPauseBtn,
    togglePlaylistTypeBtn,
    changePlaylistType
};

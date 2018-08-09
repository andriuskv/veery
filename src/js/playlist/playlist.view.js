import { removeElement, getImage, getIcon } from "../utils.js";
import { getTab } from "../tab.js";
import { postMessageToWorker } from "../web-worker.js";
import { togglePlayPauseBtn } from "../player/player.controls.js";
import { getCurrentTrack, setPlaylistState, updatePlaylist } from "./playlist.js";
import { observePlaylist, reObservePlaylist, removePlaylistObserver, observeElements } from "./playlist.element-observer.js";

function getPlaylistElement(id) {
    return document.getElementById(`js-${id}`);
}

function getTrackPlayPauseBtn({ element, index }) {
    if (index === -1 || !element) {
        return;
    }
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

function createGridItem(item) {
    const content = createGridItemContent(item, { id: "play", title: "Play" });
    return createGridItemContainer(item, content);
}

function createGridItemContainer({ index }, content = "") {
    return `<li class="grid-item track" data-index="${index}" tabindex="0">${content}</li>`;
}

function createGridItemContent(item, { title, id }) {
    return `
        <div class="artwork-container grid-item-thumbnail" tabindex="-1">
            <button class="btn-icon track-play-pause-btn artwork-container-btn" data-btn="play" title="${title}">
                ${getIcon({ iconId: id })}
            </button>
            <img src="${getImage(item.thumbnail)}" class="artwork" alt="">
        </div>
        ${getTrackInfo(item)}
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
    return tracks.reduce((items, track) => items + cb(track), "");
}

function createPlaylist({ id, type, tracks }) {
    const { listItemCb, gridItemCb } = getItemCreationCallback();

    if (type === "list") {
        return createList(id, createItems(tracks, listItemCb));
    }
    return createGrid(id, createItems(tracks, gridItemCb));
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
    const track = getCurrentTrack();

    if (track && track.playlistId === id && track.index !== -1) {
        showTrack(track, true);
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

function addTracks(pl, tracks) {
    const track = getCurrentTrack();
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

    if (track.playlistId === pl.id) {
        removePlayingClass(track.element);
        setTrackElement(track);
    }
}

function removePlaylistTab(id) {
    const element = getTab(id);

    if (element) {
        removePlaylistObserver(id);
        removeElement(element);
    }
}

function setTrackElement(track) {
    track.element = document.getElementById(`js-${track.playlistId}`).children[track.index];
    track.element.classList.add("playing");
}

function removePlayingClass(element) {
    if (element) {
        element.classList.remove("playing");
    }
}

function showTrack(track, scrollToTrack) {
    setTrackElement(track);

    if (scrollToTrack) {
        scrollToTrackElement(track.element, track.playlistId);
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
    togglePlaylistTypeBtn(type);
}

export {
    getPlaylistElement,
    getTrackPlayPauseBtn,
    createListItemContent,
    createGridItemContent,
    removePlaylistTab,
    updatePlaylistView,
    renderPlaylist,
    addTracks,
    removePlayingClass,
    showTrack,
    toggleTrackPlayPauseBtn,
    togglePlaylistTypeBtn,
    changePlaylistType
};

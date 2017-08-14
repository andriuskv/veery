import { getElementById, removeElement, removeElementClass, getImage } from "../utils.js";
import { getVisiblePlaylistId } from "../tab.js";
import { postMessageToWorker } from "../worker.js";
import { getPlayerState } from "../player/player.js";
import { togglePlayPauseBtn } from "../player/player.controls.js";
import { getPlaylistById, getCurrentTrack, updatePlaylist } from "./playlist.js";
import { enableTrackSelection } from "./playlist.track-selection.js";

function getPlaylistElement(id) {
    return getElementById(`js-${id}`);
}

function getPlaylistTrackElements(id) {
    const { children } = getPlaylistElement(id);

    return children;
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

    return element.querySelector(".btn");
}

function createListItem(item) {
    return `
        <li class="list-item track" data-index="${item.index}" tabindex="0">
            <span class="list-item-first-col">
                <span class="list-item-index">${item.index + 1}.</span>
                <button class="btn btn-icon track-play-pause-btn" data-btn="play" title="Play">
                    <svg viewBox="0 0 24 24">
                        <use class="js-icon" href="#play"></use>
                    </svg>
                </button>
            </span>
            <span class="list-item-col">${item.title}</span>
            <span class="list-item-col">${item.artist}</span>
            <span class="list-item-col">${item.album}</span>
            <span class="list-item-col">${item.duration}</span>
        </li>
    `;
}

function createList(id, items) {
    return `
        <ul class="list-view-header">
            <li class="list-item-first-col list-view-header-item">#</li>
            <li class="list-item-col list-view-header-item">Title</li>
            <li class="list-item-col list-view-header-item">Artist</li>
            <li class="list-item-col list-view-header-item">Album</li>
            <li class="list-item-col list-view-header-item">Duration</li>
        </ul>
        <ul id="js-${id}" class="list-view">${items}</ul>
    `;
}

function createGridItem(item) {
    const thumbnail = getImage(item.thumbnail);
    let trackNameTemp = `<div class="grid-item-title">${item.title}</div>`;

    if (item.artist) {
        trackNameTemp += `
            <div class="grid-item-artist">${item.artist} ${item.album ? `- ${item.album}` : ""}</div>
        `;
    }
    return `
        <li class="grid-item track" data-index="${item.index}" tabindex="0">
            <div class="grid-item-first-col">
                <img src="${thumbnail}" class="artwork grid-item-thumbnail" alt="">
                <button class="btn btn-icon track-play-pause-btn grid-item-play-pause-btn" data-btn="play" title="Play">
                    <svg viewBox="0 0 24 24">
                        <use class="js-icon" href="#play"></use>
                    </svg>
                </button>
            </div>
            <div class="grid-item-name">${trackNameTemp}</div>
            <div class="grid-item-duration">${item.duration}</div>
        </li>
    `;
}

function createGrid(id, items) {
    return `<ul id="js-${id}" class="grid-view">${items}</ul>`;
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
    const container = getElementById("js-playlist-tabs");
    pl.rendered = true;

    container.insertAdjacentHTML("beforeend", tab);
    showCurrentTrack(pl.id);
}

function updatePlaylistView(pl) {
    const { parentElement } = getPlaylistElement(pl.id);

    parentElement.innerHTML = createPlaylist(pl);
    showCurrentTrack(pl.id);
}

function removePlaylistTab(id) {
    const { parentElement } = getPlaylistElement(id);

    removeElement(parentElement);
}

function scrollToTrackElement(element, id) {
    const containerElement = getElementById(`js-tab-${id}`);
    const elementHeight = element.offsetHeight;
    const trackTop = element.offsetTop;
    const containerScrollTop = containerElement.scrollTop;
    const containerClientHeight = containerElement.clientHeight;
    const visibleContainerOffset = containerScrollTop + containerClientHeight;

    if (trackTop - elementHeight < containerScrollTop || trackTop > visibleContainerOffset) {
        containerElement.scrollTop = trackTop - containerClientHeight / 2;
    }
}

function showTrack(id, index, { scrollToTrack } = {}) {
    const element = getPlaylistElementAtIndex(id, index);

    removeElementClass("track", "playing");
    element.classList.add("playing");

    if (scrollToTrack) {
        scrollToTrackElement(element, id);
    }
}

function toggleTrackPlayPauseBtn(track, paused) {
    const element = getTrackPlayPauseBtn(track);

    if (element) {
        togglePlayPauseBtn(element, paused);
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
    postMessageToWorker({
        action: "change-type",
        playlist: {
            _id: pl._id,
            type
        }
    });
    updatePlaylistView(pl);
    enableTrackSelection(pl.id);
    togglePlaylistTypeBtn(type);
}

window.addEventListener("resize", ({ target }) => {
    const id = getVisiblePlaylistId();

    if (id) {
        const pl = getPlaylistById(id);

        if (pl.type === "list" && target.innerWidth <= 540) {
            changePlaylistType("grid", pl);
        }
    }
});

export {
    getPlaylistElement,
    getPlaylistTrackElements,
    getTrackPlayPauseBtn,
    removePlaylistTab,
    updatePlaylistView,
    renderPlaylist,
    showTrack,
    toggleTrackPlayPauseBtn,
    togglePlaylistTypeBtn,
    changePlaylistType
};

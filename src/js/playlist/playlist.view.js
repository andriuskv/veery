import { getElementById, removeElement, removeElementClass, getTrackArt } from "../utils.js";
import { getVisiblePlaylistId } from "../tab.js";
import { getPlayerState } from "../player/player.js";
import { togglePlayPauseBtn } from "../player/player.controls.js";
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

function getPlaylistElementAtIndex(id, index) {
    return getPlaylistTrackElements(id)[index];
}

function createListItem(item) {
    return `
        <li class="list-item track" data-index="${item.index}">
            <span class="list-item-first-col">
                <span class="list-item-index">${item.index + 1}.</span>
                <button class="btn btn-icon track-play-pause-btn" data-btn="play">
                    <svg viewBox="0 0 24 24">
                        <use class="svg-icon" href="#play-icon"></use>
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
            <li class="list-item-col list-view-header-item">Title</li>
            <li class="list-item-col list-view-header-item">Artist</li>
            <li class="list-item-col list-view-header-item">Album</li>
            <li class="list-item-col list-view-header-item">Duration</li>
        </ul>
        <ul id="js-${id}" class="list-view">${items}</ul>
    `;
}

function createGridItem(item) {
    const thumbnail = getTrackArt(item.thumbnail);
    let trackNameTemp = `<div class="grid-item-title">${item.title}</div>`;

    if (item.artist) {
        trackNameTemp += `
            <div class="grid-item-artist">${item.artist} ${item.album ? `- ${item.album}` : ""}</div>
        `;
    }

    return `
        <li class="grid-item track" data-index="${item.index}">
            <div class="grid-item-first-col">
                <img src="${thumbnail}" class="grid-item-thumbnail" alt="">
                <button class="btn track-play-pause-btn grid-item-play-pause-btn" data-btn="play">
                    <svg viewBox="0 0 24 24">
                        <use class="svg-icon" href="#play-icon"></use>
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

function renderPlaylist(pl) {
    const tab = createPlaylistTab(pl);
    const container = getElementById("js-playlist-tabs");
    const track = getCurrentTrack();

    pl.rendered = true;
    container.insertAdjacentHTML("beforeend", tab);

    if (track && track.playlistId === pl.id) {
        requestAnimationFrame(() => {
            showTrack(pl.id, track.index, {
                scrollToTrack: true,
                paused: getPlayerState()
            });
        });
    }
}

function updatePlaylistView(pl) {
    const { parentElement } = getPlaylistElement(pl.id);

    parentElement.innerHTML = createPlaylist(pl);
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

function showTrack(id, index, { scrollToTrack, paused } = {}) {
    const element = getPlaylistElementAtIndex(id, index);
    const btn = element.querySelector(".btn");

    togglePlayPauseBtn(paused, btn);
    removeElementClass("track", "playing");
    element.classList.add("playing");

    if (scrollToTrack) {
        scrollToTrackElement(element, id);
    }
}

function toggleTrackPlayPauseBtn(track, paused) {
    const pl = getPlaylistById(track.playlistId);

    if (track.index === -1 || !pl.rendered) {
        return;
    }
    const element = getPlaylistElementAtIndex(track.playlistId, track.index);
    const btn = element.querySelector(".btn");

    togglePlayPauseBtn(paused, btn);
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
    updatePlaylistView(pl);
    enableTrackSelection(pl.id);
    togglePlaylistTypeBtn(type);

    if (isPlaylistActive(pl.id)) {
        const { index } = getCurrentTrack();

        if (index !== -1) {
            showTrack(pl.id, index, {
                scrollToTrack: false,
                paused: getPlayerState()
            });
        }
    }
}

window.addEventListener("track-length-change", () => {
    const { duration, tracks } = getPlaylistById(getVisiblePlaylistId());
    const hours = Math.floor(duration / 3600);
    const minutes = Math.ceil(duration / 60 % 60);

    getElementById("js-playlist-tab-footer").textContent = `${tracks.length} tracks, ${hours} hr ${minutes} min`;
});

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
    removePlaylistTab,
    updatePlaylistView,
    renderPlaylist,
    showTrack,
    toggleTrackPlayPauseBtn,
    togglePlaylistTypeBtn,
    changePlaylistType
};

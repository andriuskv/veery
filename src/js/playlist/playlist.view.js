import { getElementById, replaceElement, removeElement, removeElementClass, getTrackArt } from "./../utils.js";
import { getVisiblePlaylistId } from "./../tab.js";
import { getPlaylistById, isActive, getCurrentTrack } from "./playlist.js";
import { updatePlaylist } from "./playlist.manage.js";
import { enableTrackSelection } from "./playlist.track-selection.js";

let timeout = 0;
let filteredPlaylistId = "";

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
        <ul id="js-list-view-header-${id}" class="list-view-header">
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

function filterTracks(tracks, trackElements, query) {
    tracks.forEach(track => {
        const element = trackElements[track.index];
        const regex = new RegExp(query, "gi");
        const filterString = `
            ${track.title}
            ${track.artist}
            ${track.album}
        `;

        if (regex.test(filterString)) {
            element.classList.remove("hidden");
        }
        else {
            element.classList.add("hidden");
        }
    });
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

function addMarginToPlaylistHeader(id, type) {
    if (type === "list") {
        const element = getPlaylistElement(id);
        const scrollBarWidth = element.offsetWidth - element.clientWidth;

        getElementById(`js-list-view-header-${id}`).style.marginRight = `${scrollBarWidth}px`;
    }
}

function changePlaylistType(type, pl) {
    updatePlaylist(pl.id, { type });
    getElementById(`js-tab-${pl.id}`).innerHTML = createPlaylist(pl);
    enableTrackSelection(pl.id);
    togglePlaylistTypeBtn(type);
    addMarginToPlaylistHeader(pl.id, type);

    if (isActive(pl.id)) {
        const track = getCurrentTrack();

        if (track) {
            showTrack(pl.id, track.index);
        }
    }
}

function getTrackDuration(tracks) {
    return tracks.reduce((total, track) => {
        total += track.durationInSeconds;
        return total;
    }, 0);
}

function getValueString(value, valueString) {
    valueString = value > 1 || !value ? `${valueString}s` : valueString;
    return `${value} ${valueString}`;
}

function filterPlaylist(id, query = "") {
    const { tracks } = getPlaylistById(id);
    const elements = getPlaylistTrackElements(id);

    filteredPlaylistId = query ? id : "";
    filterTracks(tracks, elements, query);
}

function resetFilteredPlaylist() {
    if (filteredPlaylistId) {
        getElementById("js-filter-input").value = "";
        filterPlaylist(filteredPlaylistId);
    }
}

function updatePlaylistDuration(tracks) {
    const tabFooterElement = getElementById("js-tab-footer");
    const duration = getTrackDuration(tracks);
    const trackString = getValueString(tracks.length, "track");
    let durationString = getValueString(Math.floor(duration / 60 % 60), "minute");

    if (duration > 3600) {
        const hourString = getValueString(Math.floor(duration / 3600), "hour");

        durationString = `${hourString} and ${durationString}`;
    }
    tabFooterElement.textContent = `${trackString}, ${durationString} of playtime`;
}

getElementById("js-filter-input").addEventListener("keyup", ({ target }) => {
    const id = getVisiblePlaylistId();
    const filter = target.value.trim().toLowerCase();

    clearTimeout(timeout);
    timeout = setTimeout(filterPlaylist, 400, id, filter);
});

window.addEventListener("track-length-change", ({ detail }) => {
    updatePlaylistDuration(detail.tracks);

    if (detail.id && detail.type) {
        addMarginToPlaylistHeader(detail.id, detail.type);
    }
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
    filterTracks,
    togglePlaylistTypeBtn,
    addMarginToPlaylistHeader,
    changePlaylistType,
    resetFilteredPlaylist
};

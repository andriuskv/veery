import { getVisiblePlaylistId } from "./../tab.js";
import { postMessageToWorker } from "./../worker.js";
import { getPlaylistById, getActivePlaylistId, getCurrentTrack } from "./playlist.js";
import { removeElement, removeElementClass } from "./../main.js";
import { resetPlaylistSort } from "./playlist.sorting.js";
import { enableTrackSelection } from "./playlist.track-selection.js";
import { removeMoveToPanelContainer } from "./playlist.move-to.js";

let timeout = 0;
let filteredPlaylistId = "";

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
    const name = item.artist && item.title ? `${item.artist} - ${item.title}` : item.name;
    const thumbnail = typeof item.thumbnail === "string" ? item.thumbnail : URL.createObjectURL(item.thumbnail);

    return `
        <li class="grid-item track" data-index="${item.index}">
            <div class="grid-item-thumb-container">
                <div class="grid-item-duration">${item.duration}</div>
                <img src="${thumbnail}" class="grid-item-thumb">
            </div>
            <div>${name}</div>
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
    const container = document.getElementById("js-tab-container");

    pl.rendered = true;
    container.insertAdjacentHTML("beforeend", tab);
}

function appendToPlaylist(pl, tracks) {
    if (!pl.rendered) {
        renderPlaylist(pl);
        return;
    }
    const playlist = document.getElementById(`js-${pl.id}`);
    const cb = pl.type === "list" ? createListItem: createGridItem;

    playlist.insertAdjacentHTML("beforeend", createItems(tracks, cb));
}

function updateListItem(item, itemElement) {
    itemElement[0].textContent = item.title;
    itemElement[1].textContent = item.artist;
    itemElement[2].textContent = item.album;
    itemElement[3].textContent = item.duration;
}

function updateGridItem(item, itemElement) {
    const name = item.artist && item.title ? `${item.artist} - ${item.title}` : item.name;
    const thumbnail = typeof item.thumbnail === "string" ? item.thumbnail : URL.createObjectURL(item.thumbnail);

    itemElement[0].children[0].textContent = item.duration;
    itemElement[0].children[1].setAttribute("src", thumbnail);
    itemElement[1].textContent = name;
}

function updatePlaylist(pl) {
    const trackElements = document.getElementById(`js-${pl.id}`).children;
    const cb = pl.type === "list" ? updateListItem: updateGridItem;

    pl.tracks.forEach((track, index) => {
        const trackElement = trackElements[index].children;

        track.index = index;
        cb(track, trackElement);
    });
}

function removePlaylistTab(id) {
    const playlistTab = document.getElementById(`js-tab-${id}`);

    removeElement(playlistTab);
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

function showPlayingTrack(index, id, scrollToTrack) {
    const container = document.getElementById(`js-${id}`);
    const track = container.children[index];

    removeElementClass("track", "playing");
    track.classList.add("playing");

    if (scrollToTrack) {
        scrollToTrackElement(track, container);
    }
}

function filterTracks(tracks, trackElements, query) {
    tracks.forEach(track => {
        const trackElement = trackElements[track.index];
        const filterString = `
            ${track.title.toLowerCase()}
            ${track.artist.toLowerCase()}
            ${track.album.toLowerCase()}
        `;

        if (!filterString.includes(query)) {
            trackElement.classList.add("hidden");
        }
        else {
            trackElement.classList.remove("hidden");
        }
    });
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

function addMarginToPlaylistHeader(id, type) {
    if (type === "list") {
        const playlistElement = document.getElementById(`js-${id}`);
        const scrollBarWidth = playlistElement.offsetWidth - playlistElement.clientWidth;

        document.getElementById(`js-list-view-header-${id}`).style.marginRight = `${scrollBarWidth}px`;
    }
}

function changePlaylistType(newType, pl) {
    pl.type = newType;
    resetPlaylistSort(pl.id);
    document.getElementById(`js-tab-${pl.id}`).innerHTML = createPlaylist(pl);
    enableTrackSelection(pl.id);
    togglePlaylistTypeBtn(newType);
    removeMoveToPanelContainer();
    addMarginToPlaylistHeader(pl.id, pl.type);
    postMessageToWorker({
        action: "update",
        playlist: {
            _id: pl._id,
            type: pl.type,
            sortedBy: pl.sortedBy,
            order: pl.order
        }
    });

    if (pl.id === getActivePlaylistId()) {
        const track = getCurrentTrack();

        if (track) {
            showPlayingTrack(track.index, pl.id, true);
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
    const trackElements = document.getElementById(`js-${id}`).children;

    filteredPlaylistId = query ? id : "";
    filterTracks(tracks, trackElements, query);
}

function resetFilteredPlaylist() {
    if (filteredPlaylistId) {
        document.getElementById("js-filter-input").value = "";
        filterPlaylist(filteredPlaylistId);
    }
}

function updatePlaylistDuration(tracks) {
    const tabFooterElement = document.getElementById("js-tab-footer");
    const duration = getTrackDuration(tracks);
    const trackString = getValueString(tracks.length, "track");
    let durationString = getValueString(Math.floor(duration / 60 % 60), "minute");

    if (duration > 3600) {
        const hourString = getValueString(Math.floor(duration / 3600), "hour");

        durationString = `${hourString} and ${durationString}`;
    }
    tabFooterElement.textContent = `${trackString}, ${durationString} of playtime`;
}

document.getElementById("js-filter-input").addEventListener("keyup", ({ target }) => {
    if (timeout) {
        clearTimeout(timeout);
    }
    timeout = setTimeout(() => {
        filterPlaylist(getVisiblePlaylistId(), target.value.trim().toLowerCase());
    }, 400);
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
    removePlaylistTab as remove,
    updatePlaylist as update,
    appendToPlaylist as append,
    renderPlaylist,
    showPlayingTrack,
    filterTracks,
    togglePlaylistTypeBtn,
    addMarginToPlaylistHeader,
    changePlaylistType,
    resetFilteredPlaylist
};

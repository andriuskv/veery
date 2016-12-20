import { removeElement } from "./main.js";
import { createNewPlaylistInputForm, onNewPlaylistFormSubmit } from "./playlist/playlist.manage.js";

let animationId = 0;
let timeoutId = 0;

function getSidebarEntry(id) {
    return document.getElementById(`js-sidebar-entry-${id}`);
}

function createSidebarEntry(title, id) {
    const sidebarEntries = document.getElementById("js-sidebar-entries");
    const newEntry = `
        <li>
            <a href="#/playlist/${id}" id="js-sidebar-entry-${id}"
                class="btn btn-transparent sidebar-btn">${title}</a>
        </li>
    `;

    sidebarEntries.insertAdjacentHTML("beforeend", newEntry);
}

function editSidebarEntry(id, title) {
    const entry = getSidebarEntry(id);

    entry.textContent = title;
}

function removeSidebarEntry(id) {
    const entry = getSidebarEntry(id);

    removeElement(entry);
}

function createActiveIcon() {
    return `<span id="js-active-playlist-icon" class="icon-volume-up active-playlist-icon"></span>`;
}

function showActiveIcon(id) {
    const entry = getSidebarEntry(id);

    removeActiveIcon();
    entry.insertAdjacentHTML("beforeend", createActiveIcon());
}

function removeActiveIcon() {
    const activeIcon = document.getElementById("js-active-playlist-icon");

    if (activeIcon) {
        removeElement(activeIcon);
    }
}

function slideElementLeft(element, width, maxWidth) {
    const left = Number.parseInt(element.style.left || 0, 10);

    element.style.left = Math.abs(left) < width + 10 ? `${left - 1}px` : `${maxWidth}px`;
    animationId = requestAnimationFrame(() => {
        slideElementLeft(element, width, maxWidth);
    });
}

function handleMouseenter({ target }) {
    const width = target.scrollWidth;
    const maxWidth = target.parentElement.offsetWidth - 8;

    if (width > maxWidth) {
        this.addEventListener("mouseleave", handleMouseleave);
        timeoutId = setTimeout(() => {
            slideElementLeft(target, width, maxWidth);
        }, 400);
    }
}

function handleMouseleave({ target }) {
    this.removeEventListener("mouseleave", handleMouseleave);
    clearTimeout(timeoutId);
    cancelAnimationFrame(animationId);
    target.style.left = 0;
}

function createTrackInfo() {
    const trackInfoElement = `
        <div id="js-track-info" class="track-info">
            <div class="track-art-container">
                <img src="" id="js-track-art" class="track-art" alt="track art">
            </div>
            <div class="track-name">
                <div id="js-track-title" class="track-title"></div>
                <div id="js-track-artist" class="track-artist"></div>
            </div>
        </div>
    `;

    document.getElementById("js-sidebar").insertAdjacentHTML("beforeend", trackInfoElement);
    document.getElementById("js-track-title").addEventListener("mouseenter", handleMouseenter);
    document.getElementById("js-track-artist").addEventListener("mouseenter", handleMouseenter);
}

function setTrackArt(track) {
    const artElement = document.getElementById("js-track-art");
    const art = track.thumbnail || "assets/images/album-art-placeholder.png";

    artElement.src = typeof art === "object" ? URL.createObjectURL(art) : art;
}

function displayTrackArtistAndTitle(artist = "", title = "") {
    document.getElementById("js-track-title").textContent = title;
    document.getElementById("js-track-artist").textContent = artist;
}

function showTrackInfo(track) {
    const trackInfoElement = document.getElementById("js-track-info");

    if (!track) {
        if (trackInfoElement) {
            document.getElementById("js-track-title").removeEventListener("mouseenter", handleMouseenter);
            document.getElementById("js-track-artist").removeEventListener("mouseenter", handleMouseenter);
            removeElement(trackInfoElement);
        }
        document.title = "Veery";
        return;
    }

    if (!trackInfoElement) {
        createTrackInfo();
    }

    if (track.artist && track.title) {
        displayTrackArtistAndTitle(track.artist, track.title);
        document.title = `${track.artist} - ${track.title}`;
    }
    else {
        displayTrackArtistAndTitle(track.name);
        document.title = track.name;
    }
    setTrackArt(track);
}

function toggleSidebarForm() {
    const sidebarForm = document.getElementById("js-sidebar-form");

    if (sidebarForm) {
        removeElement(sidebarForm);
        return;
    }
    createNewPlaylistInputForm("sidebar", this, onNewPlaylistFormSubmit);
}

document.getElementById("js-sidebar-form-toggle-btn").addEventListener("click", toggleSidebarForm);
document.getElementById("js-sidebar-container").addEventListener("click", function(event) {
    const target = event.target.getAttribute("data-target");

    if (target) {
        this.classList.toggle("contracted");
    }
    else if (event.offsetX > document.getElementById("js-sidebar").offsetWidth) {
        this.classList.add("contracted");
    }
});

export {
    createSidebarEntry,
    editSidebarEntry,
    removeSidebarEntry,
    getSidebarEntry,
    showTrackInfo,
    showActiveIcon,
    removeActiveIcon
};

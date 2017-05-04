import { removeElement, getElementById, getElementByAttr, getTrackArt } from "./utils.js";
import { createNewPlaylistInputForm, onNewPlaylistFormSubmit } from "./playlist/playlist.manage.js";
import { updatePlayerDimentions } from "./player/player.youtube.js";

let animationId = 0;
let timeoutId = 0;

function getSidebarEntry(id) {
    return getElementById(`js-sidebar-entry-${id}`);
}

function createSidebarEntry(title, id) {
    const sidebarEntries = getElementById("js-sidebar-entries");
    const newEntry = `
        <li>
            <a href="#/playlist/${id}" id="js-sidebar-entry-${id}" class="btn btn-dark sidebar-btn">
                <span>${title}</span>
            </a>
        </li>
    `;

    sidebarEntries.insertAdjacentHTML("beforeend", newEntry);
}

function editSidebarEntry(id, title) {
    const entry = getSidebarEntry(id);

    entry.firstElementChild.textContent = title;
}

function removeSidebarEntry(id) {
    const entry = getSidebarEntry(id);

    removeElement(entry);
}

function createActiveIcon() {
    return `
        <span id="js-active-playlist-icon" class="active-playlist-icon">
            <svg viewBox="0 0 24 24">
                <use href="#volume-icon"></use>
            </svg>
        </span>
    `;
}

function showActiveIcon(id) {
    const entry = getSidebarEntry(id);

    removeActiveIcon();
    entry.insertAdjacentHTML("beforeend", createActiveIcon());
}

function removeActiveIcon() {
    const activeIcon = getElementById("js-active-playlist-icon");

    if (activeIcon) {
        removeElement(activeIcon);
    }
}

function slideElementLeft(element, width, maxWidth, x = 0) {
    x = Math.abs(x) < width + 10 ? x - 1 : maxWidth;
    element.style.transform = `translateX(${x}px)`;
    animationId = requestAnimationFrame(() => {
        slideElementLeft(element, width, maxWidth, x);
    });
}

function handleMouseenter({ target }) {
    const width = target.scrollWidth;
    const maxWidth = target.parentElement.offsetWidth - 8;

    if (width > maxWidth) {
        this.addEventListener("mouseleave", handleMouseleave);
        timeoutId = setTimeout(slideElementLeft, 400, target, width, maxWidth);
    }
}

function handleMouseleave({ target }) {
    this.removeEventListener("mouseleave", handleMouseleave);
    clearTimeout(timeoutId);
    cancelAnimationFrame(animationId);
    target.style.transform = "translateX(0)";
}

function handleClickOnPlayerBtn() {
    getElementById("js-yt-player-container").classList.toggle("visible");
    updatePlayerDimentions();
}

function getExpandBtn(player) {
    if (player !== "youtube") {
        return "";
    }
    return `
        <button id='js-player-btn' class='btn'>
            <svg viewBox="0 0 24 24">
                <use href="#expand-icon"></use>
            </svg>
        </button>
    `;
}

function createTrackInfo(track) {
    const trackArtist = track.artist && track.title ? track.artist : track.name;
    const trackTitle = trackArtist !== track.name ? track.title : "";
    const thumbnail = getTrackArt(track.thumbnail);
    const btn = getExpandBtn(track.player);
    const trackInfoElement = `
        <div id="js-track-info" class="track-info">
            <div class="track-art-container">
                <div class="track-art-wrapper">
                    ${btn}
                    <img src=${thumbnail} id="js-track-art" class="track-art" alt="">
                </div>
            </div>
            <div class="track-name">
                <div id="js-track-title" class="track-title">${trackTitle}</div>
                <div id="js-track-artist" class="track-artist">${trackArtist}</div>
            </div>
        </div>
    `;

    getElementById("js-sidebar").insertAdjacentHTML("beforeend", trackInfoElement);
    getElementById("js-track-title").addEventListener("mouseenter", handleMouseenter);
    getElementById("js-track-artist").addEventListener("mouseenter", handleMouseenter);

    if (track.player === "youtube") {
        getElementById("js-player-btn").addEventListener("click", handleClickOnPlayerBtn);
    }
}

function removeTrackInfoElement(element) {
    const btn = getElementById("js-player-btn");

    getElementById("js-track-title").removeEventListener("mouseenter", handleMouseenter);
    getElementById("js-track-artist").removeEventListener("mouseenter", handleMouseenter);

    if (btn) {
        btn.removeEventListener("click", handleClickOnPlayerBtn);
    }
    removeElement(element);
}

function showTrackInfo(track) {
    const trackInfoElement = getElementById("js-track-info");

    if (trackInfoElement) {
        removeTrackInfoElement(trackInfoElement);
    }

    if (!track) {
        document.title = "Veery";
        return;
    }
    createTrackInfo(track);
    document.title = track.artist && track.title ? `${track.artist} - ${track.title}` : track.name;
}

function toggleSidebarForm() {
    const sidebarForm = getElementById("js-sidebar-form");

    if (sidebarForm) {
        removeElement(sidebarForm);
        return;
    }
    createNewPlaylistInputForm("sidebar", this, onNewPlaylistFormSubmit);
}

getElementById("js-sidebar-form-toggle-btn").addEventListener("click", toggleSidebarForm);

getElementById("js-sidebar-container").addEventListener("click", function({ target }) {
    const element = getElementByAttr(target, "data-target");

    if (!element) {
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

import { removeElement, getElementByAttr, getTrackArt } from "./main.js";
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
                class="btn btn-dark sidebar-btn">${title}</a>
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
    const activeIcon = document.getElementById("js-active-playlist-icon");

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

function updatePlayerDimentions() {
    const player = document.getElementById("yt-player");
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    const breakPoint = 600;
    let playerWidth = windowWidth;

    // -88 to account for controls and sidebar
    let playerHeight = windowHeight - 88;

    if (windowWidth > breakPoint) {
        const sidebarWidth = 160;

        playerWidth = windowWidth - sidebarWidth;

        // -36 to account for controls
        playerHeight = windowHeight - 36;
    }
    player.setAttribute("width", `${playerWidth}px`);
    player.setAttribute("height", `${playerHeight}px`);
}

function handleClickOnPlayerBtn() {
    updatePlayerDimentions();
    document.getElementById("js-yt-player-container").classList.toggle("visible");
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

    document.getElementById("js-sidebar").insertAdjacentHTML("beforeend", trackInfoElement);
    document.getElementById("js-track-title").addEventListener("mouseenter", handleMouseenter);
    document.getElementById("js-track-artist").addEventListener("mouseenter", handleMouseenter);

    if (track.player === "youtube") {
        document.getElementById("js-player-btn").addEventListener("click", handleClickOnPlayerBtn);
    }
}

function removeTrackInfoElement(element) {
    const btn = document.getElementById("js-player-btn");

    document.getElementById("js-track-title").removeEventListener("mouseenter", handleMouseenter);
    document.getElementById("js-track-artist").removeEventListener("mouseenter", handleMouseenter);

    if (btn) {
        btn.removeEventListener("click", handleClickOnPlayerBtn);
    }
    removeElement(element);
}

function showTrackInfo(track) {
    const trackInfoElement = document.getElementById("js-track-info");

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
    const sidebarForm = document.getElementById("js-sidebar-form");

    if (sidebarForm) {
        removeElement(sidebarForm);
        return;
    }
    createNewPlaylistInputForm("sidebar", this, onNewPlaylistFormSubmit);
}

document.getElementById("js-sidebar-form-toggle-btn").addEventListener("click", toggleSidebarForm);
document.getElementById("js-sidebar-container").addEventListener("click", function(event) {
    const target = getElementByAttr(event.target, "data-target");

    if (!target) {
        this.classList.add("contracted");
        return;
    }
    if (target.attrValue === "header") {
        this.classList.toggle("contracted");
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

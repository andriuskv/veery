import { removeElement, getElementById, getElementByAttr, getTrackArt } from "./utils.js";
import { createNewPlaylistInputForm, onNewPlaylistFormSubmit } from "./playlist/playlist.manage.js";

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

function toggleYoutubePlayer() {
    getElementById("js-yt-player-container").classList.toggle("visible");
    getElementById("js-sidebar-container").classList.add("contracted");
}

function toggleArtworkSize(button) {
    const trackInfo = getElementById("js-track-info");
    const isEnlarged = trackInfo.classList.contains("enlarged");
    const icon = button.querySelector(".svg-icon");
    let buttonTitle = "";
    let iconState = "";

    if (isEnlarged) {
        iconState = "up";
        buttonTitle = "Enlarge";
    }
    else {
        iconState = "down";
        buttonTitle = "Lower";
    }
    icon.setAttribute("href", `#${iconState}-arrow-icon`);
    button.setAttribute("title", `${buttonTitle} artwork`);
    trackInfo.classList.toggle("enlarged");
}

function handleClickOnArtBtn(event) {
    const element = getElementByAttr(event.target, "data-button");

    if (!element) {
        return;
    }
    const button = element.attrValue;

    if (button === "youtube") {
        toggleYoutubePlayer();
    }
    else if (button === "size") {
        toggleArtworkSize(element.elementRef);
    }
}

function getArtButtons(player) {
    return `
        <div id="js-track-art-button-container" class="track-art-button-container">
            <button class='btn artwork-size-btn' title="Enlarge artwork" data-button="size">
                <svg viewBox="0 0 24 24">
                    <use href="#up-arrow-icon" class="svg-icon"></use>
                </svg>
            </button>
            ${player === "youtube" ? `
                <button class='btn' title="Toggle YouTube player" data-button="youtube">
                    <svg viewBox="0 0 24 24">
                        <use href="#expand-icon"></use>
                    </svg>
                </button>
            ` : ""}
        </div>
    `;
}

function getTrackArtTemplate(thumbnail, player) {
    if (typeof thumbnail === "string" && thumbnail.includes("assets")) {
        return "";
    }
    const buttons = getArtButtons(player);
    thumbnail = getTrackArt(thumbnail);

    return `
        <div class="track-art-container">
            <div class="track-art-wrapper">
                ${buttons}
                <img src=${thumbnail} id="js-track-art" class="track-art" alt="">
            </div>
        </div>
    `;
}

function createTrackInfo(track) {
    const trackArtist = track.artist && track.title ? track.artist : track.name;
    const trackTitle = trackArtist !== track.name ? track.title : "";
    const trackArt = getTrackArtTemplate(track.thumbnail, track.player);
    const trackInfoElement = `
        <div id="js-track-info" class="track-info">
            ${trackArt}
            <div class="track-name">
                <div id="js-track-title" class="track-title">${trackTitle}</div>
                <div id="js-track-artist" class="track-artist">${trackArtist}</div>
            </div>
        </div>
    `;

    getElementById("js-sidebar").insertAdjacentHTML("beforeend", trackInfoElement);
    getElementById("js-track-title").addEventListener("mouseenter", handleMouseenter);
    getElementById("js-track-artist").addEventListener("mouseenter", handleMouseenter);

    if (trackArt) {
        getElementById("js-track-art-button-container").addEventListener("click", handleClickOnArtBtn);
    }
}

function removeTrackInfoElement(element) {
    const buttonContainer = getElementById("js-track-art-button-container");

    getElementById("js-track-title").removeEventListener("mouseenter", handleMouseenter);
    getElementById("js-track-artist").removeEventListener("mouseenter", handleMouseenter);

    if (buttonContainer) {
        buttonContainer.removeEventListener("click", handleClickOnArtBtn);
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

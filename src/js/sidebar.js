import { removeElement, getElementById, getElementByAttr, isOutsideElement, getTrackArt, setElementIconAndTitle } from "./utils.js";
import { toggleRoute, isRouteActive } from "./router.js";
import { createNewPlaylistInputForm, onNewPlaylistFormSubmit } from "./playlist/playlist.manage.js";

let animationId = 0;
let timeoutId = 0;
let isTrackArtEnlarged = false;

function getSidebarEntry(id) {
    return getElementById(`js-sidebar-entry-${id}`);
}

function createSidebarEntry(title, id) {
    getElementById("js-sidebar-entries").insertAdjacentHTML("beforeend", `
        <li>
            <button id="js-sidebar-entry-${id}" class="btn btn-dark sidebar-btn" data-item="btn" data-hash="playlist/${id}">
                <span>${title}</span>
            </button>
        </li>
    `);
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
        <svg viewBox="0 0 24 24" id="js-active-playlist-icon" class="active-playlist-icon">
            <use href="#volume"></use>
        </svg>
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

function handleMouseenter({ currentTarget, target }) {
    const width = target.scrollWidth;
    const maxWidth = target.parentElement.offsetWidth - 8;

    if (width > maxWidth) {
        currentTarget.addEventListener("mouseleave", handleMouseleave);
        timeoutId = setTimeout(slideElementLeft, 400, target, width, maxWidth);
    }
}

function handleMouseleave({ currentTarget, target }) {
    currentTarget.removeEventListener("mouseleave", handleMouseleave);
    clearTimeout(timeoutId);
    cancelAnimationFrame(animationId);
    target.style.transform = "translateX(0)";
}

function toggleYoutubePlayer() {
    getElementById("js-yt-player-container").classList.toggle("visible");
    getElementById("js-sidebar-container").classList.add("contracted");
}

function getArtBtnState(isTrackArtEnlarged) {
    const data = {
        on: {
            id: "up-arrow",
            title: "Enlarge artwork"
        },
        off: {
            id:"down-arrow",
            title: "Lower artwork"
        }
    };

    return isTrackArtEnlarged ? data.off : data.on;
}

function toggleArtworkSize(button) {
    isTrackArtEnlarged = !isTrackArtEnlarged;

    getElementById("js-track-info").classList.toggle("enlarged");
    setElementIconAndTitle(button, getArtBtnState(isTrackArtEnlarged));
}

function handleClickOnArtBtn({ target }) {
    const element = getElementByAttr("data-button", target);

    if (!element) {
        return;
    }
    const { attrValue, elementRef } = element;

    if (attrValue === "youtube") {
        toggleYoutubePlayer();
    }
    else if (attrValue === "size") {
        toggleArtworkSize(elementRef);
    }
}

function getArtButtons(player) {
    const { id, title } = getArtBtnState(isTrackArtEnlarged);

    return `
        <div id="js-track-art-button-container" class="track-art-button-container">
            <button class='btn btn-icon artwork-size-btn' title="${title}" data-button="size">
                <svg viewBox="0 0 24 24">
                    <use href="#${id}" class="js-icon"></use>
                </svg>
            </button>
            ${player === "youtube" ? `
                <button class="btn btn-icon" title="Toggle YouTube player" data-button="youtube">
                    <svg viewBox="0 0 24 24">
                        <use href="#expand"></use>
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
        <div id="js-track-info" class="track-info${trackArt && isTrackArtEnlarged ? " enlarged": ""}">
            ${trackArt}
            <div class="track-name">
                <div id="js-track-title" class="track-title">${trackTitle}</div>
                <div id="js-track-artist" class="track-artist">${trackArtist}</div>
            </div>
        </div>
    `;

    getElementById("js-sidebar-container").classList.remove("hidden");
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
    getElementById("js-sidebar-container").classList.add("hidden");

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

function toggleSidebarForm(btn) {
    const element = getElementById("js-sidebar-form");

    if (element) {
        removeElement(element);
        return;
    }
    createNewPlaylistInputForm("sidebar", btn, onNewPlaylistFormSubmit);
}

getElementById("js-sidebar-container").addEventListener("click", ({ currentTarget, target }) => {
    currentTarget.classList.add("contracted");

    if (isOutsideElement(target, currentTarget.firstElementChild)) {
        return;
    }
    const element = getElementByAttr("data-item", target);

    if (element) {
        const hash = element.elementRef.getAttribute("data-hash");

        if (!hash) {
            toggleSidebarForm(element.elementRef);
            return;
        }

        if (!isRouteActive(hash)) {
            toggleRoute(hash);
        }
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

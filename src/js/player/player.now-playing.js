import { getElementByAttr, removeElement, getImage } from "../utils.js";
import { togglePlaying } from "./player.js";
import { watchOnYoutube } from "./player.youtube.js";
import { getCurrentTrack } from "../playlist/playlist.js";
import { getTrackInfo } from "../playlist/playlist.view.js";

const nowPlayingElement = document.getElementById("js-now-playing");
const mediaElement = document.getElementById("js-media-container");
const animatedElements = {};
let artwork = null;

function moveLeft(name, width, maxWidth, x = 0) {
    const element = animatedElements[name];

    if (Math.abs(x) < width + 10) {
        x -= 1;

        if (x === 0 && !element.isHovering && element.loopedOnce) {
            element.target.style.transform = "translateX(0)";
            element.target.removeEventListener("mouseleave", handleMouseleave);
            delete animatedElements[name];
            return;
        }
    }
    else {
        x = maxWidth;
        element.loopedOnce = true;
    }
    element.target.style.transform = `translateX(${x}px)`;
    requestAnimationFrame(() => {
        moveLeft(name, width, maxWidth, x);
    });
}

function handleClickOnMedia({ currentTarget, target }) {
    const element = getElementByAttr("data-item", target);

    if (!element) {
        return;
    }
    const { attrValue, elementRef } = element;
    const track = getCurrentTrack();

    if (attrValue === "image") {
        togglePlaying(track);
    }
    else if (attrValue === "yt-watch") {
        watchOnYoutube(elementRef, track);
    }
    else if (attrValue === "close") {
        currentTarget.classList.remove("visible");
    }
}

function handleMousemove({ target }) {
    const name = target.getAttribute("data-element");

    if (!name) {
        return;
    }
    animatedElements[name] = animatedElements[name] || {};
    const element = animatedElements[name];

    if (element.target) {
        element.loopedOnce = false;
        element.isHovering = true;
        return;
    }

    if (element.timeoutId) {
        clearTimeout(element.timeoutId);
    }
    const { scrollWidth, offsetWidth } = target;

    // If text is overflowing
    if (scrollWidth > offsetWidth) {
        element.timeoutId = setTimeout(() => {
            element.target = target;
            element.isHovering = true;
            moveLeft(name, scrollWidth, offsetWidth);
        }, 500);

        if (!element.mouseLeaveAdded) {
            element.mouseLeaveAdded = true;
            target.addEventListener("mouseleave", handleMouseleave);
        }
    }
}

function handleMouseleave({ currentTarget }) {
    const element = animatedElements[currentTarget.getAttribute("data-element")];

    if (element.target) {
        element.isHovering = false;
    }
    else {
        clearTimeout(element.timeoutId);
        element.mouseLeaveAdded = false;
        currentTarget.removeEventListener("mouseleave", handleMouseleave);
    }
}

function toggleMedia() {
    mediaElement.classList.toggle("visible");
}

function removeTrackInfoElement() {
    const element = document.getElementById("js-track-info");

    if (element) {
        element.removeEventListener("mousemove", handleMousemove);
        removeElement(element);
    }
}

function setArtwork(artwork = "./assets/images/album-art-placeholder.png") {
    document.getElementById("js-artwork").src = artwork;
}

function renderNowPlaying(track, artwork) {
    setArtwork(artwork);
    nowPlayingElement.classList.remove("inactive");
    nowPlayingElement.insertAdjacentHTML("beforeend", getTrackInfo(track, "js-track-info"));
    document.getElementById("js-track-info").addEventListener("mousemove", handleMousemove);
}

function resetNowPlaying() {
    document.title = "Veery";

    setArtwork();
    removeTrackInfoElement();
    nowPlayingElement.classList.add("inactive");
}

function showNowPlaying(track, artwork) {
    setArtwork();
    removeTrackInfoElement();
    renderNowPlaying(track, artwork);
}

function updateTrackMedia(track, artwork) {
    const ytPlayer = document.getElementById("js-yt-player");

    if (track.player === "youtube") {
        const ytPlayerWatch = document.getElementById("js-yt-player-watch");

        ytPlayer.classList.remove("hidden");
        ytPlayerWatch.setAttribute("href", `https://www.youtube.com/watch?v=${track.id}`);
    }
    else {
        const imageElement = document.getElementById("js-media-image");

        ytPlayer.classList.add("hidden");
        imageElement.src = artwork;
    }
}

function showTrackInfo(track) {
    if (artwork) {
        URL.revokeObjectURL(artwork);
    }
    artwork = getImage(track.thumbnail);

    showNowPlaying(track, artwork);
    updateTrackMedia(track, artwork);
}

function resetTrackInfo() {
    resetNowPlaying();
    mediaElement.classList.remove("visible");

    if (artwork) {
        URL.revokeObjectURL(artwork);
        artwork = null;
    }
}

mediaElement.addEventListener("click", handleClickOnMedia);
document.getElementById("js-expand-media-btn").addEventListener("click", toggleMedia);

export {
    showTrackInfo,
    resetTrackInfo
};

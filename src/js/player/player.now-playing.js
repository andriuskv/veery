import { getElementByAttr, removeElement, getImage } from "../utils.js";
import { togglePlaying } from "./player.js";
import { watchOnYoutube } from "./player.youtube.js";
import { getCurrentTrack } from "../playlist/playlist.js";
import { getTrackName } from "../playlist/playlist.view.js";

const nowPlayingElement = document.getElementById("js-now-playing");
const mediaElement = document.getElementById("js-media-container");
let artwork = null;
let animationTarget = null;
let animationId = 0;
let timeoutId = 0;

function resetAnimationTarget() {
    clearTimeout(timeoutId);
    cancelAnimationFrame(animationId);

    animationTarget.style.textIndent = "0";
    timeoutId = 0;
    animationTarget = null;
}

function indentText(element, width, maxWidth, x = 0) {
    x = Math.abs(x) < width + 10 ? x - 1 : maxWidth;
    element.style.textIndent = `${x}px`;
    animationId = requestAnimationFrame(() => {
        indentText(element, width, maxWidth, x);
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

function handleMousemove({ currentTarget, target }) {
    if (animationTarget && target !== animationTarget && target !== currentTarget) {
        resetAnimationTarget();
    }
    else if (timeoutId) {
        return;
    }
    const width = target.scrollWidth;
    const maxWidth = target.offsetWidth;

    if (width > maxWidth) {
        animationTarget = target;
        timeoutId = setTimeout(indentText, 400, target, width, maxWidth);

        target.addEventListener("mouseleave", handleMouseleave);
    }
}

function handleMouseleave({ currentTarget }) {
    currentTarget.removeEventListener("mouseleave", handleMouseleave);

    if (animationTarget) {
        resetAnimationTarget();
    }
}

function toggleMedia() {
    mediaElement.classList.toggle("visible");
}

function removeTrackNameElement() {
    const element = document.getElementById("js-track-name");

    if (element) {
        removeElement(element);
    }
}

function setArtwork(artwork = "./assets/images/album-art-placeholder.png") {
    document.getElementById("js-artwork").src = artwork;
}

function renderNowPlaying(track, artwork) {
    setArtwork(artwork);
    nowPlayingElement.classList.remove("inactive");
    nowPlayingElement.insertAdjacentHTML("beforeend", getTrackName(track, "js-track-name"));
}

function resetNowPlaying() {
    document.title = "Veery";

    setArtwork();
    removeTrackNameElement();
    nowPlayingElement.classList.add("inactive");
}

function showNowPlaying(track, artwork) {
    document.title = track.artist && track.title ? `${track.artist} - ${track.title}` : track.name;

    setArtwork();
    removeTrackNameElement();
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

nowPlayingElement.addEventListener("mousemove", handleMousemove);
mediaElement.addEventListener("click", handleClickOnMedia);
document.getElementById("js-expand-media-btn").addEventListener("click", toggleMedia);

export {
    showTrackInfo,
    resetTrackInfo
};

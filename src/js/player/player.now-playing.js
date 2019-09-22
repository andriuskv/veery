import { getElementByAttr, removeElement, getImage, setElementIconAndTitle } from "../utils.js";
import { togglePlaying } from "./player.js";
import { getCurrentTrack } from "../playlist/playlist.js";

const nowPlayingElement = document.getElementById("js-now-playing");
const mediaToggleBtn = document.getElementById("js-media-toggle-btn");
const mediaElement = document.getElementById("js-media-container");
let artwork = null;
let mediaVisible = false;

function handleClickOnMedia({ target }) {
    const element = getElementByAttr("data-item", target);

    if (element && element.attrValue === "image") {
        togglePlaying(getCurrentTrack());
    }
}

function blurIframe() {
    const element = document.activeElement;

    if (element instanceof HTMLIFrameElement) {
        requestAnimationFrame(() => {
            element.blur();
        });
    }
}

function hideMedia(event) {
    if (event.which === 27) {
        mediaVisible = false;
        mediaElement.classList.remove("visible");
        window.removeEventListener("keydown", hideMedia);
        setElementIconAndTitle(mediaToggleBtn, { title: "Expand", id: "expand" });
    }
}

function toggleMedia({ currentTarget }) {
    const ytPlayer = document.getElementById("js-yt-player");
    mediaElement.classList.toggle("visible");
    mediaVisible = !mediaVisible;

    if (mediaVisible) {
        mediaElement.addEventListener("click", handleClickOnMedia);
        window.addEventListener("keydown", hideMedia);
        window.addEventListener("blur", blurIframe);
        setElementIconAndTitle(currentTarget, { title: "Collapse", id: "collapse" });
        ytPlayer.removeAttribute("tabindex");
    }
    else {
        mediaElement.removeEventListener("click", handleClickOnMedia);
        window.removeEventListener("keydown", hideMedia);
        window.removeEventListener("blur", blurIframe);
        setElementIconAndTitle(currentTarget, { title: "Expand", id: "expand" });
        ytPlayer.setAttribute("tabindex", "-1");
    }
}

function removeTrackInfoElement() {
    const element = document.getElementById("js-track-info");

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
    nowPlayingElement.insertAdjacentHTML("beforeend", getTrackInfo(track, "js-track-info"));
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

function updateTrackMedia(player, artwork) {
    const element = document.getElementById("js-media-image");

    if (player === "native") {
        element.classList.remove("hidden");
        element.src = artwork;
    }
    else {
        element.classList.add("hidden");
    }
}

function getTrackInfo(track, id) {
    let elementTitle = track.name;
    let info = track.name;

    if (track.artist && track.title) {
        elementTitle = `${track.artist} - ${track.title}${track.album ? ` - ${track.album}` : ""}`;
        info = `
            <div class="track-title">${track.title}</div>
            <div class="track-artist">${track.artist}${track.album ? ` - ${track.album}` : ""}</div>
        `;
    }
    return `<div id="${id}" class="track-info" title="${elementTitle}">${info}</div> `;
}

function showTrackInfo(track) {
    if (artwork) {
        URL.revokeObjectURL(artwork);
    }
    artwork = getImage(track.picture);

    showNowPlaying(track, artwork);
    updateTrackMedia(track.player, artwork);
}

function resetTrackInfo() {
    resetNowPlaying();
    mediaElement.classList.remove("visible");

    if (artwork) {
        URL.revokeObjectURL(artwork);
        artwork = null;
    }
}

mediaToggleBtn.addEventListener("click", toggleMedia);

export {
    showTrackInfo,
    resetTrackInfo
};

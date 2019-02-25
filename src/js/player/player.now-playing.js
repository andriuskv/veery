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

function hideMedia(event) {
    if (event.which === 27) {
        mediaVisible = false;
        mediaElement.classList.remove("visible");
        window.removeEventListener("keydown", hideMedia);
        setElementIconAndTitle(mediaToggleBtn, { title: "Expand", id: "expand" });
    }
}

function toggleMedia({ currentTarget }) {
    mediaElement.classList.toggle("visible");
    mediaVisible = !mediaVisible;

    if (mediaVisible) {
        window.addEventListener("keydown", hideMedia);
        setElementIconAndTitle(currentTarget, { title: "Collapse", id: "collapse" });
    }
    else {
        window.removeEventListener("keydown", hideMedia);
        setElementIconAndTitle(currentTarget, { title: "Expand", id: "expand" });
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

function updateTrackMedia(track, artwork) {
    const ytPlayer = document.getElementById("js-yt-player");

    if (track.player === "youtube") {
        ytPlayer.classList.remove("hidden");
    }
    else {
        const imageElement = document.getElementById("js-media-image");

        ytPlayer.classList.add("hidden");
        imageElement.src = artwork;
    }
}

function getTrackInfo(track, id) {
    let trackName = `<div>${track.name}</div>`;

    if (track.artist && track.title) {
        trackName = `
            <div class="track-title">${track.title}</div>
            <div>${track.artist} ${track.album ? `- ${track.album}` : ""}</div>
        `;
    }
    return `<div id="${id}" class="track-info fade-right">${trackName}</div> `;
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

mediaToggleBtn.addEventListener("click", toggleMedia);
mediaElement.addEventListener("click", handleClickOnMedia);

export {
    showTrackInfo,
    resetTrackInfo
};

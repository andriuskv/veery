import { getElementByAttr, setElementIconAndTitle } from "../utils.js";
import { toggleRoute } from "../router.js";
import { getPlayerState, togglePlaying } from "./player.js";
import { getCurrentTrack, getActivePlaylistId } from "../playlist/playlist.js";
import { scrollCurrentTrackIntoView } from "../playlist/playlist.view.js";
import { getVisiblePlaylistId } from "../tab.js";
import { getArtwork } from "../artworks";

const nowPlayingElement = document.getElementById("js-now-playing");
const mediaElement = document.getElementById("js-media-container");
let mediaVisible = false;
let iconTimeout = 0;

function isMediaVisible() {
  return mediaVisible;
}

function handleClickOnMedia({ currentTarget, target }) {
  const element = getElementByAttr("data-item", target);

  if (element && element.attrValue === "image") {
    const iconElement = document.getElementById("js-media-state-icon");

    togglePlaying(getCurrentTrack());

    if (iconElement) {
      iconElement.remove();
    }
    currentTarget.insertAdjacentHTML("beforeend", `
      <svg viewBox="0 0 24 24" id="js-media-state-icon" class="media-state-icon">
        <use href="#${getPlayerState() ? "pause" : "play"}"/>
      </svg>
    `);
    clearTimeout(iconTimeout);
    iconTimeout = setTimeout(() => {
      document.getElementById("js-media-state-icon").remove();
    }, 1000);
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
  if (event.which === 27 && mediaVisible) {
    toggleMedia(false);
  }
}

function toggleMedia(visible = !mediaVisible) {
  const toggleBtn = document.getElementById("js-media-toggle-btn");
  const ytPlayer = document.getElementById("js-yt-player");
  mediaElement.classList.toggle("visible", visible);
  mediaVisible = visible;

  if (visible) {
    const track = getCurrentTrack();

    mediaElement.addEventListener("click", handleClickOnMedia);
    window.addEventListener("keydown", hideMedia);
    window.addEventListener("blur", blurIframe);
    setElementIconAndTitle(toggleBtn, { title: "Collapse", id: "collapse" });
    ytPlayer.removeAttribute("tabindex");

    if (track?.player === "native") {
      document.getElementById("js-player-controls").classList.add("transparent");
      mediaElement.classList.add("image");
    }
  }
  else {
    mediaElement.removeEventListener("click", handleClickOnMedia);
    window.removeEventListener("keydown", hideMedia);
    window.removeEventListener("blur", blurIframe);
    setElementIconAndTitle(toggleBtn, { title: "Expand", id: "expand" });
    ytPlayer.setAttribute("tabindex", "-1");
    document.getElementById("js-player-controls").classList.remove("transparent");
    mediaElement.classList.remove("image");
  }
}

function removeTrackInfoElement() {
  const element = document.getElementById("js-track-info");

  if (element) {
    element.remove();
  }
}

function setArtwork(artwork = "./assets/images/album-art-placeholder.png") {
  document.getElementById("js-artwork").src = artwork;
}

function showNowPlaying(track, artwork) {
  removeTrackInfoElement();
  setArtwork(artwork);
  nowPlayingElement.classList.remove("inactive");
  nowPlayingElement.insertAdjacentHTML("beforeend", getTrackInfo(track));
}

function updateTrackMedia(player, artwork) {
  const element = document.getElementById("js-media-image-container");

  if (player === "native") {
    const [background, image] = element.children;

    if (artwork !== image.src) {
      const isPlaceholder = artwork.includes("placeholder");
      const artworkClone = image.cloneNode();

      artworkClone.onload = function() {
        background.classList.toggle("hidden", isPlaceholder);
        artworkClone.classList.toggle("shadow", !isPlaceholder);
        element.replaceChild(artworkClone, image);
        background.style.backgroundImage = `url(${artwork})`;
        artworkClone.onload = null;
      };
      artworkClone.src = artwork;
    }
    element.classList.remove("hidden");
  }
  else {
    element.classList.add("hidden");
  }
}

function getTrackInfo(track) {
  let elementTitle = track.name;
  let info = null;

  if (track.artist && track.title) {
    elementTitle = `${track.artist} - ${track.title}${track.album ? ` - ${track.album}` : ""}`;
    info = `
      <div class="track-info-item track-title" data-action="reveal-track">${track.title}</div>
      <div class="track-info-item">${track.artist}${track.album ? ` - ${track.album}` : ""}</div>
    `;
  }
  else {
    info = `<div class="track-info-item track-name" data-action="reveal-track">${track.name}</div>`;
  }
  return `<div id="js-track-info" class="track-info" title="${elementTitle}">${info}</div> `;
}

function showTrackInfo(track) {
  const { url, type } = getArtwork(track.artworkId);
  const isPlaceholder = url.includes("placeholder");

  showNowPlaying(track, url);
  updateTrackMedia(track.player, url);

  if ("mediaSession" in navigator && track.player !== "youtube") {
    /* global MediaMetadata */
    navigator.mediaSession.metadata = new MediaMetadata({
      title: track.title,
      artist: track.artist,
      album: track.album,
      artwork: [isPlaceholder ?
        { src: "./android-chrome-512x512.png", sizes: "512x512", type: "image/png" } :
        { src: url, sizes: "512x512", type }
      ]
    });
  }
}

function resetTrackInfo() {
  document.title = "Veery";
  nowPlayingElement.classList.add("inactive");
  setArtwork();
  removeTrackInfoElement();
  toggleMedia(false);
}

function jumpToTrack() {
  const id = getActivePlaylistId();

  if (!id) {
    return;
  }
  else if (id !== getVisiblePlaylistId()) {
    toggleRoute(`playlist/${id}`);
  }
  else {
    scrollCurrentTrackIntoView(id);
  }

  if (mediaVisible) {
    toggleMedia(false);
  }
}

nowPlayingElement.addEventListener("click", event => {
  const element = getElementByAttr("data-action", event.target);

  if (!element) {
    return;
  }
  else if (element.attrValue === "toggle-media") {
    toggleMedia();
  }
  else if (element.attrValue === "reveal-track") {
    jumpToTrack();
  }
});

export {
  isMediaVisible,
  showTrackInfo,
  resetTrackInfo
};

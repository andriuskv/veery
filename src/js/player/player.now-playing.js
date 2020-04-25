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

function updateTrackMedia(player, { original, small }) {
  const element = document.getElementById("js-media-image-container");

  if (player === "native") {
    const [background, image] = element.children;

    if (original.url !== image.src) {
      const artworkClone = image.cloneNode();

      artworkClone.onload = function() {
        const isPlaceholder = original.url.includes("placeholder");
        background.classList.toggle("hidden", isPlaceholder);
        artworkClone.classList.toggle("shadow", !isPlaceholder);

        if (image) {
          element.replaceChild(artworkClone, image);
          background.style.backgroundImage = `url(${small.url})`;
        }
        artworkClone.onload = null;
      };
      artworkClone.src = original.url;
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
  const escapedTitle = elementTitle.replace(/"/g, "&quot;");
  return `<div id="js-track-info" class="track-info" title="${escapedTitle}">${info}</div> `;
}

function showTrackInfo(track) {
  const { image, type } = getArtwork(track.artworkId);

  showNowPlaying(track, image.small.url);
  updateTrackMedia(track.player, image);

  if ("mediaSession" in navigator && track.player !== "youtube") {
    /* global MediaMetadata */
    navigator.mediaSession.metadata = new MediaMetadata({
      title: track.title,
      artist: track.artist,
      album: track.album,
      artwork: [{ src: image.original.url, sizes: "512x512", type }]
    });
  }
}

function resetTrackInfo() {
  document.title = "Veery";
  nowPlayingElement.classList.add("inactive");
  setArtwork();
  removeTrackInfoElement();
  toggleMedia(false);

  if ("mediaSession" in navigator) {
    navigator.mediaSession.metadata = null;
  }
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

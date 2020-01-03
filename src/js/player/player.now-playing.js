import { getElementByAttr, setElementIconAndTitle } from "../utils.js";
import { toggleRoute } from "../router.js";
import { togglePlaying } from "./player.js";
import { getCurrentTrack, getActivePlaylistId } from "../playlist/playlist.js";
import { scrollCurrentTrackIntoView } from "../playlist/playlist.view.js";
import { getVisiblePlaylistId } from "../tab.js";
import { getArtwork } from "../artworks";

const nowPlayingElement = document.getElementById("js-now-playing");
const jumpToTrackBtn = document.getElementById("js-jump-to-track-btn");
const mediaToggleBtn = document.getElementById("js-media-toggle-btn");
const mediaElement = document.getElementById("js-media-container");
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
  jumpToTrackBtn.insertAdjacentHTML("beforebegin", getTrackInfo(track));
}

function updateTrackMedia(player, artwork) {
  const element = document.getElementById("js-media-image-container");

  if (player === "native") {
    const [background, image] = element.children;
    const isPlaceholder = artwork.includes("placeholder");

    background.classList.toggle("hidden", isPlaceholder);
    image.classList.toggle("shadow", !isPlaceholder);
    element.classList.remove("hidden");

    if (artwork !== image.src) {
      image.src = artwork;
      background.style.backgroundImage = `url(${artwork})`;
    }
  }
  else {
    element.classList.add("hidden");
  }
}

function getTrackInfo(track) {
  let elementTitle = track.name;
  let info = track.name;

  if (track.artist && track.title) {
    elementTitle = `${track.artist} - ${track.title}${track.album ? ` - ${track.album}` : ""}`;
    info = `
      <div class="track-title">${track.title}</div>
      <div class="track-artist">${track.artist}${track.album ? ` - ${track.album}` : ""}</div>
    `;
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

  setArtwork();
  removeTrackInfoElement();
  nowPlayingElement.classList.add("inactive");
  mediaElement.classList.remove("visible");
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
}

jumpToTrackBtn.addEventListener("click", jumpToTrack);
mediaToggleBtn.addEventListener("click", toggleMedia);

export {
  showTrackInfo,
  resetTrackInfo
};

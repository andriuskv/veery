import { dispatchCustomEvent } from "../utils";
import { getArtwork } from "services/artwork";
import { getIcon } from "services/playlist-view";

const pipSupported = "documentPictureInPicture" in window;
let pipWindow = null;
let currentTitle = "";
let playerActions = {};

function isSupported() {
  return pipSupported;
}

function toggle(params) {
  if (pipWindow) {
    pipWindow.close();
  }
  else {
    init(params);
  }
}

function close() {
  pipWindow.close();
  cleanup();
}

function cleanup() {
  dispatchCustomEvent("pip-close");
  pipWindow = null;
  playerActions = {};
  currentTitle = "";
}

async function init({ paused, track, togglePlay, playNext, playPrevious }) {
  pipWindow = await window.documentPictureInPicture.requestWindow();
  playerActions = {
    togglePlay,
    playNext,
    playPrevious
  };
  await copyStyleSheets(pipWindow.document.head);

  pipWindow.document.head.insertAdjacentHTML("beforeend", `
    <style>
      body {
        overflow: hidden;
        display: flex;
        align-items: flex-end;
      }

      body:is(:hover, :focus-within) #bottom-bar {
        opacity: 1;
        transform: none;
      }

      body:is(:hover, :focus-within) #artwork-overlay {
        opacity: 1;
      }

      #artwork-background {
        z-index: -1;
        position: absolute;
        transform: scale(1.08);
        width: 100%;
        height: 100%;
        background-repeat: no-repeat;
        background-size: cover;
        background-position: center;
        filter: blur(16px);
      }

      #artwork {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        display: block;
        height: calc(100% + 40px);
        object-fit: scale-down;
        border-radius: 8px;
      }

      #artwork.shadow {
        box-shadow:
          1px 2px 2px var(--color-black-100-16),
          2px 4px 4px var(--color-black-100-8),
          4px 8px 8px var(--color-black-100-4),
          8px 16px 16px var(--color-black-100-2);
      }

      #artwork-overlay {
        position: absolute;
        inset: 0;
        content: "";
        display: block;
        background-image: linear-gradient(rgb(0 0 0 / 0%), rgb(0 0 0 / 16%), rgb(0 0 0 / 40%));
        opacity: 0;
        transition: 0.2s opacity;
        pointer-events: none;
      }

      #bottom-bar {
        position: relative;
        transform: translateY(8px);
        opacity: 0;
        width: 100%;
        padding: 0 var(--space-xl);
        transition: 0.2s opacity, 0.2s transform;
      }

      .track-info-item {
        display: -webkit-box;
        -webkit-box-orient: vertical;
        -webkit-line-clamp: 2;
        white-space: normal;
        text-shadow: 1px 2px 2px var(--color-black-100-16);
        text-wrap: balance;
        color: var(--color-white);
        text-align: center;
      }

      .track-artist {
        margin-top: var(--space-sm);
        font-size: var(--text-xs);
      }

      #controls {
        display: flex;
        justify-content: center;
        align-items: center;
        margin-top: var(--space-xl);
        margin-bottom: var(--space-xl);
      }

      .player-bar-play-pause-btn svg {
        width: 36px;
        height: 36px;
      }
    </style>
  `);

  pipWindow.document.body.insertAdjacentHTML("beforeend", `
    <svg style="display:none;">
      <symbol id="play-circle" viewBox="0 0 24 24">
        <path d="M10,16.5V7.5L16,12M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z"/>
      </symbol>
      <symbol id="pause-circle" viewBox="0 0 24 24">
        <path d="M15,16H13V8H15M11,16H9V8H11M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z"/>
      </symbol>
      <symbol id="previous" viewBox="0 0 24 24">
        <path d="M6,18V6H8V18H6M9.5,12L18,6V18L9.5,12Z"/>
      </symbol>
      <symbol id="next" viewBox="0 0 24 24">
        <path d="M16,18H18V6H16M6,18L14.5,12L6,6V18Z"/>
      </symbol>
    </svg>
    <div id="artwork-background"></div>
    <img id="artwork" src="" alt="">
    <div id="artwork-overlay"></div>
    <div id="bottom-bar">
      <div id="track-title" class="track-info-item"></div>
      <div id="controls">
        <button data-action="previous" class="btn icon-btn player-bar-secondary-btn">${getIcon({ iconId: "previous" })}</button>
        <button class="btn icon-btn player-bar-play-pause-btn" data-action="play-pause">
          ${getIcon({ iconId: paused ? "play-circle" : "pause-circle" })}
        </button>
        <button data-action="next" class="btn icon-btn player-bar-secondary-btn">${getIcon({ iconId: "next" })}</button>
      </div>
    </div>
  `);

  pipWindow.document.getElementById("controls").addEventListener("click", event => {
    const element = event.target.closest("button");

    if (element) {
      const action = element.getAttribute("data-action");

      if (action === "play-pause") {
        playerActions.togglePlay();
      }
      else if (action === "next") {
        playerActions.playNext();
      }
      else if (action === "previous") {
        playerActions.playPrevious();
      }
    }
  });

  pipWindow.addEventListener("unload", cleanup, { once: true });

  update(track, paused);
}

async function copyStyleSheets(head) {
  const allCSS = [...document.styleSheets]
    .map(styleSheet => {
      try {
        return [...styleSheet.cssRules].map((r) => r.cssText).join("");
      } catch (e) {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.type = styleSheet.type;
        link.media = styleSheet.media;
        link.href = styleSheet.href;
        head.appendChild(link);
        return null;
      }
    })
    .filter(Boolean)
    .join("\n");
  const style = document.createElement("style");
  style.textContent = allCSS;
  head.appendChild(style);
}

function update(track, paused) {
  if (!pipWindow) {
    return;
  }
  setTitle(track.artist && track.title ? `${track.artist} - ${track.title}` : track.title, paused);
  updateArtwork(track.artworkId);
  updateTrackInfo(track);
}

function updateArtwork(artworkId) {
  const { isPlaceholder, original } = getArtwork(artworkId);
  const artworkElement = pipWindow.document.getElementById("artwork");

  pipWindow.document.getElementById("artwork-background").style.backgroundImage = `url(${original.url})`;
  artworkElement.src = original.url;

  if (isPlaceholder) {
    artworkElement.classList.remove("shadow");
  }
  else {
    artworkElement.classList.add("shadow");
  }
}

function updateTrackInfo(track) {
  const trackTitleElement = pipWindow.document.getElementById("track-title");
  const trackArtistElement = pipWindow.document.getElementById("track-artist");

  trackTitleElement.textContent = track.title;

  if (track.artist) {
    if (trackArtistElement) {
      trackArtistElement.textContent = track.artist;
    }
    else {
      trackTitleElement.insertAdjacentHTML("afterend", `<div id="track-artist" class="track-info-item track-artist">${track.artist}</div>`);
    }
  }
  else if (trackArtistElement) {
    trackArtistElement.remove();
  }
}

function setTitle(title, paused) {
  currentTitle = title;

  if (!pipWindow) {
    return;
  }

  if (paused) {
    pipWindow.document.title = `Paused - ${title}`;
  }
  else {
    pipWindow.document.title = `Playing - ${title}`;
  }
}

function updateState(paused) {
  if (!pipWindow) {
    return;
  }
  const element = pipWindow.document.getElementById("controls").querySelector("[data-action=play-pause]");
  element.innerHTML = getIcon({ iconId: paused ? "play-circle" : "pause-circle" });
  setTitle(currentTitle, paused);
}

function updatePlayerActions(actions) {
  playerActions = actions;
}

export {
  isSupported,
  setTitle,
  close,
  toggle,
  update,
  updateState,
  updatePlayerActions
};

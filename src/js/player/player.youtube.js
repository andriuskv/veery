/* global YT */

import { scriptLoader, getElementById, dispatchCustomEvent, getElementByAttr } from "../utils.js";
import { storedTrack, getPlayerState, updatePlayerState } from "./player.js";
import { elapsedTime, showPlayPauseBtnSpinner, hidePlayPauseBtnSpinner } from "./player.controls.js";
import { getCurrentTrack } from "../playlist/playlist.js";

const PLAYING = 1;
const PAUSED = 2;
const BUFFERING = 3;
const UNSTARTED = -1;
let isStoredTrack = false;
let initialized = false;
let ytPlayer = null;
let args = null;
window.onYouTubeIframeAPIReady = initPlayer;

function onPlayerStateChange({ data: state }) {
    const iframe = getElementById("yt-player");
    const isPaused = getPlayerState();
    const latestState = isPaused ? PAUSED: PLAYING;

    hidePlayPauseBtnSpinner();

    if (document.activeElement === iframe) {
        iframe.blur();

        if (latestState === PAUSED) {
            dispatchCustomEvent("track-start", ytPlayer.getCurrentTime());
        }
        updatePlayerState(!isPaused, getCurrentTrack());
        return;
    }

    if (state === PLAYING) {
        if (latestState === PLAYING) {
            isStoredTrack = false;
        }

        if (isStoredTrack || latestState === PAUSED) {
            isStoredTrack = false;
            ytPlayer.pauseVideo();
            return;
        }
        dispatchCustomEvent("track-start", ytPlayer.getCurrentTime());
    }
    else if (state === PAUSED && latestState === PLAYING) {
        ytPlayer.playVideo();
    }
    else if (state === BUFFERING) {
        elapsedTime.stop();
        showPlayPauseBtnSpinner();
    }
}

function onPlayerReady() {
    initialized = true;
    hidePlayPauseBtnSpinner();
    playTrack(...args);
    args = null;
}

function onError(error) {
    console.log(error);
}

function createPlayerContainer() {
    const id = "js-yt-player-container";
    const content = `
        <div id="${id}" class="yt-player-container">
            <div class="yt-player-btns">
                <button class="btn btn-icon" data-item="watch" title="Watch on YouTube">
                    <svg viewBox="0 0 24 24">
                        <use href="#youtube"></use>
                    </svg>
                </button>
                <button class="btn btn-icon" data-item="close" title="Close YouTube player">
                    <svg viewBox="0 0 24 24">
                        <use href="#close"></use>
                    </svg>
                </button>
            </div>
            <div id="yt-player" class="yt-player"></div>
        </div>
    `;

    document.querySelector(".player").insertAdjacentHTML("afterbegin", content);
    getElementById(id).addEventListener("click", handleClick);
}

function initPlayer() {
    createPlayerContainer();
    ytPlayer = new YT.Player("yt-player", {
        playerVars: {
            autoplay: 0,
            disablekb: 1,
            controls: 0,
            fs: 0,
            showinfo: 0,
            rel: 0,

            // Hide annotations
            iv_load_policy: 3
        },
        events: {
            onReady: onPlayerReady,
            onStateChange: onPlayerStateChange,
            onError
        }
    });
}

function togglePlaying(paused) {
    if (!initialized) {
        return;
    }
    const state = ytPlayer.getPlayerState();

    if (state === BUFFERING || state === UNSTARTED) {
        return;
    }

    if (paused) {
        ytPlayer.playVideo();
    }
    else {
        ytPlayer.pauseVideo();
    }
}

function playTrack(track, volume, startTime) {
    if (!initialized) {
        args = [track, volume, startTime];
        showPlayPauseBtnSpinner();
        scriptLoader.load({ src: "https://www.youtube.com/iframe_api" });
        return;
    }
    setVolume(volume);

    if (typeof startTime === "number") {
        isStoredTrack = true;
        ytPlayer.loadVideoById(track.id, startTime);
    }
    else {
        ytPlayer.loadVideoById(track.id);
    }
}

function stopTrack() {
    if (!initialized) {
        return;
    }
    hidePlayPauseBtnSpinner();
    ytPlayer.stopVideo();
}

function setVolume(volume) {
    ytPlayer.setVolume(volume * 100);
}

function seekTo(currentTime) {
    ytPlayer.seekTo(currentTime, true);
}

function handleClick({ currentTarget, target }) {
    const element = getElementByAttr("data-item", target);

    if (!element) {
        return;
    }
    const { attrValue } = element;

    if (attrValue === "watch") {
        const isPaused = getPlayerState();
        const track = getCurrentTrack();
        const { currentTime } = storedTrack.get();
        const href = `https://www.youtube.com/watch?time_continue=${currentTime}&v=${track.id}`;

        if (!isPaused) {
            ytPlayer.pauseVideo();
            updatePlayerState(!isPaused, getCurrentTrack());
        }
        window.open(href, "_blank");
    }
    else if (attrValue === "close") {
        currentTarget.classList.remove("visible");
    }
}

export {
    playTrack,
    stopTrack,
    togglePlaying,
    seekTo,
    setVolume
};

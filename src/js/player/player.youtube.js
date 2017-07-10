/* global YT */

import { scriptLoader, getElementById, dispatchCustomEvent, getElementByAttr } from "../utils.js";
import { storedTrack, getPlayerState, togglePlaying as togglePlayerPlaying } from "./player.js";
import { elapsedTime } from "./player.controls.js";
import { getCurrentTrack } from "../playlist/playlist.js";

let ytPlayer = null;
let isStoredTrack = false;
let initialized = false;
let args = null;
window.onYouTubeIframeAPIReady = initPlayer;

function onPlayerStateChange({ data: state }) {
    const { PLAYING, BUFFERING } = YT.PlayerState;

    if (state === PLAYING) {
        if (isStoredTrack) {
            ytPlayer.pauseVideo();
            isStoredTrack = false;
            return;
        }
        dispatchCustomEvent("track-start", ytPlayer.getCurrentTime());
    }
    else if (state === BUFFERING) {
        elapsedTime.stop();
    }
}

function onPlayerReady() {
    initialized = true;
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
                <a href="" class="btn btn-icon" data-item="watch" title="Watch on YouTube" target="_blank">
                    <svg viewBox="0 0 24 24">
                        <use href="#youtube"></use>
                    </svg>
                </a>
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
    const track = getCurrentTrack();

    if (!element) {
        togglePlayerPlaying(track);
        return;
    }
    const { attrValue, elementRef } = element;

    if (attrValue === "watch") {
        const { currentTime } = storedTrack.get();
        const href = `https://www.youtube.com/watch?time_continue=${currentTime}&v=${track.id}`;

        elementRef.setAttribute("href", href);

        if (!getPlayerState()) {
            togglePlayerPlaying(track);
        }
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

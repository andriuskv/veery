/* global YT */

import { scriptLoader } from "./../main.js";
import { onTrackStart } from "./player.js";

let ytPlayer = null;
let isStoredTrack = false;
let initialized = false;
let args = null;
window.onYouTubeIframeAPIReady = initPlayer;

function onPlayerStateChange({ data: state }) {
    if (state === YT.PlayerState.PLAYING) {
        if (isStoredTrack) {
            ytPlayer.pauseVideo();
            isStoredTrack = false;
            return;
        }
        onTrackStart(Math.floor(ytPlayer.getCurrentTime()));
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
    const content = `
        <div id="js-yt-player-container" class="yt-player-container">
            <button id="js-close-player-btn" class="btn">Hide</button>
            <div id="yt-player"></div>
        </div>
    `;

    document.querySelector(".main").insertAdjacentHTML("beforeend", content);
    document.getElementById("js-close-player-btn").addEventListener("click", () => {
        document.getElementById("js-yt-player-container").classList.remove("visible");
    });
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
            rel: 0
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

export {
    playTrack,
    stopTrack,
    togglePlaying,
    seekTo,
    setVolume
};

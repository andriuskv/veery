/* global YT */

import { scriptLoader, getElementById, dispatchCustomEvent } from "../utils.js";
import { storedTrack, getPlayerState, updatePlayerState, stopPlayer, showPlayerMessage } from "./player.js";
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
    const track = getCurrentTrack();

    if (!track || track.player !== "youtube") {
        return;
    }
    const iframe = getElementById("js-yt-player");
    const isPaused = getPlayerState();
    const latestState = isPaused ? PAUSED : PLAYING;

    if (document.activeElement === iframe &&
        (state === PLAYING && latestState === PAUSED ||
        state === PAUSED && latestState === PLAYING)) {
        iframe.blur();

        if (latestState === PAUSED) {
            dispatchCustomEvent("track-start", ytPlayer.getCurrentTime());
        }
        updatePlayerState(!isPaused, track);
        return;
    }

    if (state === PLAYING) {
        if (latestState === PLAYING) {
            isStoredTrack = false;
        }

        if (isStoredTrack || latestState === PAUSED) {
            isStoredTrack = false;
            ytPlayer.pauseVideo();
            hidePlayPauseBtnSpinner();
            return;
        }
        dispatchCustomEvent("track-start", ytPlayer.getCurrentTime());
    }
    else if (state === PAUSED && latestState === PLAYING) {
        ytPlayer.playVideo();
        hidePlayPauseBtnSpinner();
    }
    else if (state === BUFFERING) {
        elapsedTime.stop();
        showPlayPauseBtnSpinner(track);
    }
}

function onPlayerReady() {
    initialized = true;
    playTrack(...args);
    args = null;
}

function onError(error) {
    console.log(error);

    if (error.data >= 100) {
        const track = getCurrentTrack();

        stopPlayer(track);
        showPlayerMessage({
            title: `Cannot play ${track.name}`,
            body: "It is either removed or marked as private"
        });
    }
}

function initPlayer() {
    ytPlayer = new YT.Player("js-yt-player", {
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

function watchOnYoutube(element, track) {
    const isPaused = getPlayerState();
    const { currentTime } = storedTrack.getTrack();

    if (!isPaused) {
        ytPlayer.pauseVideo();
        updatePlayerState(!isPaused, track);
    }
    element.setAttribute("href", `https://www.youtube.com/watch?v=${track.id}&time_continue=${currentTime}`);
}

export {
    playTrack,
    stopTrack,
    togglePlaying,
    seekTo,
    setVolume,
    watchOnYoutube
};

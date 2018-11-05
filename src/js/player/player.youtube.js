/* global YT */

import { scriptLoader, dispatchCustomEvent } from "../utils.js";
import { getPlayerState, updatePlayerState, playNextTrack, stopPlayer } from "./player.js";
import { showPlayerMessage } from "./player.view.js";
import { elapsedTime, showPlayPauseBtnSpinner, hidePlayPauseBtnSpinner } from "./player.controls.js";
import { getCurrentTrack, getNextTrack, getPlaylistById } from "../playlist/playlist.js";

const PLAYING = 1;
const PAUSED = 2;
const BUFFERING = 3;
const UNSTARTED = -1;
let initialized = false;
let ytPlayer = null;
let args = null;
window.onYouTubeIframeAPIReady = initPlayer;

function onPlayerStateChange({ data: state }) {
    const track = getCurrentTrack();

    if (!track || track.player !== "youtube") {
        return;
    }
    const iframe = document.getElementById("js-yt-player");
    const isPaused = getPlayerState();
    const latestState = isPaused ? PAUSED : PLAYING;

    if (document.activeElement === iframe &&
        (state === PLAYING && latestState === PAUSED ||
        state === PAUSED && latestState === PLAYING)) {
        iframe.blur();

        if (latestState === PAUSED) {
            dispatchCustomEvent("track-start", ytPlayer.getCurrentTime());
        }
        updatePlayerState(track);
        return;
    }

    if (state === PLAYING) {
        if (latestState === PAUSED) {
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
        showPlayPauseBtnSpinner(track);
    }
    else {
        hidePlayPauseBtnSpinner(track);
    }
}

function onPlayerReady() {
    initialized = true;
    playTrack(...args);
    args = null;
}

function onError(error) {
    let body = "";

    if (error.data === 100) {
        body = "Video is either removed or marked as private";
    }
    else if (error.data === 101 || error.data === 150) {
        body = "The owner of the requested video does not allow it to be played in embedded players";
    }
    console.log(error);

    if (body) {
        const track = getCurrentTrack();
        const pl = getPlaylistById(track.playlistId);
        const { name } = getNextTrack(pl, 1);

        if (track.name === name) {
            stopPlayer(track);
        }
        else {
            playNextTrack();
        }
        showPlayerMessage({
            title: `Cannot play ${track.name}`,
            body
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
    if (initialized) {
        setVolume(volume);
        ytPlayer.loadVideoById(track.id, startTime);
        return;
    }
    args = [track, volume, startTime];
    scriptLoader.load({ src: "https://www.youtube.com/iframe_api" });
}

function stopTrack(track) {
    if (!initialized) {
        return;
    }
    hidePlayPauseBtnSpinner(track);
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

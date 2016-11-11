/* global YT */

import { setCurrentTrack } from "./../playlist/playlist.js";
import { storedTrack, onTrackStart } from "./player.js";

let ytPlayer = null;
let isStoredTrack = false;
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
    storedTrack.setPlayerAsReady("youtube");
}

function onError(error) {
    console.log(error);
}

function initPlayer() {
    ytPlayer = new YT.Player("yt-player", {
        height: "390",
        width: "640",
        videoId: "",
        events: {
            onReady: onPlayerReady,
            onStateChange: onPlayerStateChange,
            onError
        }
    });
}

function getPlayPauseCallbacks() {
    return {
        play: ytPlayer.playVideo.bind(ytPlayer),
        pause: ytPlayer.pauseVideo.bind(ytPlayer)
    };
}

function playTrack(track, volume, startTime) {
    setVolume(volume);
    setCurrentTrack(track);
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
    getPlayPauseCallbacks,
    seekTo,
    setVolume
};

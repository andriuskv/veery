/* global YT */

import { setCurrentTrack } from "./../playlist/playlist.js";
import { storedTrack, onTrackStart } from "./player.js";

let ytPlayer = null;
window.onYouTubeIframeAPIReady = initPlayer;

function onPlayerStateChange({ data: currentState }) {
    if (currentState === YT.PlayerState.PLAYING) {
        onTrackStart({
            currentTime: Math.floor(ytPlayer.getCurrentTime()),
            duration:  ytPlayer.getDuration()
        }, ytPlayer.playVideo.bind(ytPlayer));
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
        ytPlayer.cueVideoById(track.id, startTime);
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

function getElapsed(percent) {
    const duration = ytPlayer.getDuration();
    const elapsed = duration / 100 * percent;

    ytPlayer.seekTo(elapsed, true);
    return elapsed;
}

export {
    playTrack,
    stopTrack,
    getPlayPauseCallbacks,
    getElapsed,
    setVolume
};

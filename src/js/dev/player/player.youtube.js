/* global YT */

import * as settings from "./../settings.js";
import { setCurrentTrack } from "./../playlist/playlist.js";
import { initStoredTrack } from "./../playlist/playlist.manage.js";
import { onTrackStart, onTrackEnd, toggleTrackPlaying } from "./player.js";

let ytPlayer = null;
window.onYouTubeIframeAPIReady = initPlayer;

function getTime(player) {
    return {
        currentTime: player.getCurrentTime(),
        duration:  player.getDuration()
    };
}

function onPlayerStateChange({ data: currentState }) {
    if (currentState === YT.PlayerState.PLAYING) {
        setVolume(settings.get("volume"));
        onTrackStart(getTime(ytPlayer))
        .then(() => {
            const play = ytPlayer.playVideo.bind(ytPlayer);

            onTrackEnd(play);
        });
    }
}

function onPlayerReady() {
    initStoredTrack("yt-pl-");
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

function togglePlaying() {
    const play = ytPlayer.playVideo.bind(ytPlayer);
    const pause = ytPlayer.pauseVideo.bind(ytPlayer);

    toggleTrackPlaying(play, pause);
}

function playTrack(track) {
    if (ytPlayer) {
        setCurrentTrack(track);
        ytPlayer.loadVideoById(track.id);
        return;
    }
}

function queueTrack(track, startTime) {
    setCurrentTrack(track);
    ytPlayer.cueVideoById(track.id, startTime);
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
    stopTrack as stop,
    playTrack,
    queueTrack,
    togglePlaying,
    getElapsed,
    setVolume
};

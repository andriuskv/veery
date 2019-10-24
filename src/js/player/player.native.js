import { dispatchCustomEvent } from "../utils.js";
import { stopPlayer, playNextTrack } from "./player.js";
import { hidePlayPauseBtnSpinner } from "./player.controls.js";
import { showPlayerMessage } from "./player.view.js";
import { getCurrentTrack } from "../playlist/playlist.js";

const invalidFiles = [];
let audioBlobURL;
let audio;

function playTrack(track, volume, startTime) {
    audioBlobURL = URL.createObjectURL(track.audioTrack);
    audio = new Audio(audioBlobURL);
    audio.onplaying = function() {
        dispatchCustomEvent("track-start", audio.currentTime);
    };

    audio.onerror = function(error) {
        const track = getCurrentTrack();

        if (invalidFiles.includes(track.name)) {
            stopPlayer(track);
            invalidFiles.length = 0;
        }
        else {
            hidePlayPauseBtnSpinner();
            invalidFiles.push(track.name);
            playNextTrack();
        }
        showPlayerMessage({
            title: `Cannot play ${track.name}`,
            body: "Its path or name might have changed"
        });
        console.log(error);
    };

    setVolume(volume);

    if (typeof startTime === "number") {
        seekTo(startTime);
        return;
    }
    audio.play();
}

function togglePlaying(paused) {
    if (paused) {
        audio.play();
    }
    else {
        audio.pause();
    }
}

function stopTrack() {
    audio.pause();
    audio.onplaying = null;
    audio.onerror = null;
    audio.currentTime = 0;
    audio = null;

    if (audioBlobURL) {
        URL.revokeObjectURL(audioBlobURL);
        audioBlobURL = null;
    }
}

function setVolume(volume) {
    audio.volume = volume;
}

function seekTo(currentTime) {
    audio.currentTime = currentTime;
}

export {
    playTrack,
    stopTrack,
    togglePlaying,
    seekTo,
    setVolume
};

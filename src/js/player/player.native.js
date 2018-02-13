import { dispatchCustomEvent } from "../utils.js";

let audioBlobURL;
let audio;

function playTrack(audioTrack, volume, startTime) {
    audioBlobURL = URL.createObjectURL(audioTrack);
    audio = new Audio(audioBlobURL);
    audio.onplaying = function() {
        dispatchCustomEvent("track-start", audio.currentTime);
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
    if (audioBlobURL) {
        URL.revokeObjectURL(audioBlobURL);
        audioBlobURL = null;
    }
    audio.pause();
    audio.currentTime = 0;
    audio = null;
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

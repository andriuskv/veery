import { dispatchCustomEvent } from "../utils.js";
import { updateCurrentTrack } from "../playlist/playlist.js";

function playTrack(audioTrack, volume, startTime) {
    const audioBlobURL = URL.createObjectURL(audioTrack);
    const audio = new Audio(audioBlobURL);

    setVolume(volume, audio);
    updateCurrentTrack({
        audioBlobURL,
        audio
    });

    audio.onplaying = function() {
        dispatchCustomEvent("track-start", audio.currentTime);
    };

    if (typeof startTime === "number") {
        seekTo(startTime, audio);
        return;
    }
    audio.play();
}

function togglePlaying(paused, audio) {
    if (paused) {
        audio.play();
    }
    else {
        audio.pause();
    }
}

function stopTrack(track) {
    URL.revokeObjectURL(track.audioBlobURL);
    track.audio.load();
    track.audio.onplaying = null;
    delete track.audioBlobURL;
    delete track.audio;
}

function setVolume(volume, audio) {
    audio.volume = volume;
}

function seekTo(currentTime, audio) {
    audio.currentTime = currentTime;
}

export {
    playTrack,
    stopTrack,
    togglePlaying,
    seekTo,
    setVolume
};

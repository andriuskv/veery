import { setCurrentTrack } from "./../playlist/playlist.js";
import { onTrackStart } from "./player.js";

function playTrack(track, volume, startTime) {
    track.audioBlobURL = URL.createObjectURL(track.audioTrack);
    track.audio = new Audio(track.audioBlobURL);
    track.audio.volume = volume;

    setCurrentTrack(track);
    track.audio.onplaying = function() {
        const startTime = Math.floor(track.audio.currentTime);
        const repeatTrack = track.audio.play.bind(track.audio);

        onTrackStart(startTime, repeatTrack);
    };

    if (typeof startTime === "number") {
        track.audio.currentTime = startTime;
        return;
    }
    track.audio.play();
}

function getPlayPauseCallbacks({ audio }) {
    return {
        play: audio.play.bind(audio),
        pause: audio.pause.bind(audio)
    };
}

function stopTrack(track) {
    URL.revokeObjectURL(track.audioBlobURL);
    track.audio.load();
    track.audio.onplaying = null;
    delete track.audioBlobURL;
    delete track.audio;
}

function setVolume(track, volume) {
    track.audio.volume = volume;
}

function seekTo(currentTime, track) {
    track.audio.currentTime = currentTime;
}

export {
    playTrack,
    stopTrack,
    getPlayPauseCallbacks,
    seekTo,
    setVolume
};

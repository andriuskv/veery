import { setCurrentTrack } from "./../playlist/playlist.js";
import { onTrackStart } from "./player.js";

function playTrack(track, volume, startTime) {
    track.audioBlobURL = URL.createObjectURL(track.audioTrack);
    track.audio = new Audio(track.audioBlobURL);
    track.audio.volume = volume;

    setCurrentTrack(track);
    track.audio.onplaying = function() {
        onTrackStart({
            currentTime: Math.floor(track.audio.currentTime),
            duration: Math.floor(track.audio.duration)
        }, track.audio.play.bind(track.audio));
    };

    if (typeof startTime === "number") {
        track.audio.currentTime = startTime;
        return;
    }

    track.audio.oncanplay = function() {
        track.audio.play();
    };
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
    track.audio.oncanplay = null;
    track.audio.onplaying = null;
    track.audio.onended = null;
    delete track.audioBlobURL;
    delete track.audio;
}

function setVolume(track, volume) {
    track.audio.volume = volume;
}

function getElapsed(track, percent) {
    const elapsed = track.audio.duration / 100 * percent;

    track.audio.currentTime = elapsed;
    return elapsed;
}

export {
    playTrack,
    stopTrack,
    getPlayPauseCallbacks,
    getElapsed,
    setVolume
};

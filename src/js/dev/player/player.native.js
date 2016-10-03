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

function seekTo(percent, track) {
    track.audio.currentTime = track.audio.duration / 100 * percent;
    return track.audio.currentTime;
}

export {
    playTrack,
    stopTrack,
    getPlayPauseCallbacks,
    seekTo,
    setVolume
};

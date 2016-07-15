import * as settings from "./../settings.js";
import * as playlist from "./../playlist/playlist.js";
import * as player from "./player.js";

function getTime(audio) {
    return {
        currentTime: audio.currentTime,
        duration: Math.floor(audio.duration)
    };
}

function playTrack(track, startTime) {
    console.log(track);
    track.audioBlobURL = URL.createObjectURL(track.audioTrack);
    track.audio = new Audio(track.audioBlobURL);
    track.audio.volume = settings.get("volume");

    track.audio.onplaying = function() {
        player.onTrackStart(track, getTime(track.audio))
        .then(() => {
            const play = track.audio.play.bind(track.audio);

            player.onTrackEnd(play);
        });
    };

    if (startTime) {
        track.audio.currentTime = startTime;
        return;
    }

    track.audio.oncanplay = function() {
        track.audio.play();
    };
}

function playTrackOnButtonPress(track) {
    const audio = track.audio;

    if (audio) {
        const play = audio.play.bind(audio);
        const pause = audio.pause.bind(audio);

        player.toggleTrackPlaying(play, pause);
        return;
    }
    playTrack(track);
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

function setVolume(volume) {
    const track = playlist.getCurrentTrack();

    if (track) {
        track.audio.volume = volume;
    }
}

function getElapsed(percent) {
    const { audio } = playlist.getCurrentTrack();

    if (audio) {
        const elapsed = audio.duration / 100 * percent;

        audio.currentTime = elapsed;
        return elapsed;
    }
    return 0;
}

export {
    playTrackOnButtonPress as play,
    stopTrack as stop,
    playTrack,
    getElapsed,
    setVolume
};

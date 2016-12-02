/* global SC */

import { initSoundCloud } from "./../soundcloud.js";
import { setCurrentTrack } from "./../playlist/playlist.js";
import { onTrackStart } from "./player.js";

let scPlayer = null;

async function playTrack(track, volume, startTime) {
    setCurrentTrack(track);
    await initSoundCloud();

    try {
        if (scPlayer) {
            scPlayer.dispose();
        }
        scPlayer = await SC.stream(`/tracks/${track.id}`);
    }
    catch (e) {
        console.log(e);
    }

    scPlayer.on("play-resume", () => {
        onTrackStart(Math.floor(scPlayer.currentTime() / 1000));
    });

    if (typeof startTime === "number") {
        scPlayer.once("state-change", state => {
            if (state === "loading") {
                seekTo(startTime);
                scPlayer.pause();
            }
        });
    }
    setVolume(volume);
    scPlayer.seek(0);
    scPlayer.play();
}

function getPlayPauseCallbacks() {
    return {
        play: scPlayer.play.bind(scPlayer),
        pause: scPlayer.pause.bind(scPlayer)
    };
}

function stopTrack() {
    scPlayer.seek(0);
    scPlayer.pause();
}

function setVolume(volume) {
    scPlayer.setVolume(volume);
}

function seekTo(currentTime) {
    scPlayer.seek(currentTime * 1000);
}

export {
    playTrack,
    stopTrack,
    getPlayPauseCallbacks,
    seekTo,
    setVolume
};

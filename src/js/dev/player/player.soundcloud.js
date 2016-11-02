/* global SC */

import { setCurrentTrack } from "./../playlist/playlist.js";
import { onTrackStart } from "./player.js";

let scPlayer = null;

function repeatTrack() {
    scPlayer.seek(0);
    scPlayer.play();
}

function playTrack(track, volume, startTime) {
    setCurrentTrack(track);
    SC.stream(`/tracks/${track.id}`).then(trackPlayer => {
        scPlayer = trackPlayer;
        trackPlayer.setVolume(volume);
        trackPlayer.on("play-resume", () => {
            const startTime = Math.floor(trackPlayer.currentTime() / 1000);

            onTrackStart(startTime, repeatTrack);
        });
        trackPlayer.on("state-change", state => {
            if (typeof startTime !== "number") {
                return;
            }
            else if (state === "loading") {
                seekTo(startTime);
                trackPlayer.pause();
            }
            else if (state === "seeking") {
                startTime = null;
            }
        });
        trackPlayer.play();
    })
    .catch(error => {
        console.log(error);
    });
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

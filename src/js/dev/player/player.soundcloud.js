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
            onTrackStart({
                currentTime: Math.floor(trackPlayer.currentTime() / 1000),
                duration: Math.floor(trackPlayer.streamInfo.duration / 1000)
            }, repeatTrack);
        });
        trackPlayer.on("state-change", state => {
            if (typeof startTime !== "number") {
                return;
            }
            else if (state === "loading") {
                trackPlayer.seek(startTime * 1000);
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

function getElapsed(percent) {
    const duration = scPlayer.streamInfo.duration / 1000;
    const elapsed = duration / 100 * percent;

    scPlayer.seek(elapsed * 1000);
    return elapsed;
}

export {
    playTrack,
    stopTrack,
    getPlayPauseCallbacks,
    getElapsed,
    setVolume
};

/* global SC */

import * as settings from "./../settings.js";
import * as player from "./player.js";

let scPlayer = null;

function getTime(player) {
    return {
        currentTime: player.currentTime() / 1000,
        duration: Math.floor(player.streamInfo.duration / 1000)
    };
}

function repeatTrack() {
    scPlayer.seek(0);
    scPlayer.play();
}

function playTrack(track, startTime) {
    console.log(track);
    SC.stream(`/tracks/${track.id}`).then(trackPlayer => {
        scPlayer = trackPlayer;

        trackPlayer.setVolume(settings.get("volume"));

        trackPlayer.on("play-resume", () => {
            player.onTrackStart(track, getTime(trackPlayer))
            .then(() => {
                player.onTrackEnd(repeatTrack);
            });
        });

        trackPlayer.on("state-change", state => {
            if (!startTime) {
                return;
            }
            else if (state === "loading") {
                trackPlayer.seek(startTime * 1000);
                trackPlayer.pause();
            }
            else if (state === "seeking") {
                startTime = 0;
            }
        });

        trackPlayer.play();
    })
    .catch(error => {
        console.log(error);
    });
}

function togglePlaying() {
    const play = scPlayer.play.bind(scPlayer);
    const pause = scPlayer.pause.bind(scPlayer);

    player.toggleTrackPlaying(play, pause);
}

function stopTrack() {
    scPlayer.seek(0);
    scPlayer.pause();
}

function setVolume(volume) {
    scPlayer.setVolume(volume);
}

function getElapsed(percent) {
    if (scPlayer) {
        const duration = scPlayer.streamInfo.duration / 1000;
        const elapsed = duration / 100 * percent;

        scPlayer.seek(elapsed * 1000);
        return elapsed;
    }
    return 0;
}

export {
    stopTrack as stop,
    playTrack,
    togglePlaying,
    getElapsed,
    setVolume
};

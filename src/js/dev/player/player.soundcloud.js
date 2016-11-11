import { stream } from "soundcloud";
import { setCurrentTrack } from "./../playlist/playlist.js";
import { onTrackStart } from "./player.js";

let scPlayer = null;

function playTrack(track, volume, startTime) {
    setCurrentTrack(track);
    stream(`/tracks/${track.id}`).then(trackPlayer => {
        if (scPlayer) {
            scPlayer.dispose();
        }
        scPlayer = trackPlayer;
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

import { removeElementClass, getElementByAttr } from "./../main.js";
import { getVisiblePlaylistId } from "./../tab.js";
import { getSetting } from "./../settings.js";
import { showTrackInfo, showActiveIcon, removeActiveIcon } from "./../sidebar.js";
import { showPlayingTrack } from "./../playlist/playlist.view.js";
import * as playlist from "./../playlist/playlist.js";
import * as controls from "./player.controls.js";
import * as nPlayer from "./player.native.js";
import * as ytPlayer from "./player.youtube.js";
import * as scPlayer from "./player.soundcloud.js";

let paused = true;
let scrollToTrack = false;

const storedTrack = (function () {
    const players = {
        native: false,
        youtube: false,
        soundcloud: false
    };

    function getTrack() {
        return JSON.parse(localStorage.getItem("track"));
    }

    function saveTrack(track) {
        localStorage.setItem("track", JSON.stringify(track));
    }

    function updateSavedTrack(newTrack) {
        const track = Object.assign(getTrack(), newTrack);

        saveTrack(track);
    }

    function removeTrack() {
        localStorage.removeItem("track");
    }

    function initTrack() {
        const storedTrack = getTrack();

        if (!storedTrack) {
            return;
        }
        const track = playlist.findTrack(storedTrack.playlistId, storedTrack.name);

        if (!track) {
            return;
        }
        playlist.setPlaylistAsActive(storedTrack.playlistId);
        controls.setTrackBarInnerWidth(storedTrack.elapsed);
        controls.displayCurrentTime(storedTrack.currentTime);
        beforeTrackStart(track, storedTrack.playlistId);
        playNewTrack(track, storedTrack.currentTime);
    }

    function setPlayerAsReady(player) {
        players[player] = true;

        if (Object.keys(players).every(player => players[player])) {
            initTrack();
        }
    }

    return {
        get: getTrack,
        remove: removeTrack,
        saveTrack,
        updateSavedTrack,
        setPlayerAsReady
    };
})();

function beforeTrackStart(track, id, scrollToTrack) {
    showTrackInfo(track);
    controls.showTrackDuration(track.duration);

    if (track.index !== -1) {
        showPlayingTrack(track.index, id, scrollToTrack);
    }
    scrollToTrack = false;
}

function onTrackStart(startTime) {
    const track = playlist.getCurrentTrack();
    const id = playlist.getActivePlaylistId();
    const time = {
        currentTime: startTime,
        duration: track.durationInSeconds
    };
    paused = false;

    beforeTrackStart(track, id, scrollToTrack);
    showActiveIcon(id);
    controls.togglePlayBtn(paused);
    storedTrack.saveTrack({
        playlistId: id,
        name: track.name
    });
    controls.elapsedTime.start(time);
}

function toggleTrackPlaying({ play, pause }) {
    if (paused) {
        play();
    }
    else {
        pause();
        removeActiveIcon();
        controls.elapsedTime.stop();
        controls.togglePlayBtn(!paused);
    }
    paused = !paused;
}

function togglePlaying(track) {
    let callbacks = null;

    if (track.player === "native") {
        callbacks = nPlayer.getPlayPauseCallbacks(track);
    }
    else if (track.player === "youtube") {
        callbacks = ytPlayer.getPlayPauseCallbacks();
    }
    else if (track.player === "soundcloud") {
        callbacks = scPlayer.getPlayPauseCallbacks();
    }
    toggleTrackPlaying(callbacks);
}

function playNewTrack(track, startTime) {
    const volume = getSetting("volume");

    playlist.setPlaybackIndex(track.index);

    if (track.player === "native") {
        nPlayer.playTrack(track, volume, startTime);
    }
    else if (track.player === "youtube") {
        ytPlayer.playTrack(track, volume, startTime);
    }
    else if (track.player === "soundcloud") {
        scPlayer.playTrack(track, volume, startTime);
    }
}

function playFirstTrack(source, sourceValue) {
    const id = getVisiblePlaylistId();

    if (id) {
        playlist.setPlaylistAsActive(id);
        play(source, sourceValue);
    }
}

function playTrack() {
    const currentTrack = playlist.getCurrentTrack();

    if (!currentTrack) {
        playFirstTrack("direction");
        return;
    }
    togglePlaying(currentTrack);
}

function playFromSource(pl, source, sourceValue) {
    let track = null;

    if (source === "index") {
        track = playlist.getTrack(pl.tracks[sourceValue]);
    }
    else if (source === "direction") {
        track = playlist.getNextTrack(pl, sourceValue);
        scrollToTrack = true;
    }
    if (!track) {

        // If playlist is empty reset player
        resetPlayer();
        return;
    }
    playNewTrack(track);
}

function play(source, sourceValue) {
    const currentTrack = playlist.getCurrentTrack();
    const id = playlist.getActivePlaylistId();

    if (!id) {
        return;
    }
    const pl = playlist.getPlaylistById(id);
    const shuffle = getSetting("shuffle");

    if (currentTrack) {
        stopTrack(currentTrack);
    }
    if (pl.shuffled !== shuffle) {
        playlist.shufflePlaybackOrder(pl, shuffle);
    }
    playFromSource(pl, source, sourceValue);
}

function playNextTrack() {
    play("direction", 1);
}

function playPreviousTrack() {
    play("direction", -1);
}

function stopTrack(track) {
    if (track.player === "native") {
        nPlayer.stopTrack(track);
    }
    else if (track.player === "youtube") {
        ytPlayer.stopTrack();
    }
    else if (track.player === "soundcloud") {
        scPlayer.stopTrack();
    }
}

function stopPlayer() {
    const currentTrack = playlist.getCurrentTrack();

    if (currentTrack) {
        stopTrack(currentTrack);
    }
    resetPlayer();
}

function resetPlayer() {
    paused = true;
    playlist.setCurrentTrack();
    playlist.setPlaylistAsActive();
    controls.resetTrackBar();
    controls.showTrackDuration();
    controls.togglePlayBtn(paused);
    removeActiveIcon();
    showTrackInfo();
    removeElementClass("track", "playing");
}

function toggleShuffle(shuffle) {
    const pl = playlist.getActivePlaylist();

    if (pl) {
        playlist.shufflePlaybackOrder(pl, shuffle);
    }
}

function setVolume(track, volume) {
    if (track.player === "native") {
        nPlayer.setVolume(volume, track);
    }
    else if (track.player === "youtube") {
        ytPlayer.setVolume(volume);
    }
    else if (track.player === "soundcloud") {
        scPlayer.setVolume(volume);
    }
}

function seekTo(track, percent) {
    const currentTime = Math.floor(track.durationInSeconds / 100 * percent);

    controls.elapsedTime.stop();
    if (track.player === "native") {
        nPlayer.seekTo(currentTime, track);
    }
    else if (track.player === "youtube") {
        ytPlayer.seekTo(currentTime);
    }
    else if (track.player === "soundcloud") {
        scPlayer.seekTo(currentTime);
    }
    controls.displayCurrentTime(currentTime);
}

document.getElementById("js-tab-container").addEventListener("dblclick", ({ target }) => {
    const element = getElementByAttr(target, "data-index");

    if (element) {
        playFirstTrack("index", element.attrValue);
    }
});

window.addEventListener("track-end", () => {
    if (!getSetting("repeat")) {
        playNextTrack();
        return;
    }
    playNewTrack(playlist.getCurrentTrack());
});

export {
    playTrack,
    playNextTrack,
    playPreviousTrack,
    stopPlayer,
    toggleShuffle,
    seekTo,
    setVolume,
    onTrackStart,
    storedTrack
};

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
    function getTrack() {
        return JSON.parse(localStorage.getItem("track")) || {};
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
            removeTrack();
            return;
        }
        playlist.setPlaylistAsActive(storedTrack.playlistId);
        controls.setTrackBarInnerWidth(storedTrack.elapsed);
        controls.displayCurrentTime(storedTrack.currentTime);
        beforeTrackStart(track);
        playNewTrack(track, storedTrack.currentTime);
    }

    return {
        get: getTrack,
        remove: removeTrack,
        saveTrack,
        updateSavedTrack,
        initTrack
    };
})();

function beforeTrackStart(track, scrollToTrack) {
    const id = getVisiblePlaylistId();

    showTrackInfo(track);
    controls.showTrackDuration(track.duration);

    if (id === track.playlistId && track.index !== -1) {
        showPlayingTrack(track.index, track.playlistId, scrollToTrack);
    }
    scrollToTrack = false;
}

function onTrackStart(startTime) {
    const track = playlist.getCurrentTrack();
    const time = {
        currentTime: startTime,
        duration: track.durationInSeconds
    };
    paused = false;

    beforeTrackStart(track, scrollToTrack);
    showActiveIcon(track.playlistId);
    controls.togglePlayBtn(paused);
    storedTrack.saveTrack({
        playlistId: track.playlistId,
        name: track.name,
        player: track.player
    });
    controls.elapsedTime.start(time);
}

function togglePlaying(track) {
    if (track.player === "native") {
        nPlayer.togglePlaying(paused, track);
    }
    else if (track.player === "youtube") {
        ytPlayer.togglePlaying(paused);
    }
    else if (track.player === "soundcloud") {
        scPlayer.togglePlaying(paused);
    }
    if (!paused) {
        removeActiveIcon();
        controls.elapsedTime.stop();
        controls.togglePlayBtn(!paused);
    }
    paused = !paused;
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

function stopTrack(track, once) {
    if (!once && track.player === "native") {
        nPlayer.stopTrack(track);
    }
    else if (track.player === "youtube") {
        ytPlayer.stopTrack();
    }
    else if (track.player === "soundcloud") {
        scPlayer.stopTrack();
    }
}

function stopPlayer(once) {
    const currentTrack = playlist.getCurrentTrack();

    if (currentTrack) {
        stopTrack(currentTrack, once);
    }
    resetPlayer(once);
}

function resetPlayer(once) {
    if (!once) {
        playlist.setCurrentTrack();
        playlist.setPlaylistAsActive();
        showTrackInfo();
    }
    paused = true;
    controls.resetTrackBar();
    controls.showTrackDuration();
    controls.togglePlayBtn(paused);
    removeActiveIcon();
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
    storedTrack.updateSavedTrack({
        elapsed: 0,
        currentTime: 0
    });

    if (getSetting("once")) {
        stopPlayer(true);
        return;
    }
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

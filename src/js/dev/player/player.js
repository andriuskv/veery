import { removeElementClass, getElementByAttr } from "./../main.js";
import { getActiveTabId } from "./../tab.js";
import * as settings from "./../settings.js";
import * as sidebar from "./../sidebar.js";
import * as playlist from "./../playlist/playlist.js";
import * as playlistView from "./../playlist/playlist.view.js";
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
        playlist.setPlaybackIndex(track.index);

        controls.setSliderElementWidth("track", storedTrack.elapsed);
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
    sidebar.showTrackInfo(track);
    controls.showTrackDuration(track.duration);
    if (track.index !== -1) {
        playlistView.showPlayingTrack(track.index, id, scrollToTrack);
    }
}

function onTrackStart(startTime, repeatCb) {
    const track = playlist.getCurrentTrack();
    const id = playlist.getActivePlaylistId();
    const time = {
        currentTime: startTime,
        duration: track.durationInSeconds
    };

    beforeTrackStart(track, id, scrollToTrack);
    sidebar.showActiveIcon(id);
    controls.addClassOnPlayBtn("icon-pause");
    paused = false;
    scrollToTrack = false;

    storedTrack.saveTrack({
        playlistId: id,
        name: track.name
    });
    controls.elapsedTime.start(time, onTrackEnd(repeatCb));
}

function onTrackEnd(repeatCb) {
    return function() {
        if (!settings.getSetting("repeat")) {
            playNextTrack(playlist.getCurrentTrack(), 1);
            return;
        }
        controls.resetTrackSlider();
        repeatCb();
    };
}

function toggleTrackPlaying({ play, pause }) {
    if (paused) {
        play();
    }
    else {
        pause();
        sidebar.removeActiveIcon();
        controls.elapsedTime.stop();
        controls.addClassOnPlayBtn("icon-play");
    }
    paused = !paused;
}

function playNewTrack(track, startTime) {
    const volume = settings.getSetting("volume");

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

function playTrack(track) {
    if (!track) {
        const id = getActiveTabId();

        if (playlist.getPlaylistById(id)) {
            playlist.setPlaylistAsActive(id);
            scrollToTrack = true;
            playTrackAtIndex(playlist.getNextTrackIndex(0), id);
        }
        return;
    }
    togglePlaying(track);
}

function playNextTrack(currentTrack, direction) {
    if (!currentTrack) {
        return;
    }
    stopTrack(currentTrack);

    const track = playlist.getNextTrack(direction);

    if (track) {
        scrollToTrack = true;
        playNewTrack(track);
    }
    else {

        // If playlist is empty reset player
        resetPlayer();
    }
}

function playTrackAtIndex(index, id) {
    const currentTrack = playlist.getCurrentTrack();
    const pl = playlist.getPlaylistById(id);
    const track = Object.assign({}, pl.tracks[index]);

    if (!paused || currentTrack) {
        if (track.player !== currentTrack.player) {
            stopPlayer(currentTrack);
        }
        else {
            stopTrack(currentTrack);
        }
    }

    if (!track.name) {
        return;
    }

    if (!pl.shuffled && settings.getSetting("shuffle")) {
        playlist.shufflePlaybackOrder(pl, true);
        playlist.resetPlaybackIndex();
    }
    else {
        playlist.setPlaybackIndex(track.index);
    }
    playNewTrack(track);
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

function stopPlayer(track) {
    if (track) {
        stopTrack(track);
    }
    resetPlayer();
}

function resetPlayer() {
    paused = true;
    removeElementClass("track", "playing");
    playlist.setCurrentTrack(null);
    controls.resetTrackSlider();
    controls.showTrackDuration();
    controls.addClassOnPlayBtn("icon-play");
    sidebar.removeActiveIcon();
    sidebar.showTrackInfo();
}

function toggleRepeat(repeat) {
    settings.setSetting("repeat", repeat);
}

function toggleShuffle(shuffle) {
    const pl = playlist.getPlaylistById(getActiveTabId());

    settings.setSetting("shuffle", shuffle);
    if (pl) {
        playlist.shufflePlaybackOrder(pl, shuffle);
        playlist.resetPlaybackIndex();
    }
}

function setVolume(track, volume) {
    if (track.player === "native") {
        nPlayer.setVolume(track, volume);
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
        const index = element.attrValue;
        const id = getActiveTabId();

        playlist.setPlaylistAsActive(id);
        playTrackAtIndex(index, id);
    }
});

export {
    toggleRepeat as repeat,
    toggleShuffle as shuffle,
    playTrack,
    playNextTrack,
    stopPlayer,
    seekTo,
    setVolume,
    onTrackStart,
    onTrackEnd,
    storedTrack
};

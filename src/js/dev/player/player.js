import { removeElementClass, getElementByAttr } from "./../main.js";
import * as settings from "./../settings.js";
import * as sidebar from "./../sidebar.js";
import * as playlist from "./../playlist/playlist.js";
import * as playlistView from "./../playlist/playlist.view.js";
import * as controls from "./player.controls.js";
import * as nPlayer from "./player.native.js";
import * as ytPlayer from "./player.youtube.js";
import * as scPlayer from "./player.soundcloud.js";

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
        controls.setElapsedTime(storedTrack.currentTime);
        beforeTrackStart(track, storedTrack.playlistId, true);
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

function beforeTrackStart(track, id, manual) {
    sidebar.showTrackInfo(track);
    controls.showTrackDuration(track.duration, false);
    if (track.index !== -1) {
        playlistView.showPlayingTrack(track.index, id, manual);
    }
}

function onTrackStart(time, repeatCb) {
    const track = playlist.getCurrentTrack();
    const id = playlist.getActivePlaylistId();
    const onTrackEndCbWithRepeat = onTrackEnd(repeatCb);

    beforeTrackStart(track, id, settings.get("manual"));
    sidebar.showActiveIcon(id);
    controls.addClassOnPlayBtn("icon-pause");
    settings.set("paused", false);
    settings.set("manual", false);

    storedTrack.saveTrack({
        playlistId: id,
        name: track.name
    });
    controls.elapsedTime.start(time, onTrackEndCbWithRepeat);
}

function onTrackEnd(repeatCb) {
    return function() {
        if (!settings.get("repeat")) {
            playNextTrack(playlist.getCurrentTrack(), 1);
            return;
        }
        controls.resetTrackSlider();
        repeatCb();
    };
}

function toggleTrackPlaying({ play, pause }) {
    const paused = settings.get("paused");

    if (paused) {
        settings.set("manual", true);
        play();
    }
    else {
        pause();
        sidebar.removeActiveIcon();
        controls.elapsedTime.stop();
        controls.addClassOnPlayBtn("icon-play");
    }
    settings.set("paused", !paused);
}

function playNewTrack(track, startTime) {
    const volume = settings.get("volume");

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
        const id = settings.get("activeTabId");

        if (playlist.getPlaylistById(id)) {
            playlist.setPlaylistAsActive(id);
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

    if (!settings.get("paused") || currentTrack) {
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

    if (!pl.shuffled && settings.get("shuffle")) {
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
    removeElementClass("track", "playing");
    settings.set("paused", true);
    playlist.setCurrentTrack(null);
    controls.resetTrackSlider();
    controls.showTrackDuration(0);
    controls.addClassOnPlayBtn("icon-play");
    sidebar.removeActiveIcon();
    sidebar.showTrackInfo();
}

function toggleRepeat(repeat) {
    settings.set("repeat", repeat);
}

function toggleShuffle(shuffle) {
    const pl = playlist.getPlaylistById(settings.get("activeTabId"));

    settings.set("shuffle", shuffle);
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
    let elapsed = 0;

    if (track.player === "native") {
        elapsed = nPlayer.getElapsed(track, percent);
    }
    else if (track.player === "youtube") {
        elapsed = ytPlayer.getElapsed(percent);
    }
    else if (track.player === "soundcloud") {
        elapsed = scPlayer.getElapsed(percent);
    }
    controls.setElapsedTime(elapsed);
}

document.getElementById("js-tab-container").addEventListener("dblclick", ({ target }) => {
    const element = getElementByAttr(target, "data-index");

    if (element) {
        const index = element.attrValue;
        const id = settings.get("activeTabId");

        settings.set("manual", true);
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

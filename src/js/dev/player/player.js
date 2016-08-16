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
    let storedTrack = JSON.parse(localStorage.getItem("track"));
    let initialized = false;

    function getTrack() {
        storedTrack = JSON.parse(localStorage.getItem("track"));
        return storedTrack;
    }

    function setTrack(track) {
        localStorage.setItem("track", JSON.stringify(track));
    }

    function removeTrack() {
        localStorage.removeItem("track");
    }

    function isInitialized() {
        return !storedTrack || initialized;
    }

    function initTrack() {
        if (isInitialized()) {
            return;
        }
        const track = playlist.findTrack(storedTrack.playlistId, storedTrack.name || storedTrack.title);
        initialized = true;

        if (!track) {
            return;
        }

        playlist.setActive(storedTrack.playlistId);
        playlist.setPlaybackIndex(track.index);

        controls.updateSlider("track", storedTrack.elapsed);
        controls.setElapsedTime(storedTrack.currentTime);
        beforeTrackStart(track, storedTrack.playlistId, true);

        const player = getPlayer(storedTrack.playlistId);

        settings.set("player", player);

        if (player === "native") {
            nPlayer.playTrack(track, storedTrack.currentTime);
        }
        else if (player === "soundcloud") {
            scPlayer.playTrack(track, storedTrack.currentTime);
        }
        else if (player === "youtube") {
            ytPlayer.queueTrack(track, storedTrack.currentTime);
        }
    }

    return {
        init: initTrack,
        set: setTrack,
        get: getTrack,
        remove: removeTrack,
        isInitialized
    };
})();

function beforeTrackStart(track, id, manual) {
    sidebar.showTrackInfo(track);
    controls.showTrackDuration(track.duration, false);
    if (track.index !== -1) {
        playlistView.showPlayingTrack(track.index, id, manual);
    }
}

function onTrackStart(time) {
    const track = playlist.getCurrentTrack();
    const id = playlist.getActivePlaylistId();

    beforeTrackStart(track, id, settings.get("manual"));
    sidebar.showActiveIcon(id);
    controls.addClassOnPlayBtn("icon-pause");
    settings.set("paused", false);
    settings.set("manual", false);

    return controls.elapsedTime.start({
        playlistId: id,
        name: track.name || track.title,
        duration: time.duration,
        currentTime: time.currentTime
    });
}

function onTrackEnd(repeatCb) {
    if (!settings.get("repeat")) {
        playNextTrack(1);
        return;
    }
    controls.resetTrackSlider();
    repeatCb();
}

function getPlayer(playlistId) {
    if (playlistId === "local-files") {
        return "native";
    }
    else if (playlistId.includes("yt-pl-")) {
        return "youtube";
    }
    else if (playlistId.includes("sc-pl-")) {
        return "soundcloud";
    }
}

function toggleTrackPlaying(playCb, pauseCb) {
    const paused = settings.get("paused");

    if (paused) {
        settings.set("manual", true);
        playCb();
    }
    else {
        pauseCb();
        sidebar.hideActiveIcon();
        controls.elapsedTime.stop();
        controls.addClassOnPlayBtn("icon-play");
    }
    settings.set("paused", !paused);
}

function playNewTrack(track, player) {
    if (player === "native") {
        nPlayer.playTrack(track);
    }
    else if (player === "youtube") {
        ytPlayer.playTrack(track);
    }
    else if (player === "soundcloud") {
        scPlayer.playTrack(track);
    }
}

function togglePlaying(player) {
    const track = playlist.getCurrentTrack();

    if (!track) {
        return;
    }

    if (player === "native") {
        nPlayer.togglePlaying(track);
    }
    else if (player === "youtube") {
        ytPlayer.togglePlaying();
    }
    else if (player === "soundcloud") {
        scPlayer.togglePlaying();
    }
}

function playTrack() {
    const player = settings.get("player");

    if (!player) {
        const id = settings.get("activeTabId");

        if (playlist.get(id)) {
            playlist.setActive(id);
            playTrackAtIndex(playlist.getNextTrackIndex(0), id);
        }
        return;
    }
    togglePlaying(player);
}

function playNextTrack(direction) {
    const player = settings.get("player");
    const currentTrack = playlist.getCurrentTrack();

    if (!player || !currentTrack) {
        return;
    }
    stopTrack(currentTrack, player);

    const track = playlist.getNextTrack(direction);

    if (track) {
        playNewTrack(track, player);
    }
    else {

        // If playlist is empty reset player
        resetPlayer();
    }
}

function playTrackAtIndex(index, id) {
    const currentTrack = playlist.getCurrentTrack();
    const player = getPlayer(id);
    const pl = playlist.get(id);
    const track = pl.tracks[index];

    if (!settings.get("paused") || currentTrack) {
        const currentPlayer = settings.get("player");

        if (player !== currentPlayer) {
            stopPlayer(currentTrack, currentPlayer);
        }
        else {
            stopTrack(currentTrack, currentPlayer);
        }
    }

    if (!track) {
        return;
    }
    settings.set("player", player);

    if (settings.get("shuffle") && !pl.shuffled) {
        playlist.shufflePlaybackOrder(pl, true);
        playlist.resetPlaybackIndex();
    }
    else {
        playlist.setPlaybackIndex(track.index);
    }
    playNewTrack(track, player);
}

function stopTrack(track, player) {
    if (!track) {
        return;
    }

    if (player === "native") {
        nPlayer.stop(track);
    }
    else if (player === "youtube") {
        ytPlayer.stop();
    }
    else if (player === "soundcloud") {
        scPlayer.stop();
    }
}

function stopPlayer(track = playlist.getCurrentTrack(), player = settings.get("player")) {
    stopTrack(track, player);

    if (player) {
        resetPlayer();
    }
}

function resetPlayer() {
    removeElementClass("track", "playing");
    settings.set("player", "");
    settings.set("paused", true);
    playlist.setCurrentTrack(null);
    controls.resetTrackSlider();
    controls.showTrackDuration(0);
    controls.addClassOnPlayBtn("icon-play");
    sidebar.hideActiveIcon();
    sidebar.showTrackInfo();
}

function toggleRepeat(repeat) {
    settings.set("repeat", repeat);
}

function toggleShuffle(shuffle) {
    const pl = playlist.getActive() || playlist.get(settings.get("activeTabId"));

    settings.set("shuffle", shuffle);
    if (pl) {
        playlist.shufflePlaybackOrder(pl, shuffle);
        playlist.resetPlaybackIndex();
    }
}

function setVolume(volume) {
    const player = settings.get("player");

    settings.set("volume", volume);
    if (player === "native") {
        nPlayer.setVolume(volume);
    }
    else if (player === "youtube") {
        ytPlayer.setVolume(volume);
    }
    else if (player === "soundcloud") {
        scPlayer.setVolume(volume);
    }
}

function seekTime(percent) {
    const player = settings.get("player");
    let elapsed = 0;

    if (player === "native") {
        elapsed = nPlayer.getElapsed(percent);
    }
    else if (player === "youtube") {
        elapsed = ytPlayer.getElapsed(percent);
    }
    else if (player === "soundcloud") {
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
        playlist.setActive(id);
        playTrackAtIndex(index, id);
    }
});

export {
    playTrack as play,
    playNextTrack as playNext,
    stopPlayer as stop,
    toggleRepeat as repeat,
    toggleShuffle as shuffle,
    seekTime as seek,
    toggleTrackPlaying,
    setVolume,
    onTrackStart,
    onTrackEnd,
    storedTrack
};

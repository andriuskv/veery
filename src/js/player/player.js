import {
    setTrackBarInnerWidth,
    setVolumeBarInnerWidth,
    displayCurrentTime,
    showTrackDuration,
    togglePlayPauseBtn,
    elapsedTime,
    resetTrackBar
} from "./player.controls.js";
import {
    getPlaylistById,
    getActivePlaylistId,
    setPlaylistAsActive,
    getActivePlaylist,
    setPlaybackOrder,
    findTrack,
    setCurrentTrack,
    getCurrentTrack,
    setPlaybackIndex,
    getTrack,
    getNextTrack
} from "../playlist/playlist.js";
import { removeElementClass, getElementById, getElementByAttr } from "../utils.js";
import { getVisiblePlaylistId } from "../tab.js";
import { setSetting, getSetting, removeSetting } from "../settings.js";
import { showTrackInfo, showActiveIcon, removeActiveIcon } from "../sidebar.js";
import { showTrack, toggleTrackPlayPauseBtn } from "../playlist/playlist.view.js";
import * as nPlayer from "./player.native.js";
import * as ytPlayer from "./player.youtube.js";
import * as scPlayer from "./player.soundcloud.js";

const tabContainer = getElementById("js-playlist-tabs");
let paused = true;
let scrollToTrack = false;

const storedTrack = (function() {
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
        const track = findTrack(storedTrack.playlistId, storedTrack.name);

        if (!track) {
            removeTrack();
            return;
        }
        setTrackBarInnerWidth(storedTrack.elapsed);
        displayCurrentTime(storedTrack.currentTime);
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

function getPlayerState() {
    return paused;
}

function beforeTrackStart(track) {
    const pl = getPlaylistById(track.playlistId);

    showTrackInfo(track);
    showTrackDuration(track.duration);

    if (pl.rendered && track.index !== -1) {
        showTrack(pl.id, track.index, { scrollToTrack });
    }
    scrollToTrack = false;
}

function onTrackStart(startTime) {
    const track = getCurrentTrack();

    paused = false;
    showActiveIcon(track.playlistId);
    togglePlayPauseBtn(paused);
    storedTrack.saveTrack({
        playlistId: track.playlistId,
        name: track.name,
        player: track.player
    });
    elapsedTime.start({
        currentTime: startTime,
        duration: track.durationInSeconds
    });
}

function togglePlaying(track) {
    if (track.player === "native") {
        nPlayer.togglePlaying(paused, track.audio);
    }
    else if (track.player === "youtube") {
        ytPlayer.togglePlaying(paused);
    }
    else if (track.player === "soundcloud") {
        scPlayer.togglePlaying(paused);
    }
    paused = !paused;

    if (paused) {
        removeActiveIcon();
        elapsedTime.stop();
        togglePlayPauseBtn(paused);
    }
    toggleTrackPlayPauseBtn(track, paused);
}

function playNewTrack(track, startTime) {
    const volume = getSetting("volume");

    setPlaylistAsActive(track.playlistId);
    setPlaybackIndex(track.index);
    setCurrentTrack(track);
    beforeTrackStart(track);

    if (track.player === "native") {
        nPlayer.playTrack(track.audioTrack, volume, startTime);
    }
    else if (track.player === "youtube") {
        ytPlayer.playTrack(track, volume, startTime);
    }
    else if (track.player === "soundcloud") {
        scPlayer.playTrack(track, volume, startTime);
    }
}

function playTrack() {
    const track = getCurrentTrack();

    if (!track) {
        play("direction", 0, getVisiblePlaylistId());
        return;
    }
    togglePlaying(track);
}

function play(source, sourceValue, id = getActivePlaylistId()) {
    const pl = getPlaylistById(id);
    const shuffle = getSetting("shuffle");
    const currentTrack = getCurrentTrack();
    let track = null;

    if (!pl) {
        return;
    }

    if (currentTrack) {
        resetTrackBar();
        toggleTrackPlayPauseBtn(currentTrack, true);
        stopTrack(currentTrack);
    }

    if (pl.shuffled !== shuffle) {
        setPlaybackOrder(pl, shuffle);
    }

    if (source === "index") {
        track = getTrack(pl.tracks[sourceValue]);
    }
    else if (source === "direction") {
        track = getNextTrack(pl, sourceValue);
        scrollToTrack = true;
    }

    if (!track) {

        // If playlist is empty reset player
        resetPlayer(currentTrack);
        return;
    }
    playNewTrack(track);
}

function playNextTrack() {
    play("direction", 1);
}

function playPreviousTrack() {
    play("direction", -1);
}

function playTrackFromElement({ target }) {
    const element = getElementByAttr(target, "data-index");

    if (element) {
        play("index", element.attrValue, getVisiblePlaylistId());
    }
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
    const track = getCurrentTrack();

    if (track) {
        stopTrack(track);
    }
    resetPlayer(track);
}

function resetPlayer(track) {
    paused = true;
    storedTrack.remove();
    resetTrackBar();
    showTrackDuration();
    showTrackInfo();
    setCurrentTrack();
    setPlaylistAsActive();
    togglePlayPauseBtn(paused);
    removeActiveIcon();
    removeElementClass("track", "playing");

    if (track) {
        toggleTrackPlayPauseBtn(track, paused);
    }
}

function onControlButtonClick(button) {
    switch (button) {
        case "previous":
            playPreviousTrack();
            break;
        case "play":
            playTrack();
            break;
        case "stop":
            stopPlayer();
            break;
        case "next":
            playNextTrack();
            break;
    }
}

function toggleShuffle(shuffle) {
    const pl = getActivePlaylist();

    if (pl) {
        setPlaybackOrder(pl, shuffle);
    }
}

function setVolume(track, volume) {
    if (track.player === "native") {
        nPlayer.setVolume(volume, track.audio);
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

    elapsedTime.stop();

    if (track.player === "native") {
        nPlayer.seekTo(currentTime, track.audio);
    }
    else if (track.player === "youtube") {
        ytPlayer.seekTo(currentTime);
    }
    else if (track.player === "soundcloud") {
        scPlayer.seekTo(currentTime);
    }
    displayCurrentTime(currentTime);
}

function mutePlayer(muted) {
    const track = getCurrentTrack();
    const newVolume = muted ? 0 : getSetting("volumeBeforeMute");

    if (muted) {
        const volume = getSetting("volume");

        setSetting("volumeBeforeMute", volume);
    }
    else {
        removeSetting("volumeBeforeMute");
    }
    setSetting("mute", muted);
    setSetting("volume", newVolume);
    setVolumeBarInnerWidth(newVolume);

    if (track) {
        setVolume(track, newVolume);
    }
}

tabContainer.addEventListener("dblclick", playTrackFromElement);

tabContainer.addEventListener("click", ({ target }) => {
    const element = getElementByAttr(target, "data-btn");

    if (element) {
        const trackElement = getElementByAttr(target, "data-index");
        const index = parseInt(trackElement.attrValue, 10);
        const track = getCurrentTrack();

        if (!track || index !== track.index) {
            play("index", index, getVisiblePlaylistId());
        }
        else {
            togglePlaying(track);
        }
    }
});

window.addEventListener("track-end", () => {
    if (getSetting("once")) {
        stopPlayer();
        return;
    }
    storedTrack.remove();

    if (getSetting("repeat")) {
        playNewTrack(getCurrentTrack());
        return;
    }
    playNextTrack();
});

export {
    getPlayerState,
    onControlButtonClick,
    stopPlayer,
    toggleShuffle,
    setVolume,
    seekTo,
    mutePlayer,
    onTrackStart,
    storedTrack
};

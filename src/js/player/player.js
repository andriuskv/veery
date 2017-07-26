import {
    updateTrackSlider,
    updateVolumeSliderThumb,
    showTrackDuration,
    togglePlayPauseBtn,
    elapsedTime,
    resetTrackSlider
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
import { showNowPlaying, showActiveIcon, removeActiveIcon } from "../sidebar.js";
import { showTrack, toggleTrackPlayPauseBtn } from "../playlist/playlist.view.js";
import * as nPlayer from "./player.native.js";
import * as ytPlayer from "./player.youtube.js";

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
        playNewTrack(track, storedTrack.currentTime);
        updateTrackSlider(storedTrack.currentTime);

        paused = true;
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

    showNowPlaying(track);
    showTrackDuration(track.duration, track.durationInSeconds);

    if (pl.rendered && track.index !== -1) {
        showTrack(pl.id, track.index, { scrollToTrack });
    }
    scrollToTrack = false;
    paused = false;
}

function togglePlayPauseBtns(track, isPaused) {
    const element = getElementById("js-play-btn");

    togglePlayPauseBtn(element, isPaused);
    toggleTrackPlayPauseBtn(track, isPaused);
}

function togglePlaying(track) {
    if (track.player === "native") {
        nPlayer.togglePlaying(paused, track.audio);
    }
    else if (track.player === "youtube") {
        ytPlayer.togglePlaying(paused);
    }
    paused = !paused;

    if (paused) {
        removeActiveIcon();
        elapsedTime.stop();
    }
    togglePlayPauseBtns(track, paused);
}

function playNewTrack(track, startTime) {
    const volume = getSetting("volume");

    setPlaylistAsActive(track.playlistId);
    setPlaybackIndex(track.index);
    setCurrentTrack(track);
    beforeTrackStart(track);

    if (!startTime) {
        togglePlayPauseBtns(track, paused);
    }

    if (track.player === "native") {
        nPlayer.playTrack(track.audioTrack, volume, startTime);
    }
    else if (track.player === "youtube") {
        ytPlayer.playTrack(track, volume, startTime);
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
        resetTrackSlider();
        togglePlayPauseBtns(currentTrack, true);
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
    const playPauseBtn = getElementByAttr("data-btn", target);

    if (playPauseBtn) {
        return;
    }
    const element = getElementByAttr("data-index", target);

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
}

function stopPlayer() {
    const track = getCurrentTrack();
    const element = getElementById("js-yt-player-container");

    if (track) {
        stopTrack(track);
    }

    if (element && element.classList.contains("visible")) {
        element.classList.remove("visible");
    }
    resetPlayer(track);
}

function resetPlayer(track) {
    paused = true;
    storedTrack.remove();
    showTrackDuration();
    showNowPlaying();
    setCurrentTrack();
    setPlaylistAsActive();
    removeActiveIcon();
    removeElementClass("track", "playing");

    if (track) {
        resetTrackSlider();
        togglePlayPauseBtns(track, paused);
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
}

function seekTo(track, currentTime) {
    elapsedTime.stop();

    if (track.player === "native") {
        nPlayer.seekTo(currentTime, track.audio);
    }
    else if (track.player === "youtube") {
        ytPlayer.seekTo(currentTime);
    }
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
    updateVolumeSliderThumb(newVolume);

    if (track) {
        setVolume(track, newVolume);
    }
}

tabContainer.addEventListener("dblclick", playTrackFromElement);

tabContainer.addEventListener("click", ({ target }) => {
    const element = getElementByAttr("data-btn", target);

    if (!element) {
        return;
    }
    const { attrValue } = getElementByAttr("data-index", element.elementRef);
    const index = parseInt(attrValue, 10);
    const track = getCurrentTrack();
    const id = getVisiblePlaylistId();

    if (!track || track.playlistId !== id || index !== track.index) {
        play("index", index, id);
    }
    else {
        togglePlaying(track);
    }
});

window.addEventListener("track-start", ({ detail: startTime }) => {
    const track = getCurrentTrack();

    showActiveIcon(track.playlistId);
    storedTrack.saveTrack({
        playlistId: track.playlistId,
        name: track.name,
        player: track.player
    });
    elapsedTime.start({
        currentTime: Math.floor(startTime),
        duration: track.durationInSeconds
    });
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
    togglePlaying,
    onControlButtonClick,
    stopPlayer,
    toggleShuffle,
    setVolume,
    seekTo,
    mutePlayer,
    storedTrack
};

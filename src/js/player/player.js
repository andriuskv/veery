import {
    updateVolume,
    updateTrackSlider,
    showTrackDuration,
    togglePlayPauseBtn,
    elapsedTime,
    resetTrackSlider,
    showPlayPauseBtnSpinner,
    hidePlayPauseBtnSpinner
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
import { removeElementClass, getElementById, getElementByAttr, getImage } from "../utils.js";
import { getVisiblePlaylistId } from "../tab.js";
import { setSetting, getSetting, removeSetting } from "../settings.js";
import { showActiveIcon, removeActiveIcon } from "../sidebar.js";
import { togglePanel } from "../panels.js";
import { showTrack, toggleTrackPlayPauseBtn } from "../playlist/playlist.view.js";
import { showNowPlaying, removeNowPlaying } from "./player.now-playing.js";
import * as nPlayer from "./player.native.js";
import * as ytPlayer from "./player.youtube.js";

const tabContainer = getElementById("js-playlist-tabs");
let isPaused = true;
let scrollToTrack = false;

const storedTrack = (function() {
    function getTrack() {
        return JSON.parse(localStorage.getItem("track")) || {};
    }

    function saveTrack(track) {
        localStorage.setItem("track", JSON.stringify(track));
    }

    function updateTrack(track) {
        saveTrack(Object.assign(getTrack(), track));
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
        updateTrackSlider(track, storedTrack.currentTime);

        isPaused = true;
    }

    return {
        getTrack,
        removeTrack,
        saveTrack,
        updateTrack,
        initTrack
    };
})();

function getPlayerState() {
    return isPaused;
}

function updatePlayerState(state, track) {
    isPaused = state;

    if (isPaused) {
        removeActiveIcon();
        elapsedTime.stop();
    }
    togglePlayPauseBtns(track, isPaused);
}

function updateTrackMedia(track) {
    const ytPlayer = getElementById("js-yt-player");
    const ytPlayerWatch = getElementById("js-yt-player-watch");
    const image = getElementById("js-media-image");

    if (track.player === "youtube") {
        ytPlayer.classList.remove("hidden");
        ytPlayerWatch.classList.remove("hidden");
        image.classList.add("hidden");
        ytPlayerWatch.setAttribute("href", `https://www.youtube.com/watch?v=${track.id}`);
    }
    else {
        ytPlayer.classList.add("hidden");
        ytPlayerWatch.classList.add("hidden");
        image.classList.remove("hidden");
        image.src = getImage(track.thumbnail);
    }
}

function beforeTrackStart(track) {
    const pl = getPlaylistById(track.playlistId);

    showNowPlaying(track);
    showTrackDuration(track.duration, track.durationInSeconds);
    updateTrackMedia(track);

    if (pl.rendered && track.index !== -1) {
        showTrack(pl.id, track.index, { scrollToTrack });
    }
    scrollToTrack = false;
    isPaused = false;
}

function togglePlayPauseBtns(track, isPaused) {
    const element = getElementById("js-play-btn");

    togglePlayPauseBtn(element, isPaused);
    toggleTrackPlayPauseBtn(track, isPaused);
}

function togglePlaying(track) {
    if (track.player === "native") {
        nPlayer.togglePlaying(isPaused, track.audio);
    }
    else if (track.player === "youtube") {
        ytPlayer.togglePlaying(isPaused);
    }
    updatePlayerState(!isPaused, track);
}

function playNewTrack(track, startTime) {
    const volume = getSetting("volume");

    setPlaylistAsActive(track.playlistId);
    setPlaybackIndex(track.index);
    setCurrentTrack(track);
    beforeTrackStart(track);

    if (typeof startTime === "undefined") {
        showPlayPauseBtnSpinner(track);
        togglePlayPauseBtns(track, isPaused);
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
        ytPlayer.stopTrack(track);
    }
}

function stopPlayer(track) {
    const element = getElementById("js-media-container");

    if (track) {
        stopTrack(track);
    }
    element.classList.remove("visible");
    resetPlayer(track);
}

function resetPlayer(track) {
    isPaused = true;
    storedTrack.removeTrack();
    showTrackDuration();
    removeNowPlaying();
    setCurrentTrack();
    setPlaylistAsActive();
    removeActiveIcon();
    removeElementClass("track", "playing");

    if (track) {
        resetTrackSlider();
        hidePlayPauseBtnSpinner(track);
        togglePlayPauseBtns(track, isPaused);
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

function setVolume(volume) {
    const track = getCurrentTrack() || {};

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
    const volume = muted ? 0 : getSetting("volumeBeforeMute");

    if (muted) {
        setSetting("volumeBeforeMute", getSetting("volume"));
    }
    else {
        removeSetting("volumeBeforeMute");
    }
    updateVolume(volume);
}

function getPlayerMessageCb(title, body) {
    return (id, { element }) => {
        element.insertAdjacentHTML("beforeend", `
            <div id="${id}" class="panel player-message">
                <p class="play-message-title">${title}</p>
                <p class="play-message-body">${body}</p>
            </div>
        `);
    };
}

function showPlayerMessage({ title, body }) {
    const createPlayerMessage = getPlayerMessageCb(title, body);

    togglePanel("js-player-message", createPlayerMessage, {
        element: document.querySelector(".player"),
        removeOnClick: true
    });
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
        durationInSeconds: track.durationInSeconds,
        duration: track.duration
    });
    hidePlayPauseBtnSpinner(track);
});

window.addEventListener("track-end", () => {
    const track = getCurrentTrack();

    if (getSetting("once")) {
        stopPlayer(track);
        return;
    }
    storedTrack.removeTrack();

    if (getSetting("repeat")) {
        playNewTrack(track);
        return;
    }
    playNextTrack();
});

export {
    getPlayerState,
    updatePlayerState,
    togglePlaying,
    onControlButtonClick,
    stopPlayer,
    toggleShuffle,
    setVolume,
    seekTo,
    mutePlayer,
    storedTrack,
    showPlayerMessage
};

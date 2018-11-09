import {
    updateTrackSlider,
    showTrackDuration,
    togglePlayPauseBtn,
    elapsedTime,
    resetTrackSlider,
    showPlayPauseBtnSpinner,
    hidePlayPauseBtnSpinner,
    showTrackSlider,
    hideTrackSlider
} from "./player.controls.js";
import {
    getPlaylistById,
    getActivePlaylistId,
    getPlaylistState,
    setPlaylistAsActive,
    setPlaybackOrder,
    findTrack,
    setCurrentTrack,
    getCurrentTrack,
    setPlaybackIndex,
    cloneTrack,
    getNextTrack
} from "../playlist/playlist.js";
import { getElementByAttr } from "../utils.js";
import { getVisiblePlaylistId } from "../tab.js";
import { getSetting } from "../settings.js";
import { showActiveIcon, removeActiveIcon } from "../sidebar.js";
import { showTrack, toggleTrackPlayPauseBtn, removePlayingClass } from "../playlist/playlist.view.js";
import { showTrackInfo, resetTrackInfo } from "./player.now-playing.js";
import * as nPlayer from "./player.native.js";
import * as ytPlayer from "./player.youtube.js";

let isPaused = true;

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
        const track = cloneTrack(findTrack(storedTrack.playlistId, storedTrack.name));

        if (!track) {
            removeTrack();
            return;
        }
        playNewTrack(track, { startTime: storedTrack.currentTime });
        updateTrackSlider(track, storedTrack.currentTime);
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

function updatePlayerState(track, state) {
    isPaused = typeof state === "boolean" ? state : !isPaused;

    if (isPaused) {
        removeActiveIcon();
        elapsedTime.stop();
    }
    togglePlayPauseBtns(track, isPaused);
    updateDocumentTitle();
}

function beforeTrackStart(track, { scrollToTrack, startTime }) {
    const { rendered } = getPlaylistState(track.playlistId);

    showTrackInfo(track);
    showTrackDuration(track.duration, track.durationInSeconds);
    showTrackSlider();
    setPlaylistAsActive(track.playlistId);
    setPlaybackIndex(track.index);
    setCurrentTrack(track);

    if (rendered && track.index !== -1) {
        showTrack(track, scrollToTrack);
    }

    if (typeof startTime === "undefined") {
        isPaused = false;

        updateDocumentTitle();
        showPlayPauseBtnSpinner(track);
        togglePlayPauseBtns(track, isPaused);
    }
    else {
        isPaused = true;
    }
}

function togglePlayPauseBtns(track, isPaused) {
    const element = document.getElementById("js-play-btn");

    togglePlayPauseBtn(element, isPaused);
    toggleTrackPlayPauseBtn(track, isPaused);
}

function togglePlaying(track) {
    if (track.player === "native") {
        nPlayer.togglePlaying(isPaused);
    }
    else if (track.player === "youtube") {
        ytPlayer.togglePlaying(isPaused);
    }
    updatePlayerState(track);
}

function playNewTrack(track, options = {}) {
    const volume = getSetting("volume");

    beforeTrackStart(track, options);

    if (track.player === "native") {
        nPlayer.playTrack(track.audioTrack, volume, options.startTime);
    }
    else if (track.player === "youtube") {
        ytPlayer.playTrack(track, volume, options.startTime);
    }
}

function playTrack() {
    const track = getCurrentTrack();

    if (track) {
        togglePlaying(track);
    }
    else {
        play("direction", 0, getVisiblePlaylistId());
    }
}

function play(source, sourceValue, id) {
    if (!id) {
        return;
    }
    const shuffle = getSetting("shuffle");
    const currentTrack = getCurrentTrack();
    const { shuffled } = getPlaylistState(id);
    let alreadyShuffled = false;

    if (currentTrack) {
        removePlayingClass(currentTrack.element);
        resetTrackSlider();
        toggleTrackPlayPauseBtn(currentTrack, true);
        stopTrack(currentTrack);
    }

    if (shuffled !== shuffle) {
        alreadyShuffled = true;
        setPlaybackOrder(id, shuffle);
    }

    if (source === "index") {
        const { tracks } = getPlaylistById(id);

        if (!alreadyShuffled && shuffle) {
            setPlaybackOrder(id, shuffle);
        }
        playNewTrack(cloneTrack(tracks[sourceValue]));
    }
    else if (source === "direction") {
        const track = getNextTrack(id, sourceValue);

        if (track) {
            playNewTrack(track, { scrollToTrack: true });
        }
        else {
            // If playlist is empty reset player
            resetPlayer(currentTrack);
        }
    }
}

function playNextTrack() {
    play("direction", 1, getActivePlaylistId());
}

function playPreviousTrack() {
    play("direction", -1, getActivePlaylistId());
}

function playTrackFromElement({ currentTarget, detail, target }) {
    const id = getVisiblePlaylistId();
    const element = getElementByAttr("data-btn", target, currentTarget);
    const trackElement = getElementByAttr("data-index", target, currentTarget);

    if (detail === 2 && trackElement && !element) {
        play("index", trackElement.attrValue, id);
    }
    else if (element) {
        const index = parseInt(trackElement.attrValue, 10);
        const track = getCurrentTrack();

        if (!track || track.playlistId !== id || index !== track.index) {
            play("index", index, id);
        }
        else {
            togglePlaying(track);
        }
    }
}

function stopTrack(track) {
    if (track.player === "native") {
        nPlayer.stopTrack();
    }
    else if (track.player === "youtube") {
        ytPlayer.stopTrack(track);
    }
}

function stopPlayer(track) {
    if (track) {
        stopTrack(track);
    }
    resetPlayer(track);
}

function resetPlayer(track) {
    isPaused = true;
    storedTrack.removeTrack();
    showTrackDuration();
    hideTrackSlider();
    resetTrackInfo();
    setCurrentTrack();
    setPlaylistAsActive();
    removeActiveIcon();

    if (track) {
        removePlayingClass(track.element);
        resetTrackSlider();
        hidePlayPauseBtnSpinner(track);
        togglePlayPauseBtns(track, isPaused);
    }
}

function setVolume(volume) {
    const track = getCurrentTrack() || {};

    if (track.player === "native") {
        nPlayer.setVolume(volume);
    }
    else if (track.player === "youtube") {
        ytPlayer.setVolume(volume);
    }
}

function seekTo(player, currentTime) {
    elapsedTime.stop();

    if (player === "native") {
        nPlayer.seekTo(currentTime);
    }
    else if (player === "youtube") {
        ytPlayer.seekTo(currentTime);
    }
}

function updateDocumentTitle(id = getVisiblePlaylistId()) {
    const isPlayerPaused = getPlayerState();
    const pl = getPlaylistById(id);
    let documentTitle = "Veery";

    if (!isPlayerPaused) {
        const { artist, name, title } = getCurrentTrack();
        documentTitle = `${artist && title ? `${artist} - ${title}` : name} | ${documentTitle}`;
    }
    else if (pl) {
        documentTitle = `${pl.title} | ${documentTitle}`;
    }
    document.title = documentTitle;
}

window.addEventListener("track-start", ({ detail: startTime }) => {
    const track = getCurrentTrack();

    showActiveIcon(track.playlistId);
    storedTrack.saveTrack({
        name: track.name,
        playlistId: track.playlistId
    });
    elapsedTime.start({
        currentTime: Math.floor(startTime),
        duration: track.duration,
        durationInSeconds: track.durationInSeconds
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
    playPreviousTrack,
    playTrack,
    playNextTrack,
    playTrackFromElement,
    stopPlayer,
    setVolume,
    seekTo,
    storedTrack,
    updateDocumentTitle
};

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
    setPlaylistAsActive,
    setPlaybackOrder,
    findTrack,
    setCurrentTrack,
    getCurrentTrack,
    setPlaybackIndex,
    getTrack,
    getNextTrack
} from "../playlist/playlist.js";
import { removeElementClass, getElementByAttr } from "../utils.js";
import { getVisiblePlaylistId } from "../tab.js";
import { getSetting } from "../settings.js";
import { showActiveIcon, removeActiveIcon } from "../sidebar.js";
import { showTrack, toggleTrackPlayPauseBtn } from "../playlist/playlist.view.js";
import { showTrackInfo, resetTrackInfo } from "./player.now-playing.js";
import * as nPlayer from "./player.native.js";
import * as ytPlayer from "./player.youtube.js";

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

function updatePlayerState(track, state) {
    isPaused = typeof state === "boolean" ? state : !isPaused;

    if (isPaused) {
        removeActiveIcon();
        elapsedTime.stop();
    }
    togglePlayPauseBtns(track, isPaused);
    updateDocumentTitle();
}

function beforeTrackStart(track) {
    const pl = getPlaylistById(track.playlistId);

    showTrackInfo(track);
    showTrackDuration(track.duration, track.durationInSeconds);
    showTrackSlider();

    if (pl.rendered && track.index !== -1) {
        showTrack(pl.id, track.index, { scrollToTrack });
    }
    scrollToTrack = false;
    isPaused = false;
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

function playNewTrack(track, startTime) {
    const volume = getSetting("volume");

    setPlaylistAsActive(track.playlistId);
    setPlaybackIndex(track.index);
    setCurrentTrack(track);
    beforeTrackStart(track);

    if (typeof startTime === "undefined") {
        updateDocumentTitle();
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

function play(source, sourceValue, id) {
    const pl = getPlaylistById(id);
    const shuffle = getSetting("shuffle");
    const currentTrack = getCurrentTrack();
    let track = null;
    let shuffled = false;

    if (!pl) {
        return;
    }

    if (currentTrack) {
        resetTrackSlider();
        toggleTrackPlayPauseBtn(currentTrack, true);
        stopTrack(currentTrack);
    }

    if (pl.shuffled !== shuffle) {
        shuffled = true;
        setPlaybackOrder(pl, shuffle);
    }

    if (source === "index") {
        if (!shuffled && pl.shuffled) {
            setPlaybackOrder(pl, pl.shuffled);
        }
        track = getTrack(pl.tracks[sourceValue]);
    }
    else if (source === "direction") {
        track = getNextTrack(pl, sourceValue);

        if (!track) {
            // If playlist is empty reset player
            resetPlayer(currentTrack);
            return;
        }
        scrollToTrack = true;
    }
    playNewTrack(track);
}

function playNextTrack() {
    play("direction", 1, getActivePlaylistId());
}

function playPreviousTrack() {
    play("direction", -1, getActivePlaylistId());
}

function playTrackFromElement({ currentTarget, detail, target }) {
    const id = currentTarget.id.split("js-tab-")[1];
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
    removeElementClass(".track.playing", "playing");

    if (track) {
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
        documentTitle = `${artist && title ? `${artist} - ${title}` : name} | Veery`;
    }
    else if (pl) {
        documentTitle = `${pl.title} | Veery`;
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

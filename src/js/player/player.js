import { removeElementClass, getElementByAttr } from "./../main.js";
import { getVisiblePlaylistId } from "./../tab.js";
import { setSetting, getSetting, removeSetting } from "./../settings.js";
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
        controls.setTrackBarInnerWidth(storedTrack.elapsed);
        controls.displayCurrentTime(storedTrack.currentTime);
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

function beforeTrackStart(track) {
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

    paused = false;
    showActiveIcon(track.playlistId);
    controls.togglePlayBtn(paused);
    storedTrack.saveTrack({
        playlistId: track.playlistId,
        name: track.name,
        player: track.player
    });
    controls.elapsedTime.start({
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
    if (!paused) {
        removeActiveIcon();
        controls.elapsedTime.stop();
        controls.togglePlayBtn(!paused);
    }
    paused = !paused;
}

function playNewTrack(track, startTime) {
    const volume = getSetting("volume");

    playlist.setPlaylistAsActive(track.playlistId);
    playlist.setPlaybackIndex(track.index);
    playlist.setCurrentTrack(track);
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
    const track = playlist.getCurrentTrack();

    if (!track) {
        play("direction", 0, getVisiblePlaylistId());
        return;
    }
    togglePlaying(track);
}

function play(source, sourceValue, id = playlist.getActivePlaylistId()) {
    const pl = playlist.getPlaylistById(id);
    const shuffle = getSetting("shuffle");
    const currentTrack = playlist.getCurrentTrack();
    let track = null;

    if (!pl) {
        return;
    }

    if (currentTrack) {
        controls.resetTrackBar();
        stopTrack(currentTrack);
    }

    if (pl.shuffled !== shuffle) {
        playlist.shufflePlaybackOrder(pl, shuffle);
    }

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
    const track = playlist.getCurrentTrack();

    if (track) {
        stopTrack(track, once);
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
    storedTrack.remove();
    controls.resetTrackBar();
    controls.showTrackDuration();
    controls.togglePlayBtn(paused);
    removeActiveIcon();
    removeElementClass("track", "playing");
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
    const pl = playlist.getActivePlaylist();

    if (pl) {
        playlist.shufflePlaybackOrder(pl, shuffle);
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

    controls.elapsedTime.stop();
    if (track.player === "native") {
        nPlayer.seekTo(currentTime, track.audio);
    }
    else if (track.player === "youtube") {
        ytPlayer.seekTo(currentTime);
    }
    else if (track.player === "soundcloud") {
        scPlayer.seekTo(currentTime);
    }
    controls.displayCurrentTime(currentTime);
}

function mutePlayer(muted) {
    const track = playlist.getCurrentTrack();
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
    controls.setVolumeBarInnerWidth(newVolume);

    if (track) {
        setVolume(track, newVolume);
    }
}

(function () {
    const tabContainer = document.getElementById("js-tab-container");

    function getTouchCoords(touch) {
        return {
            x: Math.floor(touch.clientX),
            y: Math.floor(touch.clientY)
        };
    }

    if (window.innerWidth < 600) {
        let touchStartCoords = {};

        tabContainer.addEventListener("touchstart", event => {
            touchStartCoords = getTouchCoords(event.changedTouches[0]);
        });

        tabContainer.addEventListener("touchend", event => {
            const { x, y } = getTouchCoords(event.changedTouches[0]);

            if (touchStartCoords.x === x && touchStartCoords.y === y) {
                playTrackFromElement(event);
            }
        });
    }
    tabContainer.addEventListener("dblclick", playTrackFromElement);
})();

window.addEventListener("track-end", () => {
    if (getSetting("once")) {
        stopPlayer(true);
        return;
    }
    storedTrack.remove();

    if (!getSetting("repeat")) {
        playNextTrack();
        return;
    }
    playNewTrack(playlist.getCurrentTrack());
});

export {
    onControlButtonClick,
    stopPlayer,
    toggleShuffle,
    setVolume,
    seekTo,
    mutePlayer,
    onTrackStart,
    storedTrack
};

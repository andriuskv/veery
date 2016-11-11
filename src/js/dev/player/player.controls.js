import { setSetting, getSetting } from "./../settings.js";
import { capitalize, formatTime, dispatchEvent } from "./../main.js";
import { getCurrentTrack } from "./../playlist/playlist.js";
import * as player from "./player.js";

let seeking = false;
const elapsedTime = (function() {
    let timeout = 0;

    function stop() {
        if (timeout) {
            clearTimeout(timeout);
        }
    }

    function updateTrackSlider(track, startTime, elapsed) {
        const ideal = performance.now() - startTime;
        const diff = ideal - elapsed;

        displayCurrentTime(track.currentTime);
        if (!seeking) {
            const elapsedInPercentage = track.currentTime / track.duration * 100;

            setTrackBarInnerWidth(elapsedInPercentage);
            player.storedTrack.updateSavedTrack({
                elapsed: elapsedInPercentage,
                currentTime: track.currentTime
            });
        }
        timeout = setTimeout(() => {
            if (track.currentTime < track.duration) {
                track.currentTime += 1;
                elapsed += 1000;
                updateTrackSlider(track, startTime, elapsed);
            }
            else {
                dispatchEvent("track-end");
            }
        }, 1000 - diff);
    }

    function start(track) {
        const startTime = performance.now();

        stop();
        updateTrackSlider(track, startTime, 0);
    }

    return { stop, start };
})();

function togglePlayBtnClasses(nextAction, prevAction) {
    const playBtn = document.getElementById("js-play-btn");

    playBtn.classList.remove(`icon-${prevAction}`);
    playBtn.classList.add(`icon-${nextAction}`);
    playBtn.setAttribute("title", capitalize(nextAction));
}

function togglePlayBtn(paused) {
    let nextAction = "pause";
    let prevAction = "play";

    if (paused) {
        nextAction = "play";
        prevAction = "pause";
    }
    togglePlayBtnClasses(nextAction, prevAction);
}

function getElapsedValue(bar, pageX) {
    const element = document.getElementById(`js-${bar}-bar`);
    const { left, width } = element.getBoundingClientRect();
    let value = (pageX - left) / width;

    if (value < 0) {
        value = 0;
    }
    else if (value > 1) {
        value = 1;
    }
    return value * 100;
}

function getTrackElapsedValue(pageX) {
    return getElapsedValue("track", pageX);
}

function resetTrackBar() {
    elapsedTime.stop();
    displayCurrentTime();
    setTrackBarInnerWidth();
}

function onVolumeTrackMousemove(event) {
    const volumeInPercentage = getElapsedValue("volume", event.pageX);
    const volume = volumeInPercentage / 100;
    const track = getCurrentTrack();

    setVolumeBarInnerWidth(volumeInPercentage);
    setSetting("volume", volume);

    if (track) {
        player.setVolume(track, volume);
    }
}

function onVolumeTrackMouseup() {
    document.removeEventListener("mousemove", onVolumeTrackMousemove);
    document.removeEventListener("mouseup", onVolumeTrackMouseup);
}

function setBarInnerWidth(bar, percent = 0) {
    document.getElementById(`js-${bar}-bar-inner`).style.width = `${percent}%`;
}

function setTrackBarInnerWidth(percent) {
    setBarInnerWidth("track", percent);
}

function setVolumeBarInnerWidth(percent) {
    setBarInnerWidth("volume", percent);
}

function displayCurrentTime(time = 0) {
    document.getElementById("js-track-current").textContent = formatTime(time);
}

function showTrackDuration(duration = "0:00") {
    document.getElementById("js-track-duration").textContent = duration;
}

function onPlayerTrackMousemove({ pageX }) {
    setTrackBarInnerWidth(getTrackElapsedValue(pageX));
}

function onPlayerTrackMouseup({ pageX }) {
    const track = getCurrentTrack();

    if (track) {
        player.seekTo(track, getTrackElapsedValue(pageX));
    }
    seeking = false;
    document.removeEventListener("mousemove", onPlayerTrackMousemove);
    document.removeEventListener("mouseup", onPlayerTrackMouseup);
}

document.getElementById("js-track-bar").addEventListener("mousedown", event => {
    if (event.which !== 1 || !getCurrentTrack()) {
        return;
    }
    seeking = true;
    onPlayerTrackMousemove(event);
    document.addEventListener("mousemove", onPlayerTrackMousemove);
    document.addEventListener("mouseup", onPlayerTrackMouseup);
});

document.getElementById("js-volume-bar").addEventListener("mousedown", event => {
    if (event.which !== 1) {
        return;
    }
    onVolumeTrackMousemove(event);
    document.addEventListener("mousemove", onVolumeTrackMousemove);
    document.addEventListener("mouseup", onVolumeTrackMouseup);
});

document.getElementById("js-controls").addEventListener("click", ({ target }) => {
    const item = target.getAttribute("data-control-item");

    switch (item) {
        case "previous":
            player.playPreviousTrack();
            break;
        case "play":
            player.playTrack();
            break;
        case "stop":
            player.stopPlayer();
            player.storedTrack.remove();
            break;
        case "next":
            player.playNextTrack();
            break;
        case "repeat":
            target.classList.toggle("active");
            setSetting(item, !getSetting(item));
            break;
        case "shuffle":
            target.classList.toggle("active");
            setSetting(item, !getSetting(item));
            player.toggleShuffle(!getSetting(item));
            break;
    }
});

window.addEventListener("DOMContentLoaded", function onLoad() {
    const repeat = getSetting("repeat");
    const shuffle = getSetting("shuffle");
    const volume = getSetting("volume");

    if (repeat) {
        document.querySelector(`[data-control-item="repeat"]`).classList.add("active");
    }
    if (shuffle) {
        document.querySelector(`[data-control-item="shuffle"]`).classList.add("active");
    }
    setVolumeBarInnerWidth(volume * 100);
    window.removeEventListener("DOMContentLoaded", onLoad);
});

export {
    elapsedTime,
    togglePlayBtn,
    setTrackBarInnerWidth,
    displayCurrentTime,
    showTrackDuration,
    resetTrackBar
};

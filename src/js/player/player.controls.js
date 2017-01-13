import { setSetting, getSetting } from "./../settings.js";
import { formatTime, dispatchCustomEvent } from "./../main.js";
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
                dispatchCustomEvent("track-end");
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

function togglePlayBtn(paused) {
    const playBtn = document.getElementById("js-play-btn");

    if (paused) {
        playBtn.classList.remove("icon-pause");
    }
    else {
        playBtn.classList.add("icon-pause");
    }
    playBtn.setAttribute("title", paused ? "Play": "Pause");
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

    if (item === "repeat" || item === "shuffle" || item === "once") {
        const itemSetting = getSetting(item);

        target.classList.toggle("active");
        setSetting(item, !itemSetting);

        if (item === "shuffle") {
            player.toggleShuffle(!itemSetting);
        }
    }
    else if (item === "volume") {
        target.classList.toggle("active");
        document.getElementById("js-volume-bar-container").classList.toggle("visible");
    }
    else {
        player.onControlButtonClick(item);
    }
});

function toggleSetting(settingName) {
    const setting = getSetting(settingName);

    if (setting) {
        document.querySelector(`[data-control-item="${settingName}"]`).classList.add("active");
    }
}

window.addEventListener("DOMContentLoaded", function onLoad() {
    const volume = getSetting("volume");

    toggleSetting("repeat");
    toggleSetting("shuffle");
    toggleSetting("once");
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

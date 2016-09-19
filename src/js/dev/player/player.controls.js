import * as settings from "./../settings.js";
import * as player from "./player.js";
import { formatTime } from "./../main.js";
import { getCurrentTrack } from "./../playlist/playlist.js";

let seeking = false;
const elapsedTime = (function() {
    let timeout = 0;

    function stop() {
        if (timeout) {
            clearTimeout(timeout);
        }
    }

    function updateTrackSlider(track, startTime, elapsed, trackEndCb) {
        const ideal = performance.now() - startTime;
        const diff = ideal - elapsed;

        setElapsedTime(track.currentTime);
        if (!seeking) {
            const elapsedInPercentage = track.currentTime / track.duration * 100;

            setSliderElementWidth("track", elapsedInPercentage);
            player.storedTrack.updateSavedTrack({
                elapsed: elapsedInPercentage,
                currentTime: track.currentTime
            });
        }
        timeout = setTimeout(() => {
            if (track.currentTime < track.duration) {
                track.currentTime += 1;
                elapsed += 1000;
                updateTrackSlider(track, startTime, elapsed, trackEndCb);
            }
            else {
                trackEndCb();
            }
        }, 1000 - diff);
    }

    function update(track, trackEndCb) {
        const startTime = performance.now();

        updateTrackSlider(track, startTime, 0, trackEndCb);
    }

    function start(track, onTrackEnd) {
        stop();
        update(track, onTrackEnd);
    }

    return { stop, start };
})();

function addClassOnPlayBtn(classToAdd) {
    const playBtn = document.getElementById("js-player-play");
    let classToRemove = "";
    let btnTitle = "";

    if (classToAdd === "icon-play") {
        classToRemove = "icon-pause";
        btnTitle = "Play";
    }
    else if (classToAdd === "icon-pause") {
        classToRemove = "icon-play";
        btnTitle = "Pause";
    }
    playBtn.classList.remove(classToRemove);
    playBtn.classList.add(classToAdd);
    playBtn.setAttribute("title", btnTitle);
}

function togglePlayBtnClass(paused) {
    const iconClassName = paused ? "icon-play" : "icon-pause";

    addClassOnPlayBtn(iconClassName);
}

function getElapsedValue(slider, screenX) {
    const trackSlider = document.getElementById(`js-player-${slider}-slider`);
    const { left, width } = trackSlider.getBoundingClientRect();
    let value = (screenX - left) / width;

    if (value < 0) {
        value = 0;
    }
    else if (value > 1) {
        value = 1;
    }
    return value * 100;
}

function resetTrackSlider() {
    elapsedTime.stop();
    setElapsedTime(0);
    setSliderElementWidth("track", 0);
}

function onVolumeTrackMousemove(event) {
    const volumeInPercentage = getElapsedValue("volume", event.screenX);
    const volume = volumeInPercentage / 100;
    const track = getCurrentTrack();

    setSliderElementWidth("volume", volumeInPercentage);
    settings.setSetting("volume", volume);

    if (track) {
        player.setVolume(track, volume);
    }
}

function onVolumeTrackMouseup() {
    document.removeEventListener("mousemove", onVolumeTrackMousemove);
    document.removeEventListener("mouseup", onVolumeTrackMouseup);
}

function setSliderElementWidth(slider, percent) {
    document.getElementById(`js-player-${slider}-elapsed`).style.width = `${percent}%`;
}

function setElapsedTime(time) {
    document.getElementById("js-player-elapsed").textContent = formatTime(time);
}

function showTrackDuration(duration, format = true) {
    const durationElem = document.getElementById("js-player-duration");

    durationElem.textContent = format ? formatTime(duration) : duration;
}

function onPlayerTrackMousemove(event) {
    setSliderElementWidth("track", getElapsedValue("track", event.screenX));
}

function onPlayerTrackMouseup({ screenX }) {
    const track = getCurrentTrack();

    if (track) {
        player.seekTo(track, getElapsedValue("track", screenX));
    }
    seeking = false;
    document.removeEventListener("mousemove", onPlayerTrackMousemove);
    document.removeEventListener("mouseup", onPlayerTrackMouseup);
}

document.getElementById("js-player-track-slider").addEventListener("mousedown", event => {
    if (event.which !== 1 || !getCurrentTrack()) {
        return;
    }
    seeking = true;
    setSliderElementWidth("track", getElapsedValue("track", event.screenX));
    document.addEventListener("mousemove", onPlayerTrackMousemove);
    document.addEventListener("mouseup", onPlayerTrackMouseup);
});

document.getElementById("js-player-volume-slider").addEventListener("mousedown", event => {
    if (event.which !== 1) {
        return;
    }
    onVolumeTrackMousemove(event);
    document.addEventListener("mousemove", onVolumeTrackMousemove);
    document.addEventListener("mouseup", onVolumeTrackMouseup);
});

document.getElementById("js-player-controls").addEventListener("click", ({ target }) => {
    const item = target.getAttribute("data-control-item");
    const track = getCurrentTrack();

    switch (item) {
        case "previous":
            player.playNextTrack(track, -1);
            break;
        case "play":
            player.playTrack(track);
            break;
        case "stop":
            player.stopPlayer(track);
            player.storedTrack.remove();
            break;
        case "next":
            player.playNextTrack(track, 1);
            break;
        case "repeat":
        case "shuffle":
            target.classList.toggle("active");
            player[item](target.classList.contains("active"));
            break;
    }
});

window.addEventListener("DOMContentLoaded", function onLoad() {
    const repeat = settings.getSetting("repeat");
    const shuffle = settings.getSetting("shuffle");
    const volume = settings.getSetting("volume");

    if (repeat) {
        document.querySelector(`[data-control-item="repeat"]`).classList.add("active");
    }
    if (shuffle) {
        document.querySelector(`[data-control-item="shuffle"]`).classList.add("active");
    }
    setSliderElementWidth("volume", volume * 100);
    window.removeEventListener("DOMContentLoaded", onLoad);
});

export {
    elapsedTime,
    togglePlayBtnClass,
    addClassOnPlayBtn,
    setSliderElementWidth,
    setElapsedTime,
    showTrackDuration,
    resetTrackSlider
};

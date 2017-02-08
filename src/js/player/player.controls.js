import { setSetting, getSetting, removeSetting, getSettings } from "./../settings.js";
import { getElementByAttr, formatTime, dispatchCustomEvent } from "./../main.js";
import { getCurrentTrack } from "./../playlist/playlist.js";
import { storedTrack, toggleShuffle, setVolume, seekTo, mutePlayer, onControlButtonClick } from "./player.js";

let seeking = false;
const elapsedTime = (function() {
    let timeout = 0;

    function stop() {
        clearTimeout(timeout);
    }

    function updateTrackSlider(track, startTime, elapsed) {
        const ideal = performance.now() - startTime;
        const diff = ideal - elapsed;

        displayCurrentTime(track.currentTime);

        if (!seeking) {
            const elapsedInPercentage = track.currentTime / track.duration * 100;

            setTrackBarInnerWidth(elapsedInPercentage);
            storedTrack.updateSavedTrack({
                elapsed: elapsedInPercentage,
                currentTime: track.currentTime
            });
        }

        if (track.currentTime <= track.duration) {
            track.currentTime += 1;
            elapsed += 1000;
            timeout = setTimeout(updateTrackSlider, 1000 - diff, track, startTime, elapsed);
        }
        else {
            dispatchCustomEvent("track-end");
        }
    }

    function start(track) {
        const startTime = performance.now();

        stop();
        updateTrackSlider(track, startTime, 0);
    }

    return { stop, start };
})();

function setElementIconAndTitle(element, { id, title }) {
    const icon = element.querySelector(".btn-icon");

    icon.setAttribute("href", `#${id}`);
    element.setAttribute("title", title);
}

function togglePlayBtn(state) {
    const element = document.getElementById("js-play-btn");
    const data = {
        on: {
            id: "play-icon",
            title: "Play"
        },
        off: {
            id:"pause-icon",
            title: "Pause"
        }
    };

    setElementIconAndTitle(element, state ? data.on : data.off);
}

function toggleVolumeBtn(element, state) {
    const data = {
        on: {
            id: "volume-off-icon",
            title: "Unmute"
        },
        off: {
            id:"volume-icon",
            title: "Mute"
        }
    };

    setElementIconAndTitle(element, state ? data.on : data.off);
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
    const volume = getElapsedValue("volume", event.pageX) / 100;
    const track = getCurrentTrack();

    setVolumeBarInnerWidth(volume);
    setSetting("volume", volume);

    if (track) {
        setVolume(track, volume);
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

function setVolumeBarInnerWidth(fraction) {
    setBarInnerWidth("volume", fraction * 100);
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
        seekTo(track, getTrackElapsedValue(pageX));
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
    const muted = getSetting("mute");

    if (muted) {
        const element = document.getElementById("js-volume-btn");

        removeSetting("volumeBeforeMute");
        setSetting("mute", !muted);
        toggleVolumeBtn(element, !muted);
        element.classList.remove("active");
    }
    onVolumeTrackMousemove(event);
    document.addEventListener("mousemove", onVolumeTrackMousemove);
    document.addEventListener("mouseup", onVolumeTrackMouseup);
});

document.getElementById("js-controls").addEventListener("click", ({ target }) => {
    const mainControlElement = getElementByAttr(target, "data-main-ctrl-item");

    if (mainControlElement) {
        onControlButtonClick(mainControlElement.attrValue);
        return;
    }
    const controlElement = getElementByAttr(target, "data-ctrl-item");

    if (controlElement) {
        const action = controlElement.attrValue;
        const elementRef = controlElement.elementRef;
        const setting = getSetting(action);
        const newSetting = !setting;

        elementRef.classList.toggle("active");
        setSetting(action, newSetting);

        if (action === "shuffle") {
            toggleShuffle(newSetting);
        }
        else if (action === "mute") {
            mutePlayer(newSetting);
            toggleVolumeBtn(elementRef, newSetting);
        }
    }
});

function loadSetting(name) {
    const setting = getSetting(name);
    const element = document.querySelector(`[data-ctrl-item="${name}"]`);

    if (setting && element) {
        element.classList.add("active");

        if (name === "mute") {
            toggleVolumeBtn(element, setting);
        }
    }
}

window.addEventListener("DOMContentLoaded", function onLoad() {
    const volume = getSetting("volume");
    const settings = getSettings();

    Object.keys(settings).forEach(loadSetting);
    setVolumeBarInnerWidth(volume);

    window.removeEventListener("DOMContentLoaded", onLoad);
});

export {
    elapsedTime,
    togglePlayBtn,
    setTrackBarInnerWidth,
    setVolumeBarInnerWidth,
    displayCurrentTime,
    showTrackDuration,
    resetTrackBar
};

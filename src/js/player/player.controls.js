import { getElementById, getElementByAttr, formatTime, dispatchCustomEvent, setElementIconAndTitle } from "../utils.js";
import { setSetting, getSetting, removeSetting, getSettings } from "../settings.js";
import { getCurrentTrack } from "../playlist/playlist.js";
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

function togglePlayPauseBtn(state, element = getElementById("js-play-btn")) {
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

function getPosInPercentage(bar, pageX) {
    const element = getElementById(`js-${bar}-bar`);
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

function getTrackCurrentTime(pageX) {
    return getPosInPercentage("track", pageX);
}

function resetTrackBar() {
    elapsedTime.stop();
    displayCurrentTime();
    setTrackBarInnerWidth();
}

function updateVolumeBarLabel(percentage) {
    const label = getElementById("js-volume-bar-label");

    label.textContent = `${percentage}%`;
    label.style.left = `${percentage}%`;
}

function onVolumeTrackMousemove({ pageX }) {
    const percentage = getPosInPercentage("volume", pageX);
    const volume = percentage / 100;
    const track = getCurrentTrack();

    setVolumeBarInnerWidth(volume);
    setSetting("volume", volume);
    updateVolumeBarLabel(Math.floor(percentage));

    if (track) {
        setVolume(track, volume);
    }
}

function onVolumeTrackMouseup() {
    window.removeEventListener("mousemove", onVolumeTrackMousemove);
    window.removeEventListener("mouseup", onVolumeTrackMouseup);
}

function setBarInnerWidth(bar, percent = 0) {
    getElementById(`js-${bar}-bar-inner`).style.width = `${percent}%`;
}

function setTrackBarInnerWidth(percent) {
    setBarInnerWidth("track", percent);
}

function setVolumeBarInnerWidth(fraction) {
    setBarInnerWidth("volume", fraction * 100);
}

function displayCurrentTime(time = 0) {
    getElementById("js-track-current").textContent = formatTime(time);
}

function showTrackDuration(duration = "0:00") {
    getElementById("js-track-duration").textContent = duration;
}

function onPlayerTrackMousemove({ pageX }) {
    const { durationInSeconds } = getCurrentTrack();
    const percentage = getTrackCurrentTime(pageX);
    const durationAtThumb = Math.floor(durationInSeconds * percentage / 100);
    const label = getElementById("js-track-bar-label");

    setTrackBarInnerWidth(percentage);
    label.style.left = `${Math.floor(percentage)}%`;
    label.textContent = formatTime(durationAtThumb);
}

function onPlayerTrackMouseup({ pageX }) {
    const track = getCurrentTrack();

    if (track) {
        seekTo(track, getTrackCurrentTime(pageX));
    }
    seeking = false;

    window.removeEventListener("mousemove", onPlayerTrackMousemove);
    window.removeEventListener("mouseup", onPlayerTrackMouseup);
}

getElementById("js-track-bar").addEventListener("mousedown", event => {
    if (event.which !== 1 || !getCurrentTrack()) {
        return;
    }
    seeking = true;

    onPlayerTrackMousemove(event);
    window.addEventListener("mousemove", onPlayerTrackMousemove);
    window.addEventListener("mouseup", onPlayerTrackMouseup);
});

getElementById("js-track-bar").addEventListener("mousemove", ({ pageX }) => {
    const track = getCurrentTrack();
    const label = getElementById("js-track-bar-label");

    if (!track) {
        label.classList.add("hidden");
        return;
    }
    const percentage = getTrackCurrentTime(pageX);
    const durationAtThumb = Math.floor(track.durationInSeconds * percentage / 100);

    label.classList.remove("hidden");
    label.style.left = `${Math.floor(percentage)}%`;
    label.textContent = formatTime(durationAtThumb);
});


getElementById("js-volume-bar").addEventListener("mousedown", event => {
    if (event.which !== 1) {
        return;
    }
    const muted = getSetting("mute");

    if (muted) {
        const element = getElementById("js-volume-btn");

        removeSetting("volumeBeforeMute");
        setSetting("mute", !muted);
        toggleVolumeBtn(element, !muted);
        element.classList.remove("active");
    }
    onVolumeTrackMousemove(event);
    window.addEventListener("mousemove", onVolumeTrackMousemove);
    window.addEventListener("mouseup", onVolumeTrackMouseup);
});

getElementById("js-volume-bar").addEventListener("mousemove", ({ pageX }) => {
    const percentage = getPosInPercentage("volume", pageX);

    updateVolumeBarLabel(Math.floor(percentage));
});

getElementById("js-main-controls").addEventListener("click", ({ target }) => {
    const element = getElementByAttr(target, "data-item");

    if (element) {
        onControlButtonClick(element.attrValue);
    }
});

getElementById("js-controls").addEventListener("click", ({ target }) => {
    const element = getElementByAttr(target, "data-item");

    if (element) {
        const action = element.attrValue;
        const elementRef = element.elementRef;
        const newSetting = !getSetting(action);

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
    const element = document.querySelector(`[data-item="${name}"]`);

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
    togglePlayPauseBtn,
    setTrackBarInnerWidth,
    setVolumeBarInnerWidth,
    displayCurrentTime,
    showTrackDuration,
    resetTrackBar
};

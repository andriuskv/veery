import { getElementById, getElementByAttr, formatTime, dispatchCustomEvent, setElementIconAndTitle } from "../utils.js";
import { setSetting, getSetting, removeSetting } from "../settings.js";
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
            id: "play",
            title: "Play"
        },
        off: {
            id:"pause",
            title: "Pause"
        }
    };

    setElementIconAndTitle(element, state ? data.on : data.off);
}

function toggleVolumeBtn(element, state) {
    const data = {
        on: {
            id: "volume-off",
            title: "Unmute"
        },
        off: {
            id:"volume",
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

    label.textContent = `${Math.floor(percentage)}%`;
    label.style.left = `${percentage}%`;
}

function onVolumeBarMousemove({ pageX }) {
    const percentage = getPosInPercentage("volume", pageX);
    const volume = percentage / 100;
    const track = getCurrentTrack();

    setVolumeBarInnerWidth(volume);
    setSetting("volume", volume);
    updateVolumeBarLabel(percentage);

    if (track) {
        setVolume(track, volume);
    }
}

function onVolumeBarMouseup() {
    window.removeEventListener("mousemove", onVolumeBarMousemove);
    window.removeEventListener("mouseup", onVolumeBarMouseup);
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

function onTrackBarMousemove({ pageX }) {
    const { durationInSeconds } = getCurrentTrack();
    const percentage = getTrackCurrentTime(pageX);
    const durationAtThumb = Math.floor(durationInSeconds * percentage / 100);
    const label = getElementById("js-track-bar-label");

    setTrackBarInnerWidth(percentage);
    label.style.left = `${percentage}%`;
    label.textContent = formatTime(durationAtThumb);
}

function onTrackBarMouseup({ pageX }) {
    const track = getCurrentTrack();

    if (track) {
        seekTo(track, getTrackCurrentTime(pageX));
    }
    seeking = false;

    window.removeEventListener("mousemove", onTrackBarMousemove);
    window.removeEventListener("mouseup", onTrackBarMouseup);
}

function updateSetting({ attrValue, elementRef }) {
    const setting = !getSetting(attrValue);

    elementRef.classList.toggle("active");
    elementRef.setAttribute("aria-checked", setting);
    setSetting(attrValue, setting);

    if (attrValue === "shuffle") {
        toggleShuffle(setting);
    }
    else if (attrValue === "mute") {
        mutePlayer(setting);
        toggleVolumeBtn(elementRef, setting);
    }
}

getElementById("js-track-bar").addEventListener("mousedown", event => {
    if (event.which !== 1 || !getCurrentTrack()) {
        return;
    }
    seeking = true;

    onTrackBarMousemove(event);
    window.addEventListener("mousemove", onTrackBarMousemove);
    window.addEventListener("mouseup", onTrackBarMouseup);
});

getElementById("js-track-bar").addEventListener("mousemove", event => {

    // If left mouse button is pressed down let global mousemove handler handle the event
    if ("buttons" in event && event.buttons) {
        return;
    }
    const track = getCurrentTrack();
    const label = getElementById("js-track-bar-label");

    if (!track) {
        label.classList.add("hidden");
        return;
    }
    const percentage = getTrackCurrentTime(event.pageX);
    const durationAtThumb = Math.floor(track.durationInSeconds * percentage / 100);

    label.classList.remove("hidden");
    label.style.left = `${percentage}%`;
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
    onVolumeBarMousemove(event);
    window.addEventListener("mousemove", onVolumeBarMousemove);
    window.addEventListener("mouseup", onVolumeBarMouseup);
});

getElementById("js-volume-bar").addEventListener("mousemove", event => {

    // If left mouse button is pressed down let global mousemove handler handle the event
    if ("buttons" in event && event.buttons) {
        return;
    }
    const percentage = getPosInPercentage("volume", event.pageX);

    updateVolumeBarLabel(percentage);
});

getElementById("js-main-controls").addEventListener("click", ({ target }) => {
    const element = getElementByAttr("data-item", target);

    if (element) {
        onControlButtonClick(element.attrValue);
    }
});

getElementById("js-controls").addEventListener("click", ({ target }) => {
    const element = getElementByAttr("data-item", target);

    if (!element) {
        return;
    }
    updateSetting(element);
});

getElementById("js-controls").addEventListener("keyup", ({ which, target }) => {
    if (which === 32 || which === 13) {
        updateSetting(getElementByAttr("data-item", target));
    }
});

(function () {
    setVolumeBarInnerWidth(getSetting("volume"));

    Array.from(document.querySelectorAll(".control-btn")).forEach(element => {
        const item = element.getAttribute("data-item");
        const setting = getSetting(item);

        if (setting) {
            element.classList.add("active");
            element.setAttribute("aria-checked", true);

            if (item === "mute") {
                toggleVolumeBtn(element, setting);
            }
        }
    });
})();

export {
    elapsedTime,
    togglePlayPauseBtn,
    setTrackBarInnerWidth,
    setVolumeBarInnerWidth,
    displayCurrentTime,
    showTrackDuration,
    resetTrackBar
};

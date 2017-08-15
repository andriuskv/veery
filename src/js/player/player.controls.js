import {
    getElementById,
    getElementByAttr,
    formatTime,
    dispatchCustomEvent,
    setElementIconAndTitle,
    removeElement,
    addSpinner
} from "../utils.js";
import { setSetting, getSetting, removeSetting } from "../settings.js";
import { getCurrentTrack } from "../playlist/playlist.js";
import { getTrackPlayPauseBtn } from "../playlist/playlist.view.js";
import { storedTrack, toggleShuffle, setVolume, seekTo, mutePlayer, onControlButtonClick } from "./player.js";

const volumeSlider = getElementById("js-volume-slider");
const trackSlider = getElementById("js-track-slider");
const controlsElement = getElementById("js-controls");
let seeking = false;
let isSpinnerActive = false;

const elapsedTime = (function() {
    let timeout = 0;

    function stop() {
        clearTimeout(timeout);
    }

    function update(track, startTime, elapsed) {
        const ideal = performance.now() - startTime;
        const diff = ideal - elapsed;

        if (!seeking) {
            updateTrackSlider(track.currentTime);
        }
        storedTrack.updateSavedTrack({
            currentTime: track.currentTime
        });

        if (track.currentTime <= track.duration) {
            track.currentTime += 1;
            elapsed += 1000;
            timeout = setTimeout(update, 1000 - diff, track, startTime, elapsed);
        }
        else {
            dispatchCustomEvent("track-end");
        }
    }

    function start(track) {
        const startTime = performance.now();

        stop();
        update(track, startTime, 0);
    }

    return { stop, start };
})();

function showPlayPauseBtnSpinner(track) {
    if (isSpinnerActive) {
        return;
    }
    const element = getElementById("js-play-btn");
    const btn = getTrackPlayPauseBtn(track);
    isSpinnerActive = true;

    if (btn) {
        addSpinner(btn);
    }
    addSpinner(element);
}

function hidePlayPauseBtnSpinner(track) {
    if (!isSpinnerActive) {
        return;
    }
    const element = getElementById("js-play-btn");
    const btn = getTrackPlayPauseBtn(track);
    isSpinnerActive = false;

    if (btn) {
        removeElement(btn.lastElementChild);
    }
    removeElement(element.lastElementChild);
}

function togglePlayPauseBtn(element, state) {
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

function getPosInPercentage(slider, pageX) {
    const { left, width } = getElementById(`js-${slider}-slider`).getBoundingClientRect();
    let percentage = (pageX - left) / width * 100;

    if (percentage < 0) {
        percentage = 0;
    }
    else if (percentage > 100) {
        percentage = 100;
    }
    return percentage;
}

function getTrackCurrentTime(pageX) {
    return getPosInPercentage("track", pageX);
}

function resetTrackSlider() {
    elapsedTime.stop();
    updateTrackSlider();
}

function updateVolumeSliderLabel(percentage) {
    const label = getElementById("js-volume-slider-label");

    label.textContent = `${Math.floor(percentage)}%`;
    label.style.left = `${percentage}%`;
}

function onVolumeSliderMousemove({ pageX }) {
    const percentage = getPosInPercentage("volume", pageX);
    const volume = percentage / 100;
    const track = getCurrentTrack();

    updateVolumeSliderThumb(volume);
    setSetting("volume", volume);
    updateVolumeSliderLabel(percentage);

    if (track) {
        setVolume(track, volume);
    }
}

function onVolumeSliderMouseup() {
    window.removeEventListener("mousemove", onVolumeSliderMousemove);
    window.removeEventListener("mouseup", onVolumeSliderMouseup);
}

function updateSliderThumb(slider, percentage = 0) {
    getElementById(`js-${slider}-slider-thumb`).style.left = `${percentage}%`;
}

function updateTrackSlider(currentTime = 0) {
    const formatedCurrentTime = formatTime(currentTime);
    const track = getCurrentTrack();
    const durationInSeconds = track ? track.durationInSeconds : 1;
    const duration = track ? track.duration : formatedCurrentTime;
    const percentage = currentTime / durationInSeconds * 100;

    if (!seeking) {
        getElementById("js-track-current").textContent = formatedCurrentTime;
    }
    updateSliderThumb("track", percentage);
    trackSlider.setAttribute("aria-valuenow", currentTime);
    trackSlider.setAttribute("aria-valuetext", `${formatedCurrentTime} of ${duration}`);
}

function updateVolumeSliderThumb(volume) {
    const percentage = volume * 100;

    updateSliderThumb("volume", percentage);
    volumeSlider.setAttribute("aria-valuenow", percentage);
    volumeSlider.setAttribute("aria-valuetext", `${Math.round(percentage)}% volume`);
}

function showTrackDuration(duration = "0:00", durationInSeconds = 0) {
    getElementById("js-track-duration").textContent = duration;
    trackSlider.setAttribute("aria-valuemax", durationInSeconds);
}

function onTrackSliderMousemove({ pageX }) {
    const { durationInSeconds } = getCurrentTrack();
    const percentage = getTrackCurrentTime(pageX);
    const currentTime = Math.floor(durationInSeconds * percentage / 100);
    const label = getElementById("js-track-slider-label");

    updateTrackSlider(currentTime);
    label.style.left = `${percentage}%`;
    label.textContent = formatTime(currentTime);
}

function onTrackSliderMouseup({ pageX }) {
    const track = getCurrentTrack();

    seeking = false;

    if (track) {
        const percentage = getTrackCurrentTime(pageX);
        const currentTime = Math.floor(track.durationInSeconds * percentage / 100);

        updateTrackSlider(currentTime);
        seekTo(track, currentTime);
    }
    window.removeEventListener("mousemove", onTrackSliderMousemove);
    window.removeEventListener("mouseup", onTrackSliderMouseup);
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

function unmutePlayer() {
    const muted = getSetting("mute");

    if (muted) {
        const element = getElementById("js-volume-btn");

        removeSetting("volumeBeforeMute");
        setSetting("mute", !muted);
        toggleVolumeBtn(element, !muted);
        element.classList.remove("active");
    }
}

trackSlider.addEventListener("mousedown", event => {
    if (event.which !== 1 || !getCurrentTrack()) {
        return;
    }
    seeking = true;

    onTrackSliderMousemove(event);
    window.addEventListener("mousemove", onTrackSliderMousemove);
    window.addEventListener("mouseup", onTrackSliderMouseup);
});

trackSlider.addEventListener("mousemove", event => {

    // If left mouse button is pressed down let global mousemove handler handle the event
    if ("buttons" in event && event.buttons) {
        return;
    }
    const track = getCurrentTrack();
    const label = getElementById("js-track-slider-label");

    if (!track) {
        label.classList.add("hidden");
        return;
    }
    const percentage = getTrackCurrentTime(event.pageX);
    const currentTime = Math.floor(track.durationInSeconds * percentage / 100);

    label.classList.remove("hidden");
    label.style.left = `${percentage}%`;
    label.textContent = formatTime(currentTime);
});

trackSlider.addEventListener("keydown", ({ which }) => {
    const track = getCurrentTrack();

    if (!track || which < 37 || which > 40) {
        return;
    }
    const duration = track.durationInSeconds;
    const percentage = parseFloat(getElementById(`js-track-slider-thumb`).style.left);
    let currentTime = Math.round(duration * percentage / 100);

    if (which === 38 || which === 39) {
        currentTime += 5;

        if (currentTime > duration) {
            currentTime = duration;
        }
    }
    else if (which === 37 || which === 40) {
        currentTime -= 5;

        if (currentTime < 0) {
            currentTime = 0;
        }
    }
    updateTrackSlider(currentTime);
    seekTo(track, currentTime);
});

volumeSlider.addEventListener("mousedown", event => {
    if (event.which !== 1) {
        return;
    }
    unmutePlayer();
    onVolumeSliderMousemove(event);
    window.addEventListener("mousemove", onVolumeSliderMousemove);
    window.addEventListener("mouseup", onVolumeSliderMouseup);
});

volumeSlider.addEventListener("mousemove", event => {

    // If left mouse button is pressed down let global mousemove handler handle the event
    if ("buttons" in event && event.buttons) {
        return;
    }
    const percentage = getPosInPercentage("volume", event.pageX);

    updateVolumeSliderLabel(percentage);
});

volumeSlider.addEventListener("keydown", ({ which }) => {
    let volume = getSetting("volume");

    if (which === 38 || which === 39) {
        volume += 0.05;

        if (volume > 1) {
            volume = 1;
        }
        unmutePlayer();
    }
    else if (volume && (which === 37 || which === 40)) {
        volume -= 0.05;

        if (volume <= 0) {
            volume = 0;

            updateSetting({
                attrValue: "mute",
                elementRef: getElementById("js-volume-btn")
            });
            return;
        }
    }
    const track = getCurrentTrack();

    updateVolumeSliderThumb(volume);
    setSetting("volume", volume);

    if (track) {
        setVolume(track, volume);
    }
});

getElementById("js-main-controls").addEventListener("click", ({ target }) => {
    const element = getElementByAttr("data-item", target);

    if (element) {
        onControlButtonClick(element.attrValue);
    }
});

controlsElement.addEventListener("click", ({ target }) => {
    const element = getElementByAttr("data-item", target);

    if (!element) {
        return;
    }
    updateSetting(element);
});

controlsElement.addEventListener("keyup", ({ which, target }) => {
    const element = getElementByAttr("data-item", target);

    if (element && (which === 32 || which === 13)) {
        updateSetting(element);
    }
});

(function() {
    updateVolumeSliderThumb(getSetting("volume"));

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
    showPlayPauseBtnSpinner,
    hidePlayPauseBtnSpinner,
    togglePlayPauseBtn,
    updateTrackSlider,
    updateVolumeSliderThumb,
    showTrackDuration,
    resetTrackSlider
};

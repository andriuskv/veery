import {
    getElementByAttr,
    getScrollParent,
    formatTime,
    dispatchCustomEvent,
    setElementIconAndTitle
} from "../utils.js";
import { setSetting, getSetting, removeSetting } from "../settings.js";
import { getCurrentTrack } from "../playlist/playlist.js";
import { getTrackPlayPauseBtn } from "../playlist/playlist.view.js";
import { storedTrack, setVolume, seekTo, playPreviousTrack, playTrack, playNextTrack } from "./player.js";

const volumeSlider = document.getElementById("js-volume-slider");
const trackSlider = document.getElementById("js-track-slider");
const controlsElement = document.getElementById("js-controls");
let seeking = false;
let lastSpinnerElement = null;

const elapsedTime = (function() {
    let timeout = 0;

    function stop() {
        clearTimeout(timeout);
    }

    function update(track, startTime, elapsed) {
        const ideal = performance.now() - startTime;
        const diff = ideal - elapsed;

        if (!seeking) {
            updateTrackSlider(track, track.currentTime);
        }
        storedTrack.updateTrack({
            currentTime: track.currentTime
        });

        if (track.currentTime <= track.durationInSeconds) {
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

function showPlayPauseBtnSpinner() {
    const element = getTrackPlayPauseBtn();

    if (element) {
        lastSpinnerElement = element;
        element.classList.add("show-spinner");
    }
    document.getElementById("js-play-btn").classList.add("show-spinner");
}

function hidePlayPauseBtnSpinner() {
    const element = getTrackPlayPauseBtn();

    if (lastSpinnerElement) {
        lastSpinnerElement.classList.remove("show-spinner");
        lastSpinnerElement = null;
    }

    if (element) {
        element.classList.remove("show-spinner");
    }
    document.getElementById("js-play-btn").classList.remove("show-spinner");
}

function getPlayPauseButtonIcon(state) {
    if (state) {
        return {
            id: "play",
            title: "Play"
        };
    }
    return {
        id: "pause",
        title: "Pause"
    };
}

function togglePlayPauseBtn(element, state) {
    setElementIconAndTitle(element, getPlayPauseButtonIcon(state));
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

function getPosInPercentage(slider, x) {
    const { left, width } = document.getElementById(`js-${slider}-slider`).getBoundingClientRect();
    let percentage = (x - left) / width * 100;

    if (percentage < 0) {
        percentage = 0;
    }
    else if (percentage > 100) {
        percentage = 100;
    }
    return percentage;
}

function resetTrackSlider() {
    elapsedTime.stop();
    updateTrackSlider();
}

function updateVolume(volume) {
    setSetting("volume", volume);
    updateVolumeSlider(volume);
    setVolume(volume);
}

function isOutsideViewport(x, width) {
    const maxWidth = window.innerWidth;
    const halfWidth = width / 2;

    return x + halfWidth + 8 > maxWidth || x - halfWidth - 8 < 0;
}

function getLabelOffset(percent, halfLabelWidth) {
    return `calc(${percent}% - ${halfLabelWidth}px)`;
}

function updateVolumeSliderLabel(percentage, pageX) {
    const label = document.getElementById("js-volume-slider-label");
    label.textContent = `${Math.floor(percentage)}%`;
    const width = label.offsetWidth;

    if (isOutsideViewport(pageX, width)) {
        return;
    }
    label.style.left = getLabelOffset(percentage, width / 2);
}

function updateSlider(slider, value) {
    document.getElementById(`js-${slider}-slider-thumb`).style.left = `${value * 100}%`;
    document.getElementById(`js-${slider}-slider-elapsed`).style.transform = `scaleX(${value})`;
}

function updateTrackSlider(track, currentTime = 0) {
    let durationInSeconds = 1;
    let duration = "0:00";

    if (track) {
        durationInSeconds = track.durationInSeconds;
        duration = track.duration;
    }
    const formatedCurrentTime = formatTime(currentTime, durationInSeconds >= 3600);

    if (!seeking) {
        document.getElementById("js-track-current").textContent = formatedCurrentTime;
    }
    updateSlider("track", currentTime / durationInSeconds);
    trackSlider.setAttribute("aria-valuenow", currentTime);
    trackSlider.setAttribute("aria-valuetext", `${formatedCurrentTime} of ${duration}`);
}

function updateVolumeSlider(volume) {
    const percentage = Math.floor(volume * 100);

    updateSlider("volume", volume);
    volumeSlider.setAttribute("aria-valuenow", percentage);
    volumeSlider.setAttribute("aria-valuetext", `${percentage}% volume`);
}

function showTrackDuration(duration = "0:00", durationInSeconds = 0) {
    document.getElementById("js-track-duration").textContent = duration;
    trackSlider.setAttribute("aria-valuemax", durationInSeconds);
}

function showTrackSlider() {
    trackSlider.classList.add("visible");
}

function hideTrackSlider() {
    trackSlider.classList.remove("visible");
}

function getCurrentTime(offset, duration) {
    const percent = getPosInPercentage("track", offset);

    return {
        percent,
        currentTime: Math.floor(duration * percent / 100)
    };
}

function updateTrackSliderLabel(percentage, currentTime, pageX) {
    const label = document.getElementById("js-track-slider-label");
    label.textContent = formatTime(currentTime);
    const width = label.offsetWidth;

    if (isOutsideViewport(pageX, width)) {
        return;
    }
    label.style.left = getLabelOffset(percentage, width / 2);
}

function onTrackSliderMousemove({ pageX }) {
    const track = getCurrentTrack();
    const { percent, currentTime } = getCurrentTime(pageX, track.durationInSeconds);

    updateTrackSlider(track, currentTime);
    updateTrackSliderLabel(percent, currentTime, pageX);
}

function onLocalTrackSliderMousemove({ pageX }) {
    const track = getCurrentTrack();

    if (!track) {
        return;
    }
    const { percent, currentTime } = getCurrentTime(pageX, track.durationInSeconds);

    updateTrackSliderLabel(percent, currentTime, pageX);
}

function onTrackSliderMouseup({ pageX }) {
    const track = getCurrentTrack();
    seeking = false;

    if (track) {
        const { currentTime } = getCurrentTime(pageX, track.durationInSeconds);

        updateTrackSlider(track, currentTime);
        seekTo(track.player, currentTime);
        storedTrack.updateTrack({ currentTime });
    }
    window.removeEventListener("pointermove", onTrackSliderMousemove);
    window.removeEventListener("pointerup", onTrackSliderMouseup);
    trackSlider.addEventListener("pointermove", onLocalTrackSliderMousemove);
}

function onVolumeSliderMousemove({ pageX }) {
    const percentage = getPosInPercentage("volume", pageX);
    const volume = percentage / 100;

    if (volume === getSetting("volume")) {
        return;
    }
    updateVolumeSliderLabel(percentage, pageX);

    if (!volume) {
        updateSetting({
            attrValue: "mute",
            elementRef: document.getElementById("js-volume-btn")
        });
        return;
    }
    unmutePlayer();
    updateVolume(volume);
}

function onLocalVolumeSliderMousemove({ pageX }) {
    updateVolumeSliderLabel(getPosInPercentage("volume", pageX), pageX);
}

function onVolumeSliderMouseup() {
    window.removeEventListener("pointermove", onVolumeSliderMousemove);
    window.removeEventListener("pointerup", onVolumeSliderMouseup);
    volumeSlider.addEventListener("pointermove", onLocalVolumeSliderMousemove);
}

let timeout = 0;

function setPlaybackMode(element, initMode) {
    let mode = element.getAttribute("data-mode");
    const modes = {
        "normal": {
            name: "repeat",
            nextTitle: "Play track once",
            currentTitle: "Repeat track",
            iconId: "repeat"
        },
        "repeat": {
            name: "track-once",
            nextTitle: "Play playlist once",
            currentTitle: "Play track once",
            iconId: "repeat-once"
        },
        "track-once": {
            name: "playlist-once",
            nextTitle: "Repeat playlist",
            currentTitle: "Play playlist once",
            iconId: "repeat-once"
        },
        "playlist-once": {
            name: "normal",
            nextTitle: "Repeat track",
            currentTitle: "Repeat playlist",
            iconId: "repeat"
        }
    };

    if (initMode) {
        for (const [key, value] of Object.entries(modes)) {
            if (initMode === value.name) {
                mode = key;
                break;
            }
        }
    }
    else {
        const a = document.getElementById("js-control-btn-label");

        if (a) {
            a.remove();
        }
        element.parentElement.insertAdjacentHTML("afterbegin", `
            <div id="js-control-btn-label" class="control-btn-label">${modes[mode].currentTitle}</div>
        `);
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            document.getElementById("js-control-btn-label").remove();
        }, 1000);
    }
    const { name, nextTitle, iconId } = modes[mode];

    if (name === "normal") {
        element.classList.remove("active");
        element.setAttribute("aria-checked", false);
    }
    else {
        element.setAttribute("aria-checked", true);
        element.classList.add("active");
    }
    element.setAttribute("data-mode", name);
    element.setAttribute("title", nextTitle);
    element.querySelector("use").setAttribute("href", `#${iconId}`);
    setSetting("playback", name);
}

function updateSetting({ attrValue, elementRef }) {
    if (attrValue === "playback") {
        setPlaybackMode(elementRef);
        return;
    }
    const value = !getSetting(attrValue);

    elementRef.setAttribute("aria-checked", value);
    setSetting(attrValue, value);

    if (attrValue === "mute") {
        mutePlayer(value);
        toggleVolumeBtn(elementRef, value);
    }
    else {
        elementRef.classList.toggle("active");
    }
}

function mutePlayer(muted) {
    const volume = muted ? 0 : getSetting("volumeBeforeMute");

    if (muted) {
        setSetting("volumeBeforeMute", getSetting("volume"));
    }
    else {
        removeSetting("volumeBeforeMute");
    }
    updateVolume(volume);
}

function unmutePlayer() {
    const muted = getSetting("mute");

    if (muted) {
        const element = document.getElementById("js-volume-btn");

        removeSetting("volumeBeforeMute");
        setSetting("mute", !muted);
        toggleVolumeBtn(element, !muted);
        element.classList.remove("active");
    }
}

function toggleMute() {
    const value = !getSetting("mute");
    const element = document.getElementById("js-volume-btn");

    mutePlayer(value);
    toggleVolumeBtn(element, value);
    setSetting("mute", value);
}

function updateVolumeOnKeyDown(key) {
    let volume = getSetting("volume");

    if (volume < 1 && key === "ArrowUp") {
        if (!volume) {
            unmutePlayer();
        }
        volume += 0.05;

        if (volume > 1) {
            volume = 1;
        }
    }
    else if (volume && key === "ArrowDown") {
        volume -= 0.05;

        if (volume <= 0) {
            volume = 0;

            updateSetting({
                attrValue: "mute",
                elementRef: document.getElementById("js-volume-btn")
            });
            return;
        }
    }
    updateVolume(volume);
}

function updateCurrentTimeOnKeyDown(key) {
    const track = getCurrentTrack();

    if (!track) {
        return;
    }
    const duration = track.durationInSeconds;
    let { currentTime } = storedTrack.getTrack();

    if (key === "ArrowRight" || key === "ArrowUp") {
        currentTime += 5;

        if (currentTime > duration) {
            currentTime = duration;
        }
    }
    else if (key === "ArrowLeft" || key === "ArrowDown") {
        currentTime -= 5;

        if (currentTime < 0) {
            currentTime = 0;
        }
    }
    updateTrackSlider(track, currentTime);
    seekTo(track.player, currentTime);
    storedTrack.updateTrack({ currentTime });
}

function getMouseEnterHandler(slider) {
    return function({ pageX }) {
        const label = document.getElementById(`js-${slider}-slider-label`);
        const viewportWidth = window.innerWidth;
        const halfLabelWidth = label.offsetWidth / 2;

        if (pageX + halfLabelWidth + 8 > viewportWidth) {
            const percent = getPosInPercentage(slider, viewportWidth - halfLabelWidth - 8);
            label.style.left = getLabelOffset(percent, halfLabelWidth);
        }
        else if (pageX - halfLabelWidth - 8 < 0) {
            const percent = getPosInPercentage(slider, halfLabelWidth + 8);
            label.style.left = getLabelOffset(percent, halfLabelWidth);
        }
    };
}

window.addEventListener("keydown", event => {
    const modifierKeyPressed = event.ctrlKey || event.shiftKey || event.altKey || event.metaKey;

    if (event.target instanceof HTMLInputElement || modifierKeyPressed) {
        return;
    }
    const { key } = event;

    if (key === "p") {
        playTrack();
    }
    else if (key === "m") {
        toggleMute();
    }
    else if (key === "[") {
        playNextTrack();
    }
    else if (key === "o") {
        playPreviousTrack();
    }
    else if (key.startsWith("Arrow") && event.target.getAttribute("role") !== "slider" && !getScrollParent(event.target)) {
        if (key === "ArrowUp" || key === "ArrowDown") {
            updateVolumeOnKeyDown(key);
        }
        else if (key === "ArrowRight" || key === "ArrowLeft") {
            updateCurrentTimeOnKeyDown(key);
        }
    }
});

trackSlider.addEventListener("pointerdown", event => {
    if (event.which !== 1 || !getCurrentTrack()) {
        return;
    }
    seeking = true;

    onTrackSliderMousemove(event);
    trackSlider.removeEventListener("pointermove", onLocalTrackSliderMousemove);
    window.addEventListener("pointermove", onTrackSliderMousemove);
    window.addEventListener("pointerup", onTrackSliderMouseup);
});

trackSlider.addEventListener("pointermove", onLocalTrackSliderMousemove);
trackSlider.addEventListener("pointerenter", getMouseEnterHandler("track"));

trackSlider.addEventListener("keydown", ({ key }) => {
    if (key.startsWith("Arrow")) {
        updateCurrentTimeOnKeyDown(key);
    }
});

volumeSlider.addEventListener("pointerdown", event => {
    if (event.which !== 1) {
        return;
    }
    onVolumeSliderMousemove(event);
    volumeSlider.removeEventListener("pointermove", onLocalVolumeSliderMousemove);
    window.addEventListener("pointermove", onVolumeSliderMousemove);
    window.addEventListener("pointerup", onVolumeSliderMouseup);
});

volumeSlider.addEventListener("pointermove", onLocalVolumeSliderMousemove);
volumeSlider.addEventListener("pointerenter", getMouseEnterHandler("volume"));

volumeSlider.addEventListener("keydown", ({ key }) => {
    if (key.startsWith("Arrow")) {
        updateVolumeOnKeyDown(key);
    }
});

document.getElementById("js-main-controls").addEventListener("click", ({ target }) => {
    const element = getElementByAttr("data-item", target);

    if (element) {
        switch (element.attrValue) {
            case "previous":
                playPreviousTrack();
                break;
            case "play":
                playTrack();
                break;
            case "next":
                playNextTrack();
                break;
        }
    }
});

controlsElement.addEventListener("click", ({ target }) => {
    const element = getElementByAttr("data-item", target);

    if (element) {
        updateSetting(element);
    }
});

controlsElement.addEventListener("keyup", ({ which, target }) => {
    const element = getElementByAttr("data-item", target);

    if (element && (which === 32 || which === 13)) {
        updateSetting(element);
    }
});

document.getElementById("js-control-toggle-btn").addEventListener("click", () => {
    controlsElement.classList.toggle("visible");
});

(function() {
    updateVolumeSlider(getSetting("volume"));

    Array.from(document.querySelectorAll(".control-btn")).forEach(element => {
        const item = element.getAttribute("data-item");
        const setting = getSetting(item);

        if (setting) {
            if (item === "playback") {
                setPlaybackMode(element, setting);
                return;
            }
            element.setAttribute("aria-checked", true);

            if (item === "mute") {
                toggleVolumeBtn(element, setting);
            }
            else {
                element.classList.add("active");
            }
        }
    });
})();

export {
    elapsedTime,
    showPlayPauseBtnSpinner,
    hidePlayPauseBtnSpinner,
    getPlayPauseButtonIcon,
    togglePlayPauseBtn,
    updateTrackSlider,
    updateVolume,
    showTrackDuration,
    resetTrackSlider,
    showTrackSlider,
    hideTrackSlider
};

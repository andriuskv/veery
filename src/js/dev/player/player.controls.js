import * as settings from "./../settings.js";
import * as main from "./../main.js";
import * as playlist from "./../playlist/playlist.js";
import * as player from "./player.js";

const elapsedTime = (function() {
    let timeout = 0;

    function stop() {
        if (timeout) {
            clearTimeout(timeout);
        }
    }

    function update(track) {
        const startTime = performance.now();

        return new Promise(resolve => {
            (function update(currentTime, startTime, elapsed) {
                const ideal = performance.now() - startTime;
                const diff = ideal - elapsed;

                setElapsedTime(currentTime);
                track.currentTime = currentTime;
                if (!settings.get("seeking")) {
                    const elapsedInPercent = currentTime / track.duration * 100;

                    updateSlider("track", elapsedInPercent);
                    track.elapsed = elapsedInPercent;
                    player.storedTrack.set(track);
                }
                timeout = setTimeout(() => {
                    if (currentTime < track.duration) {
                        currentTime += 1;
                        elapsed += 1000;
                        update(currentTime, startTime, elapsed);
                    }
                    else {
                        resolve();
                    }
                }, 1000 - diff);
            })(Math.floor(track.currentTime), startTime, 0);
        });
    }

    function start(track) {
        stop();
        return update(track);
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
    updateSlider("track", 0);
}

function onVolumeTrackMousemove(event) {
    const volume = getElapsedValue("volume", event.screenX);

    updateSlider("volume", volume);
    player.setVolume(volume / 100);
}

function onVolumeTrackMouseup() {
    document.removeEventListener("mousemove", onVolumeTrackMousemove);
    document.removeEventListener("mouseup", onVolumeTrackMouseup);
}

function updateSlider(slider, percent) {
    document.getElementById(`js-player-${slider}-elapsed`).style.width = `${percent}%`;
}

function setElapsedTime(time) {
    document.getElementById("js-player-elapsed").textContent = main.formatTime(time);
}

function showTrackDuration(duration, format = true) {
    const durationElem = document.getElementById("js-player-duration");

    durationElem.textContent = format ? main.formatTime(duration) : duration;
}

function onPlayerTrackMousemove(event) {
    updateSlider("track", getElapsedValue("track", event.screenX));
}

function onPlayerTrackMouseup({ screenX }) {
    if (playlist.getCurrentTrack()) {
        player.seek(getElapsedValue("track", screenX));
    }

    settings.set("seeking", false);
    document.removeEventListener("mousemove", onPlayerTrackMousemove);
    document.removeEventListener("mouseup", onPlayerTrackMouseup);
}

document.getElementById("js-player-track").addEventListener("mousedown", event => {
    if (event.which !== 1 ||
        !event.target.getAttribute("data-track-item") ||
        !playlist.getCurrentTrack()) {
        return;
    }

    settings.set("seeking", true);
    updateSlider("track", getElapsedValue("track", event.screenX));
    document.addEventListener("mousemove", onPlayerTrackMousemove);
    document.addEventListener("mouseup", onPlayerTrackMouseup);
});

document.getElementById("js-volume-track").addEventListener("mousedown", event => {
    if (event.which !== 1 || !event.target.getAttribute("data-volume-item")) {
        return;
    }

    onVolumeTrackMousemove(event);
    document.addEventListener("mousemove", onVolumeTrackMousemove);
    document.addEventListener("mouseup", onVolumeTrackMouseup);
});

document.getElementById("js-player-controls").addEventListener("click", ({ target }) => {
    const item = target.getAttribute("data-control-item");

    switch (item) {
        case "previous":
            player.playNext(-1);
            break;
        case "play":
            player.play();
            break;
        case "stop":
            player.stop();
            player.storedTrack.remove();
            break;
        case "next":
            player.playNext(1);
            break;
        case "repeat":
        case "shuffle":
            target.classList.toggle("active");
            player[item](target.classList.contains("active"));
            break;
        case "volume":
            document.getElementById("js-volume-track").classList.toggle("active");
            target.classList.toggle("active");
            break;
    }
});

window.addEventListener("DOMContentLoaded", function onLoad() {
    const repeat = settings.get("repeat");
    const shuffle = settings.get("shuffle");
    const volume = settings.get("volume");

    if (repeat) {
        document.querySelector(`[data-control-item="repeat"]`).classList.add("active");
    }
    if (shuffle) {
        document.querySelector(`[data-control-item="shuffle"]`).classList.add("active");
    }
    updateSlider("volume", volume * 100);
    window.removeEventListener("DOMContentLoaded", onLoad);
});

export {
    elapsedTime,
    togglePlayBtnClass,
    addClassOnPlayBtn,
    updateSlider,
    setElapsedTime,
    showTrackDuration,
    resetTrackSlider
};

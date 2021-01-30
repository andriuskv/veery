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
import { storedTrack, setVolume, seekTo, playPreviousTrack, playTrack, playNextTrack, getPlayerState } from "./player.js";
import { isMediaVisible } from "./player.now-playing.js";
import { toggleQueue } from "./queue.js";

const volumeSlider = document.getElementById("js-volume-slider");
const trackSlider = document.getElementById("js-track-slider");
const controlsElement = document.getElementById("js-player-controls");
let seeking = false;
let lastSpinnerElement = null;
let playbackBtnLabelTimeout = 0;
let actionDisplayTimeout = 0;

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
  const playBtn = document.getElementById("js-play-btn");
  const spinnerElement = playBtn.querySelector(".play-pause-btn-spinner");

  if (spinnerElement) {
    return;
  }
  const element = getTrackPlayPauseBtn();
  const spinner = `
    <svg viewBox="0 0 100 100" class="play-pause-btn-spinner">
      <use href="#spinner"/>
    </svg>
  `;

  if (element) {
    lastSpinnerElement = element;
    element.insertAdjacentHTML("beforeend", spinner);
  }
  playBtn.insertAdjacentHTML("beforeend", spinner);
}

function hidePlayPauseBtnSpinner() {
  const element = getTrackPlayPauseBtn();

  if (lastSpinnerElement) {
    removeSpinner(lastSpinnerElement);
    lastSpinnerElement = null;
  }

  if (element) {
    removeSpinner(element);
  }
  removeSpinner(document.getElementById("js-play-btn"));
}

function removeSpinner(element) {
  const spinner = element.querySelector(".play-pause-btn-spinner");

  if (spinner) {
    spinner.remove();
  }
}

function getPlayPauseButtonIcon(state) {
  if (state) {
    return {
      id: "play-circle",
      title: "Play"
    };
  }
  return {
    id: "pause-circle",
    title: "Pause"
  };
}

function togglePlayPauseBtn(element, state) {
  setElementIconAndTitle(element, getPlayPauseButtonIcon(state));
}

function updateVolumeIcon(state) {
  const element = document.getElementById("js-volume-icon");
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

function updateVolume(volume, volumeVisible = false) {
  setVolume(volume);
  setSetting("volume", volume);
  updateVolumeSlider(volume);

  if (volumeVisible) {
    displayVolumeLevel(volume);
  }
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
  const formattedCurrentTime = formatTime(currentTime, durationInSeconds >= 3600);

  if (!seeking) {
    document.getElementById("js-track-current").textContent = formattedCurrentTime;
  }
  updateSlider("track", currentTime / durationInSeconds);
  trackSlider.setAttribute("aria-valuenow", currentTime);
  trackSlider.setAttribute("aria-valuetext", `${formattedCurrentTime} of ${duration}`);
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

function showSliderLabel(slider) {
  document.getElementById(`js-${slider}-slider-label`).classList.add("visible");
}

function hideSliderLabel(slider) {
  document.getElementById(`js-${slider}-slider-label`).classList.remove("visible");
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
  hideSliderLabel("track");
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
    toggleMute({ mute: true });
    return;
  }
  unmutePlayer();
  updateVolume(volume);
}

function onLocalVolumeSliderMousemove({ pageX }) {
  updateVolumeSliderLabel(getPosInPercentage("volume", pageX), pageX);
}

function onVolumeSliderMouseup() {
  hideSliderLabel("volume");
  window.removeEventListener("pointermove", onVolumeSliderMousemove);
  window.removeEventListener("pointerup", onVolumeSliderMouseup);
  volumeSlider.addEventListener("pointermove", onLocalVolumeSliderMousemove);
}

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
    showControlBtnLabel(element, modes[mode].currentTitle);
  }
  const { name, nextTitle, iconId } = modes[mode];

  if (name === "normal") {
    element.classList.remove("active");
  }
  else {
    element.classList.add("active");
  }
  element.setAttribute("data-mode", name);
  element.setAttribute("title", nextTitle);
  element.querySelector("use").setAttribute("href", `#${iconId}`);
  setSetting("playback", name);
}

function showControlBtnLabel(element, label) {
  const labelElement = document.getElementById("js-control-btn-label");

  if (labelElement) {
    labelElement.remove();
  }
  element.parentElement.insertAdjacentHTML("afterbegin", `
    <div id="js-control-btn-label" class="control-btn-label">${label}</div>
  `);
  clearTimeout(playbackBtnLabelTimeout);
  playbackBtnLabelTimeout = setTimeout(() => {
    document.getElementById("js-control-btn-label").remove();
  }, 1000);
}

function mutePlayer(muted, volumeVisible) {
  const volume = muted ? 0 : getSetting("volumeBeforeMute");

  if (muted) {
    setSetting("volumeBeforeMute", getSetting("volume"));
  }
  else {
    removeSetting("volumeBeforeMute");
  }
  updateVolume(volume, volumeVisible);
}

function unmutePlayer() {
  const muted = getSetting("mute");

  if (muted) {
    removeSetting("volumeBeforeMute");
    setSetting("mute", !muted);
    updateVolumeIcon(!muted);
  }
}

function toggleMute({ mute = !getSetting("mute"), volumeVisible = false } = {}) {
  mutePlayer(mute, volumeVisible);
  setSetting("mute", mute);
  updateVolumeIcon(mute);
}

function toggleShuffle(element) {
  const value = !getSetting("shuffle");

  setSetting("shuffle", value);
  showControlBtnLabel(element, value ? "Shuffle" : "No shuffle");
  element.classList.toggle("active");
  element.querySelector("title").textContent = value ? "No shuffle" : "Shuffle";
}

function handleControls({ attrValue, elementRef }) {
  switch (attrValue) {
    case "play":
      playTrack();
      break;
    case "next":
      playNextTrack();
      break;
    case "previous":
      playPreviousTrack();
      break;
    case "playback":
      setPlaybackMode(elementRef);
      break;
    case "mute":
      toggleMute();
      break;
    case "shuffle":
      toggleShuffle(elementRef.parentElement);
      break;
    case "queue":
      toggleQueue(elementRef);
      break;
  }
}

function displayControlAction(iconId, html = "", className = "") {
  const element = document.getElementById("js-control-action");
  className = `${className ? ` ${className}` : ""}`;

  if (isMediaVisible()) {
    const track = getCurrentTrack();

    if (track?.player === "youtube") {
      className = `${className} youtube-player-visible`;
    }
    else {
      className = `${className} artwork-visible`;
    }
  }

  if (element) {
    element.remove();
  }
  document.body.insertAdjacentHTML("beforeend", `
    <div id="js-control-action" class="control-action${className}">
      ${html}
      <svg viewBox="0 0 24 24" class="control-action-icon">
        <use href="#${iconId}"/>
      </svg>
    </div>
  `);

  clearTimeout(actionDisplayTimeout);
  actionDisplayTimeout = setTimeout(() => {
    document.getElementById("js-control-action").remove();
  }, 1000);
}

function displayPlayerState() {
  displayControlAction(getPlayerState() ? "pause" : "play");
}

function displayVolumeLevel(volume) {
  const displayValue = `${Math.round(volume * 100)}%`;
  const iconId = volume ? "volume" : "volume-off";

  displayControlAction(iconId, `<div class="control-action-text">${displayValue}</div>`, "text-visible");
}

function updateVolumeOnKeyDown(key) {
  let volume = getSetting("volume");

  if (volume < 1 && key === "ArrowRight" || key === "ArrowUp") {
    if (!volume) {
      unmutePlayer();
    }
    volume += 0.05;

    if (volume > 1) {
      volume = 1;
    }
  }
  else if (volume && "ArrowLeft" || key === "ArrowDown") {
    volume -= 0.05;

    if (volume <= 0) {
      volume = 0;
      toggleMute({ mute: true });
      return;
    }
  }
  updateVolume(volume, true);
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
    displayControlAction("fast-forward");
  }
  else if (key === "ArrowLeft" || key === "ArrowDown") {
    currentTime -= 5;

    if (currentTime < 0) {
      currentTime = 0;
    }
    displayControlAction("rewind");
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
  const { target, key } = event;

  if ((target instanceof HTMLInputElement && target.type === "text") || modifierKeyPressed) {
    return;
  }

  if (key === "p") {
    playTrack();
    displayPlayerState();
  }
  else if (key === "m") {
    toggleMute({ volumeVisible: true });
  }
  else if (key === "[") {
    playNextTrack();
  }
  else if (key === "o") {
    playPreviousTrack();
  }
  else if (key.startsWith("Arrow") && target.getAttribute("role") !== "slider" && !getScrollParent(target)) {
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
  showSliderLabel("track");
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
  showSliderLabel("volume");
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

controlsElement.addEventListener("click", ({ target }) => {
  const element = getElementByAttr("data-item", target);

  if (element) {
    handleControls(element);
  }
});

controlsElement.addEventListener("keyup", ({ target, key }) => {
  const element = getElementByAttr("data-item", target);

  if (element?.elementRef.nodeName === "INPUT" && key === "Enter") {
    handleControls(element);
  }
});

document.getElementById("js-volume-toggle-btn").addEventListener("click", ({ currentTarget }) => {
  currentTarget.classList.toggle("active");
  document.getElementById("js-additional-controls").classList.toggle("visible");
});

(function() {
  updateVolumeSlider(getSetting("volume"));

  Array.from(controlsElement.querySelectorAll("[data-item]")).forEach(element => {
    const item = element.getAttribute("data-item");
    const setting = getSetting(item);

    if (setting) {
      if (item === "playback") {
        setPlaybackMode(element, setting);
      }
      else if (item === "mute") {
        updateVolumeIcon(setting);
      }
      else if (item === "shuffle") {
        element.parentElement.classList.add("active");
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
  displayControlAction,
  updateTrackSlider,
  updateVolume,
  showTrackDuration,
  resetTrackSlider,
  showTrackSlider,
  hideTrackSlider
};

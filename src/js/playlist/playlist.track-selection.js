import { getElementByAttr, isOutsideElement } from "../utils.js";
import {
  updateCurrentTrackIndex,
  resetTrackIndexes,
  setPlaybackOrder,
  getPlaylistState,
  setSortOrder
} from "./playlist.js";
import { getSetting } from "../settings.js";
import { getVisiblePlaylistId, getVisiblePlaylist, getTab } from "../tab.js";
import { postMessageToWorker } from "../web-worker.js";
import { createSelectionPanelContainer, removeSelectionPanel } from "./selection-panel.js";
import { getPlaylistElement, updatePlaylistView } from "./playlist.view.js";
import { updatePlaylistEntry } from "./playlist.entries.js";
import { removeQueueTracks } from "../player/queue.js";

const startingPoint = {};
const mousePos = {};
let playlistElement = null;
let playlistElementRect = null;
let playlistOffsetY = 0;
let selectionElement = null;
let selectionArea = {};
let trackElements = [];
let intervalId = 0;
let updating = false;
let isSelectionPanelVisible = false;
let selectTrackIndex = -1;

function enableTrackSelection({ id, tracks, type }) {
  if (playlistElement) {
    disableTrackSelection();
  }

  if (tracks.length) {
    selectTrackIndex = -1;
    playlistOffsetY = type === "list" ? 35 : 0;
    playlistElement = getTab(id);
    playlistElement.addEventListener("mousedown", onMousedown);
  }
}

function disableTrackSelection() {
  playlistElement.removeEventListener("mousedown", onMousedown);
  playlistElement = null;
}

function getPlaylistElementRect(element) {
  return {
    top: element.offsetTop,
    left: element.offsetLeft,
    width: element.clientWidth, // clientWidth excludes scrollbar width
    height: element.offsetHeight,
    scrollHeight: element.scrollHeight
  };
}

function initSelectionArea(parent, { x, y }) {
  selectionArea.top = y;
  selectionArea.left = x;

  parent.insertAdjacentHTML("afterbegin", `
  <div class="selection-area" style="top: ${y}px; left: ${x}px"></div>
  `);

  return parent.firstElementChild;
}

function getTrackElements() {
  const { children } = getPlaylistElement(getVisiblePlaylistId());

  return Array.from(children).map(element => {
    const top = element.offsetTop;
    const left = element.offsetLeft;

    return {
      ref: element,
      top,
      left,
      right: left + element.offsetWidth,
      bottom: top + element.offsetHeight
    };
  });
}

function updateSelectionArea(mousePos, startingPoint, area, areaStyle) {
  let width = mousePos.x - startingPoint.x;
  let height = mousePos.y - startingPoint.y;

  if (width < 0) {
    const left = startingPoint.x + width;

    width *= -1;
    area.left = left;
    areaStyle.left = `${left}px`;
  }
  else if (area.left !== startingPoint.x) {
    area.left = startingPoint.x;
    areaStyle.left = `${startingPoint.x}px`;
  }

  if (height < 0) {
    let top = startingPoint.y + height;

    if (top < playlistOffsetY) {
      top = playlistOffsetY;
    }
    height *= -1;
    area.top = top;
    areaStyle.top = `${top}px`;
  }
  else if (area.top !== startingPoint.y) {
    area.top = startingPoint.y;
    areaStyle.top = `${startingPoint.y}px`;
  }
  area.right = area.left + width;
  area.bottom = area.top + height;
  areaStyle.width = `${width}px`;
  areaStyle.height = `${height}px`;
}

function removeSelectedElementClass() {
  const elements = getSelectedElements();

  elements.forEach(element => {
    element.classList.remove("selected");
  });
}

function deselectTrackElements() {
  removeSelectedElementClass();
  hideSelectionPanel();
}

function showSelectionPanel() {
  if (!isSelectionPanelVisible) {
    isSelectionPanelVisible = true;

    createSelectionPanelContainer();
    addClickHandler();
    window.addEventListener("keydown", handleKeydown);
  }
}

function hideSelectionPanel() {
  if (isSelectionPanelVisible) {
    isSelectionPanelVisible = false;

    removeSelectionPanel();
    window.removeEventListener("click", onClick, true);
    window.removeEventListener("keydown", handleKeydown);
  }
}

function selectTrackElement(element, selectMultiple) {
  if (!selectMultiple) {
    removeSelectedElementClass();
  }
  element.classList.toggle("selected");

  if (element.classList.contains("selected")) {
    showSelectionPanel();
  }
  else {
    const elements = getSelectedElements();

    element.blur();

    if (!elements.length) {
      hideSelectionPanel();
    }
  }
}

function selectTrackElements(elements, area, ctrlKey) {
  for (let i = 0; i < elements.length; i++) {
    const element = elements[i];
    const elementClassList = element.ref.classList;

    if (area.right > element.left && area.left < element.right &&
      area.bottom > element.top && area.top < element.bottom) {
      if (ctrlKey && !element.selected && elementClassList.contains("selected")) {
        elementClassList.remove("selected");
        element.removed = true;
      }

      if (!element.removed) {
        elementClassList.add("selected");
        element.selected = true;
      }
    }
    else if (element.selected) {
      elementClassList.remove("selected");
      element.selected = false;
    }
    else if (element.removed) {
      elementClassList.add("selected");
      element.removed = false;
    }
  }
}

function normalizeMousePosition(pos, { min, max }) {
  if (pos > max) {
    return max;
  }
  else if (pos < min) {
    return min;
  }
  return pos;
}

function isAboveThreshold(mousePos, startingPoint) {
  return mousePos.x > startingPoint.x + 2 || mousePos.x < startingPoint.x - 2
  || mousePos.y > startingPoint.y + 2 || mousePos.y < startingPoint.y - 2;
}

function stopScrolling() {
  clearInterval(intervalId);
  intervalId = 0;
}

function resetSelection() {
  selectionElement.remove();
  selectionElement = null;
  selectionArea = {};
  trackElements.length = 0;
}

function update(ctrlKey) {
  updating = true;

  requestAnimationFrame(() => {
    if (selectionElement) {
      updateSelectionArea(mousePos, startingPoint, selectionArea, selectionElement.style);
    }
    selectTrackElements(trackElements, selectionArea, ctrlKey);
    updating = false;
  });
}

function scrollDown(ctrlKey) {
  const { scrollHeight, height } = playlistElementRect;
  playlistElement.scrollTop += 36;
  mousePos.y = playlistElement.scrollTop + height;

  if (mousePos.y >= scrollHeight) {
    mousePos.y = scrollHeight;
    stopScrolling();
  }

  if (!updating) {
    update(ctrlKey);
  }
}

function scrollUp(ctrlKey) {
  playlistElement.scrollTop -= 36;
  mousePos.y = playlistElement.scrollTop;

  if (mousePos.y <= 0) {
    mousePos.y = 0;
    stopScrolling();
  }

  if (!updating) {
    update(ctrlKey);
  }
}

function onMousemove(event) {
  const { top, left, width, height, scrollHeight } = playlistElementRect;
  const mouseYRelatedToPage = event.clientY - top;

  mousePos.x = normalizeMousePosition(event.clientX - left, {
    min: 0,
    max: width
  });
  mousePos.y = normalizeMousePosition(playlistElement.scrollTop + mouseYRelatedToPage, {
    min: playlistOffsetY,
    max: scrollHeight
  });

  event.preventDefault();

  if (!selectionElement && isAboveThreshold(mousePos, startingPoint)) {
    trackElements = getTrackElements();
    selectionElement = initSelectionArea(playlistElement, startingPoint);

    // Remove focus from initial selected element
    document.activeElement.blur();

    if (!event.ctrlKey) {
      removeSelectedElementClass();
    }
    hideSelectionPanel();
    return;
  }

  if (!updating) {
    update(event.ctrlKey);
  }

  if (intervalId && mouseYRelatedToPage > playlistOffsetY && mouseYRelatedToPage < height) {
    stopScrolling();
  }
  else if (!intervalId) {
    let scrollDirection = null;

    if (mouseYRelatedToPage > height && mousePos.y < scrollHeight) {
      scrollDirection = scrollDown;
    }
    else if (mouseYRelatedToPage < playlistOffsetY && mousePos.y > playlistOffsetY) {
      scrollDirection = scrollUp;
    }
    else {
      return;
    }
    intervalId = setInterval(scrollDirection, 40, event.ctrlKey);
  }
}

function onMouseup({ target, ctrlKey, shiftKey }) {
  if (intervalId) {
    stopScrolling();
  }

  if (selectionElement) {
    const elements = getSelectedElements();
    selectTrackIndex = -1;

    resetSelection();

    if (elements.length) {
      showSelectionPanel();
    }
    else {
      hideSelectionPanel();
    }
  }
  else {
    const element = getElementByAttr("data-index", target, playlistElement);

    if (element) {
      const newSelectTrackIndex = parseInt(element.attrValue, 10);

      if (!shiftKey || selectTrackIndex === -1) {
        selectTrackIndex = newSelectTrackIndex;
        selectTrackElement(element.elementRef, ctrlKey);
      }
      else if (selectTrackIndex >= 0 && selectTrackIndex !== newSelectTrackIndex) {
        selectTrackElementRange(selectTrackIndex, newSelectTrackIndex, ctrlKey);
      }
    }
    else if (!ctrlKey) {
      selectTrackIndex = -1;
      deselectTrackElements();
    }
  }
  window.removeEventListener("mousemove", onMousemove);
  window.removeEventListener("mouseup", onMouseup);
}

function selectTrackElementRange(start, end, ctrlKey) {
  const { children } = getPlaylistElement(getVisiblePlaylistId());

  if (start > end) {
    [start, end] = [end, start];
  }
  const elementRange = [...children].slice(start, end + 1);

  if (!ctrlKey) {
    removeSelectedElementClass();
  }

  for (const element of elementRange) {
    element.classList.add("selected");
  }
}

function addClickHandler() {
  // Use setTimeout to skip first click
  setTimeout(() => {
    window.addEventListener("click", onClick, true);
  }, 0);
}

function onClick({ target }) {
  const element = getElementByAttr("data-selection-panel", target);

  if (!element && isOutsideElement(target, playlistElement)) {
    deselectTrackElements();
  }
}

function onMousedown({ currentTarget, target, which, clientX, clientY }) {
  if (which !== 1) {
    return;
  }

  if (getElementByAttr("data-btn", target)) {
    deselectTrackElements();
    return;
  }
  playlistElementRect = getPlaylistElementRect(currentTarget);
  startingPoint.x = clientX - playlistElementRect.left;
  startingPoint.y = currentTarget.scrollTop + clientY - playlistElementRect.top;

  // Don't add event listeners if clicked on scrollbar or playlist header
  if (startingPoint.x < playlistElementRect.width && startingPoint.y > playlistOffsetY) {
    window.addEventListener("mousemove", onMousemove);
    window.addEventListener("mouseup", onMouseup);
  }
}

function handleKeydown({ key, keyCode }) {
  if (key === "Delete" || keyCode === 127) {
    removeSelectedTracks();
    hideSelectionPanel();
  }
}

function getSelectedElements() {
  return Array.from(playlistElement.querySelectorAll(".track.selected"));
}

function getElementIndexes(elements) {
  return elements.map(element => parseInt(element.getAttribute("data-index"), 10));
}

function getSelectedElementIndexes() {
  return getElementIndexes(getSelectedElements());
}

function separatePlaylistTracks(tracks, indexes) {
  const tracksToKeep = [];
  const tracksToRemove = [];

  tracks.forEach(track => {
    if (indexes.includes(track.index)) {
      tracksToRemove.push(track);
    }
    else {
      tracksToKeep.push(track);
    }
  });

  return {
    tracksToRemove,
    tracksToKeep
  };
}

function resetElementIndexes(id) {
  const { sortOrder } = getPlaylistState(id);
  const elements = [...getPlaylistElement(id).children];

  elements.forEach((element, index) => {
    const indexElement = element.querySelector(".list-item-index");

    if (indexElement) {
      indexElement.textContent = index + 1;
    }
    element.setAttribute("data-index", sortOrder[index]);
  });
}

function removeSelectedTracks() {
  const elements = getSelectedElements();
  const pl = getVisiblePlaylist();
  const indexes = getElementIndexes(elements);
  const { tracksToKeep, tracksToRemove } = separatePlaylistTracks(pl.tracks, indexes);
  pl.tracks = tracksToKeep;
  selectTrackIndex = -1;

  elements.forEach(element => element.remove());
  resetTrackIndexes(pl);
  setSortOrder(pl);
  resetElementIndexes(pl.id);
  setPlaybackOrder(pl.id, getSetting("shuffle"));
  updateCurrentTrackIndex(pl.id);
  updatePlaylistEntry(pl.id, tracksToKeep);

  if (!tracksToKeep.length) {
    disableTrackSelection();
    updatePlaylistView(pl);
  }

  if (pl.storePlaylist) {
    postMessageToWorker({
      action: "remove-tracks",
      playlist: {
        id: pl.id,
        tracks: tracksToRemove
      }
    });
  }
  removeQueueTracks(tracksToRemove);
}

window.addEventListener("keydown", event => {
  const modifierKeyPressed = event.shiftKey || event.altKey || event.metaKey;
  const id = getVisiblePlaylistId();

  if (event.target instanceof HTMLInputElement || modifierKeyPressed || !id) {
    return;
  }
  const playlistElement = getPlaylistElement(id);

  if (!playlistElement || !playlistElement.children.length) {
    return;
  }

  if (event.ctrlKey && event.key === "a") {
    event.preventDefault();
    showSelectionPanel();

    for (const element of playlistElement.children) {
      element.classList.add("selected");
    }
  }
});

export {
  enableTrackSelection,
  getSelectedElementIndexes,
  deselectTrackElements
};

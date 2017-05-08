import {
    getElementById,
    removeElement,
    removeElements,
    removeElementClass,
    getElementByAttr,
    isOutsideElement,
    dispatchCustomEvent
} from "../utils.js";
import {
    getPlaylistById,
    updatePlaylistDuration,
    isPlaylistActive,
    getCurrentTrack,
    updateCurrentTrack,
    resetTrackIndexes,
    findTrack,
    getPlaybackOrder,
    setPlaybackIndex
} from "./playlist.js";
import { getSetting } from "../settings.js";
import { getVisiblePlaylistId } from "../tab.js";
import { updatePlaylist } from "./playlist.manage.js";
import { showMoveToBtn } from "./playlist.move-to.js";
import { getPlaylistElement, getPlaylistTrackElements } from "./playlist.view.js";

const startingPoint = {};
const mousePos = {};
let selectedArea = {};
let playlistElement = null;
let playlistElementRect = null;
let trackElements = [];
let maxScrollHeight = 0;
let maxWidth = 0;
let selectionElement = null;
let intervalId = 0;
let animationId = 0;
let allowClick = false;

function enableTrackSelection(id) {
    if (playlistElement) {
        playlistElement.removeEventListener("mousedown", onMousedown);
    }
    playlistElement = getPlaylistElement(`tab-${id}`);
    playlistElement.addEventListener("mousedown", onMousedown);
}

function initSelectionArea(parent) {
    const element = document.createElement("div");

    selectedArea.top = startingPoint.y;
    selectedArea.left = startingPoint.x;
    element.setAttribute("id", "js-selected-area");
    element.setAttribute("class", "selected-area");
    element.style.top = `${startingPoint.y}px`;
    element.style.left = `${startingPoint.x}px`;
    parent.insertBefore(element, parent.firstElementChild);

    return element;
}

function getTrackElements() {
    const elements = getPlaylistTrackElements(getVisiblePlaylistId());
    const parentRect = playlistElementRect;
    const scrollTop = playlistElement.scrollTop;

    return Array.from(elements).map(element => {
        const rect = element.getBoundingClientRect();
        const top = scrollTop + rect.top - parentRect.top;
        const left = rect.left - parentRect.left;
        const right = left + rect.width;
        const bottom = top + rect.height;

        return {
            ref: element,
            top,
            right,
            bottom,
            left
        };
    });
}

function updateSelectedArea(mousePos, startingPoint, areaStyle) {
    let width = mousePos.x - startingPoint.x;
    let height = mousePos.y - startingPoint.y;

    if (width < 0) {
        const left = startingPoint.x + width;

        width *= -1;
        selectedArea.left = left;
        areaStyle.left = `${left}px`;
    }
    else if (selectedArea.left !== startingPoint.x) {
        selectedArea.left = startingPoint.x;
        areaStyle.left = `${startingPoint.x}px`;
    }

    if (height < 0) {
        const top = startingPoint.y + height;

        height *= -1;
        selectedArea.top = top;
        areaStyle.top = `${top}px`;
    }
    else if (selectedArea.top !== startingPoint.y) {
        selectedArea.top = startingPoint.y;
        areaStyle.top = `${startingPoint.y}px`;
    }

    selectedArea.right = selectedArea.left + width;
    selectedArea.bottom = selectedArea.top + height;
    areaStyle.width = `${width}px`;
    areaStyle.height = `${height}px`;
}

function deselectTrackElements() {
    const element = getElementById("js-move-to-panel-container");

    removeElementClass("track", "selected");
    window.removeEventListener("keypress", onKeypress);

    if (element) {
        removeElement(element);
    }
}

function selectTrackElement(element, selectMultiple) {
    if (!selectMultiple) {
        removeElementClass("track", "selected");
    }
    element.classList.toggle("selected");

    if (element.classList.contains("selected")) {
        showMoveToBtn();
    }
}

function selectTrackElements(elements, area, ctrlKey) {
    elements.forEach(element => {
        const elementClassList = element.ref.classList;

        if (area.right > element.left && area.left < element.right
            && area.bottom > element.top && area.top < element.bottom) {
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
    });
}

function adjustMousePosition(pos, max) {
    if (pos > max) {
        return max;
    }
    else if (pos < 0) {
        return 0;
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
    removeElement(selectionElement);
    selectionElement = null;
    selectedArea = {};
    trackElements.length = 0;
}

function update(ctrlKey) {
    cancelAnimationFrame(animationId);
    animationId = requestAnimationFrame(() => {
        if (selectionElement) {
            updateSelectedArea(mousePos, startingPoint, selectionElement.style);
        }
        selectTrackElements(trackElements, selectedArea, ctrlKey);
    });
}

function scrollDown(ctrlKey) {
    playlistElement.scrollTop += 36;
    mousePos.y = playlistElement.scrollTop + playlistElementRect.height;

    if (mousePos.y >= maxScrollHeight) {
        mousePos.y = maxScrollHeight;
        stopScrolling();
    }
    update(ctrlKey);
}

function scrollUp(ctrlKey) {
    playlistElement.scrollTop -= 36;
    mousePos.y = playlistElement.scrollTop;

    if (mousePos.y <= 0) {
        mousePos.y = 0;
        stopScrolling();
    }
    update(ctrlKey);
}

function onMousemove(event) {
    const mouseYRelatedToViewport = event.clientY - playlistElementRect.top;
    const x = event.clientX - playlistElementRect.left;
    const y = playlistElement.scrollTop + mouseYRelatedToViewport;
    mousePos.x = adjustMousePosition(x, maxWidth);
    mousePos.y = adjustMousePosition(y, maxScrollHeight);

    event.preventDefault();

    if (!selectionElement && isAboveThreshold(mousePos, startingPoint)) {
        trackElements = getTrackElements();
        selectionElement = initSelectionArea(playlistElement);

        if (!event.ctrlKey) {
            trackElements.forEach(element => element.ref.classList.remove("selected"));
        }
        return;
    }

    if (!intervalId && mouseYRelatedToViewport > playlistElementRect.height && mousePos.y < maxScrollHeight) {
        intervalId = setInterval(scrollDown, 40, event.ctrlKey);
        return;
    }
    else if (!intervalId && mouseYRelatedToViewport < 0 && mousePos.y > 0) {
        intervalId = setInterval(scrollUp, 40, event.ctrlKey);
        return;
    }
    update(event.ctrlKey);

    if (intervalId && mouseYRelatedToViewport > 0 && mouseYRelatedToViewport < playlistElementRect.height) {
        stopScrolling();
    }
}

function onMouseup({ target, ctrlKey }) {
    allowClick = false;

    if (intervalId) {
        stopScrolling();
    }
    if (selectionElement) {
        const elements = getSelectedTrackElements();

        resetSelection();

        if (elements.length) {
            showMoveToBtn();
            window.addEventListener("keypress", onKeypress);
            window.addEventListener("click", onClick);
        }
    }
    else {
        const item = getElementByAttr(target, "data-index");

        if (item) {
            selectTrackElement(item.elementRef, ctrlKey);
            window.addEventListener("keypress", onKeypress);
            window.addEventListener("click", onClick);
        }
        else {
            deselectTrackElements();
            window.removeEventListener("click", onClick);
        }
    }
    setTimeout(() => {
        allowClick = true;
    }, 0);
    window.removeEventListener("mousemove", onMousemove);
    window.removeEventListener("mouseup", onMouseup);
}

function onClick({ target }) {
    if (!allowClick) {
        return;
    }
    const element = getElementById("js-move-to-panel-container");

    if (!element || isOutsideElement(target, playlistElement) && isOutsideElement(target, element)) {
        deselectTrackElements();
        window.removeEventListener("click", onClick);
    }
}

function onMousedown(event) {
    if (event.which !== 1) {
        return;
    }
    const element = getElementByAttr(event.target, "data-btn");

    if (element) {
        deselectTrackElements();
        return;
    }
    playlistElementRect = playlistElement.getBoundingClientRect();
    maxScrollHeight = playlistElement.scrollHeight;
    maxWidth = playlistElement.clientWidth;
    startingPoint.x = event.clientX - playlistElementRect.left;
    startingPoint.y = playlistElement.scrollTop + event.clientY - playlistElementRect.top;

    // Don't add event listeners if clicked on scrollbar
    if (startingPoint.x < maxWidth) {
        window.addEventListener("mousemove", onMousemove);
        window.addEventListener("mouseup", onMouseup);
    }
}

function onKeypress(event) {
    const key = event.key === "Delete" || event.keyCode === 127;

    if (!key) {
        return;
    }
    removeSelectedTracks();
    window.removeEventListener("keypress", onKeypress);
}

function getSelectedTrackElements() {
    return Array.from(document.querySelectorAll(".track.selected"));
}

function getSelectedTrackIndexes(elements) {
    return elements.map(element => parseInt(element.getAttribute("data-index"), 10));
}

function removeSelectedPlaylistTracks(tracks, selectedTrackIndexes) {
    const filteredTracks = tracks.filter(track => !selectedTrackIndexes.includes(track.index));

    return resetTrackIndexes(filteredTracks);
}

function resetListElementIndexes(elements, startIndex) {
    Array.from(elements).slice(startIndex).forEach((element, index) => {
        element.setAttribute("data-index", startIndex + index);
        element.querySelector(".list-item-index").textContent = startIndex + index + 1;
    });
}

function resetGridElementIndexes(elements, startIndex) {
    Array.from(elements).slice(startIndex).forEach((element, index) => {
        element.setAttribute("data-index", startIndex + index);
    });
}

function resetPlaylistElementIndexes(id, type, selectedTrackIndexes) {
    const smallestIndex = Math.min(...selectedTrackIndexes);
    const elements = getPlaylistTrackElements(id);

    if (type === "list") {
        resetListElementIndexes(elements, smallestIndex);
    }
    else {
        resetGridElementIndexes(elements, smallestIndex);
    }
}

function updateCurrentTrackIndex(playlistId, selectedTrackIndexes) {
    const currentTrack = getCurrentTrack();

    if (currentTrack && isPlaylistActive(playlistId)) {
        const track = findTrack(playlistId, currentTrack.name);
        let index = currentTrack.index;

        if (selectedTrackIndexes.includes(index) || !track) {
            updateCurrentTrack({ index: -1 });
        }
        else {
            index = track.index;
            updateCurrentTrack({ index });
        }
        setPlaybackIndex(index);
    }
}

function removeSelectedTracks() {
    const id = getVisiblePlaylistId();
    const selectedElements = getSelectedTrackElements();
    const pl = getPlaylistById(id);
    const selectedTrackIndexes = getSelectedTrackIndexes(selectedElements);
    const tracks = removeSelectedPlaylistTracks(pl.tracks, selectedTrackIndexes);
    const playbackOrder = getPlaybackOrder(tracks, getSetting("shuffle"));

    removeElements(selectedElements);
    resetPlaylistElementIndexes(id, pl.type, selectedTrackIndexes);
    updatePlaylist(id, { tracks, playbackOrder });
    updateCurrentTrackIndex(id, selectedTrackIndexes);
    removeElement(getElementById("js-move-to-panel-container"));
    updatePlaylistDuration(pl);
    dispatchCustomEvent("track-length-change");
}

export {
    enableTrackSelection,
    getSelectedTrackElements,
    getSelectedTrackIndexes
};

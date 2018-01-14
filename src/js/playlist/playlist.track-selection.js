import {
    removeElement,
    removeElements,
    getElementByAttr,
    isOutsideElement
} from "../utils.js";
import {
    getPlaylistById,
    updatePlaylist,
    getPlaylistDuration,
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
import { postMessageToWorker } from "../worker.js";
import { createMoveToContainer, removeMoveToContainer } from "./playlist.move-to.js";
import { getPlaylistParentElement, getPlaylistTrackElements, updatePlaylistView } from "./playlist.view.js";

const startingPoint = {};
const mousePos = {};
let playlistElement = null;
let playlistElementRect = null;
let selectionElement = null;
let selectionArea = {};
let trackElements = [];
let intervalId = 0;
let updating = false;
let isMoveToVisible = false;

function enableTrackSelection({ id, tracks }) {
    if (playlistElement) {
        playlistElement.removeEventListener("mousedown", onMousedown);
    }

    if (!tracks.length) {
        return;
    }
    playlistElement = getPlaylistParentElement(id);
    playlistElement.addEventListener("mousedown", onMousedown);
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

function initSelectionArea(parent, startingPoint) {
    const element = document.createElement("div");

    selectionArea.top = startingPoint.y;
    selectionArea.left = startingPoint.x;
    element.setAttribute("id", "js-selected-area");
    element.setAttribute("class", "selected-area");
    element.style.top = `${startingPoint.y}px`;
    element.style.left = `${startingPoint.x}px`;
    parent.insertBefore(element, parent.firstElementChild);

    return element;
}

function getTrackElements() {
    const elements = getPlaylistTrackElements(getVisiblePlaylistId());

    return Array.from(elements).map(element => {
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
        const top = startingPoint.y + height;

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
    hideMoveTo();
}

function showMoveTo() {
    if (!isMoveToVisible) {
        isMoveToVisible = true;

        createMoveToContainer();
        addClickHandler();
        window.addEventListener("keypress", onKeypress);
    }
}

function hideMoveTo() {
    if (isMoveToVisible) {
        isMoveToVisible = false;

        removeMoveToContainer();
        window.removeEventListener("click", onClick, true);
        window.removeEventListener("keypress", onKeypress);
    }
}

function selectTrackElement(element, selectMultiple) {
    if (!selectMultiple) {
        removeSelectedElementClass();
    }
    element.classList.toggle("selected");

    if (element.classList.contains("selected")) {
        showMoveTo();
    }
    else {
        const elements = getSelectedElements();

        element.blur();

        if (!elements.length) {
            hideMoveTo();
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

function normalizeMousePosition(pos, max) {
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

function scrollDown(ctrlKey, playlistElement, { scrollHeight, height }) {
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

function scrollUp(ctrlKey, playlistElement) {
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

    mousePos.x = normalizeMousePosition(event.clientX - left, width);
    mousePos.y = normalizeMousePosition(playlistElement.scrollTop + mouseYRelatedToPage, scrollHeight);

    event.preventDefault();

    if (!selectionElement && isAboveThreshold(mousePos, startingPoint)) {
        trackElements = getTrackElements();
        selectionElement = initSelectionArea(playlistElement, startingPoint);

        // Remove focus from initial selected element
        document.activeElement.blur();

        if (!event.ctrlKey) {
            removeSelectedElementClass();
        }
        hideMoveTo();
        return;
    }

    if (!updating) {
        update(event.ctrlKey);
    }

    if (intervalId && mouseYRelatedToPage > 0 && mouseYRelatedToPage < height) {
        stopScrolling();
    }
    else if (!intervalId) {
        let scrollDirection = null;

        if (mouseYRelatedToPage > height && mousePos.y < scrollHeight) {
            scrollDirection = scrollDown;
        }
        else if (mouseYRelatedToPage < 0 && mousePos.y > 0) {
            scrollDirection = scrollUp;
        }
        else {
            return;
        }
        intervalId = setInterval(scrollDirection, 40, event.ctrlKey, playlistElement, playlistElementRect);
    }
}

function onMouseup({ target, ctrlKey }) {
    if (intervalId) {
        stopScrolling();
    }

    if (selectionElement) {
        const elements = getSelectedElements();

        resetSelection();

        if (elements.length) {
            showMoveTo();
        }
        else {
            hideMoveTo();
        }
    }
    else {
        const element = getElementByAttr("data-index", target, playlistElement);

        if (element) {
            selectTrackElement(element.elementRef, ctrlKey);
        }
        else if (!ctrlKey) {
            deselectTrackElements();
        }
    }
    window.removeEventListener("mousemove", onMousemove);
    window.removeEventListener("mouseup", onMouseup);
}

function addClickHandler() {

    // Use setTimeout to skip first click
    setTimeout(() => {
        window.addEventListener("click", onClick, true);
    }, 0);
}

function onClick({ target }) {
    const element = getElementByAttr("data-move-to", target);

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

    // Don't add event listeners if clicked on scrollbar
    if (startingPoint.x < playlistElementRect.width) {
        window.addEventListener("mousemove", onMousemove);
        window.addEventListener("mouseup", onMouseup);
    }
}

function onKeypress({ key, keyCode }) {
    if (key === "Delete" || keyCode === 127) {
        removeSelectedTracks();
        hideMoveTo();
    }
}

function getSelectedElements() {
    return Array.from(playlistElement.querySelectorAll(".track.selected"));
}

function getElementIndexes(elements) {
    return elements.map(element => parseInt(element.getAttribute("data-index"), 10));
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
        tracksToKeep: resetTrackIndexes(tracksToKeep)
    };
}

function resetListElementIndexes(elements, startIndex) {
    elements.forEach((element, index) => {
        element.setAttribute("data-index", startIndex + index);
        element.querySelector(".list-item-index").textContent = startIndex + index + 1;
    });
}

function resetGridElementIndexes(elements, startIndex) {
    elements.forEach((element, index) => {
        element.setAttribute("data-index", startIndex + index);
    });
}

function resetPlaylistElementIndexes(id, type, selectedTrackIndexes) {
    const startIndex = Math.min(...selectedTrackIndexes);
    const elements = Array.from(getPlaylistTrackElements(id)).slice(startIndex);

    if (type === "list") {
        resetListElementIndexes(elements, startIndex);
    }
    else {
        resetGridElementIndexes(elements, startIndex);
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
    const elements = getSelectedElements();
    const pl = getPlaylistById(getVisiblePlaylistId());
    const indexes = getElementIndexes(elements);
    const { tracksToKeep, tracksToRemove } = separatePlaylistTracks(pl.tracks, indexes);

    removeElements(elements);
    resetPlaylistElementIndexes(pl.id, pl.type, indexes);
    updatePlaylist(pl.id, {
        playbackOrder: getPlaybackOrder(tracksToKeep, getSetting("shuffle")),
        tracks: tracksToKeep,
        duration: getPlaylistDuration(tracksToKeep)
    });
    postMessageToWorker({
        action: "remove-tracks",
        playlist: {
            _id: pl._id,
            tracks: tracksToRemove
        }
    });
    updateCurrentTrackIndex(pl.id, indexes);

    if (!tracksToKeep.length) {
        enableTrackSelection(pl);
        updatePlaylistView(pl);
    }
}

export {
    enableTrackSelection,
    getSelectedElements,
    getElementIndexes,
    deselectTrackElements
};

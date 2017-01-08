import { removeElement, removeElementClass, getElementByAttr, isOutsideElement } from "./../main.js";
import { getSelectedTrackElements } from "./playlist.manage.js";
import { showMoveToBtn, removeMoveToPanelContainer } from "./playlist.move-to.js";

const startingPoint = {};
const mousePos = {};
let selectedArea = {};
let playlistElement = null;
let playlistElementRect = null;
let trackElements = [];
let maxScrollHeight = 0;
let selectionElement = null;
let selectionEnabled = false;
let intervalId = 0;
let updating = false;
let keepTracksSelected = false;

function enableTrackSelection(id) {
    if (playlistElement) {
        playlistElement.removeEventListener("mousedown", onMousedown);
    }
    playlistElement = document.getElementById(`js-${id}`);
    playlistElement.addEventListener("mousedown", onMousedown);
}

function initSelectionArea(parent) {
    const selectionElement = document.createElement("li");

    selectedArea.top = startingPoint.y;
    selectedArea.left = startingPoint.x;
    selectionElement.setAttribute("id", "js-selected-area");
    selectionElement.setAttribute("class", "selected-area");
    selectionElement.style.top = `${startingPoint.y}px`;
    selectionElement.style.left = `${startingPoint.x}px`;
    parent.insertBefore(selectionElement, parent.firstElementChild);

    return selectionElement;
}

function removeSelectionArea() {
    removeElement(selectionElement);
    selectionElement = null;
}

function getTrackElements(elements) {
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

function prevendTrackDeselection(gotSelectedTracks) {
    if (gotSelectedTracks) {
        keepTracksSelected = true;
        showMoveToBtn();
    }
}

function deselectTrackElements(startElement) {
    if (!keepTracksSelected && isOutsideElement(startElement, "js-move-to-panel-container")) {
        removeElementClass("track", "selected");
        removeMoveToPanelContainer();
    }
    keepTracksSelected = false;
}

function selectTrackElement(element, selectMultiple) {
    const item = getElementByAttr(element, "data-index");

    if (item) {
        if (!selectMultiple) {
            removeElementClass("track", "selected");
        }
        keepTracksSelected = true;
        item.elementRef.classList.toggle("selected");
        prevendTrackDeselection(item.elementRef.classList.contains("selected"));
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
        && mousePos.y > startingPoint.y + 2 || mousePos.y < startingPoint.y - 2;
}

function stopScrolling() {
    clearInterval(intervalId);
    intervalId = 0;
}

function resetSelection() {
    requestAnimationFrame(removeSelectionArea);
    selectionEnabled = false;
    selectedArea = {};
    trackElements.length = 0;
}

function update(ctrlKey) {
    updating = true;
    requestAnimationFrame(() => {
        updateSelectedArea(mousePos, startingPoint, selectionElement.style);
        selectTrackElements(trackElements, selectedArea, ctrlKey);
        updating = false;
    });
}

function scrollDown(ctrlKey) {
    playlistElement.scrollTop += 36;
    mousePos.y = playlistElement.scrollTop + playlistElementRect.height;

    if (mousePos.y >= maxScrollHeight) {
        mousePos.y = maxScrollHeight;
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
    const mouseYRelatedToViewport = event.clientY - playlistElementRect.top;
    const x = event.clientX - playlistElementRect.left;
    const y = playlistElement.scrollTop + mouseYRelatedToViewport;
    mousePos.x = adjustMousePosition(x, playlistElement.clientWidth);
    mousePos.y = adjustMousePosition(y, maxScrollHeight);

    event.preventDefault();

    if (!selectionEnabled) {
        selectionEnabled = isAboveThreshold(mousePos, startingPoint);

        if (selectionEnabled && !selectionElement) {
            trackElements = getTrackElements(playlistElement.children);
            selectionElement = initSelectionArea(playlistElement);

            if (!event.ctrlKey) {
                trackElements.forEach(element => element.ref.classList.remove("selected"));
            }
        }
        return;
    }

    if (!intervalId && mouseYRelatedToViewport > playlistElementRect.height && mousePos.y < maxScrollHeight) {
        intervalId = setInterval(() => {
            scrollDown(event.ctrlKey);
        }, 40);
        return;
    }
    else if (!intervalId && mouseYRelatedToViewport < 0 && mousePos.y > 0) {
        intervalId = setInterval(() => {
            scrollUp(event.ctrlKey);
        }, 40);
        return;
    }
    else if (!updating) {
        update(event.ctrlKey);
    }

    if (intervalId && mouseYRelatedToViewport > 0 && mouseYRelatedToViewport < playlistElementRect.height) {
        stopScrolling();
    }
}

function onMouseup({ target, ctrlKey }) {
    if (intervalId) {
        stopScrolling();
    }

    if (selectionEnabled) {
        const selectedElements = getSelectedTrackElements();

        resetSelection();
        prevendTrackDeselection(selectedElements.length);
    }
    else {
        selectTrackElement(target, ctrlKey);
    }
    window.removeEventListener("mousemove", onMousemove);
    window.removeEventListener("mouseup", onMouseup);

    if (!isOutsideElement(target, playlistElement.id)) {
        deselectTrackElements(target);
    }
}

function onMousedown(event) {
    if (event.which !== 1) {
        return;
    }
    playlistElementRect = playlistElement.getBoundingClientRect();
    startingPoint.x = event.clientX - playlistElementRect.left;
    startingPoint.y = playlistElement.scrollTop + event.clientY - playlistElementRect.top;
    maxScrollHeight = playlistElement.scrollHeight;

    // Don't add event listeners if clicked on scrollbar
    if (startingPoint.x < playlistElement.clientWidth) {
        window.addEventListener("mousemove", onMousemove);
        window.addEventListener("mouseup", onMouseup);
    }
}

export {
    enableTrackSelection,
    deselectTrackElements
};

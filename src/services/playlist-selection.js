import { dispatchCustomEvent } from "../utils";
import { getPlaylistState } from "services/playlist";
import { getSearchValue } from "services/playlist-view";

let playlist = {};
let selection = {};
let selectTrackIndex = -1;
let updating = false;
let pointerPosition = null;
let trackElements = null;
let raf = 0;
let intervalId = 0;
let downTimeoutId = 0;
let mobileSelectionEnabled = false;


function enableTrackSelection(element, { viewMode, tracks }) {
  disableTrackSelection();

  if (tracks.length) {
    playlist.offsetY = viewMode === "grid" ? 0 : 40;
    playlist.element = element;
    element.addEventListener("pointerdown", handlePointerDown);
  }
}

function disableTrackSelection() {
  if (playlist.element) {
    selectTrackIndex = -1;
    playlist.element.removeEventListener("pointerdown", handlePointerDown);
    playlist = {};
  }
}

function handlePointerDown(event) {
  if (event.which !== 1) {
    return;
  }
  const isHoverableDevice = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  window.removeEventListener("pointerup", handleOutsideClick);

  if (isHoverableDevice) {
    if (event.target.closest(".artwork-btn")) {
      dispatchCustomEvent("selection", false);
      resetSelectedElements();
      return;
    }
    setPlaylistElementRect(event.currentTarget);

    const startingPoint = {};

    startingPoint.x = event.clientX - playlist.rect.left;
    startingPoint.y = event.currentTarget.scrollTop + event.clientY - playlist.rect.top;

    // Don't add event listeners if pointer is on scrollbar or playlist header
    if (startingPoint.x < playlist.rect.width && startingPoint.y > event.currentTarget.scrollTop + playlist.offsetY) {
      selection.startingPoint = startingPoint;

      window.addEventListener("pointermove", handlePointerMove);
      window.addEventListener("pointerup", handlePointerUp);
    }
  }
  else {
    window.addEventListener("contextmenu", preventContextMenu, { once: true });

    if (event.target.closest(".artwork-btn")) {
      disableMobileSelection();
      return;
    }

    if (mobileSelectionEnabled) {
      const element = event.target.closest(".track");

      if (element) {
        selectTrackElement(element, true);
      }
    }
    else {
      window.addEventListener("pointercancel", resetPointerDownTimeout, { once: true });
      window.addEventListener("pointerup", resetPointerDownTimeout, { once: true });

      downTimeoutId = setTimeout(() => {
        const element = event.target.closest(".track");

        if (element) {
          selectTrackElement(element, true);
          enableMobileSelection();
        }
      }, 1000);
    }
  }
}

function handlePointerMove(event) {
  if (updating) {
    return;
  }
  updating = true;

  raf = requestAnimationFrame(() => {
    const { top, left, width, height, scrollHeight } = playlist.rect;
    const pointerYRelativeToPage = event.clientY - top;

    pointerPosition = {
      x: normalizePointerPosition(event.clientX - left, { min: 0, max: width }),
      y: normalizePointerPosition(playlist.element.scrollTop + pointerYRelativeToPage, { min: playlist.offsetY, max: scrollHeight })
    };

    if (selection.element) {
      updateSelectionArea();
      selectTrackElements(event.ctrlKey);

      if (!intervalId) {
        let scrollDirection = null;

        if (pointerYRelativeToPage > height && pointerPosition.y < scrollHeight) {
          scrollDirection = scrollDown;
        }
        else if (pointerYRelativeToPage < playlist.offsetY && pointerPosition.y > playlist.offsetY) {
          scrollDirection = scrollUp;
        }

        if (scrollDirection) {
          intervalId = setInterval(scrollDirection, 40, event.ctrlKey);
        }
      }
      else if (pointerYRelativeToPage > playlist.offsetY && pointerYRelativeToPage < height) {
        stopScrolling();
      }
    }
    else if (isAboveThreshold(pointerPosition)) {
      setTrackElements();
      initSelectionArea();

      if (!event.ctrlKey) {
        resetSelectedElements();
      }
      window.removeEventListener("pointerup", handleOutsideClick);
      dispatchCustomEvent("selection", false);
    }
    updating = false;
  });
}

function handlePointerUp({ target, ctrlKey, shiftKey }) {
  if (raf) {
    cancelAnimationFrame(raf);
    raf = 0;
    updating = false;

    if (intervalId) {
      stopScrolling();
    }
  }

  if (selection.element) {
    const elements = getSelectedElements();

    selectTrackIndex = -1;
    selection.element.remove();
    selection = {};
    trackElements.length = 0;

    if (elements.length) {
      window.addEventListener("pointerup", handleOutsideClick);
      dispatchCustomEvent("selection", true);
    }
  }
  else {
    const trackElement = target.closest(".track");

    if (trackElement) {
      let index = 0;

      for (const element of trackElement.parentElement.children) {
        if (element === trackElement) {
          break;
        }
        else {
          index += 1;
        }
      }

      if (!shiftKey || selectTrackIndex === -1) {
        selectTrackIndex = index;
        selectTrackElement(trackElement, ctrlKey);
      }
      else if (selectTrackIndex >= 0 && selectTrackIndex !== index) {
        selectTrackElementRange(selectTrackIndex, index, ctrlKey);
      }
    }
    else if (!ctrlKey) {
      selectTrackIndex = -1;
      resetSelectedElements();
      dispatchCustomEvent("selection", false);
    }
  }
  window.removeEventListener("pointermove", handlePointerMove);
  window.removeEventListener("pointerup", handlePointerUp);
}

function handleOutsideClick({ target }) {
  if (target.closest(".playlist-view") || target.closest(".js-selection-btn")) {
    return;
  }
  mobileSelectionEnabled = false;

  window.removeEventListener("pointerup", handleOutsideClick);
  dispatchCustomEvent("selection", false);
  resetSelectedElements();
}

function preventContextMenu(event) {
  event.preventDefault();
}

function resetPointerDownTimeout() {
  clearTimeout(downTimeoutId);
}

function enableMobileSelection() {
  mobileSelectionEnabled = true;
}

function disableMobileSelection() {
  mobileSelectionEnabled = false;

  dispatchCustomEvent("selection", false);
  resetSelectedElements();
  window.removeEventListener("pointerup", handleOutsideClick);
}

function resetSelection() {
  mobileSelectionEnabled = false;

  resetSelectedElements();
  window.removeEventListener("pointerup", handleOutsideClick);
}

function getSelectedElements() {
  return playlist.element.querySelectorAll(".track.selected");
}

function resetSelectedElements() {
  const elements = getSelectedElements();

  for (const element of elements) {
    element.classList.remove("selected");
  }
}

function setPlaylistElementRect(element) {
  playlist.rect = {
    top: element.offsetTop,
    left: element.offsetLeft,
    width: element.clientWidth - 1, // clientWidth excludes scrollbar width
    height: element.offsetHeight,
    scrollHeight: element.scrollHeight
  };
}

function selectTrackElement(element, ctrlKey) {
  if (!ctrlKey) {
    resetSelectedElements();
  }
  element.classList.toggle("selected");

  if (element.classList.contains("selected")) {
    dispatchCustomEvent("selection", true);
    window.addEventListener("pointerup", handleOutsideClick);
  }
  else {
    const elements = getSelectedElements();

    if (elements.length === 0) {
      mobileSelectionEnabled = false;

      dispatchCustomEvent("selection", false);
      window.removeEventListener("pointerup", handleOutsideClick);
    }
  }
}

function selectTrackElementRange(start, end, ctrlKey) {
  const { children } = playlist.element.lastElementChild;

  if (start > end) {
    [start, end] = [end, start];
  }
  const elementRange = [...children].slice(start, end + 1);

  if (!ctrlKey) {
    resetSelectedElements();
  }

  for (const element of elementRange) {
    element.classList.add("selected");
  }
}

function normalizePointerPosition(position, { min, max }) {
  if (position > max) {
    return max;
  }
  else if (position < min) {
    return min;
  }
  return position;
}

function initSelectionArea() {
  selection.area = {
    top: selection.startingPoint.y,
    left: selection.startingPoint.x
  };

  playlist.element.insertAdjacentHTML("afterbegin", `
    <div class="selection-area" style="top: ${selection.startingPoint.y}px; left: ${selection.startingPoint.x}px"></div>
  `);

  selection.element = playlist.element.firstElementChild;
}

function updateSelectionArea() {
  const style = selection.element.style;
  let width = pointerPosition.x - selection.startingPoint.x;
  let height = pointerPosition.y - selection.startingPoint.y;

  if (width < 0) {
    const left = selection.startingPoint.x + width;

    width *= -1;
    selection.area.left = left;
    style.left = `${left}px`;
  }
  else if (selection.area.left !== selection.startingPoint.x) {
    selection.area.left = selection.startingPoint.x;
    style.left = `${selection.startingPoint.x}px`;
  }

  if (height < 0) {
    let top = selection.startingPoint.y + height;

    if (top < playlist.offsetY) {
      top = playlist.offsetY;
    }
    height *= -1;
    selection.area.top = top;
    style.top = `${top}px`;
  }
  else if (selection.area.top !== selection.startingPoint.y) {
    selection.area.top = selection.startingPoint.y;
    style.top = `${selection.startingPoint.y}px`;
  }
  selection.area.right = selection.area.left + width;
  selection.area.bottom = selection.area.top + height;
  style.width = `${width}px`;
  style.height = `${height}px`;
}

function selectTrackElements(ctrlKey) {
  for (const element of trackElements) {
    const elementClassList = element.elementRef.classList;

    if (selection.area.right > element.left && selection.area.left < element.right &&
      selection.area.bottom > element.top && selection.area.top < element.bottom) {
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

function stopScrolling() {
  clearInterval(intervalId);
  intervalId = 0;
}

function scrollDown(ctrlKey) {
  const { scrollHeight, height } = playlist.rect;
  playlist.element.scrollTop += 36;
  pointerPosition.y = playlist.element.scrollTop + height;

  if (pointerPosition.y >= scrollHeight) {
    pointerPosition.y = scrollHeight;
    stopScrolling();
  }
  updateSelectionArea();
  selectTrackElements(ctrlKey);
}

function scrollUp(ctrlKey) {
  playlist.element.scrollTop -= 36;
  pointerPosition.y = playlist.element.scrollTop;

  if (pointerPosition.y <= 0) {
    pointerPosition.y = 0;
    stopScrolling();
  }
  updateSelectionArea();
  selectTrackElements(ctrlKey);
}

function isAboveThreshold(mousePos) {
  return mousePos.x > selection.startingPoint.x + 2 || mousePos.x < selection.startingPoint.x - 2
  || mousePos.y > selection.startingPoint.y + 2 || mousePos.y < selection.startingPoint.y - 2;
}

function setTrackElements() {
  const { children } = playlist.element.lastElementChild;

  trackElements = Array.from(children).map(element => {
    const top = element.offsetTop;
    const left = element.offsetLeft;

    return {
      elementRef: element,
      top,
      left,
      right: left + element.offsetWidth,
      bottom: top + element.offsetHeight
    };
  });
}

function selectedAllTracks() {
  const value = getSearchValue();
  const selector = value ? ".track:not(.hidden)" : ".track";
  const elements = playlist.element.querySelectorAll(selector);

  if (elements.length) {
    for (const element of elements) {
      element.classList.add("selected");
    }
    window.addEventListener("pointerup", handleOutsideClick);

    return true;
  }
}

function getElementIndexes(elements) {
  return [...elements].map(element => Number(element.getAttribute("data-index")));
}

function resetElementIndexes(id, viewMode) {
  const { sortOrder } = getPlaylistState(id);
  const { children } = playlist.element.lastElementChild;

  for (let i = 0; i < children.length; i += 1) {
    const element = children[i];
    const trackIndex = sortOrder[i];

    if (viewMode !== "grid") {
      const indexElement = element.querySelector(".track-index");

      if (indexElement) {
        indexElement.textContent = i + 1;
      }
    }
    element.setAttribute("data-index", trackIndex);
  }
}

function removeElements(elements) {
  for (const element of elements) {
    element.remove();
  }
}

function removeSelectedElements(elements, { id, viewMode }) {
  removeElements(elements);
  resetElementIndexes(id, viewMode);
  window.removeEventListener("pointerup", handleOutsideClick);
}

export {
  enableTrackSelection,
  disableTrackSelection,
  resetSelection,
  getElementIndexes,
  getSelectedElements,
  selectedAllTracks,
  removeSelectedElements
};

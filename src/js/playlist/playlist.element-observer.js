import { getTab, getVisiblePlaylist } from "../tab.js";
import { getPlaylistElement, creatItemContent } from "./playlist.view.js";

const observers = {};

function handleIntersectingEntry(entry) {
  const { id, tracks, type } = getVisiblePlaylist();
  const track = tracks[entry.getAttribute("data-index")];

  entry.innerHTML = creatItemContent(track, id, type);
}

function callback(entries) {
  entries.forEach(({ isIntersecting, target }) => {
    const isEmpty = !target.childElementCount;

    if (isIntersecting && isEmpty) {
      handleIntersectingEntry(target);
    }
    else if (!isIntersecting && !isEmpty && !target.contains(document.activeElement)) {
      target.innerHTML = "";
    }
  });
}

function observePlaylist(id) {
  if (!IntersectionObserver || observers[id]) {
    return;
  }
  observers[id] = new IntersectionObserver(callback, {
    root: getTab(id),
    rootMargin: "120px 0px"
  });
  const { children } = getPlaylistElement(id);

  observeElements(id, Array.from(children));
}

function reObservePlaylist(id) {
  if (observers[id]) {
    removePlaylistObserver(id);
  }
  observePlaylist(id);
}

function observeElements(id, elements) {
  elements.forEach(element => {
    observers[id].observe(element);
  });
}

function removePlaylistObserver(id) {
  if (observers[id]) {
    observers[id].disconnect();
    delete observers[id];
  }
}

export {
  observePlaylist,
  reObservePlaylist,
  removePlaylistObserver
};

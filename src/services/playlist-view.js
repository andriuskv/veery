import { getPlaylistState, getPlaylistById } from "services/playlist";
import { enableTrackSelection, disableTrackSelection } from "services/playlist-selection";
import { getActivePlaylistId, getActiveTrack, getPlayerState } from "services/player";
import { getArtwork } from "services/artwork";

let playlistElement = null;
let observer = null;
let visiblePlaylistId = "";
let searchValue = "";
let activeTrack = null;
let scrollPos = 0;

function getVisiblePlaylistId() {
  return visiblePlaylistId;
}

function observerCallback(entries) {
  entries.forEach(({ isIntersecting, target }) => {
    const { id, tracks, viewMode } = getPlaylistById(visiblePlaylistId);
    const index = Number(target.getAttribute("data-index"));
    const track = tracks[index];

    if (!track) {
      return;
    }

    if (isIntersecting) {
      target.innerHTML = createItem(structuredClone(track), id, viewMode);
    }
    else {
      target.innerHTML = createItemPlaceholder(track, viewMode);
    }
  });
}

function observePlaylist(root) {
  if (observer) {
    observer.disconnect();
  }
  observer = new IntersectionObserver(observerCallback, {
    root,
    rootMargin: "200px 0px"
  });
  const { children } = root.lastElementChild;

  Array.from(children).forEach(element => {
    observer.observe(element);
  });
}

function reobserveTrack(track) {
  const { children } = observer.root.lastElementChild;
  const { sortOrder } = getPlaylistState("local-files");
  const elementIndex = sortOrder.indexOf(track.index);
  const element = children[elementIndex];

  if (element) {
    observer.unobserve(element);
    observer.observe(element);
  }
}

function savePlaylistScrollPos() {
  if (playlistElement) {
    scrollPos = playlistElement.scrollTop;
  }
}

function resetPlaylistScrollPos() {
  scrollPos = 0;
}

function restorePlaylistScrollPos() {
  requestAnimationFrame(() => {
    playlistElement.scrollTop = scrollPos;
    scrollPos = 0;
  });
}

function cleanupPlaylistView() {
  if (observer) {
    observer.disconnect();
    observer = null;
  }
  visiblePlaylistId = "";
  searchValue = "";
  playlistElement = null;

  disableTrackSelection();

  window.removeEventListener("track", handleTrackUpdate);
  window.removeEventListener("tracks", handleTracksUpdate);
}

function createItem(item, id, viewMode) {
  item.title = item.title.replace(/<(.+?)>/g, (_, g1) => `&lt;${g1}&gt;`);

  if (viewMode === "grid") {
    return createGridItem(item, id);
  }
  else if (viewMode === "compact") {
    return createCompactItem(item, id);
  }
  return createMinimalItem(item, id);
}

function createMinimalItem(item, playlistId) {
  const { sortOrder } = getPlaylistState(playlistId);
  const index = sortOrder.indexOf(item.index);
  const { title, id } = getPlayPauseIcon(item.index, playlistId);

  return `
    <div class="track-first-col">
      <div class="track-index">${index + 1}</div>
      <button class="btn icon-btn artwork-btn" title="${title}">
        ${getIcon({ iconId: id, className: "artwork-btn-icon" })}
      </button>
    </div>
    <div class="track-col">${item.title}</div>
    <div class="track-col">${item.artist}</div>
    <div class="track-col">${item.album}</div>
    <div class="track-last-col">${item.duration}</div>
  `;
}

function createMinimalItemPlaceholder(track) {
  return `
    <div class="track-first-col">
      <div class="track-index-placeholder"></div>
    </div>
    <div class="track-col">
      <div class="track-col-inner"></div>
    </div>
    <div class="track-col">
      ${track.artist ? `<div class="track-col-inner"></div>` : ""}
    </div>
    <div class="track-col">
      ${track.album ? `<div class="track-col-inner"></div>` : ""}
    </div>
    <div class="track-last-col">
      <div class="track-duration-placeholder"></div>
    </div>
  `;
}

function createCompactItem(item, playlistId) {
  const { title, id } = getPlayPauseIcon(item.index, playlistId);
  const { sortOrder } = getPlaylistState(playlistId);
  const index = sortOrder.indexOf(item.index);

  return `
    <div class="track-first-col">
      <div class="track-index">${index + 1}</div>
      <button class="btn icon-btn artwork-btn" title="${title}">
        ${getIcon({ iconId: id, className: "artwork-btn-icon" })}
      </button>
    </div>
    <div class="artwork-container compact-item-thumbnail">
      <img src="${getArtwork(item.artworkId).small.url}" class="artwork" alt="">
    </div>
    ${getCompactTrackInfo(item)}
    <div class="track-col">${item.album}</div>
    <div class="track-last-col">${item.duration}</div>
  `;
}

function createCompactItemPlaceholder(track) {
  return `
    <div class="track-first-col">
      <div class="track-index-placeholder"></div>
    </div>
    <div class="artwork-container compact-item-thumbnail"></div>
    <div class="track-col">
      <div class="compact-item-title-placeholder"></div>
      <div class="compact-item-artist-placeholder"></div>
    </div>
    <div class="track-col">
      ${track.album ? `<div class="track-col-inner"></div>` : ""}
    </div>
    <div class="track-last-col">
      <div class="track-duration-placeholder"></div>
    </div>
  `;
}

function createGridItem(item, playlistId) {
  const { title, id } = getPlayPauseIcon(item.index, playlistId);

  return `
    <div class="artwork-container grid-item-thumbnail">
      <img src="${getArtwork(item.artworkId).small.url}" class="artwork" alt="">
      <button class="btn icon-btn artwork-btn" title="${title}">
        ${getIcon({ iconId: id, className: "artwork-btn-icon" })}
      </button>
    </div>
    ${getGridTrackInfo(item)}
  `;
}

function createGridItemPlaceholder() {
  return `
    <div class="artwork-container grid-item-thumbnail placeholder"></div>
    <div class="grid-item-info-placeholder">
      <div class="grid-item-title-placeholder"></div>
      <div class="grid-item-artist-placeholder"></div>
      <div class="grid-item-duration-placeholder"></div>
    </div>
  `;
}

function getGridTrackInfo(track) {
  return `
    <div class="track-info">
      <div class="track-info-item track-title multiline">${track.title}</div>
      ${track.artist ? `<div class="track-info-item">${track.artist}</div>` : ""}
      <div class="track-info-item-duration">${track.duration}</div>
    </div>
  `;
}

function getCompactTrackInfo(track) {
  return `
    <div class="track-info">
      <div class="track-info-item track-title${track.artist ? "" : " multiline"}">${track.title}</div>
      ${track.artist ? `<div class="track-info-item">${track.artist}</div>` : ""}
    </div>
  `;
}

function getIcon(config) {
  const elementId = config.elementId ? ` id=${config.elementId}` : "";
  const className = config.className ? ` class="${config.className}"` : "";
  const title = config.title ? `<title>${config.title}</title>` : "";

  return `
    <svg viewBox="0 0 24 24"${elementId}${className}>
      ${title}
      <use href="#${config.iconId}"></use>
    </svg>
  `;
}

function createMinimal(id, items) {
  return `
    <ul class="playlist-view-header">
      <li class="track-first-col">#</li>
      <li class="track-col">TITLE</li>
      <li class="track-col">ARTIST</li>
      <li class="track-col">ALBUM</li>
      <li class="track-last-col">DURATION</li>
    </ul>
    <ul id="js-${id}" class="playlist-items minimal-items">${items}</ul>
  `;
}

function createCompact(id, items) {
  return `
  <ul class="playlist-view-header">
    <li class="track-first-col">#</li>
    <li class="compact-item-second-col">TITLE</li>
    <li class="track-col">ALBUM</li>
    <li class="track-last-col">DURATION</li>
  </ul>
  <ul id="js-${id}" class="playlist-items compact-items">${items}</ul>
  `;
}

function createGrid(id, items) {
  return `<ul id="js-${id}" class="playlist-items grid-items">${items}</ul>`;
}

function createItemContainers(playlist) {
  const { id, tracks } = playlist;
  const { sortOrder } = getPlaylistState(id);
  let html = "";

  for (const index of sortOrder) {
    const track = tracks[index];

    html += createItemContainer(track, playlist);
  }
  return html;
}

function createItemContainer(track, { id, viewMode }) {
  const placeholder = createItemPlaceholder(track, viewMode);
  let classNames = "";

  if (searchValue) {
    const regex = new RegExp(`(${searchValue})`, "i");
    const matches = regex.test(track.title) || regex.test(track.artist) || regex.test(track.album);

    console.log(track);

    if (!matches) {
      classNames += " hidden";
    }
  }

  if (activeTrack) {
    let playlistId = id;
    let trackIndex = track.index;

    if (id === "search") {
      playlistId = track.playlistId;
      trackIndex = track.playlistIndex;
    }

    if (activeTrack.playlistId === playlistId && activeTrack.index === trackIndex) {
      classNames += " playing";
    }
  }
  return `<li class="track ${viewMode}-item${classNames}" data-index="${track.index}">${placeholder}</li>`;
}

function createItemPlaceholder(track, viewMode) {
  if (viewMode === "grid") {
    return createGridItemPlaceholder();
  }
  else if (viewMode === "compact") {
    return createCompactItemPlaceholder(track);
  }
  return createMinimalItemPlaceholder(track);
}

function createPlaylistView(container, playlist) {
  const html = createItemContainers(playlist);

  playlistElement = container;
  visiblePlaylistId = playlist.id;

  if (playlist.viewMode === "grid") {
    container.innerHTML = createGrid(playlist.id, html);
  }
  else if (playlist.viewMode === "compact") {
    container.innerHTML = createCompact(playlist.id, html);
  }
  else if (playlist.viewMode === "minimal") {
    container.innerHTML = createMinimal(playlist.id, html);
  }
  observePlaylist(container);

  if (playlist.id === "local-files") {
    window.addEventListener("track", handleTrackUpdate);
  }

  if (playlist.id !== "search") {
    window.addEventListener("tracks", handleTracksUpdate);
  }
  enableTrackSelection(container, playlist.viewMode);
}

function updatePlaylistView(container, playlistId) {
  const playlist = getPlaylistById(playlistId);

  container.lastElementChild.innerHTML = createItemContainers(playlist);
  observePlaylist(container);
}

function addTrackElements(tracks, container, playlistId) {
  const playlist = getPlaylistById(playlistId);
  const elements = tracks.reduce((items, track) => items + createItemContainer(track, playlist), "");

  container.lastElementChild.insertAdjacentHTML("beforeend", elements);
  observePlaylist(container);
}

function handleTrackUpdate({ detail: { track } }) {
  reobserveTrack(track);
}

function handleTracksUpdate({ detail: { id, tracks, type } }) {
  if (id !== visiblePlaylistId) {
    return;
  }

  if (type === "replace") {
    updatePlaylistView(playlistElement, id);
  }
  else {
    addTrackElements(tracks, playlistElement, id);
  }
}

function setSearchValue(value) {
  searchValue = value;
}

function getSearchValue() {
  return searchValue;
}

function searchPlaylist(query) {
  const { tracks, id } = getPlaylistById(visiblePlaylistId);

  if (query) {
    if (!tracks.length) {
      return;
    }
    const { children } = document.getElementById(`js-${id}`);
    const { sortOrder } = getPlaylistState(id);
    const regex = new RegExp(`(${query})`, "i");
    let found = false;

    for (const track of tracks) {
      const matches = regex.test(track.title) || regex.test(track.artist) || regex.test(track.album);
      const index = sortOrder.indexOf(track.index);

      if (matches) {
        found = true;
      }
      children[index].classList.toggle("hidden", !matches);
    }
    return found;
  }
  else {
    resetSearchedPlaylist(id);
    return true;
  }
}

function resetSearchedPlaylist(id) {
  const elements = document.getElementById(`js-${id}`).querySelectorAll(".hidden");

  for (const element of elements) {
    element.classList.remove("hidden");
  }
}

function getTrackElement(index, playlistId) {
  if (playlistId === visiblePlaylistId) {
    const { sortOrder } = getPlaylistState(playlistId);
    const elementIndex = sortOrder.indexOf(index);

    return document.getElementById(`js-${playlistId}`).children[elementIndex];
  }
}

function setPlaylistViewActiveTrack(index, playlistId, scrollToTrack) {
  if (index >= 0) {
    const element = getTrackElement(index, playlistId);
    activeTrack = { index, playlistId };

    if (element) {
      element.classList.add("playing");

      if (scrollToTrack) {
        scrollActiveTrackIntoView(playlistId);
      }
    }
    else {
      const searchTrackElement = getSearchTrackElement();

      if (searchTrackElement) {
        searchTrackElement.classList.add("playing");
      }
    }
  }
  else {
    activeTrack = null;
  }
}

function addSpinner(element) {
  if (!element) {
    return;
  }
  const spinnerElement = element.querySelector(".play-pause-btn-spinner");

  if (spinnerElement) {
    return;
  }
  element.insertAdjacentHTML("beforeend", `
    <svg viewBox="0 0 100 100" class="play-pause-btn-spinner">
      <use href="#spinner"/>
    </svg>
  `);
}

function removeSpinner(element) {
  if (!element) {
    return;
  }
  const spinnerElement = element.querySelector(".play-pause-btn-spinner");

  if (spinnerElement) {
    spinnerElement.remove();
    return;
  }
}

function showTrackElementSpinner() {
  if (activeTrack) {
    const element = getTrackElement(activeTrack.index, activeTrack.playlistId);

    if (element) {
      addSpinner(element.querySelector(".icon-btn"));
    }
    else {
      const element = getSearchTrackElement();

      if (element) {
        addSpinner(element.querySelector(".icon-btn"));
      }
    }
  }
}

function hideTrackElementSpinner() {
  if (activeTrack) {
    const element = getTrackElement(activeTrack.index, activeTrack.playlistId);

    if (element) {
      removeSpinner(element.querySelector(".icon-btn"));
    }
    else {
      const element = getSearchTrackElement();

      if (element) {
        removeSpinner(element.querySelector(".icon-btn"));
      }
    }
  }
}

function getTrackPlayPauseBtn() {
  if (activeTrack) {
    const element = getTrackElement(activeTrack.index, activeTrack.playlistId);

    if (element) {
      return element.querySelector(".icon-btn");
    }
  }
}

function getSearchTrackElement() {
  const playlist = getPlaylistById("search");

  if (!playlist) {
    return;
  }
  const container = document.getElementById("js-search");

  for (const element of container.children) {
    const track = playlist.tracks[element.getAttribute("data-index")];

    if (activeTrack.index === track.playlistIndex && activeTrack.playlistId === track.playlistId) {
      return element;
    }
  }
}

function resetPlaylistViewActiveTrack() {
  togglePlayPauseBtns(true);
  hideTrackElementSpinner();

  if (activeTrack) {
    resetActiveTrack();
  }
}

function resetActiveTrack() {
  const element = getTrackElement(activeTrack.index, activeTrack.playlistId);

  if (element) {
    element.classList.remove("playing");
  }
  else {
    const element = getSearchTrackElement();

    if (element) {
      element.classList.remove("playing");
    }
  }
  activeTrack = null;
}

function togglePlayPauseBtns(paused) {
  if (!visiblePlaylistId) {
    return;
  }
  const element = getTrackPlayPauseBtn();

  if (element) {
    setElementIconAndTitle(element, paused);
  }
  else if (visiblePlaylistId === "search") {
    const element = getSearchTrackElement();

    if (element) {
      const btnElement = element.querySelector(".icon-btn");

      if (btnElement) {
        setElementIconAndTitle(btnElement, paused);
      }
    }
  }
}

function getPlayPauseButtonIcon(paused) {
  if (paused) {
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

function setElementIconAndTitle(element, paused) {
  const { id, title } = getPlayPauseButtonIcon(paused);

  if (element.nodeName === "svg") {
    element.querySelector("title").textContent = title;
  }
  else {
    element.setAttribute("title", title);
  }
  element.querySelector("use").setAttribute("href", `#${id}`);
}

function getPlayPauseIcon(index, playlistId) {
  const activePlaylistId = getActivePlaylistId();

  if (playlistId === "search") {
    const playlist = getPlaylistById(playlistId);
    const track = playlist.tracks[index];

    if (track.playlistId === activePlaylistId) {
      index = track.playlistIndex;
    }
    else {
      return getPlayPauseButtonIcon(true);
    }
  }
  else if (playlistId !== activePlaylistId) {
    return getPlayPauseButtonIcon(true);
  }
  const activeTrack = getActiveTrack();
  const paused = getPlayerState();

  return activeTrack && activeTrack.index === index ?
    getPlayPauseButtonIcon(paused) :
    getPlayPauseButtonIcon(true);
}

function scrollActiveTrackIntoView(id) {
  const playlistId = getActivePlaylistId();

  if (playlistId === id) {
    if (activeTrack && playlistElement) {
      scrollTrackIntoView();
      resetPlaylistScrollPos();
    }
  }
  else if (playlistElement) {
    restorePlaylistScrollPos();
  }
}

function scrollTrackIntoView() {
  requestAnimationFrame(() => {
    const { clientHeight, scrollTop } = playlistElement;
    const { offsetHeight, offsetTop } = getTrackElement(activeTrack.index, activeTrack.playlistId);
    const offset = scrollTop + clientHeight;

    if (offsetTop - offsetHeight < scrollTop || offsetTop > offset) {
      playlistElement.scrollTop = offsetTop - clientHeight / 2;
    }
  });
}

export {
  getVisiblePlaylistId,
  reobserveTrack,
  savePlaylistScrollPos,
  cleanupPlaylistView,
  createPlaylistView,
  getIcon,
  setSearchValue,
  getSearchValue,
  searchPlaylist,
  resetSearchedPlaylist,
  setPlaylistViewActiveTrack,
  resetPlaylistViewActiveTrack,
  togglePlayPauseBtns,
  showTrackElementSpinner,
  hideTrackElementSpinner,
  getPlayPauseButtonIcon,
  scrollActiveTrackIntoView
};

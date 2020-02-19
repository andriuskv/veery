import { getElementByAttr, isOutsideElement, getIcon } from "./utils.js";
import { togglePanel, removePanel } from "./panels.js";
import { onNewPlaylistFormSubmit } from "./playlist/playlist.manage.js";

const sidebarContainerElement = document.getElementById("js-sidebar-container");

function getSidebarEntry(id) {
  return document.getElementById(`js-sidebar-entry-${id}`);
}

function createSidebarEntry(title, id) {
  const element = document.getElementById("js-sidebar-entries");

  element.insertAdjacentHTML("beforeend", `
    <li id="js-sidebar-entry-${id}" class="sidebar-entry">
      <a href="./#/playlist/${id}" class="sidebar-link" data-link>${title}</a>
    </li>
  `);
}

function editSidebarEntryTitle(id, title) {
  getSidebarEntry(id).querySelector(".sidebar-link").textContent = title;
}

function removeSidebarEntry(id) {
  getSidebarEntry(id).remove();
}

function showActiveIcon(id) {
  const entry = getSidebarEntry(id);

  removeActiveIcon();
  entry.insertAdjacentHTML("beforeend", getIcon({
    iconId: "volume",
    elementId: "js-active-playlist-icon",
    className: "active-playlist-icon"
  }));
}

function removeActiveIcon() {
  const element = document.getElementById("js-active-playlist-icon");

  if (element) {
    element.remove();
  }
}

function createSidebarFormPanel(id, { element }) {
  element.insertAdjacentHTML("afterend", `
    <form id="${id}" class="panel sidebar-form">
      <h3 class="panel-title">Create Playlist</h3>
      <div class="sidebar-form-input-container">
        <input type="text" name="title" class="input sidebar-form-input"
          autocomplete="off" placeholder="Title" required>
        <button class="btn">Create</button>
      </div>
    </form>
  `);
  const form = document.getElementById(id);
  form.elements.title.focus();
  form.addEventListener("submit", handleFormSubmit);
}

function handleFormSubmit(event) {
  onNewPlaylistFormSubmit(event);
  removePanel();
}

sidebarContainerElement.addEventListener("click", ({ currentTarget, target }) => {
  const linkElement = getElementByAttr("data-link", target, currentTarget);

  if (linkElement || isOutsideElement(target, currentTarget.firstElementChild)) {
    currentTarget.classList.add("hidden");
    return;
  }
  const element = getElementByAttr("data-btn", target, currentTarget);

  if (element) {
    togglePanel("js-sidebar-form-panel", createSidebarFormPanel, { element: element.elementRef });
  }
});

sidebarContainerElement.addEventListener("keyup", ({ currentTarget, target, key }) => {
  const element = getElementByAttr("data-link", target, currentTarget);

  if (element && key === " ") {
    element.elementRef.click();
  }
});

window.addEventListener("connectivity-status", ({ detail: status }) => {
  const statusElement = document.getElementById("js-online-status");

  statusElement.classList.toggle("visible", !status);
});

export {
  createSidebarEntry,
  editSidebarEntryTitle,
  removeSidebarEntry,
  getSidebarEntry,
  showActiveIcon,
  removeActiveIcon
};

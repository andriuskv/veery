import { removeElement, getElementByAttr, isOutsideElement, getIcon } from "./utils.js";
import { togglePanel } from "./panels.js";
import { createNewPlaylistForm, onNewPlaylistFormSubmit } from "./playlist/playlist.manage.js";

const sidebarContainerElement = document.getElementById("js-sidebar-container");

function getSidebarEntry(id) {
    return document.getElementById(`js-sidebar-entry-${id}`);
}

function createSidebarEntry(title, id) {
    const element = document.getElementById("js-sidebar-entries");

    element.insertAdjacentHTML("beforeend", `
        <li id="js-sidebar-entry-${id}" class="sidebar-entry">
            <a href="./#/playlist/${id}" class="sidebar-link" data-link>
                <div class="fade-right">${title}</div>
            </a>
        </li>
    `);
}

function editSidebarEntryTitle(id, title) {
    getSidebarEntry(id).querySelector(".sidebar-link").textContent = title;
}

function removeSidebarEntry(id) {
    removeElement(getSidebarEntry(id));
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
        removeElement(element);
    }
}

function createSidebarFormPanel(id, { element }) {
    element.insertAdjacentHTML("afterend", `
        <div id="${id}" class="panel sidebar-form-panel"></div>
    `);
    const panel = document.getElementById(id);

    createNewPlaylistForm("sidebar", panel, "beforeend", onNewPlaylistFormSubmit);
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

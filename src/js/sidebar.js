import { removeElement, getElementById, getElementByAttr, isOutsideElement } from "./utils.js";
import { createNewPlaylistForm, onNewPlaylistFormSubmit } from "./playlist/playlist.manage.js";

function getSidebarEntry(id) {
    return getElementById(`js-sidebar-entry-${id}`);
}

function createSidebarEntry(title, id) {
    getElementById("js-sidebar-entries").insertAdjacentHTML("beforeend", `
        <li id="js-sidebar-entry-${id}" class="sidebar-entry">
            <a href="./#/playlist/${id}" class="sidebar-link" data-link>${title}</a>
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
    removeActiveIcon();
    getSidebarEntry(id).insertAdjacentHTML("beforeend", `
        <svg viewBox="0 0 24 24" id="js-active-playlist-icon" class="active-playlist-icon">
            <use href="#volume"></use>
        </svg>
    `);
}

function removeActiveIcon() {
    const element = getElementById("js-active-playlist-icon");

    if (element) {
        removeElement(element);
    }
}

function toggleSidebarForm(btn) {
    const element = getElementById("js-sidebar-form");

    if (element) {
        removeElement(element);
        return;
    }
    createNewPlaylistForm("sidebar", btn.parentElement, onNewPlaylistFormSubmit);
}

getElementById("js-sidebar-container").addEventListener("click", ({ currentTarget, target }) => {
    const linkElement = getElementByAttr("data-link", target, currentTarget);

    if (linkElement || isOutsideElement(target, currentTarget.firstElementChild)) {
        currentTarget.classList.add("hidden");
        return;
    }
    const element = getElementByAttr("data-btn", target, currentTarget);

    if (element) {
        toggleSidebarForm(element.elementRef);
    }
});

export {
    createSidebarEntry,
    editSidebarEntryTitle,
    removeSidebarEntry,
    getSidebarEntry,
    showActiveIcon,
    removeActiveIcon
};

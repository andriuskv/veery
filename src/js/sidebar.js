import { removeElement, getElementById, getElementByAttr, isOutsideElement } from "./utils.js";
import { toggleRoute, isRouteActive } from "./router.js";
import { createNewPlaylistInputForm, onNewPlaylistFormSubmit } from "./playlist/playlist.manage.js";

function getSidebarEntry(id) {
    return getElementById(`js-sidebar-entry-${id}`);
}

function createSidebarEntry(title, id) {
    getElementById("js-sidebar-entries").insertAdjacentHTML("beforeend", `
        <li>
            <button id="js-sidebar-entry-${id}" class="btn btn-dark sidebar-btn" data-item="btn" data-hash="playlist/${id}">
                <span>${title}</span>
            </button>
        </li>
    `);
}

function editSidebarEntry(id, title) {
    const entry = getSidebarEntry(id);

    entry.firstElementChild.textContent = title;
}

function removeSidebarEntry(id) {
    const entry = getSidebarEntry(id);

    removeElement(entry);
}

function showActiveIcon(id) {
    const entry = getSidebarEntry(id);

    removeActiveIcon();
    entry.insertAdjacentHTML("beforeend", `
        <svg viewBox="0 0 24 24" id="js-active-playlist-icon" class="active-playlist-icon">
            <use href="#volume"></use>
        </svg>
    `);
}

function removeActiveIcon() {
    const activeIcon = getElementById("js-active-playlist-icon");

    if (activeIcon) {
        removeElement(activeIcon);
    }
}

function toggleSidebarForm(btn) {
    const element = getElementById("js-sidebar-form");

    if (element) {
        removeElement(element);
        return;
    }
    createNewPlaylistInputForm("sidebar", btn, onNewPlaylistFormSubmit);
}

getElementById("js-sidebar-container").addEventListener("click", ({ currentTarget, target }) => {
    currentTarget.classList.add("contracted");

    if (isOutsideElement(target, currentTarget.firstElementChild)) {
        return;
    }
    const element = getElementByAttr("data-item", target);

    if (element) {
        const hash = element.elementRef.getAttribute("data-hash");

        if (!hash) {
            toggleSidebarForm(element.elementRef);
            return;
        }

        if (!isRouteActive(hash)) {
            toggleRoute(hash);
        }
    }
});

export {
    createSidebarEntry,
    editSidebarEntry,
    removeSidebarEntry,
    getSidebarEntry,
    showActiveIcon,
    removeActiveIcon
};

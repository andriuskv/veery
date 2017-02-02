import { removeElement, getElementByAttr } from "./../main.js";
import { editSidebarEntry } from "./../sidebar.js";
import { getPlaylistById } from "./playlist.js";
import { removePlaylist, updatePlaylist } from "./playlist.manage.js";
import { importPlaylist, createImportOptionMask } from "./playlist.import.js";

function createEntryContainer(id) {
    const div = document.createElement("div");
    const h3 = document.createElement("h3");
    const ul = document.createElement("ul");

    div.classList.add("pl-entry-container");
    h3.classList.add("manage-tab-section-title");
    ul.classList.add("pl-entries");

    h3.textContent = "Playlist entries";
    ul.id = id;
    ul.addEventListener("click", handleClickOnEntryContainer);

    div.appendChild(h3);
    div.appendChild(ul);
    document.getElementById("js-manage-tab-content").appendChild(div);
    return ul;
}

function removeEntryContainer(container) {
    container.removeEventListener("click", handleClickOnEntryContainer);
    removeElement(container.parentElement);
}

function getEntryContainer() {
    const containerId = "js-pl-entries";

    return document.getElementById(containerId) || createEntryContainer(containerId);
}

function getRefrectBtn(url) {
    if (!url) {
        return "";
    }
    return `
        <button type="submit" class="btn btn-light"
            data-action="refresh" title="Refresh playlist">
            <svg viewBox="0 0 24 24">
                <use class="btn-icon" href="#refresh-icon">
            </svg>
        </button>
    `;
}

function createPlaylistEntry(title, id, url) {
    const playlistEntryContainer = getEntryContainer();
    const refreshBtn = getRefrectBtn(url);
    const entry = `
        <li class="pl-entry" data-id=${id}>
            <form class="pl-entry-form">
                <input type="text" class="input pl-entry-title" value="${title}" readonly>
                <button type="submit" class="btn btn-light"
                    data-action="edit" title="Edit playlist title">
                    <svg viewBox="0 0 24 24">
                        <use class="btn-icon" href="#edit-icon">
                    </svg>
                </button>
            </form>
            ${refreshBtn}
            <button class="btn btn-light" data-action="remove" title="Remove playlist">
                <svg viewBox="0 0 24 24">
                    <use class="btn-icon" href="#trash-icon">
                </svg>
            </button>
        </li>
    `;

    playlistEntryContainer.insertAdjacentHTML("beforeend", entry);
}

function removePlaylistEntry(entryElement) {
    const parentElement = entryElement.parentElement;

    removeElement(entryElement);

    if (!parentElement.children.length) {
        removeEntryContainer(parentElement);
    }
}

function updatePlaylistEntryBtn(btn, action) {
    const nextAction = action === "edit" ? "save": "edit";

    btn.setAttribute("data-action", nextAction);
    btn.classList.toggle("active");
}

function editPlaylistTitle(action, parentElement, playlistId) {
    const titleElement = parentElement.querySelector(".pl-entry-title");
    const playlistTitle = titleElement.value;

    if (action === "edit") {
        titleElement.removeAttribute("readonly");
        titleElement.focus();
        titleElement.selectionStart = 0;
        titleElement.selectionEnd = playlistTitle.length;
    }
    else if (action === "save") {
        const { title } = getPlaylistById(playlistId);
        const newTitle = playlistTitle ? playlistTitle : title;

        if (newTitle !== title) {
            titleElement.setAttribute("value", newTitle);
            editSidebarEntry(playlistId, newTitle);
            updatePlaylist(playlistId, { title: newTitle });
        }
        titleElement.setAttribute("readonly", "readonly");
    }
}

function handleClickOnEntryContainer(event) {
    const entry = getElementByAttr(event.target, "data-id");
    const btn = getElementByAttr(event.target, "data-action");

    event.preventDefault();

    if (!entry || !btn) {
        return;
    }
    const playlistId = entry.attrValue;
    const action = btn.attrValue;

    if (action === "remove") {
        removePlaylist(playlistId);
        removePlaylistEntry(entry.elementRef);
        return;
    }
    if (action === "refresh") {
        const { url } = getPlaylistById(playlistId);
        let option = "";

        if (url.includes("youtube")) {
            option = "youtube";
        }
        else if (url.includes("soundcloud")) {
            option = "soundcloud";
        }
        createImportOptionMask(option, "Refreshing");
        importPlaylist(url);
        removeElement(btn.elementRef);
        return;
    }
    editPlaylistTitle(action, entry.elementRef,playlistId);
    updatePlaylistEntryBtn(btn.elementRef, action);
}

export {
    createPlaylistEntry
};

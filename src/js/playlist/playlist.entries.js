import { removeElement, getElementById, getElementByAttr, enableBtn, disableBtn } from "../utils.js";
import { editSidebarEntry } from "../sidebar.js";
import { postMessageToWorker } from "../worker.js";
import { getPlaylistById, updatePlaylist } from "./playlist.js";
import { removePlaylist } from "./playlist.manage.js";
import { importPlaylist, createImportOptionMask, initGoogleAuth } from "./playlist.import.js";

function createEntryContainer(id) {
    const div = document.createElement("div");
    const h3 = document.createElement("h3");
    const ul = document.createElement("ul");

    div.classList.add("pl-entry-container");
    h3.classList.add("home-tab-section-title");
    ul.classList.add("pl-entries");

    h3.textContent = "Playlist entries";
    ul.id = id;
    ul.addEventListener("click", handleClickOnEntryContainer);

    div.appendChild(h3);
    div.appendChild(ul);
    getElementById("js-tab-home").appendChild(div);
    return ul;
}

function removeEntryContainer(container) {
    container.removeEventListener("click", handleClickOnEntryContainer);
    removeElement(container.parentElement);
}

function getEntryContainer() {
    const containerId = "js-pl-entries";

    return getElementById(containerId) || createEntryContainer(containerId);
}

function getSyncBtn(id) {
    const entry = document.querySelector(`[data-entry-id="${id}"]`);

    if (entry) {
        return entry.querySelector(`[data-action="sync"]`);
    }
    return null;
}

function enableSyncBtn(id) {
    const btn = getSyncBtn(id);

    if (btn) {
        enableBtn(btn);
    }
}

function disableSyncBtn(id) {
    const btn = getSyncBtn(id);

    if (btn) {
        disableBtn(btn);
    }
}

function getSyncBtnTemplate() {
    return `
        <button class="btn btn-icon pl-entry-btn" data-action="sync" title="Synchronize playlist">
            <svg viewBox="0 0 24 24">
                <use href="#sync">
            </svg>
        </button>
    `;
}

function createPlaylistEntry(title, id, url) {
    const container = getEntryContainer();
    const btn = url ? getSyncBtnTemplate() : "";
    const entry = `
        <li class="pl-entry" data-entry-id=${id}>
            <form class="pl-entry-form">
                <input type="text" class="input pl-entry-title" value="${title}" readonly>
                <button type="submit" class="btn btn-icon pl-entry-btn"
                    data-action="edit" title="Edit playlist title">
                    <svg viewBox="0 0 24 24">
                        <use href="#edit">
                    </svg>
                </button>
            </form>
            ${btn}
            <button class="btn btn-icon pl-entry-btn" data-action="remove" title="Remove playlist">
                <svg viewBox="0 0 24 24">
                    <use href="#trash">
                </svg>
            </button>
        </li>
    `;

    container.insertAdjacentHTML("beforeend", entry);
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
        titleElement.selectionStart = playlistTitle.length;
    }
    else if (action === "save") {
        const { _id, title } = getPlaylistById(playlistId);
        const newTitle = playlistTitle || title;

        if (newTitle !== title) {
            editSidebarEntry(playlistId, newTitle);
            updatePlaylist(playlistId, { title: newTitle });
            postMessageToWorker({
                action: "change-title",
                playlist: {
                    _id,
                    title: newTitle
                }
            });
        }
        titleElement.value = newTitle;
        titleElement.setAttribute("readonly", "readonly");
    }
}

async function syncPlaylist(id) {
    const { url, player } = getPlaylistById(id);

    if (player === "youtube") {
        disableSyncBtn(id);
        await initGoogleAuth();
        enableSyncBtn(id);
    }
    createImportOptionMask(player, "Synchronizing");
    importPlaylist(player, {
        url,
        type: "sync"
    });
}

function handleClickOnEntryContainer(event) {
    const entry = getElementByAttr("data-entry-id", event.target);
    const btn = getElementByAttr("data-action", event.target);

    event.preventDefault();

    if (!entry || !btn || btn.elementRef.disabled) {
        return;
    }
    const playlistId = entry.attrValue;
    const action = btn.attrValue;

    if (action === "remove") {
        removePlaylist(playlistId);
        removePlaylistEntry(entry.elementRef);
        return;
    }

    if (action === "sync") {
        syncPlaylist(playlistId);
        return;
    }
    editPlaylistTitle(action, entry.elementRef,playlistId);
    updatePlaylistEntryBtn(btn.elementRef, action);
}

export {
    createPlaylistEntry,
    enableSyncBtn,
    disableSyncBtn
};

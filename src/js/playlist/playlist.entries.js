import { removeElement, getElementById, getElementByAttr, enableBtn, disableBtn } from "../utils.js";
import { editSidebarEntry } from "../sidebar.js";
import { postMessageToWorker } from "../worker.js";
import { getPlaylistById, updatePlaylist } from "./playlist.js";
import { removePlaylist } from "./playlist.manage.js";
import { importPlaylist, createImportOptionMask, initGoogleAuth } from "./playlist.import.js";

function createContainer(id) {
    const div = document.createElement("div");
    const h3 = document.createElement("h3");
    const ul = document.createElement("ul");

    div.classList.add("pl-entry-container");
    h3.classList.add("home-tab-section-title");
    ul.classList.add("pl-entries");

    h3.textContent = "Playlist entries";
    ul.id = id;
    ul.addEventListener("click", handleContainerClick);
    ul.addEventListener("focus", handleContainerFocus, true);

    div.appendChild(h3);
    div.appendChild(ul);
    getElementById("js-tab-home").appendChild(div);
    return ul;
}

function removeContainer(container) {
    container.removeEventListener("click", handleContainerClick);
    container.removeEventListener("focus", handleContainerFocus, true);
    removeElement(container.parentElement);
}

function getContainer() {
    const id = "js-pl-entries";

    return getElementById(id) || createContainer(id);
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

function updatePlaylistStats() {
    const container = getElementById("js-pl-entries");

    if (!container) {
        return;
    }
    Array.from(container.children).forEach(entry => {
        const { tracks, duration } = getPlaylistById(entry.getAttribute("data-entry-id"));

        entry.querySelector(".track-count").textContent = `${tracks.length} tracks`;
        entry.querySelector(".playlist-duration").textContent = parsePlaylistDuration(duration);
    });
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

function getStatusIcon() {
    return `
        <svg viewBox="0 0 24 24" class="pl-entry-stats-item">
            <use href="#lock"></use>
        </svg>
    `;
}

function parsePlaylistDuration(duration) {
    const hours = Math.floor(duration / 3600);
    const minutes = Math.ceil(duration / 60 % 60);

    return `${hours} hr ${minutes} min`;
}

function createPlaylistEntry(pl) {
    const container = getContainer();
    const btn = pl.url ? getSyncBtnTemplate() : "";
    const icon = pl.isPrivate ? getStatusIcon() : "";

    container.insertAdjacentHTML("beforeend", `
        <li class="pl-entry" data-entry-id=${pl.id}>
            <div class="pl-entry-input-container" data-action="edit">
                <input type="text" class="input pl-entry-input" value="${pl.title}">
                <svg viewBox="0 0 24 24" class="pl-entry-input-icon">
                    <use href="#edit">
                </svg>
            </div>
            <div class="pl-entry-content">
                <div class="pl-entry-stats">
                    ${icon}
                    <span class="pl-entry-stats-item track-count">${pl.tracks.length} tracks</span>
                    <span class="pl-entry-stats-item playlist-duration">${parsePlaylistDuration(pl.duration)}</span>
                </div>
                ${btn}
                <button class="btn btn-icon pl-entry-btn" data-action="remove" title="Remove playlist">
                    <svg viewBox="0 0 24 24">
                        <use href="#trash">
                    </svg>
                </button>
            </div>
        </li>
    `);
}

function removePlaylistEntry(entryElement) {
    const parentElement = entryElement.parentElement;

    removeElement(entryElement);

    if (!parentElement.children.length) {
        removeContainer(parentElement);
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

function editPlaylistTitle({ currentTarget }) {
    const { attrValue: playlistId } = getElementByAttr("data-entry-id", currentTarget);
    const { _id, title } = getPlaylistById(playlistId);
    const newTitle = currentTarget.value;

    currentTarget.removeEventListener("blur", editPlaylistTitle);
    currentTarget.removeEventListener("keyup", blurEntryInput);

    if (!newTitle) {
        currentTarget.value = title;
        return;
    }

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
}

function blurEntryInput({ currentTarget, which }) {
    if (which === 13) {
        currentTarget.blur();
    }
}

function handleContainerClick(event) {
    const entry = getElementByAttr("data-entry-id", event.target);
    const element = getElementByAttr("data-action", event.target);

    if (!entry || !element || element.elementRef.disabled) {
        return;
    }
    const playlistId = entry.attrValue;
    const action = element.attrValue;

    if (action === "remove") {
        removePlaylist(playlistId);
        removePlaylistEntry(entry.elementRef);
    }
    else if (action === "sync") {
        syncPlaylist(playlistId);
    }
    else if (action === "edit") {
        element.elementRef.querySelector(".input").focus();
    }
}

function handleContainerFocus({ target }) {
    const element = getElementByAttr("data-action", target);

    if (element && element.attrValue === "edit") {
        target.addEventListener("blur", editPlaylistTitle);
        target.addEventListener("keyup", blurEntryInput);
    }
}

export {
    createPlaylistEntry,
    enableSyncBtn,
    disableSyncBtn,
    updatePlaylistStats
};

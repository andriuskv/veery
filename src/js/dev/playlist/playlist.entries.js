import { removeElement, getElementByAttr, capitalize } from "./../main.js";
import { postMessageToWorker } from "./../worker.js";
import { editSidebarEntry } from "./../sidebar.js";
import { getPlaylistById } from "./playlist.js";
import { removePlaylist } from "./playlist.manage.js";
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

function createPlaylistEntry(title, id, url) {
    const playlistEntryContainer = getEntryContainer();
    const entry = `
        <li class="pl-entry" data-id=${id}>
            <form class="pl-entry-form">
                <input type="text" class="input pl-entry-title" value="${title}" readonly>
                <button type="submit" class="icon-pencil btn btn-transparent"
                    data-action="edit" title="Edit"></button>
            </form>
            <button type="submit" class="icon-cw btn btn-transparent ${!url ? "hidden" : ""}"
                data-action="refresh" title="Refresh"></button>
            <button class="icon-trash btn btn-transparent"
                data-action="remove" title="Remove playlist"></button>
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

    btn.setAttribute("title", capitalize(nextAction));
    btn.setAttribute("data-action", nextAction);
    btn.classList.toggle("active");
}

function editPlaylistTitle(action, parentElement, playlistId) {
    const titleElement = parentElement.querySelector(".pl-entry-title");

    if (action === "edit") {
        titleElement.removeAttribute("readonly");
        titleElement.focus();
        titleElement.selectionStart = 0;
        titleElement.selectionEnd = titleElement.value.length;
    }
    else if (action === "save") {
        const pl = getPlaylistById(playlistId);

        if (!titleElement.value) {
            titleElement.value = pl.title;
        }
        const newTitle = titleElement.value;

        if (newTitle !== pl.title) {
            pl.title = newTitle;
            editSidebarEntry(playlistId, newTitle);
            titleElement.setAttribute("value", newTitle);
            postMessageToWorker({
                action: "update",
                playlist: {
                    _id: pl._id,
                    title: pl.title
                }
            });
        }
        titleElement.setAttribute("readonly", "readonly");
    }
}

function handleClickOnEntryContainer(event) {
    const entry = getElementByAttr(event.target, "data-id");
    const action = event.target.getAttribute("data-action");

    event.preventDefault();
    if (!entry || !action) {
        return;
    }
    if (action === "remove") {
        removePlaylist(entry.attrValue);
        removePlaylistEntry(entry.elementRef);
        return;
    }
    if (action === "refresh") {
        const { url } = getPlaylistById(entry.attrValue);
        let option = "";

        if (url.includes("youtube")) {
            option = "youtube";
        }
        else if (url.includes("soundcloud")) {
            option = "soundcloud";
        }
        createImportOptionMask(option);
        importPlaylist(url);
        event.target.classList.add("hidden");
        return;
    }
    editPlaylistTitle(action, entry.elementRef, entry.attrValue);
    updatePlaylistEntryBtn(event.target, action);
}

export {
    createPlaylistEntry
};

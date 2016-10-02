import { getElementByAttr, capitalize } from "./../main.js";
import { postMessageToWorker } from "./../worker.js";
import { editSidebarEntry } from "./../sidebar.js";
import { getPlaylistById } from "./playlist.js";
import { removePlaylist } from "./playlist.manage.js";

function createEntryContainer() {
    const entryContainer = document.createElement("ul");

    entryContainer.setAttribute("id", "js-pl-entries");
    entryContainer.classList.add("pl-entries");
    entryContainer.addEventListener("click", handleClickOnEntryContainer);
    document.getElementById("js-add-tab-content").appendChild(entryContainer);
    return entryContainer;
}

function removeEntryContainer(container) {
    container.removeEventListener("click", handleClickOnEntryContainer);
    container.parentElement.removeChild(container);
}

function createPlaylistEntry(title, id) {
    const playlistEntryContainer = document.getElementById("js-pl-entries") || createEntryContainer();
    const entry = `
        <li class="pl-entry" data-id=${id}>
            <form class="pl-entry-form">
                <input type="text" class="input pl-entry-title" value="${title}" readonly>
                <button type="submit" class="icon-pencil btn btn-transparent"
                data-action="edit" title="Edit"></button>
                <button class="icon-trash btn btn-transparent"
                data-action="remove" title="Remove playlist"></button>
            </form>
        </li>
    `;

    playlistEntryContainer.insertAdjacentHTML("beforeend", entry);
}

function removePlaylistEntry(entryElement) {
    const parentElement = entryElement.parentElement;

    parentElement.removeChild(entryElement);

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
                    id: pl.id,
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
    editPlaylistTitle(action, entry.elementRef, entry.attrValue);
    updatePlaylistEntryBtn(event.target, action);
}

export {
    createPlaylistEntry
};

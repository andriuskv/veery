import { removeElementClass, getElementByAttr, scriptLoader, capitalize } from "./../main.js";
import { initializeWorker, postMessageToWorker } from "./../worker.js";
import { editSidebarEntry } from "./../sidebar.js";
import { getPlaylistById, createPlaylist, resetTrackIndexes } from "./playlist.js";
import { initPlaylist, removePlaylist, appendToPlaylist } from "./playlist.manage.js";
import { showDropboxChooser } from "./../dropbox.js";
import { selectLocalFiles } from "./../local.js";
import * as yt from "./../youtube.js";
import * as sc from "./../soundcloud.js";

let provider = "";

const importBtn = (function() {
    const btn = document.getElementById("js-playlist-import-btn");

    function toggle() {
        btn.children[0].classList.toggle("hidden");
        btn.children[1].classList.toggle("hidden");
    }

    return { toggle };
})();

function removeNotice() {
    const element = document.getElementById("js-playlist-add-notice");

    if (element) {
        element.parentElement.removeChild(element);
    }
}

function createNotice(message) {
    const div = document.createElement("div");

    div.setAttribute("id", "js-playlist-add-notice");
    div.classList.add("playlist-add-notice");
    div.textContent = message;
    return div;
}

function showNotice(message) {
    const noticeElement = createNotice(message);
    const parentElement = document.getElementById("js-tab-add");

    removeNotice();
    parentElement.insertBefore(noticeElement, document.getElementById("js-playlist-entries"));
    setTimeout(removeNotice, 3200);
}

function importPlaylist(name, value) {
    if (name === "youtube") {
        yt.fetchPlaylist(value);
    }
    else if (name === "soundcloud") {
        sc.fetchPlaylist(value);
    }
}

function filterDuplicateTracks(tracks, existingTracks) {
    return tracks.reduce((tracks, track) => {
        const duplicate = existingTracks.some(localTrack => localTrack.name === track.name);

        if (!duplicate) {
            tracks.push(track);
        }
        return tracks;
    }, []);
}

function addImportedPlaylist(pl) {
    const existingPlaylist = getPlaylistById(pl.id);
    let playlist = null;

    if (existingPlaylist) {
        const tracks = filterDuplicateTracks(pl.tracks, existingPlaylist.tracks);

        playlist = Object.assign({}, existingPlaylist);
        playlist.tracks.push(...tracks);
        playlist.tracks = resetTrackIndexes(playlist.tracks);
        appendToPlaylist(playlist, tracks, true);
    }
    else {
        playlist = createPlaylist(pl);
        initPlaylist(playlist, true);
    }
    importBtn.toggle();
    postMessageToWorker({
        action: "put",
        playlist
    });
}

function setProvider(item) {
    const newProvider = item.attrValue;

    if (newProvider !== provider) {
        provider = newProvider;
        removeElementClass("playlist-add-option", "active");
        item.elementRef.classList.add("active");
        document.getElementById("js-playlist-import-form").classList.add("visible");
    }
}

function showFilePicker(choice) {
    const filePicker = document.getElementById("js-file-chooser");
    const clickEvent = new MouseEvent("click");

    if (choice === "file") {
        filePicker.removeAttribute("webkitdirectory");
        filePicker.removeAttribute("directory");
        filePicker.setAttribute("multiple", true);
    }
    else if (choice === "folder") {
        filePicker.removeAttribute("multiple");
        filePicker.setAttribute("webkitdirectory", true);
        filePicker.setAttribute("directory", true);
    }
    filePicker.dispatchEvent(clickEvent);
}

function createPlaylistEntry(title, id) {
    const playlistEntryContainer = document.getElementById("js-playlist-entries");
    const entry = `
        <li class="playlist-entry" data-id=${id}>
            <form class="playlist-entry-form">
                <input type="text" class="input playlist-entry-title" value="${title}" readonly>
                <button type="submit" class="icon-pencil btn btn-transparent"
                data-action="edit" title="Edit"></button>
                <button class="icon-trash btn btn-transparent"
                data-action="remove" title="Remove playlist"></button>
            </form>
        </li>
    `;

    playlistEntryContainer.insertAdjacentHTML("beforeend", entry);
}

function updatePlaylistEntryBtn(btn, action) {
    const nextAction = action === "edit" ? "save": "edit";

    btn.setAttribute("title", capitalize(nextAction));
    btn.setAttribute("data-action", nextAction);
    btn.classList.toggle("active");
}

function editPlaylistTitle(action, parentElement, playlistId) {
    const titleElement = parentElement.querySelector(".playlist-entry-title");

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

document.getElementById("js-file-chooser").addEventListener("change", ({ target }) => {
    selectLocalFiles([...target.files]);
    target.value = "";
});

document.getElementById("js-playlist-import-form").addEventListener("submit", event => {
    const { target: form } = event;
    const value = form.elements["playlist-id"].value.trim();

    if (value) {
        importBtn.toggle();
        importPlaylist(provider, value);
        form.reset();
    }
    event.preventDefault();
});

document.getElementById("js-playlist-entries").addEventListener("click", ({ target }) => {
    const entry = getElementByAttr(target, "data-id");
    const action = target.getAttribute("data-action");

    if (!entry || !action) {
        return;
    }
    if (action === "remove") {
        removePlaylist(entry.attrValue);
        entry.elementRef.parentElement.removeChild(entry.elementRef);
        return;
    }
    editPlaylistTitle(action, entry.elementRef, entry.attrValue);
    updatePlaylistEntryBtn(target, action);
});

document.getElementById("js-playlist-add-options").addEventListener("click", ({ target }) => {
    const item = getElementByAttr(target, "data-choice");

    if (!item) {
        return;
    }
    const choice = item.attrValue;

    if (choice === "file" || choice === "folder") {
        showFilePicker(choice);
        return;
    }
    if (choice === "dropbox") {
        const isLoaded = scriptLoader.load({
            src: "https://www.dropbox.com/static/api/2/dropins.js",
            id: "dropboxjs",
            "data-app-key": ""
        }, showDropboxChooser);

        if (isLoaded) {
            showDropboxChooser();
        }
        return;
    }
    setProvider(item);
});

window.addEventListener("load", function onLoad() {
    scriptLoader.load({ src: "js/libs/sdk.js" }, sc.init);
    scriptLoader.load({ src: "https://www.youtube.com/iframe_api" });
    scriptLoader.load({ src: "js/libs/metadata-audio-parser.js" });

    initializeWorker();
    window.removeEventListener("load", onLoad);
});

export {
    addImportedPlaylist,
    showNotice,
    importBtn,
    createPlaylistEntry
};

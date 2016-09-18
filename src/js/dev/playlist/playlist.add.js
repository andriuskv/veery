import { removeElementClass, getElementByAttr, scriptLoader } from "./../main.js";
import { initializeWorker, postMessageToWorker } from "./../worker.js";
import { editSidebarEntry } from "./../sidebar.js";
import { getPlaylistById, createPlaylist } from "./playlist.js";
import { initPlaylist, removePlaylist, replacePlaylistTracks } from "./playlist.manage.js";
import * as local from "./../local.js";
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

function addRemotePlaylist(pl) {
    const existingPlaylist = getPlaylistById(pl.id);
    let playlist = null;

    if (existingPlaylist) {
        playlist = Object.assign({}, existingPlaylist, { tracks: pl.tracks });
        replacePlaylistTracks(playlist, true);
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
        removeElementClass("playlist-provider", "selected");
        item.elementRef.classList.add("selected");
        document.getElementById("js-import-form-container").classList.add("visible");
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

function editPlaylistTitle(action, target, titleElement, playlistId) {
    target.setAttribute("title", action[0].toUpperCase() + action.slice(1));
    target.setAttribute("data-action", action);
    target.classList.toggle("active");

    if (action === "save") {
        titleElement.removeAttribute("readonly");
        titleElement.focus();
        titleElement.selectionStart = 0;
        titleElement.selectionEnd = titleElement.value.length;
    }
    else if (action === "edit") {
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
    local.addTracks([...target.files]);
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
    const action = target.getAttribute("data-action");
    const entry = getElementByAttr(target, "data-id");

    if (!entry) {
        return;
    }

    if (action === "remove") {
        removePlaylist(entry.attrValue, entry.elementRef);
        return;
    }
    let nextAction = "";

    if (action === "save") {
        nextAction = "edit";
    }
    else if (action === "edit") {
        nextAction = "save";
    }

    if (nextAction) {
        const titleElement = entry.elementRef.querySelector(".playlist-entry-title");

        editPlaylistTitle(nextAction, target, titleElement, entry.attrValue);
    }
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
    setProvider(item);
});

window.addEventListener("load", function onLoad() {
    scriptLoader.load("js/libs/sdk.js", sc.init);
    scriptLoader.load("https://www.youtube.com/iframe_api");
    scriptLoader.load("js/libs/metadata-audio-parser.js");

    initializeWorker();
    window.removeEventListener("load", onLoad);
});

export {
    addRemotePlaylist,
    showNotice,
    importBtn
};

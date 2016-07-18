import * as main from "./../main.js";
import * as router from "./../router.js";
import * as sidebar from "./../sidebar.js";
import * as local from "./../local.js";
import * as yt from "./../youtube.js";
import * as sc from "./../soundcloud.js";
import * as playlist from "./playlist.js";
import * as playlistManage from "./playlist.manage.js";

let provider = "";

const importBtn = (function() {
    const btn = document.getElementById("js-playlist-import-btn");

    function toggle() {
        btn.children[0].classList.toggle("hidden");
        btn.children[1].classList.toggle("hidden");
    }

    return { toggle };
})();

function showNotice(message) {
    const element = document.getElementById("js-playlist-add-notice");

    element.textContent = message;
    element.classList.add("show");

    setTimeout(() => {
        element.textContent = "";
        element.classList.remove("show");
    }, 4000);
}

function importPlaylist(name, value) {
    if (name === "youtube") {
        yt.fetchPlaylist(value);
    }
    else if (name === "soundcloud") {
        sc.fetchPlaylist(value);
    }
}

function addPlaylist(pl) {
    const existingPlaylist = playlist.get(pl.id);

    if (existingPlaylist) {
        playlistManage.remove(existingPlaylist.id);
    }
    importBtn.toggle();
    playlistManage.init(playlist.create(pl), true);
}

function setProvider(item) {
    const newProvider = item.attrValue;

    if (newProvider !== provider) {
        provider = newProvider;
        main.removeClassFromElement("playlist-provider", "selected");
        item.element.classList.add("selected");
        document.getElementById("js-import-form-container").classList.add("show");
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
        const pl = playlist.get(playlistId);

        if (!titleElement.value) {
            titleElement.value = pl.title;
        }

        const newTitle = titleElement.value;

        if (newTitle !== pl.title) {
            pl.title = newTitle;
            sidebar.editEntry(playlistId, newTitle);
            titleElement.setAttribute("value", newTitle);
            playlist.save(pl);
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
    const entry = main.getElementByAttr(target, "data-id");

    if (!entry) {
        return;
    }

    if (action === "remove") {
        playlistManage.remove(entry.attrValue, entry.element);
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
        const titleElement = entry.element.querySelector(".playlist-entry-title");

        editPlaylistTitle(nextAction, target, titleElement, entry.attrValue);
    }
});

document.getElementById("js-playlist-add-options").addEventListener("click", ({ target }) => {
    const item = main.getElementByAttr(target, "data-choice");

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
    const savedPlaylists = playlist.getSavedPlaylists();

    main.scriptLoader.load("js/libs/sdk.js", sc.init);
    main.scriptLoader.load("https://www.youtube.com/iframe_api");
    main.scriptLoader.load("js/libs/metadata-audio-parser.js");

    Object.keys(savedPlaylists).forEach(id => {
        const pl = savedPlaylists[id];

        playlistManage.init(playlist.create(pl), false);
    });

    local.worker.init();
    router.toggleCurrent();
    window.removeEventListener("load", onLoad);
});

export {
    addPlaylist as add,
    showNotice,
    importBtn
};

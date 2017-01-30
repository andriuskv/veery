import { removeElement, removeElements, removeElementClass, getElementByAttr, scriptLoader } from "./../main.js";
import { getPlaylistById, createPlaylist } from "./playlist.js";
import { addTracksToPlaylist } from "./playlist.manage.js";
import { showDropboxChooser } from "./../dropbox.js";
import { selectLocalFiles } from "./../local.js";
import { fetchYoutubePlaylist } from "./../youtube.js";
import { fetchSoundcloudPlaylist } from "./../soundcloud.js";

let importOption = "";

function setImportOption(option = "") {
    importOption = option;
}

function isNewImportOption(option) {
    return importOption !== option;
}

function createImportOptionMask(option, message = "") {
    const optionElements = Array.from(document.querySelectorAll(`[data-option-id*=${option}]`));

    optionElements.forEach(element => {
        element.parentElement.insertAdjacentHTML("beforeend", `
            <div class="option-mask" data-mask-id=${option}>
                <span class="icon-spin4 animate-spin"></span>
                <span class="mask-message">${message}</span>
            </div>
        `);
    });
}

function getMaskElements(option) {
    return Array.from(document.querySelectorAll(`[data-mask-id*=${option}]`));
}

function removeImportOptionMask(option) {
    if (option) {
        const elements = getMaskElements(option);

        removeElements(elements);
    }
}

function showNotice(option, message) {
    const elements = getMaskElements(option);

    elements.forEach(element => {
        element.textContent = message;
    });

    setTimeout(removeElements, 3200, elements);
}

function importPlaylist(url) {
    if (url.includes("youtube")) {
        fetchYoutubePlaylist(url);
    }
    else if (url.includes("soundcloud")) {
        fetchSoundcloudPlaylist(url);
    }
    else {
        showNotice(importOption, "Invalid url");
    }
}

function filterDuplicateTracks(tracks, oldTracks) {
    return tracks.reduce((tracks, track) => {
        const duplicate = oldTracks.some(oldTrack => oldTrack.name === track.name);

        if (!duplicate) {
            tracks.push(track);
        }
        return tracks;
    }, []);
}

function replaceInvalidImages(tracks) {
    if (!tracks.length) {
        return Promise.resolve(tracks);
    }
    return new Promise(resolve => {
        let i = 0;

        tracks.forEach(track => {
            const image = new Image();

            image.onload = function() {
                i += 1;
                if (i === tracks.length) {
                    resolve(tracks);
                }
            };
            image.onerror = function() {
                track.thumbnail = "assets/images/album-art-placeholder.png";
                i += 1;
                if (i === tracks.length) {
                    resolve(tracks);
                }
            };
            image.src = track.thumbnail;
        });
    });
}

async function addImportedPlaylist(playlist) {
    const pl = getPlaylistById(playlist.id) || createPlaylist(playlist);
    const tracks = filterDuplicateTracks(playlist.tracks, pl.tracks);
    const newTracks = await replaceInvalidImages(tracks);

    setImportOption();
    removePlaylistImportForm();
    addTracksToPlaylist(pl, newTracks);
    removeImportOptionMask(playlist.player);
}

function createPlaylistImportForm(container) {
    const formId = "js-import-form";
    const form = `
        <form id=${formId} class="import-form">
            <input type="text" name="playlist-url" class="input" placeholder="Playlist url">
            <button class="btn">Import</button>
        </form>
    `;

    container.insertAdjacentHTML("beforeend", form);

    const formElement = document.getElementById(formId);

    formElement.elements["playlist-url"].focus();
    formElement.addEventListener("submit", handleImportFormSubmit);
}

function removePlaylistImportForm() {
    const form = document.getElementById("js-import-form");

    if (form) {
        form.removeEventListener("submit", handleImportFormSubmit);
        removeElement(form);
        removeElementClass("import-option-btn", "active");
    }
}

function selectOption(optionElement) {
    optionElement.classList.add("active");
    createPlaylistImportForm(optionElement);
}

function handleChangeOnFileInput({ target }) {
    selectLocalFiles([...target.files]);
    target.value = "";
    target.removeEventListener("change", handleChangeOnFileInput);
    removeElement(target);
}

function createFileInput() {
    const input = document.createElement("input");

    input.setAttribute("type", "file");
    input.setAttribute("id", "js-file-picker");
    input.classList.add("file-picker");
    input.addEventListener("change", handleChangeOnFileInput);
    document.body.appendChild(input);
    return input;
}

function showFilePicker(choice) {
    const filePicker = document.getElementById("js-file-picker") || createFileInput();

    if (choice === "local-file") {
        filePicker.removeAttribute("webkitdirectory");
        filePicker.removeAttribute("directory");
        filePicker.removeAttribute("allowdirs");
        filePicker.setAttribute("multiple", "");
    }
    else if (choice === "local-folder") {
        filePicker.removeAttribute("multiple");
        filePicker.setAttribute("webkitdirectory", "");
        filePicker.setAttribute("directory", "");
        filePicker.setAttribute("allowdirs", "");
    }
    filePicker.click();
}

function handleImportFormSubmit(event) {
    const url = event.target.elements["playlist-url"].value.trim();

    if (url) {
        createImportOptionMask(importOption, "Importing");
        importPlaylist(url);
        event.target.reset();
    }
    event.preventDefault();
}

document.getElementById("js-import-options").addEventListener("mouseover", function onMouveover({ target }) {
    const item = getElementByAttr(target, "data-option-id");

    if (!item) {
        return;
    }
    const option = item.attrValue;

    if (option === "dropbox") {
        this.removeEventListener("mouseover", onMouveover);
        scriptLoader.load({
            src: "https://www.dropbox.com/static/api/2/dropins.js",
            id: "dropboxjs",
            "data-app-key": process.env.DROPBOX_API_KEY
        });
    }
});

document.getElementById("js-import-options").addEventListener("click", ({ target }) => {
    const item = getElementByAttr(target, "data-option-id");

    if (!item) {
        return;
    }
    const option = item.attrValue;

    if (!isNewImportOption(option)) {
        return;
    }
    setImportOption(option);
    removePlaylistImportForm();

    if (option.includes("local")) {
        showFilePicker(option);
        setImportOption();
    }
    else if (option === "dropbox") {
        showDropboxChooser();
        setImportOption();
    }
    else {
        selectOption(item.elementRef);
    }
});

export {
    importPlaylist,
    addImportedPlaylist,
    showNotice,
    createImportOptionMask,
    removeImportOptionMask
};

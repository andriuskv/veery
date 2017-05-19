import { removeElement, removeElements, removeElementClass, getElementById, getElementByAttr, scriptLoader } from "./../utils.js";
import { togglePanel } from "../panels.js";
import { getPlaylistById, createPlaylist } from "./playlist.js";
import { addTracksToPlaylist } from "./playlist.manage.js";
import { showDropboxChooser } from "../dropbox.js";
import { selectLocalFiles } from "../local.js";
import { fetchYoutubeItem } from "../youtube.js";
import { fetchSoundcloudPlaylist } from "../soundcloud.js";

const importOptions = getElementById("js-import-options");
let importOption = "";

function setImportOption(option = "") {
    importOption = option;
}

function isNewImportOption(option) {
    return importOption !== option;
}

function getElementsByAttr(attr) {
    return Array.from(document.querySelectorAll(`[${attr}]`));
}

function createImportOptionMask(option, message = "") {
    const elements = getElementsByAttr(`data-item=${option}`);

    elements.forEach(element => {
        element.insertAdjacentHTML("afterend", `
            <div class="option-mask" data-mask-id=${option}>
                <img src="./assets/images/ring-alt.svg" alt="">
                <span class="mask-message">${message}</span>
            </div>
        `);
    });
}

function getMaskElements(option) {
    return getElementsByAttr(`data-mask-id=${option}`);
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

function importPlaylist(option, url) {
    if (option === "youtube") {
        fetchYoutubeItem(url);
    }
    else if (option === "soundcloud") {
        fetchSoundcloudPlaylist(url);
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
    const plTracks = playlist.tracks.splice(0);
    const pl = getPlaylistById(playlist.id) || createPlaylist(playlist);
    const fileredTracks = filterDuplicateTracks(plTracks, pl.tracks);
    const tracks = await replaceInvalidImages(fileredTracks);

    addTracksToPlaylist(pl, tracks);
    setImportOption();
    removeImportForm();
    removeImportOptionMask(playlist.player);
}

function createImportForm(container, item) {
    const id = "js-import-form";
    const form = `
        <form id=${id} class="import-form" data-for="${item}">
            <input type="text" name="url" class="input" placeholder="URL" required>
            <button class="btn btn-dark">Import</button>
        </form>
    `;

    container.insertAdjacentHTML("afterend", form);

    const element = getElementById(id);

    element.elements["url"].focus();
    element.addEventListener("submit", handleImportFormSubmit);
}

function removeImportForm() {
    const form = getElementById("js-import-form");

    if (form) {
        form.removeEventListener("submit", handleImportFormSubmit);
        removeElement(form);
        removeElementClass("import-option-btn", "active");
    }
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

function showFilePicker(element) {
    const type = element.getAttribute("data-type");
    const filePicker = getElementById("js-file-picker") || createFileInput();

    if (type === "file") {
        filePicker.removeAttribute("webkitdirectory");
        filePicker.removeAttribute("directory");
        filePicker.removeAttribute("allowdirs");
        filePicker.setAttribute("multiple", "");
    }
    else if (type === "folder") {
        filePicker.removeAttribute("multiple");
        filePicker.setAttribute("webkitdirectory", "");
        filePicker.setAttribute("directory", "");
        filePicker.setAttribute("allowdirs", "");
    }
    filePicker.click();
}

function handleImportFormSubmit(event) {
    const url = event.target.elements["url"].value.trim();

    if (url) {
        const option = event.target.getAttribute("data-for");

        createImportOptionMask(option, "Importing");
        importPlaylist(option, url);
        event.target.reset();
    }
    event.preventDefault();
}

function createYouTubeInfoPanel(id, { element }) {
    const a = `
        <div id="${id}" class="panel info-panel">
            <p class="info-panel-title">Accepted formats:</p>
            <ul>
                <li class="info-panel-content-item">https://www.youtube.com/playlist?list={playlistId}</li>
                <li class="info-panel-content-item">https://www.youtube.com/watch?v={videoId}</li>
            </ul>
        </div>
    `;

    element.insertAdjacentHTML("afterend", a);
}

function createSoundCloudInfoPanel(id, { element }) {
    const a = `
        <div id="${id}" class="panel info-panel">
            <p class="info-panel-title">Accepted formats:</p>
            <ul>
                <li class="info-panel-content-item">https://soundcloud.com/{userId}/sets/{playlistId}</li>
                <li class="info-panel-content-item">https://soundcloud.com/{userId}/tracks</li>
            </ul>
        </div>
    `;

    element.insertAdjacentHTML("afterend", a);
}

importOptions.addEventListener("mouseover", function onMouveover({ currentTarget, target }) {
    const item = getElementByAttr(target, "data-item");

    if (!item) {
        return;
    }
    const option = item.attrValue;

    if (option === "dropbox") {
        currentTarget.removeEventListener("mouseover", onMouveover);
        scriptLoader.load({
            src: "https://www.dropbox.com/static/api/2/dropins.js",
            id: "dropboxjs",
            "data-app-key": process.env.DROPBOX_API_KEY
        });
    }
});

importOptions.addEventListener("click", ({ target }) => {
    const element = getElementByAttr(target, "data-item");

    if (!element) {
        return;
    }
    const { attrValue, elementRef } = element;

    if (attrValue === "youtube-info") {
        togglePanel(`js-${attrValue}-panel`, createYouTubeInfoPanel, {
            element: elementRef
        });
        return;
    }

    if (attrValue === "soundcloud-info") {
        togglePanel(`js-${attrValue}-panel`, createSoundCloudInfoPanel, {
            element: elementRef
        });
        return;
    }
    removeImportForm();

    if (attrValue === "local") {
        showFilePicker(elementRef);
    }
    else if (attrValue === "dropbox") {
        showDropboxChooser();
    }
    else if (isNewImportOption(attrValue)) {
        elementRef.classList.add("active");
        createImportForm(elementRef, attrValue);
        setImportOption(attrValue);
    }
    else {
        setImportOption();
    }
});

export {
    importPlaylist,
    addImportedPlaylist,
    showNotice,
    createImportOptionMask,
    removeImportOptionMask
};

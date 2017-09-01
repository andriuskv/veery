/* global gapi */

import {
    removeElement,
    removeElementClass,
    getElementById,
    getElementByAttr,
    scriptLoader,
    enableBtn,
    disableBtn
} from "./../utils.js";
import { togglePanel } from "../panels.js";
import { getPlaylistById, createPlaylist } from "./playlist.js";
import { addTracksToPlaylist } from "./playlist.manage.js";
import { showDropboxChooser } from "../dropbox.js";
import { selectLocalFiles } from "../local.js";
import { fetchYoutubeItem } from "../youtube.js";

const importOptions = getElementById("js-import-options");
let googleAuthInitialized = false;
let importOption = "";

function setImportOption(option = "") {
    importOption = option;
}

function isNewImportOption(option) {
    return importOption !== option;
}

function createImportOptionMask(option, message = "") {
    document.querySelector(`[data-option=${option}]`).insertAdjacentHTML("beforeend", `
        <div class="option-mask" data-mask-id=${option}>
            <img src="./assets/images/ring-alt.svg" alt="">
            <span class="mask-message">${message}</span>
        </div>
    `);
}

function getMaskElement(option) {
    return document.querySelector(`[data-mask-id=${option}]`);
}

function removeImportOptionMask(option) {
    removeElement(getMaskElement(option));
}

function showNotice(option, message) {
    const element = getMaskElement(option);
    element.textContent = message;
    setTimeout(removeElement, 3200, element);
}

function importPlaylist(option, { url, type }) {
    if (option === "youtube") {
        fetchYoutubeItem(url, type);
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

async function addImportedPlaylist(playlist, type = "new") {
    const tempTracks = playlist.tracks.splice(0);
    let pl = null;
    let tracks = [];

    if (type === "new") {
        pl = createPlaylist(playlist);
        tracks = tempTracks;
    }
    else if (type === "sync") {
        pl = getPlaylistById(playlist.id);
        pl.tracks.length = 0;
        tracks = tempTracks;
    }
    else if (type === "update") {
        pl = getPlaylistById(playlist.id);
        tracks = filterDuplicateTracks(tempTracks, pl.tracks);
    }
    else {
        throw new Error("Unknown import type");
    }
    const newTracks = await replaceInvalidImages(tracks);

    addTracksToPlaylist(pl, newTracks);
    setImportOption();
    removeImportForm();
    removeImportOptionMask(playlist.player);
}

function createImportForm(container, item) {
    const id = "js-import-form";
    const form = `
        <form id=${id} class="import-form" data-for="${item}">
            <input type="text" name="url" class="input" placeholder="URL" required>
            <button class="btn">Import</button>
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

function showFilePicker(item) {
    const filePicker = getElementById("js-file-picker") || createFileInput();

    if (item === "file") {
        filePicker.removeAttribute("webkitdirectory");
        filePicker.removeAttribute("directory");
        filePicker.removeAttribute("allowdirs");
        filePicker.setAttribute("multiple", "");
    }
    else if (item === "folder") {
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
        importPlaylist(option, { url });
        event.target.reset();
    }
    event.preventDefault();
}

function createYouTubeInfoPanel(id, { element }) {
    element.insertAdjacentHTML("afterend", `
        <div id="${id}" class="panel info-panel">
            <p class="info-panel-title">Accepted formats:</p>
            <ul>
                <li class="info-panel-content-item">youtube.com/playlist?list={playlistId}</li>
                <li class="info-panel-content-item">youtube.com/watch?v={videoId}</li>
            </ul>
        </div>
    `);
}

function handleGoogleAuthClick(element) {
    if (element.disabled) {
        return;
    }
    const instance = gapi.auth2.getAuthInstance();

    disableBtn(element);

    if (instance.isSignedIn.get()) {
        instance.signOut().then(() => {
            element.firstElementChild.textContent = "Sign In";
            enableBtn(element);
        }, error => {
            enableBtn(element);
            console.log(error);
        });
    }
    else {
        instance.signIn().then(() => {
            element.firstElementChild.textContent = "Sign Out";
            enableBtn(element);
        }, error => {
            enableBtn(element);
            console.log(error);
        });
    }
}

async function initGoogleAuth() {
    if (googleAuthInitialized) {
        return;
    }
    const element = document.querySelector(".google-sign-in-or-out-btn");
    googleAuthInitialized = true;

    try {
        disableBtn(element);

        await scriptLoader.load({ src: "https://apis.google.com/js/api.js" });
        await new Promise(resolve => gapi.load('client:auth2', resolve));
        await gapi.client.init({
            apiKey: process.env.YOUTUBE_API_KEY,
            clientId: "293076144560-r5cear7rprgo094u6ibcd6nl3bbg18te.apps.googleusercontent.com",
            discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/youtube/v3/rest"],
            scope: "https://www.googleapis.com/auth/youtube.force-ssl"
        });

        enableBtn(element);

        if (gapi.auth2.getAuthInstance().isSignedIn.get()) {
            element.firstElementChild.textContent = "Sign Out";
        }
    }
    catch (e) {
        console.log(e);
    }
}

function handleYouTubeOptionClick({ attrValue, elementRef }) {
    if (attrValue === "form-toggle") {
        const option = "youtube";

        if (isNewImportOption(option)) {
            elementRef.classList.add("active");
            createImportForm(elementRef, option);
            setImportOption(option);

            if (!googleAuthInitialized) {
                initGoogleAuth();
            }
        }
        else {
            setImportOption();
            removeImportForm();
        }
    }
    else if (attrValue === "google-sign-in-or-out") {
        handleGoogleAuthClick(elementRef);
    }
    else if (attrValue === "youtube-info") {
        togglePanel(`js-${attrValue}-panel`, createYouTubeInfoPanel, { element: elementRef });
    }
}

importOptions.addEventListener("mouseover", function onMouveover({ currentTarget, target }) {
    const element = getElementByAttr("data-option", target);

    if (!element || element.attrValue !== "dropbox") {
        return;
    }
    currentTarget.removeEventListener("mouseover", onMouveover);
    scriptLoader.load({
        src: "https://www.dropbox.com/static/api/2/dropins.js",
        id: "dropboxjs",
        "data-app-key": process.env.DROPBOX_API_KEY
    });
});

importOptions.addEventListener("click", ({ target }) => {
    const optionElement = getElementByAttr("data-option", target);
    const element = getElementByAttr("data-item", target);

    if (!optionElement || !element) {
        return;
    }
    const option = optionElement.attrValue;

    if (option === "local") {
        showFilePicker(element.attrValue);
    }
    else if (option === "dropbox") {
        showDropboxChooser();
    }
    else if (option === "youtube") {
        handleYouTubeOptionClick(element);
    }
});

export {
    importPlaylist,
    addImportedPlaylist,
    showNotice,
    createImportOptionMask,
    removeImportOptionMask,
    initGoogleAuth
};

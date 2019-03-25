import { removeElement, removeElementClass, getElementByAttr } from "./../utils.js";
import { togglePanel } from "../panels.js";
import { isGoogleAPIInitialized, changeGoogleAuthState, initGoogleAPI } from "../google-auth.js";
import { showDropboxChooser } from "../dropbox.js";
import { selectLocalFiles } from "../local.js";
import { fetchYoutubeItem } from "../youtube.js";
import { getSidebarEntry } from "../sidebar.js";
import { getSyncBtn } from "./playlist.entries.js";

const importOptionsElement = document.getElementById("js-import-options");
let importOption = "";

const importSettings = (function() {
    const defaultSettings = {
        "local-files": {
            storePlaylist: false
        },
        dropbox: {
            storePlaylist: false
        }
    };
    const settings = { ...defaultSettings, ...JSON.parse(localStorage.getItem("import-settings")) };

    function setSetting(id, setting, value) {
        settings[id][setting] = value;
        localStorage.setItem("import-settings", JSON.stringify(settings));
    }

    function getSetting(id, setting) {
        return settings[id] ? settings[id][setting] : null;
    }

    function getSettings() {
        return settings;
    }

    return { setSetting, getSetting, getSettings };
})();

function setImportOption(option = "") {
    importOption = option;
}

function isNewImportOption(option) {
    return importOption !== option;
}

function changeImportOptionState({ children }, state) {
    Array.from(children).forEach(element => {
        if (element.hasAttribute("data-item")) {
            element.disabled = state;
        }
    });
}

function resetImportOption() {
    setImportOption();
    removeImportForm();
}

function toggleStatusIndicator(id, state) {
    const entry = getSidebarEntry(id);
    const btn = getSyncBtn(id);

    if (entry) {
        entry.classList.toggle("show-spinner", state);
    }

    if (btn) {
        btn.disabled = state;
    }
}

function importPlaylist(option, { url, type }) {
    if (option === "youtube") {
        fetchYoutubeItem(url, type);
    }
}

function createImportForm(container, item) {
    const id = "js-import-form";

    container.insertAdjacentHTML("beforeend", `
        <form id=${id} class="import-form" data-for="${item}">
            <div class="import-form-input-container">
                <input type="text" name="url" class="input import-form-input" placeholder="URL" required>
                <button type="button"
                    class="btn-icon import-info-btn" data-item="youtube-info">
                    <svg viewBox="0 0 24 24">
                        <use href="#info"></use>
                    </svg>
                </button>
            </div>
            <button class="btn">Import</button>
        </form>
    `);
    document.getElementById(id).addEventListener("submit", handleImportFormSubmit);
}

function removeImportForm() {
    const form = document.getElementById("js-import-form");

    if (form) {
        form.removeEventListener("submit", handleImportFormSubmit);
        removeElement(form);
        removeElementClass(".import-option-btn.active", "active");
    }
}

function createImportProgressContainer() {
    importOptionsElement.insertAdjacentHTML("afterend", `
        <div id="js-import-progress" class="import-progress">
            <p id="js-import-progress-label" class="import-progress-label"></p>
            <div class="import-progress-bar">
                <div id="js-import-progress-bar-inner" class="import-progress-bar-inner"></div>
                <div id="js-import-progress-bar-label" class="import-progress-bar-label"></div>
            </div>
        </div>
    `);
}

function removeImportProgressContainer() {
    removeElement(document.getElementById("js-import-progress"));
}

function setImportProgressLabel(label = "") {
    document.getElementById("js-import-progress-label").textContent = label;
}

function updateProgress(label, current, total) {
    setImportProgressLabel(label);
    document.getElementById("js-import-progress-bar-inner").style.transform = `scaleX(${current / total})`;
    document.getElementById("js-import-progress-bar-label").textContent = `${current}/${total}`;
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
    input.setAttribute("accept", "audio/*");
    input.classList.add("file-picker");
    input.addEventListener("change", handleChangeOnFileInput);
    document.body.appendChild(input);
    return input;
}

function showFilePicker(item) {
    const filePicker = document.getElementById("js-file-picker") || createFileInput();

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
    const url = event.target.elements.url.value.trim();

    if (url) {
        const option = event.target.getAttribute("data-for");

        resetImportOption();
        importPlaylist(option, { url });
    }
    event.preventDefault();
}

function createYouTubeInfoPanel(id, { element }) {
    element.insertAdjacentHTML("afterend", `
        <div id="${id}" class="panel info-panel">
            <h3 class="panel-title">Accepted formats</h3>
            <ul>
                <li class="info-panel-content-item">youtube.com/playlist?list={playlistId}</li>
                <li class="info-panel-content-item">youtube.com/watch?v={videoId}</li>
            </ul>
        </div>
    `);
}

function createSettingsPanel(id, { element }) {
    const settings = importSettings.getSettings();

    element.insertAdjacentHTML("afterend", `
        <div id="${id}" class="panel import-settings-panel">
            <h3 class="panel-title">Settings</h3>
            <label class="import-setting">
                <input type="checkbox" class="checkbox-input"
                    ${settings["local-files"].storePlaylist ? "checked" : ""} data-id="local-files">
                <div class="checkbox">
                    <div class="checkbox-tick"></div>
                </div>
                <span class="import-setting-label">Store <b>Local files</b> playlist</span>
            </label>
            <label class="import-setting">
                <input type="checkbox" class="checkbox-input"
                    ${settings.dropbox.storePlaylist ? "checked" : ""} data-id="dropbox">
                <div class="checkbox">
                    <div class="checkbox-tick"></div>
                </div>
                <span class="import-setting-label">Store <b>Dropbox</b> playlist</span>
            </label>
            <div class="import-setting-message">
                <svg viewBox="0 0 24 24">
                    <use href="#info"></use>
                </svg>
                <span>Stored playlists will persist through reload</span>
            </div>
        </div>
    `);
    document.getElementById(id).addEventListener("change", handleSettingChange);
}

function handleSettingChange({ target }) {
    const id = target.getAttribute("data-id");

    importSettings.setSetting(id, "storePlaylist", target.checked);
}

function handleYouTubeOptionClick({ attrValue, elementRef }) {
    if (attrValue === "form-toggle") {
        const option = "youtube";

        if (isNewImportOption(option)) {
            elementRef.classList.add("active");
            createImportForm(elementRef.parentElement, option);
            setImportOption(option);

            if (!isGoogleAPIInitialized()) {
                initGoogleAPI();
            }
        }
        else {
            resetImportOption();
        }
    }
    else if (attrValue === "google-sign-in") {
        changeGoogleAuthState(elementRef);
    }
    else if (attrValue === "youtube-info") {
        togglePanel(`js-${attrValue}-panel`, createYouTubeInfoPanel, { element: elementRef });
    }
}

importOptionsElement.addEventListener("click", ({ currenTarget, target }) => {
    const element = getElementByAttr("data-item", target, currenTarget);

    if (!element || element.elementRef.disabled) {
        return;
    }
    const { attrValue } = getElementByAttr("data-option", target, currenTarget);

    if (attrValue === "local") {
        showFilePicker(element.attrValue);
    }
    else if (attrValue === "dropbox") {
        showDropboxChooser();
    }
    else if (attrValue === "youtube") {
        handleYouTubeOptionClick(element);
    }
});

document.getElementById("js-import-settings-btn").addEventListener("click", ({ currentTarget }) => {
    togglePanel("js-import-settings-panel", createSettingsPanel, {
        element: currentTarget
    });
});

window.addEventListener("import", ({ detail }) => {
    const { importing, option, playlistId } = detail;
    const element = document.querySelector(`[data-option=${option}]`);

    changeImportOptionState(element, importing);
    toggleStatusIndicator(playlistId, importing);

    if (option === "local") {
        if (importing) {
            createImportProgressContainer();
        }
        else {
            removeImportProgressContainer();
        }
    }
});

export {
    importSettings,
    importPlaylist,
    resetImportOption,
    updateProgress
};

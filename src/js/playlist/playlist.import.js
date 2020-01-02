import { getElementByAttr } from "./../utils.js";
import { togglePanel } from "../panels.js";
import { changeGoogleAuthState } from "../google-auth.js";
import { showDropboxChooser } from "../dropbox.js";
import { selectLocalFiles } from "../local.js";
import { fetchYoutubeItem, getYoutubeUserPlaylists, fetchYoutubeUserPlaylists } from "../youtube.js";
import { getSidebarEntry } from "../sidebar.js";
import { getSyncBtn } from "./playlist.entries.js";

const importOptionsElement = document.getElementById("js-import-options");

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

function changeImportOptionState({ children }, state) {
  Array.from(children).forEach(element => {
    let itemELement = null;

    if (element.hasAttribute("data-item")) {
      itemELement = element;
    }
    else if (element.querySelector("[data-item]")) {
      itemELement = element.querySelector("[data-item]");
    }

    if (itemELement) {
      itemELement.classList.toggle("spinner", state);
      itemELement.disabled = state;
    }
  });
}

function toggleStatusIndicator(id, state) {
  const entry = getSidebarEntry(id);
  const btn = getSyncBtn(id);

  if (entry) {
    entry.classList.toggle("show-spinner", state);
  }

  if (btn) {
    btn.disabled = state;
    btn.classList.toggle("spinner", state);
  }
}

function removeYoutubeModal(element) {
  document.getElementById("js-import-form").removeEventListener("submit", handleImportFormSubmit);
  element.removeEventListener("click", handleClickOnYoutubeModal);
  element.remove();
}

function handleClickOnYoutubeModal({ target, currentTarget }) {
  if (target === currentTarget || getElementByAttr("data-cancel-btn", target, currentTarget)) {
    removeYoutubeModal(currentTarget);
    return;
  }
  const playlistImportBtn = getElementByAttr("data-id", target, currentTarget);

  if (playlistImportBtn) {
    fetchYoutubeItem(`https://youtube.com/playlist?list=${playlistImportBtn.attrValue}`);
    removeYoutubeModal(currentTarget);
    return;
  }
  const inputInfoBtn = getElementByAttr("data-info-btn", target, currentTarget);

  if (inputInfoBtn) {
    const { elementRef } = inputInfoBtn;

    togglePanel("js-youtube-info-panel", createYouTubeInfoPanel, { element: elementRef });
  }
}
function createYoutubeModal() {
  const containerId = "js-youtube-modal";
  const formId = "js-import-form";
  const playlistsTemplate = getYoutubeUserPlaylistsTemplate();

  importOptionsElement.insertAdjacentHTML("beforeend", `
    <div id="${containerId}" class="youtube-modal-container">
      <div class="youtube-modal">
        <h3 class="youtube-modal-title">YouTube Import</h3>
        <form id="${formId}" class="youtube-modal-form">
          <div class="youtube-modal-form-input-container">
            <input type="text" name="url" class="input youtube-modal-form-input" placeholder="URL" required>
            <button type="button"
              class="btn btn-icon youtube-modal-form-info-btn" data-info-btn>
              <svg viewBox="0 0 24 24">
              <use href="#info"></use>
              </svg>
            </button>
          </div>
          <button class="btn youtube-modal-form-submit-btn">Import</button>
        </form>
        ${playlistsTemplate}
        <div class="youtube-modal-footer">
          <button class="btn btn-text" data-cancel-btn>Cancel</button>
        </div>
      </div>
    </div>
  `);

  document.getElementById(containerId).addEventListener("click", handleClickOnYoutubeModal);
  document.getElementById(formId).addEventListener("submit", handleImportFormSubmit);
}

function handleChangeOnFileInput({ target }) {
  selectLocalFiles([...target.files]);
  target.value = "";
  target.removeEventListener("change", handleChangeOnFileInput);
  target.remove();
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
    fetchYoutubeItem(url);
    removeYoutubeModal(document.getElementById("js-youtube-modal"));
  }
  event.preventDefault();
}

function createYouTubeInfoPanel(id, { element }) {
  element.insertAdjacentHTML("afterend", `
    <div id="${id}" class="panel info-panel">
    <h3 class="panel-title">Accepted formats:</h3>
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

async function handleYouTubeOptionClick(attrValue, optionElement) {
  changeImportOptionState(optionElement, true);

  if (attrValue === "modal-toggle") {
    await fetchYoutubeUserPlaylists();
    createYoutubeModal();
  }
  else if (attrValue === "google-sign-in") {
    await changeGoogleAuthState();
  }
  changeImportOptionState(optionElement, false);
}

function getYoutubeUserPlaylistsTemplate() {
  const playlists = getYoutubeUserPlaylists();

  if (!playlists) {
    return "";
  }
  const items = playlists.reduce((str, pl) => {
    return `
      ${str}
      <li class="youtube-modal-playlist">
        <button class="youtube-modal-playlist-btn" data-id="${pl.id}">
          <div class="youtube-modal-playlist-thumb-container">
            <img src="${pl.thumbnail}" alt="" class="youtube-modal-playlist-thumb">
          </div>
          <div class="youtube-modal-playlist-content">
            <div>${pl.title}</div>
            <div class="youtube-modal-playlist-info">${pl.itemCount} item${pl.itemCount === 1 ? "" : "s"}</div>
          </div>
          <span class="youtube-modal-playlist-action">Import</span>
        </button>
      </li>
    `;
  }, "");

  return `
    <h4 class="youtube-modal-section-title">Your Playlists</h4>
    <ul class="youtube-modal-playlists">${items}</ul>
  `;
}

importOptionsElement.addEventListener("click", ({ currenTarget, target }) => {
  const element = getElementByAttr("data-item", target, currenTarget);

  if (!element || element.elementRef.disabled) {
    return;
  }
  const { attrValue, elementRef: optionElement } = getElementByAttr("data-option", target, currenTarget);

  if (attrValue === "local") {
    showFilePicker(element.attrValue);
  }
  else if (attrValue === "dropbox") {
    showDropboxChooser();
  }
  else if (attrValue === "youtube") {
    handleYouTubeOptionClick(element.attrValue, optionElement);
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
});

window.addEventListener("connectivity-status", ({ detail: status }) => {
  if (!status) {
    const element = document.getElementById("js-youtube-modal");

    if (element) {
      removeYoutubeModal(element);
    }
  }
  importOptionsElement.querySelectorAll("[data-disable]").forEach(element => {
    element.disabled = !status;
  });
});

export {
  importSettings
};

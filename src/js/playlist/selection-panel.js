import { getElementByAttr, getIcon } from "./../utils.js";
import { removePanel } from "./../panels.js";
import { createMoveToForm, moveTracks, getMoveToSection } from "./playlist.move-to.js";
import { addSelectedTracksToQueue } from "../player/queue.js";

function createSelectionPanelContainer() {
  const id = "js-selection-panel-container";
  const element = document.getElementById("js-playlist-tab-header-items");

  element.insertAdjacentHTML("afterbegin", `
    <div id="${id}" class="playlist-tab-header-item" data-selection-panel>
      <button class="btn btn-icon" data-item="selection-panel" title="Show selection panel">
        ${getIcon({ iconId: "playlist-add" })}
      </button>
    </div>
  `);
  document.getElementById(id).addEventListener("click", handleClick);
}

function createSelectionPanel(panelId, { playlistId }) {
  const element = document.getElementById("js-selection-panel-container");

  element.insertAdjacentHTML("beforeend", `
    <div id="${panelId}" class="panel selection-panel">
      <div class="selection-panel-section">
        ${getMoveToSection(playlistId)}
      </div>
      <div class="selection-panel-section">
        <button class="btn btn-icon selection-panel-btn" data-panel-item="queue-btn">Add to Queue</button>
      </div>
    </div>
  `);
}

function removeSelectionPanel() {
  const element = document.getElementById("js-selection-panel-container");

  element.removeEventListener("click", handleClick);
  element.remove();
}

function handleClick({ currentTarget, target }) {
  const element = getElementByAttr("data-panel-item", target, currentTarget);

  if (!element) {
    return;
  }
  const { attrValue, elementRef } = element;

  if (attrValue === "form-btn") {
    createMoveToForm("selection-panel-move-to", elementRef, "afterend");
    elementRef.remove();
  }
  else if (attrValue === "queue-btn") {
    addSelectedTracksToQueue();
    removePanel();
  }
  else {
    currentTarget.removeEventListener("click", handleClick);
    moveTracks(attrValue);
    removePanel();
  }
}

export {
  createSelectionPanelContainer,
  createSelectionPanel,
  removeSelectionPanel
};

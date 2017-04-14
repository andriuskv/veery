import { getElementById, removeElement, isOutsideElement } from "./utils.js";

let visiblePanel = null;

function removePanel() {
    window.removeEventListener("click", handleClick, true);
    removeElement(visiblePanel);
    visiblePanel = null;
}

function createPanel(id, pl, panelCreationCallback) {
    panelCreationCallback(id, pl);
    visiblePanel = getElementById(id);
    window.addEventListener("click", handleClick, true);
}

function togglePanel(id, pl, panelCreationCallback) {
    if (visiblePanel) {
        window.removeEventListener("click", handleClick, true);
        removeElement(visiblePanel);

        if (visiblePanel.id !== id) {
            createPanel(id, pl, panelCreationCallback);
        }
        else {
            visiblePanel = null;
        }
    }
    else {
        createPanel(id, pl, panelCreationCallback);
    }
}

function handleClick({ target }) {
    if (isOutsideElement(target, visiblePanel.parentElement)) {
        removePanel();
    }
}

export {
    removePanel,
    togglePanel
};

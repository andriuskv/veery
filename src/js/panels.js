import { getElementById, removeElement, isOutsideElement } from "./utils.js";

let visiblePanel = null;

function removePanel() {
    window.removeEventListener("click", handleClick, true);
    removeElement(visiblePanel);
    visiblePanel = null;
}

function createPanel(id, panelCreationCallback, options) {
    panelCreationCallback(id, options);
    visiblePanel = getElementById(id);
    window.addEventListener("click", handleClick, true);
}

function togglePanel(id, panelCreationCallback, options) {
    if (visiblePanel) {
        window.removeEventListener("click", handleClick, true);
        removeElement(visiblePanel);

        if (visiblePanel.id !== id) {
            createPanel(id, panelCreationCallback, options);
        }
        else {
            visiblePanel = null;
        }
    }
    else {
        createPanel(id, panelCreationCallback, options);
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

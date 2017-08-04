import { getElementById, removeElement, isOutsideElement } from "./utils.js";

let visiblePanel = null;

function removePanel() {
    window.removeEventListener("click", handleClick, true);
    removeElement(visiblePanel.element);
    visiblePanel = null;
}

function createPanel(id, panelCreationCallback, params) {
    panelCreationCallback(id, params);
    visiblePanel = {
        id,
        element: getElementById(id),
        removeOnClick: params.removeOnClick,
        initiator: params.element
    };
    window.addEventListener("click", handleClick, true);
}

function togglePanel(id, panelCreationCallback, params) {
    if (visiblePanel) {
        const panelId = visiblePanel.id;

        removePanel();

        if (panelId !== id) {
            createPanel(id, panelCreationCallback, params);
        }
    }
    else {
        createPanel(id, panelCreationCallback, params);
    }
}

function handleClick({ target }) {
    if (visiblePanel.removeOnClick) {
        removePanel();
        return;
    }
    const isOutsidePanel = isOutsideElement(target, visiblePanel.element);
    const isOutsideInitiator = isOutsideElement(target, visiblePanel.initiator);

    if (isOutsidePanel && isOutsideInitiator) {
        removePanel();
    }
}

export {
    removePanel,
    togglePanel
};

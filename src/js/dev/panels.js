import { removeElement, isOutsideElement } from "./main.js";

const visiblePanels = {};

function markPanelAsVisible(panelId) {
    visiblePanels[panelId] = true;
}

function removePanel(panelId) {
    const panelElement = document.getElementById(panelId);

    visiblePanels[panelId] = false;
    if (panelElement) {
        removeElement(panelElement);
    }
}

function isPanelVisible(panelId) {
    return visiblePanels[panelId];
}

function togglePanel(panelId, pl, panelCreationCallback) {
    if (!isPanelVisible(panelId)) {
        markPanelAsVisible(panelId);
        panelCreationCallback(panelId, pl);
    }
    else {
        removePanel(panelId);
    }
}

function removePresentPanels(event = {}, panelToKeepId) {
    Object.keys(visiblePanels).forEach(id => {
        if (visiblePanels[id] && id !== panelToKeepId && isOutsideElement(event.target, id)) {
            removePanel(id);
        }
    });
}

export {
    removePanel,
    removePresentPanels,
    togglePanel
};

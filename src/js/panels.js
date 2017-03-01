import { getElementById, removeElement, isOutsideElement } from "./utils.js";

const visiblePanels = {};

function markPanelAsVisible(panelId) {
    visiblePanels[panelId] = true;
}

function removePanel(panelId) {
    const panelElement = getElementById(panelId);

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
        const element = getElementById(id);

        if (visiblePanels[id] && id !== panelToKeepId && isOutsideElement(event.target, element)) {
            removePanel(id);
        }
    });
}

export {
    removePanel,
    removePresentPanels,
    togglePanel
};

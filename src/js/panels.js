import { isOutsideElement } from "./utils.js";

let visiblePanel = null;

function removePanel() {
  window.removeEventListener("click", handleClick, true);
  visiblePanel.element.remove();
  visiblePanel = null;
}

function createPanel(id, panelCreationCallback, params = {}) {
  panelCreationCallback(id, params);
  visiblePanel = {
    id,
    element: document.getElementById(id),
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
  const { element, initiator } = visiblePanel;
  const isOutsidePanel = isOutsideElement(target, element);
  const isOutsideInitiator = initiator ? isOutsideElement(target, initiator) : false;

  if (isOutsidePanel && isOutsideInitiator) {
    removePanel();
  }
}

export {
  removePanel,
  togglePanel
};

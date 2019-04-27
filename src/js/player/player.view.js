import { dispatchCustomEvent, removeElement } from "../utils.js";

function createMessageContainer() {
    const div = document.createElement("div");

    div.id = "js-player-messages";
    div.classList.add("player-messages");
    document.getElementById("js-player").appendChild(div);

    return div;
}

function getMessageContainer() {
    return document.getElementById("js-player-messages") || createMessageContainer();
}

function removePlayerMessage() {
    const element = getMessageContainer();

    removeElement(element.lastElementChild);

    if (!element.childElementCount) {
        removeElement(element);
    }
}

function showPlayerMessage({ title, body }) {
    const element = getMessageContainer();

    element.insertAdjacentHTML("afterBegin", `
        <div class="player-message">
            <h3 class="player-message-title">${title}</h3>
            <p class="player-message-body">${body}</p>
        </div>
    `);

    setTimeout(removePlayerMessage, 6000);
}

function showServiceWorkerMessage() {
    const element = getMessageContainer();

    element.insertAdjacentHTML("afterBegin", `
        <div class="player-message service-worker-message">
            <p class="player-message-body">Update is available, please refresh.</p>
            <button id="js-player-message-btn" class="btn btn-icon player-message-btn">Refresh</button>
        </div>
    `);
    document.getElementById("js-player-message-btn").addEventListener("click", refreshPage);

    setTimeout(removePlayerMessage, 6000);
}

function refreshPage() {
    location.reload();
}

function emitConnectivityStatus() {
    dispatchCustomEvent("connectivity-status", navigator.onLine);
}

window.addEventListener("sw-state-change", ({ detail }) => {
    if (detail === "update") {
        showServiceWorkerMessage();
    }
});

window.addEventListener("online", emitConnectivityStatus);
window.addEventListener("offline", emitConnectivityStatus);
window.addEventListener("load", emitConnectivityStatus);

export {
    showPlayerMessage
};

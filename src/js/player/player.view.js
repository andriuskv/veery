import { dispatchCustomEvent } from "../utils.js";

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
    const container = getMessageContainer();

    if (container) {
        const elements = [...container.children].reverse();

        for (const element of elements) {
            if (!element.id) {
                element.remove();

                if (elements.length - 1 === 0) {
                    container.remove();
                }
                break;
            }
        }
    }
}

function showPlayerMessage({ title, body, id }) {
    const element = getMessageContainer();

    element.insertAdjacentHTML("afterBegin", `
        <div ${id ? `id=${id} ` : ""}class="player-message">
            ${title ? `<h3 class="player-message-title">${title}</h3>` : ""}
            <div class="player-message-body">${body}</div>
        </div>
    `);

    if (!id) {
        setTimeout(removePlayerMessage, 6000);
    }
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
    showPlayerMessage,
    emitConnectivityStatus
};

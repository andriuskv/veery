import { togglePanel } from "../panels.js";

function getPlayerMessageCb(title, body = "") {
    return (id, { element }) => {
        element.insertAdjacentHTML("beforeend", `
            <div id="${id}" class="panel player-message">
                <h3 class="panel-title">${title}</h3>
                ${body && `<p class="player-message-body">${body}</p>`}
            </div>
        `);
    };
}

function getServiceWorkerMessageCb() {
    return (id, { element }) => {
        element.insertAdjacentHTML("beforeend", `
            <div id="${id}" class="panel player-message service-worker-message">
                <p class="player-message-body">Update is available, please refresh.</p>
                <button id="js-player-message-btn" class="btn-icon player-message-btn">Refresh</button>
            </div>
        `);
        document.getElementById("js-player-message-btn").addEventListener("click", refreshPage, { once: true });
    };
}

function showPlayerMessage({ title, body, callback = getPlayerMessageCb }) {
    const createMessage = callback(title, body);

    togglePanel("js-player-message", createMessage, {
        element: document.getElementById("js-player"),
        removeOnClick: true
    });
}

function updateOnlineStatus() {
    const statusElement = document.getElementById("js-online-status");

    statusElement.classList.toggle("visible", !navigator.onLine);
}

function refreshPage() {
    location.reload();
}

window.addEventListener("sw-state-change", ({ detail }) => {
    if (detail === "update") {
        showPlayerMessage({
            callback: getServiceWorkerMessageCb
        });
    }
});

window.addEventListener("online", updateOnlineStatus);
window.addEventListener("offline", updateOnlineStatus);
window.addEventListener("load", updateOnlineStatus);

export {
    showPlayerMessage
};

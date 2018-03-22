import { togglePanel } from "../panels.js";

function getPlayerMessageCb(title, body = "") {
    return (id, { element }) => {
        element.insertAdjacentHTML("beforeend", `
            <div id="${id}" class="panel player-message">
                <h3 class="panel-title player-message-title">${title}</h3>
                ${body && `<p class="player-message-body">${body}</p>`}
            </div>
        `);
    };
}

function showPlayerMessage({ title, body }) {
    const createPlayerMessage = getPlayerMessageCb(title, body);

    togglePanel("js-player-message", createPlayerMessage, {
        element: document.getElementById("js-player"),
        removeOnClick: true
    });
}

function updateOnlineStatus() {
    const statusElement = document.getElementById("js-online-status");

    if (!navigator.onLine) {
        statusElement.classList.add("visible");
    }
    else {
        statusElement.classList.remove("visible");
    }
}

window.addEventListener("sw-state-change", ({ detail }) => {
    if (detail === "init") {
        showPlayerMessage({
            title: "Content is cached for offline use."
        });
    }
    else if (detail === "update") {
        showPlayerMessage({
            title: "Update is available, please refresh."
        });
    }
});

window.addEventListener("online", updateOnlineStatus);
window.addEventListener("offline", updateOnlineStatus);
window.addEventListener("load", updateOnlineStatus);

export {
    showPlayerMessage
};

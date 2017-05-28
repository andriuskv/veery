import { toggleCurrentRoute } from "./router.js";
import { updatePlaylist, createPlaylist } from "./playlist/playlist.js";
import { initPlaylist } from "./playlist/playlist.manage.js";
import { storedTrack } from "./player/player.js";

const worker = new Worker("./ww.js");

worker.onmessage = function({ data: { action, payload } }) {
    if (action === "init") {
        Object.keys(payload).forEach(id => {
            initPlaylist(createPlaylist(payload[id]));
        });
        storedTrack.initTrack();
        toggleCurrentRoute();
    }
    else if (action === "update") {
        updatePlaylist(payload.id, payload);
    }
};

worker.onerror = function(event) {
    console.log(event);
};

function postMessageToWorker(message) {
    worker.postMessage(message);
}

export {
    postMessageToWorker
};

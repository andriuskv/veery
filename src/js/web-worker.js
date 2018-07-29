import { showCurrentRoute } from "./router.js";
import { updatePlaylist, createPlaylist } from "./playlist/playlist.js";
import { initPlaylist } from "./playlist/playlist.manage.js";
import { syncPlaylists } from "./playlist/playlist.entries.js";
import { storedTrack } from "./player/player.js";

const worker = new Worker("./ww.js");

worker.onmessage = function({ data: { action, payload } }) {
    if (action === "init") {
        payload.forEach(pl => {
            initPlaylist(createPlaylist(pl));
        });
        syncPlaylists(payload.filter(pl => pl.syncOnInit));
        storedTrack.initTrack();
        showCurrentRoute();
    }
    else if (action === "update") {
        updatePlaylist(payload.id, payload);
    }
};

worker.onerror = function(event) {
    console.log(event);
};

function postMessageToWorker(message) {
    if (message.playlist.storageDisabled) {
        return;
    }
    else if (message.action === "add" || message.playlist._id) {
        worker.postMessage(message);
    }
}

export {
    postMessageToWorker
};

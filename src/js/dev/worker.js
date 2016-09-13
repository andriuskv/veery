import * as router from "./router.js";
import { createPlaylist } from "./playlist/playlist.js";
import { initPlaylist } from "./playlist/playlist.manage.js";
import { storedTrack } from "./player/player.js";

let worker = null;

function initializeWorker() {
    worker = new Worker("js/workers/worker1.js");

    worker.onmessage = function(event) {
        const savedPlaylists = event.data;

        Object.keys(savedPlaylists).forEach(id => {
            const pl = savedPlaylists[id];

            initPlaylist(createPlaylist(pl));
        });
        storedTrack.setPlayerAsReady("native");
        router.toggleCurrent();
    };

    worker.onerror = function(event) {
        console.log(event);
    };
}

function postMessageToWorker(message) {
    worker.postMessage(message);
}

export { initializeWorker, postMessageToWorker };

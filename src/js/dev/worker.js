import * as router from "./router.js";
import { getPlaylistById, createPlaylist } from "./playlist/playlist.js";
import { initPlaylist } from "./playlist/playlist.manage.js";
import { storedTrack } from "./player/player.js";

let worker = null;

function initializeWorker() {
    worker = new Worker("js/ww.js");

    worker.onmessage = function({ data }) {
        if (data.action === "init-playlist") {
            const playlists = data.payload;

            Object.keys(playlists).forEach(id => {
                const pl = playlists[id];

                initPlaylist(createPlaylist(pl), false);
            });
            storedTrack.setPlayerAsReady("native");
            router.toggleCurrent();
        }
        else if (data.action === "update-playlist") {
            const pl = getPlaylistById(data.payload.id);

            pl._id = data.payload._id;
        }
    };

    worker.onerror = function(event) {
        console.log(event);
    };
}

function postMessageToWorker(message) {
    worker.postMessage(message);
}

export { initializeWorker, postMessageToWorker };

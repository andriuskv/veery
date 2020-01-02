import { showCurrentRoute } from "./router.js";
import { createPlaylist } from "./playlist/playlist.js";
import { initPlaylist } from "./playlist/playlist.manage.js";
import { syncPlaylists } from "./playlist/playlist.entries.js";
import { storedTrack } from "./player/player.js";
import { initArtworks } from "./artworks";

const worker = new Worker("./ww.js");

worker.onmessage = function({ data: { artworks, playlists } }) {
  initArtworks(artworks);
  playlists.forEach(pl => {
    initPlaylist(createPlaylist(pl));
  });
  syncPlaylists(playlists.filter(pl => pl.syncOnInit));
  storedTrack.initTrack();
  showCurrentRoute();
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

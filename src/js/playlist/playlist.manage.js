import {
    isPlaylistActive,
    createPlaylist,
    removePlaylist,
    getPlaylistState,
    setPlaylistState,
    getCurrentTrack,
    updateCurrentTrackIndex,
    resetTrackIndexes,
    setPlaybackOrder,
    setSortOrder
} from "./playlist.js";
import { createPlaylistEntry, updatePlaylistEntry } from "./playlist.entries.js";
import { removePlaylistTab, updatePlaylistView, getPlaylistElement } from "./playlist.view.js";
import { addRoute, removeRoute } from "../router.js";
import { getSetting } from "../settings.js";
import { postMessageToWorker } from "../web-worker.js";
import { createSidebarEntry, removeSidebarEntry } from "../sidebar.js";
import { stopPlayer } from "../player/player.js";

function initPlaylist(pl) {
    setPlaylistState(pl.id, { initialized: true });
    createSidebarEntry(pl.title, pl.id);
    createPlaylistEntry(pl);
    resetTrackIndexes(pl);
    setSortOrder(pl);
    addRoute(`playlist/${pl.id}`);
}

function deletePlaylist({ id, _id }) {
    if (isPlaylistActive(id)) {
        stopPlayer(getCurrentTrack());
    }
    removePlaylistTab(id);
    removePlaylist(id);
    removeSidebarEntry(id);
    removeRoute(id);
    postMessageToWorker({
        action: "remove",
        playlist: { _id }
    });
}

function addTracksToPlaylist(pl, tracks) {
    const { initialized, rendered } = getPlaylistState(pl.id);

    if (tracks.length) {
        pl.tracks = pl.tracks.concat(tracks);
    }

    if (initialized) {
        if (isPlaylistActive(pl.id)) {
            setPlaybackOrder(pl.id, getSetting("shuffle"));
        }
        resetTrackIndexes(pl);
        setSortOrder(pl);
        updateCurrentTrackIndex(pl.id);
        updatePlaylistEntry(pl.id, pl.tracks);

        if (rendered) {
            updatePlaylistView(pl);
        }
        postMessageToWorker({
            action: "add-tracks",
            playlist: {
                _id: pl._id,
                tracks
            }
        });
    }
    else {
        initPlaylist(pl);

        if (pl.storePlaylist) {
            postMessageToWorker({
                action: "add",
                playlist: pl
            });
        }
    }
}

function clearPlaylistTracks({ id, _id, tracks }) {
    const { rendered } = getPlaylistState(id);
    const element = getPlaylistElement(id);

    if (rendered && element) {
        element.innerHTML = "";
    }
    postMessageToWorker({
        action: "remove-tracks",
        playlist: { _id, tracks }
    });
    tracks.length = 0;
}

function onNewPlaylistFormSubmit(event) {
    const pl = createPlaylist({
        title: event.target.title.value,
        id: Math.random().toString(36).slice(2),
        storePlaylist: true,
        type: "grid"
    });

    initPlaylist(pl);
    postMessageToWorker({
        action: "add",
        playlist: pl
    });
    event.preventDefault();
    event.target.reset();
}

function createNewPlaylistForm(id, element, insertPoint, handleSubmit) {
    element.insertAdjacentHTML(insertPoint, `
        <form id="js-${id}-form" class="${id}-form">
            <input type="text" name="title" class="input" autocomplete="off" placeholder="Playlist title" required>
            <button class="btn">Create</button>
        </form>
    `);

    const form = document.getElementById(`js-${id}-form`);

    form.elements.title.focus();
    form.addEventListener("submit", handleSubmit);
}

export {
    initPlaylist,
    deletePlaylist,
    addTracksToPlaylist,
    clearPlaylistTracks,
    onNewPlaylistFormSubmit,
    createNewPlaylistForm
};

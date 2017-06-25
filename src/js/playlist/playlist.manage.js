import * as playlist from "./playlist.js";
import { getElementById, dispatchCustomEvent } from "../utils.js";
import { removePlaylistTab, updatePlaylistView } from "./playlist.view.js";
import { isRouteActive, addRoute, toggleRoute } from "../router.js";
import { getSetting } from "../settings.js";
import { postMessageToWorker } from "../worker.js";
import { createSidebarEntry, removeSidebarEntry } from "../sidebar.js";
import { stopPlayer } from "../player/player.js";
import { sortTracks } from "./playlist.sorting.js";
import { createPlaylistEntry } from "./playlist.entries.js";

function updateTracks(pl) {
    playlist.setPlaybackOrder(pl, getSetting("shuffle"));

    if (pl.sortedBy) {
        sortTracks(pl.tracks, pl.sortedBy, pl.order);
    }
    pl.tracks = playlist.resetTrackIndexes(pl.tracks);
    playlist.updatePlaylistDuration(pl);
}

function initPlaylist(pl) {
    pl.initialized = true;
    addRoute(`playlist/${pl.id}`);
    createSidebarEntry(pl.title, pl.id);
    createPlaylistEntry(pl.title, pl.id, pl.url);
    updateTracks(pl);
}

function removePlaylist(id) {
    const { rendered, _id } = playlist.getPlaylistById(id);

    if (playlist.isPlaylistActive(id)) {
        stopPlayer();
    }
    if (rendered) {
        removePlaylistTab(id);
    }
    playlist.removePlaylist(id);
    removeSidebarEntry(id);
    postMessageToWorker({
        action: "remove",
        playlist: { _id }
    });
}

function updateCurrentTrack(pl) {
    const currentTrack = playlist.getCurrentTrack();

    if (currentTrack && playlist.isPlaylistActive(pl.id)) {
        const track = playlist.findTrack(pl.id, currentTrack.name);

        if (track) {
            playlist.updateCurrentTrack({ index: track.index });
            playlist.setPlaybackIndex(track.index);
        }
    }
}

function addTracksToPlaylist(pl, tracks, showPlaylist = isRouteActive("manage")) {
    pl.tracks = pl.tracks.concat(tracks);

    if (!pl.initialized) {
        initPlaylist(pl);
    }
    else {
        dispatchCustomEvent("playlist-status-update", { id: pl.id });
        updateTracks(pl);
        updateCurrentTrack(pl);

        if (pl.rendered) {
            updatePlaylistView(pl);
        }
    }

    if (showPlaylist) {
        toggleRoute(`playlist/${pl.id}`);
    }
    else {
        dispatchCustomEvent("track-length-change");
    }
    postMessageToWorker({
        action: "put",
        playlist: pl
    });
}

function onNewPlaylistFormSubmit(event) {
    const form = event.target;
    const title = form.title.value.trim();

    event.preventDefault();

    if (!title) {
        return;
    }
    const pl = playlist.createPlaylist({
        title,
        id: Math.random().toString(36).slice(2),
        type: "grid"
    });

    initPlaylist(pl);
    postMessageToWorker({
        action: "put",
        playlist: pl
    });
    form.reset();
}

function createNewPlaylistInputForm(id, containerElement, handleSubmit) {
    containerElement.insertAdjacentHTML("afterend", `
        <form id="js-${id}-form" class="${id}-form">
            <input type="text" name="title" class="input" autocomplete="off" placeholder="Playlist title" required>
            <button class="btn">Create</button>
        </form>
    `);

    const element = getElementById(`js-${id}-form`);

    element.querySelector(".input").focus();
    element.addEventListener("submit", handleSubmit);

}

export {
    initPlaylist,
    removePlaylist,
    updateCurrentTrack,
    addTracksToPlaylist,
    onNewPlaylistFormSubmit,
    createNewPlaylistInputForm
};

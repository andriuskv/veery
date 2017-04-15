import * as playlist from "./playlist.js";
import { appendToPlaylistView, removePlaylistTab, updatePlaylistView, showPlayingTrack } from "./playlist.view.js";
import { getElementById } from "./../utils.js";
import { isRouteActive, addRoute, toggleRoute } from "./../router.js";
import { getSetting } from "./../settings.js";
import { postMessageToWorker } from "./../worker.js";
import { createSidebarEntry, removeSidebarEntry } from "./../sidebar.js";
import { stopPlayer } from "./../player/player.js";
import { sortTracks } from "./playlist.sorting.js";
import { createPlaylistEntry } from "./playlist.entries.js";

function resortTracks(pl) {
    playlist.shufflePlaybackOrder(pl, getSetting("shuffle"));

    if (pl.sortedBy) {
        sortTracks(pl.tracks, pl.sortedBy, pl.order);
        pl.tracks = playlist.resetTrackIndexes(pl.tracks);

        if (pl.rendered) {
            refreshPlaylist(pl);
        }
    }
}

function initPlaylist(pl) {
    pl.initialized = true;
    addRoute(`playlist/${pl.id}`);
    createSidebarEntry(pl.title, pl.id);
    createPlaylistEntry(pl.title, pl.id, pl.url);
    resortTracks(pl);
}

function appendToPlaylist(pl, tracks) {
    appendToPlaylistView(pl, tracks);
    resortTracks(pl);
}

function removePlaylist(id) {
    const { rendered, _id } = playlist.getPlaylistById(id);

    if (playlist.isActive(id)) {
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

function refreshPlaylist(pl) {
    const currentTrack = playlist.getCurrentTrack();

    updatePlaylistView(pl);

    if (currentTrack && playlist.isActive(pl.id)) {
        const track = playlist.findTrack(pl.id, currentTrack.name);

        if (track) {
            playlist.updateCurrentTrack({ index: track.index });
            playlist.setPlaybackIndex(track.index);
            showPlayingTrack(track.index, pl.id);
        }
    }
}

function addTracksToPlaylist(pl, tracks, showPlaylist = isRouteActive("manage")) {
    pl.tracks = pl.tracks.concat(tracks);

    if (!pl.initialized) {
        initPlaylist(pl);
    }
    else {
        pl.tracks = playlist.resetTrackIndexes(pl.tracks);
        appendToPlaylist(pl, tracks);
    }

    if (showPlaylist) {
        toggleRoute(`playlist/${pl.id}`);
    }
    postMessageToWorker({
        action: "put",
        playlist: pl
    });
}

function updatePlaylist(playlistId, data) {
    const { _id } = playlist.getPlaylistById(playlistId);

    playlist.updatePlaylist(playlistId, data);
    postMessageToWorker({
        action: "update",
        playlist: Object.assign({ _id }, data)
    });
}

function onNewPlaylistFormSubmit(event) {
    const form = event.target;
    const pl = playlist.createPlaylist({
        id: Math.random().toString(36).slice(2),
        title: form.title.value,
        type: "grid"
    });

    initPlaylist(pl);
    postMessageToWorker({
        action: "put",
        playlist: pl
    });
    event.preventDefault();
    form.reset();
}

function createNewPlaylistInputForm(id, element, handleSubmit) {
    const formElement = `
        <form id="js-${id}-form" class="${id}-form">
            <input type="text" name="title" autocomplete="off" required>
            <button class="btn">Create</button>
        </form>
    `;

    element.insertAdjacentHTML("afterend", formElement);
    getElementById(`js-${id}-form`).addEventListener("submit", handleSubmit);
}

export {
    initPlaylist,
    removePlaylist,
    refreshPlaylist,
    addTracksToPlaylist,
    updatePlaylist,
    onNewPlaylistFormSubmit,
    createNewPlaylistInputForm
};

import * as playlist from "./playlist.js";
import { getElementById, removeElementClass, removeElement, addSpinner } from "../utils.js";
import { removePlaylistTab, updatePlaylistView } from "./playlist.view.js";
import { addRoute, toggleRoute } from "../router.js";
import { getSetting } from "../settings.js";
import { postMessageToWorker } from "../worker.js";
import { createSidebarEntry, getSidebarEntry, removeSidebarEntry } from "../sidebar.js";
import { stopPlayer } from "../player/player.js";
import { sortTracks } from "./playlist.sorting.js";
import { createPlaylistEntry, enableSyncBtn, disableSyncBtn, updatePlaylistStats } from "./playlist.entries.js";

function updateTracks(pl) {
    playlist.setPlaybackOrder(pl, getSetting("shuffle"));
    sortTracks(pl.tracks, pl.sortedBy, pl.order);
    pl.tracks = playlist.resetTrackIndexes(pl.tracks);
}

function initPlaylist(pl) {
    pl.initialized = true;
    addRoute(`playlist/${pl.id}`);
    createSidebarEntry(pl.title, pl.id);
    createPlaylistEntry(pl);
    updateTracks(pl);
}

function removePlaylist({ id, rendered, _id }) {
    if (playlist.isPlaylistActive(id)) {
        stopPlayer(playlist.getCurrentTrack());
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
        let index = -1;

        if (track) {
            index = track.index;
        }
        else {
            removeElementClass(".track.playing", "playing");
        }
        playlist.updateCurrentTrack({ index });
        playlist.setPlaybackIndex(index);
    }
}

function addTracksToPlaylist(pl, tracks, showPlaylist) {
    if (tracks.length) {
        tracks = setPrimaryTackIndexes(tracks, pl.lastTrackIndex);
        pl.lastTrackIndex = tracks[tracks.length - 1].primaryIndex + 1;
        pl.tracks = pl.tracks.concat(tracks);
        pl.duration = playlist.getPlaylistDuration(pl.tracks);

        updatePlaylistStats();
    }

    if (!pl.initialized) {
        initPlaylist(pl);
        postMessageToWorker({
            action: "add",
            playlist: pl
        });
    }
    else {
        hideStatusIndicator(pl.id);
        updateTracks(pl);
        updateCurrentTrack(pl);

        if (pl.rendered) {
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

    if (showPlaylist) {
        toggleRoute(`playlist/${pl.id}`);
    }
}

function setPrimaryTackIndexes(tracks, lastIndex = 0) {
    return tracks.map((track, index) => {
        track.primaryIndex = lastIndex + index;
        return track;
    });
}

function onNewPlaylistFormSubmit(event) {
    const pl = playlist.createPlaylist({
        title: event.target.title.value,
        id: Math.random().toString(36).slice(2),
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

function createNewPlaylistForm(id, containerElement, handleSubmit) {
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

function showStatusIndicator(id) {
    const entry = getSidebarEntry(id);

    addSpinner(entry, `js-${id}-sidebar-spinner`, "sidebar-entry-spinner");
    disableSyncBtn(id);
}

function hideStatusIndicator(id) {
    const element = getElementById(`js-${id}-sidebar-spinner`);

    if (element) {
        removeElement(element);
    }
    enableSyncBtn(id);
}

export {
    initPlaylist,
    removePlaylist,
    updateCurrentTrack,
    addTracksToPlaylist,
    onNewPlaylistFormSubmit,
    createNewPlaylistForm,
    showStatusIndicator,
    hideStatusIndicator
};

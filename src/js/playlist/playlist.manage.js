import {
    isPlaylistActive,
    createPlaylist,
    removePlaylist,
    getCurrentTrack,
    updateCurrentTrackIndex,
    resetTrackIndexes,
    setPlaybackOrder
} from "./playlist.js";
import {
    createPlaylistEntry,
    enableSyncBtn,
    disableSyncBtn,
    updatePlaylistEntry
} from "./playlist.entries.js";
import { removePlaylistTab, updatePlaylistView, addTracks, getPlaylistElement } from "./playlist.view.js";
import { addRoute, toggleRoute, removeRoute } from "../router.js";
import { getSetting } from "../settings.js";
import { postMessageToWorker } from "../web-worker.js";
import { createSidebarEntry, getSidebarEntry, removeSidebarEntry } from "../sidebar.js";
import { stopPlayer } from "../player/player.js";
import { sortTracks } from "./playlist.sorting.js";

function updateTracks(pl) {
    setPlaybackOrder(pl, getSetting("shuffle"));
    sortTracks(pl.tracks, pl.sortedBy, pl.order);
    pl.tracks = resetTrackIndexes(pl.tracks);
}

function initPlaylist(pl) {
    pl.initialized = true;
    addRoute(`playlist/${pl.id}`);
    createSidebarEntry(pl.title, pl.id);
    createPlaylistEntry(pl);
    updateTracks(pl);
}

function deletePlaylist({ id, rendered, _id }) {
    if (isPlaylistActive(id)) {
        stopPlayer(getCurrentTrack());
    }

    if (rendered) {
        removePlaylistTab(id);
    }
    removePlaylist(id);
    removeSidebarEntry(id);
    removeRoute(id);
    postMessageToWorker({
        action: "remove",
        playlist: { _id }
    });
}

function addTracksToPlaylist(pl, tracks, showPlaylist) {
    if (tracks.length) {
        tracks = setPrimaryTackIndexes(tracks, pl.lastTrackIndex);
        pl.lastTrackIndex = tracks[tracks.length - 1].primaryIndex + 1;
        pl.tracks = pl.tracks.concat(tracks);
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
        updateCurrentTrackIndex(pl.id);
        updatePlaylistEntry(pl.id, pl.tracks);

        if (pl.rendered) {
            if (tracks.length) {
                addTracks(pl, tracks);
            }
            else {
                updatePlaylistView(pl);
            }
        }
        postMessageToWorker({
            action: "add-tracks",
            playlist: {
                _id: pl._id,
                lastTrackIndex: pl.lastTrackIndex,
                tracks
            }
        });
    }

    if (showPlaylist) {
        toggleRoute(`playlist/${pl.id}`);
    }
}

function clearPlaylistTracks(pl) {
    const element = getPlaylistElement(pl.id);

    if (pl.rendered && element) {
        element.innerHTML = "";
    }
    postMessageToWorker({
        action: "remove-tracks",
        playlist: {
            _id: pl._id,
            tracks: pl.tracks
        }
    });
    pl.tracks.length = 0;
}

function setPrimaryTackIndexes(tracks, lastIndex = 0) {
    return tracks.map((track, index) => {
        track.primaryIndex = lastIndex + index;
        return track;
    });
}

function onNewPlaylistFormSubmit(event) {
    const pl = createPlaylist({
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

function showStatusIndicator(id) {
    const entry = getSidebarEntry(id);

    if (entry) {
        entry.classList.add("show-spinner");
    }
    disableSyncBtn(id);
}

function hideStatusIndicator(id) {
    const entry = getSidebarEntry(id);

    if (entry) {
        entry.classList.remove("show-spinner");
    }
    enableSyncBtn(id);
}

export {
    initPlaylist,
    deletePlaylist,
    addTracksToPlaylist,
    clearPlaylistTracks,
    onNewPlaylistFormSubmit,
    createNewPlaylistForm,
    showStatusIndicator,
    hideStatusIndicator
};

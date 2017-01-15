import * as playlist from "./playlist.js";
import * as playlistView from "./playlist.view.js";
import { isRouteActive, addRoute, toggleRoute } from "./../router.js";
import { getSetting } from "./../settings.js";
import { getVisiblePlaylistId } from "./../tab.js";
import { removeElements, dispatchCustomEvent } from "./../main.js";
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
    playlistView.appendToPlaylistView(pl, tracks);
    resortTracks(pl);
}

function removePlaylist(id) {
    const { rendered, _id } = playlist.getPlaylistById(id);

    if (playlist.isActive(id)) {
        stopPlayer();
    }
    if (rendered) {
        playlistView.removePlaylistTab(id);
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

    playlistView.updatePlaylistView(pl);

    if (currentTrack && playlist.isActive(pl.id)) {
        const track = playlist.findTrack(pl.id, currentTrack.name);

        if (track) {
            playlist.updateCurrentTrack({ index: track.index });
            playlist.setPlaybackIndex(track.index);
            playlistView.showPlayingTrack(track.index, pl.id);
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

function getSelectedTrackIndexes(selectedElements) {
    return selectedElements.map(element => parseInt(element.getAttribute("data-index"), 10));
}

function resetTrackElementIndexes(elements) {
    Array.from(elements).forEach((element, index) => {
        element.setAttribute("data-index", index);
    });
}

function removeSelectedPlaylistTracks(pl, selectedTrackIndexes) {
    const filteredTracks = pl.tracks.filter(track => !selectedTrackIndexes.includes(track.index));

    return playlist.resetTrackIndexes(filteredTracks);
}

function updateCurrentTrackIndex(playlistId, selectedTrackIndexes) {
    const currentTrack = playlist.getCurrentTrack();

    if (currentTrack && playlist.isActive(playlistId)) {
        if (selectedTrackIndexes.includes(currentTrack.index)) {
            playlist.updateCurrentTrack({ index: -1 });
        }
        else {
            const { index } = playlist.findTrack(playlistId, currentTrack.name);

            playlist.updateCurrentTrack({ index });
        }
    }
}

function getSelectedTrackElements() {
    return Array.from(document.querySelectorAll(".track.selected"));
}

function removeSelectedTracks(pl) {
    const selectedElements = getSelectedTrackElements();

    if (!selectedElements.length) {
        return;
    }
    const selectedTrackIndexes = getSelectedTrackIndexes(selectedElements);
    const tracks = removeSelectedPlaylistTracks(pl, selectedTrackIndexes);
    const elements = playlistView.getPlaylistTrackElements(pl.id);

    removeElements(selectedElements);
    resetTrackElementIndexes(elements);
    playlist.shufflePlaybackOrder(pl, getSetting("shuffle"));
    updateCurrentTrackIndex(pl.id, selectedTrackIndexes);
    dispatchCustomEvent("track-length-change", {
        tracks,
        id: pl.id,
        type: pl.type
    });
    updatePlaylist(pl.id, { tracks });
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

window.addEventListener("keypress", event => {
    const key = event.key === "Delete" || event.keyCode === 127;
    const pl = playlist.getPlaylistById(getVisiblePlaylistId());

    if (!key || !pl) {
        return;
    }
    removeSelectedTracks(pl);
});

function createNewPlaylistInputForm(id, element, handleSubmit) {
    const formElement = `
        <form id="js-${id}-form" class="${id}-form">
            <input type="text" name="title" autocomplete="off" required>
            <button class="btn">Create</button>
        </form>
    `;

    element.insertAdjacentHTML("afterend", formElement);
    document.getElementById(`js-${id}-form`).addEventListener("submit", handleSubmit);
}

export {
    initPlaylist,
    removePlaylist,
    refreshPlaylist,
    addTracksToPlaylist,
    updatePlaylist,
    getSelectedTrackIndexes,
    getSelectedTrackElements,
    onNewPlaylistFormSubmit,
    createNewPlaylistInputForm
};

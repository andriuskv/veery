import * as router from "./../router.js";
import * as playlist from "./playlist.js";
import * as playlistView from "./playlist.view.js";
import { getSetting } from "./../settings.js";
import { getVisiblePlaylistId } from "./../tab.js";
import { removeElements, removeElementClass, dispatchCustomEvent } from "./../main.js";
import { postMessageToWorker } from "./../worker.js";
import { createSidebarEntry, removeSidebarEntry } from "./../sidebar.js";
import { stopPlayer } from "./../player/player.js";
import { sortTracks } from "./playlist.sorting.js";
import { createPlaylistEntry } from "./playlist.entries.js";

function resortTracks(pl) {
    playlist.shufflePlaybackOrder(pl, getSetting("shuffle"));

    if (pl.sortedBy) {
        sortTracks(pl.tracks, pl.sortedBy, pl.order);

        if (pl.rendered) {
            refreshPlaylist(pl);
        }
    }
}

function initPlaylist(pl) {
    pl.initialized = true;
    router.add( `playlist/${pl.id}`);
    createSidebarEntry(pl.title, pl.id);
    createPlaylistEntry(pl.title, pl.id, pl.url);
    resortTracks(pl);
}

function appendToPlaylist(pl, tracks) {
    playlistView.append(pl, tracks);
    resortTracks(pl);
}

function removePlaylist(id) {
    const { rendered } = playlist.getPlaylistById(id);

    if (playlist.isActive(id)) {
        stopPlayer();
    }
    if (rendered) {
        playlistView.remove(id);
    }
    playlist.removePlaylist(id);
    removeSidebarEntry(id);
    postMessageToWorker({
        action: "remove",
        playlistId: id
    });
}

function refreshPlaylist(pl) {
    const currentTrack = playlist.getCurrentTrack();

    removeElementClass("track", "selected");
    playlistView.update(pl);

    if (currentTrack && playlist.isActive(pl.id)) {
        const track = playlist.findTrack(pl.id, currentTrack.name);

        if (track) {
            playlist.updateCurrentTrackIndex(track.index);
            playlist.setPlaybackIndex(track.index);
            playlistView.showPlayingTrack(track.index, pl.id, true);
        }
    }
}

function updatePlaylist(pl, tracks, showPlaylist = router.isActive("manage")) {
    pl.tracks = pl.tracks.concat(tracks);

    if (!pl.initialized) {
        initPlaylist(pl);
    }
    else {
        pl.tracks = playlist.resetTrackIndexes(pl.tracks);
        appendToPlaylist(pl, tracks);
    }

    if (showPlaylist) {
        router.toggle(`playlist/${pl.id}`);
    }

    postMessageToWorker({
        action: "put",
        playlist: pl
    });
}

function getSelectedTrackIndexes(selectedElements) {
    return selectedElements.map(element => Number.parseInt(element.getAttribute("data-index"), 10));
}

function resetTrackElementIndexes(elements) {
    elements.forEach((element, index) => {
        element.setAttribute("data-index", index);
    });
}

function removeSelectedPlaylistTracks(pl, selectedTrackIndexes) {
    const filteredTracks = pl.tracks.filter(track => !selectedTrackIndexes.includes(track.index));

    return playlist.resetTrackIndexes(filteredTracks);
}

function updateCurrentTrack(playlistId, selectedTrackIndexes) {
    const currentTrack = playlist.getCurrentTrack();

    if (currentTrack && playlist.isActive(playlistId)) {
        if (selectedTrackIndexes.includes(currentTrack.index)) {
            playlist.updateCurrentTrackIndex(-1);
        }
        else {
            const { index } = playlist.findTrack(playlistId, currentTrack.name);

            playlist.updateCurrentTrackIndex(index);
        }
    }
}

function getSelectedTrackElements() {
    return Array.from(document.querySelectorAll(".track.selected"));
}

function removeSelectedTracks(pl) {
    const selectedElements = getSelectedTrackElements();

    if (selectedElements.length) {
        const selectedTrackIndexes = getSelectedTrackIndexes(selectedElements);

        removeElements(selectedElements);
        resetTrackElementIndexes(Array.from(document.getElementById(`js-${pl.id}`).children));
        pl.tracks = removeSelectedPlaylistTracks(pl, selectedTrackIndexes);
        playlist.shufflePlaybackOrder(pl, getSetting("shuffle"));
        updateCurrentTrack(pl.id, selectedTrackIndexes);
        dispatchCustomEvent("track-length-change", {
            id: pl.id,
            tracks: pl.tracks,
            type: pl.type
        });
        postMessageToWorker({
            action: "put",
            playlist: pl
        });
    }
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
    updatePlaylist,
    getSelectedTrackIndexes,
    getSelectedTrackElements,
    onNewPlaylistFormSubmit,
    createNewPlaylistInputForm
};

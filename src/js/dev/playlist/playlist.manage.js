import * as router from "./../router.js";
import * as playlist from "./playlist.js";
import * as playlistView from "./playlist.view.js";
import { getSetting } from "./../settings.js";
import { getActiveTabId } from "./../tab.js";
import { removeElementClass } from "./../main.js";
import { postMessageToWorker } from "./../worker.js";
import { createSidebarEntry, removeSidebarEntry } from "./../sidebar.js";
import { storedTrack, stopPlayer } from "./../player/player.js";
import { sortTracks } from "./playlist.sorting.js";
import { createPlaylistEntry } from "./playlist.entries.js";
import { removeImportOptionMask } from "./playlist.add.js";

function resortTracks(pl) {
    playlist.setPlaybackOrder(pl, getSetting("shuffle"));
    playlist.resetPlaybackIndex();

    if (pl.sortedBy) {
        sortTracks(pl.tracks, pl.sortedBy, pl.order);
        refreshPlaylist(pl);
    }
}

function initPlaylist(pl, toggle = router.isActive("add")) {
    const route = `playlist/${pl.id}`;

    router.add(route);
    playlistView.add(pl);
    createSidebarEntry(pl.title, pl.id);
    createPlaylistEntry(pl.title, pl.id);
    resortTracks(pl);

    if (toggle) {
        router.toggle(route);
    }
}

function appendToPlaylist(pl, tracks, toggle = router.isActive("add")) {
    const route = `playlist/${pl.id}`;

    playlistView.append(pl, tracks);
    resortTracks(pl);

    if (toggle) {
        router.toggle(route);
    }
}

function removePlaylist(id) {
    const track = storedTrack.get();

    if (track && track.playlistId === id) {
        storedTrack.remove();
    }
    if (playlist.isActive(id)) {
        stopPlayer(playlist.getCurrentTrack());
    }
    playlist.removePlaylist(id);
    removeSidebarEntry(id);
    playlistView.remove(id);
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

function updatePlaylist(pl, tracks, importOption) {
    pl.tracks.push(...tracks);

    if (document.getElementById(`js-${pl.id}`)) {
        appendToPlaylist(pl, tracks);
    }
    else {
        initPlaylist(pl);
    }
    removeImportOptionMask(importOption);
    postMessageToWorker({
        action: "put",
        playlist: pl
    });
}

function getSelectedTrackIndexes(selectedElements) {
    return selectedElements.map(element => Number.parseInt(element.getAttribute("data-index"), 10));
}

function removeSelectedTrackElements(selectedElements) {
    selectedElements.forEach(element => {
        element.parentElement.removeChild(element);
    });
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

    if (playlistId === playlist.getActivePlaylistId() && currentTrack) {
        if (selectedTrackIndexes.includes(currentTrack.index)) {
            playlist.updateCurrentTrackIndex(-1);
        }
        else {
            const { index } = playlist.findTrack(playlistId, currentTrack.name);

            playlist.updateCurrentTrackIndex(index);
            playlist.setPlaybackIndex(index);
        }
    }
}

function removeSelectedTracks(pl) {
    const playlistContainer = document.getElementById(`js-${pl.id}`);
    const selectedElements = Array.from(playlistContainer.querySelectorAll(".track.selected"));

    if (selectedElements.length) {
        const selectedTrackIndexes = getSelectedTrackIndexes(selectedElements);

        removeSelectedTrackElements(selectedElements);
        resetTrackElementIndexes(Array.from(playlistContainer.children));
        pl.tracks = removeSelectedPlaylistTracks(pl, selectedTrackIndexes);
        playlist.setPlaybackOrder(pl, getSetting("shuffle"));
        updateCurrentTrack(pl.id, selectedTrackIndexes);
        postMessageToWorker({
            action: "put",
            playlist: pl
        });
    }
}

window.addEventListener("keypress", event => {
    const key = event.key === "Delete" || event.keyCode === 127;
    const pl = playlist.getPlaylistById(getActiveTabId());

    if (!key || !pl) {
        return;
    }
    removeSelectedTracks(pl);
});

export {
    initPlaylist,
    appendToPlaylist,
    removePlaylist,
    refreshPlaylist,
    updatePlaylist
};

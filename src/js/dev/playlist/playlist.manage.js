import { removeElementClass } from "./../main.js";
import { postMessageToWorker } from "./../worker.js";
import { createSidebarEntry, removeSidebarEntry } from "./../sidebar.js";
import { storedTrack, stopPlayer } from "./../player/player.js";
import * as settings from "./../settings.js";
import * as router from "./../router.js";
import * as tab from "./../tab.js";
import * as playlist from "./playlist.js";
import * as playlistView from "./playlist.view.js";

function initPlaylist(pl, toggle) {
    const route = `playlist/${pl.id}`;

    router.add(route);
    playlist.setTrackIndexes(pl, settings.get("shuffle"));
    playlist.resetPlaybackIndex();
    playlistView.add(pl);
    createSidebarEntry(pl.title, pl.id);
    createPlaylistEntry(pl.title, pl.id);

    if (pl.sortedBy) {
        playlist.sortTracks(pl.tracks, pl.sortedBy, pl.order);
        updatePlaylist(pl);
    }

    if (toggle) {
        router.toggle(route);
    }
    else if (router.isActive(pl.id)) {
        tab.toggle(pl.id);
    }
}

function appendToPlaylist(pl, tracks, toggle) {
    playlist.setTrackIndexes(pl, settings.get("shuffle"));
    playlist.resetPlaybackIndex();
    playlistView.append(pl, tracks);

    if (toggle) {
        router.toggle(`playlist/${pl.id}`);
    }
}

function replacePlaylistTracks(pl, toggle) {
    playlist.setTrackIndexes(pl, settings.get("shuffle"));
    playlist.resetPlaybackIndex();
    playlistView.replacePlaylistTrackView(pl);

    if (toggle) {
        router.toggle(`playlist/${pl.id}`);
    }
}

function removePlaylist(id, entry) {
    const track = storedTrack.get();

    if (track && track.playlistId === id) {
        storedTrack.remove();
    }
    if (playlist.isActive(id)) {
        stopPlayer();
    }
    if (!entry) {
        entry = document.querySelector(`[data-id=${id}]`);
    }
    entry.parentElement.removeChild(entry);
    playlist.removePlaylist(id);
    removeSidebarEntry(id);
    playlistView.remove(id);
    postMessageToWorker({
        action: "remove",
        playlistId: id
    });
}

function updatePlaylist(pl) {
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

function createPlaylistEntry(title, id) {
    const playlistEntryContainer = document.getElementById("js-playlist-entries");
    const entry = `
        <li class="playlist-entry" data-id=${id}>
            <input type="text" class="input playlist-entry-title" value="${title}" readonly>
            <button class="icon-pencil btn btn-transparent"
                data-action="edit" title="Edit playlist title"></button>
            <button class="icon-trash btn btn-transparent"
                data-action="remove" title="Remove playlist"></button>
        </li>
    `;

    playlistEntryContainer.insertAdjacentHTML("beforeend", entry);
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
    return pl.tracks
    .filter(track => !selectedTrackIndexes.includes(track.index))
    .map((track, index) => {
        track.index = index;
        return track;
    });
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
        playlist.setTrackIndexes(pl, settings.get("shuffle"));
        updateCurrentTrack(pl.id, selectedTrackIndexes);
        postMessageToWorker({
            action: "put",
            playlist: pl
        });
    }
}

window.addEventListener("keypress", event => {
    const key = event.key === "Delete" || event.keyCode === 127;
    const pl = playlist.getPlaylistById(settings.get("activeTabId"));

    if (!key || !pl) {
        return;
    }
    removeSelectedTracks(pl);
});

export {
    initPlaylist,
    appendToPlaylist,
    replacePlaylistTracks,
    removePlaylist,
    updatePlaylist
};

import { removeElementClass } from "./../main.js";
import * as settings from "./../settings.js";
import * as router from "./../router.js";
import * as tab from "./../tab.js";
import * as sidebar from "./../sidebar.js";
import * as local from "./../local.js";
import * as player from "./../player/player.js";
import * as playlist from "./playlist.js";
import * as playlistView from "./playlist.view.js";

function initPlaylist(pl, toggle) {
    const route = `playlist/${pl.id}`;

    router.add(route);
    playlist.setTrackIndexes(pl, settings.get("shuffle"));
    playlist.resetPlaybackIndex();
    playlistView.add(pl);
    sidebar.createEntry(pl.title, pl.id);
    createPlaylistEntry(pl.title, pl.id);

    if (pl.id !== "local-files" && pl.sortedBy) {
        playlist.sortTracks(pl.tracks, pl.sortedBy, pl.order);
        updatePlaylist(pl);
    }

    if (toggle && router.isActive("add")) {
        router.toggle(route);
    }
    else if (router.isActive(pl.id)) {
        tab.toggle(`playlist-${pl.id}`);
    }
    playlist.save(pl);
}

function appendToPlaylist(pl, tracks, toggle) {
    playlist.setTrackIndexes(pl, settings.get("shuffle"));
    playlist.resetPlaybackIndex();
    playlistView.append(pl, tracks);

    if (toggle && router.isActive("add")) {
        const route = `playlist/${pl.id}`;

        router.toggle(route);
    }
}

function removePlaylist(id, entry) {
    playlistView.remove(id);

    if (id === "local-files") {
        local.worker.post({ action: "clear" });
    }

    if (playlist.isActive(id)) {
        player.stop();
    }

    const storedTrack = player.storedTrack.get();

    if (storedTrack && storedTrack.playlistId === id) {
        player.storedTrack.remove();
    }

    if (!entry) {
        entry = document.querySelector(`[data-id=${id}]`);
    }
    entry.parentElement.removeChild(entry);
    playlist.remove(id);
    sidebar.removeEntry(id);
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

function initStoredTrack(playlistIdPrefix) {
    if (player.storedTrack.isInitialized()) {
        return;
    }
    const playlistIds = Object.keys(playlist.getAll()).filter(id => id.startsWith(playlistIdPrefix));

    playlistIds.forEach(id => {
        const { initialized } = playlist.get(id);

        if (!initialized) {
            const allPlaylistsInitialized = playlist.setAsInitialized(id);

            if (allPlaylistsInitialized) {
                player.storedTrack.init();
            }
        }
    });
}

function getSelectedTrackIndexes(selectedElements) {
    return selectedElements.map(element => {
        return Number.parseInt(element.getAttribute("data-index"), 10);
    });
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
    .filter(track => {
        const includesTrack = selectedTrackIndexes.includes(track.index);

        if (includesTrack && pl.id === "local-files") {
            local.worker.post({
                action: "remove",
                name: track.name
            });
        }
        return !includesTrack;
    })
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
        playlist.save(pl);
        updateCurrentTrack(pl.id, selectedTrackIndexes);
    }
}

window.addEventListener("keypress", event => {
    const key = event.key === "Delete" || event.keyCode === 127;
    const pl = playlist.get(settings.get("activeTabId"));

    if (!key || !pl) {
        return;
    }
    removeSelectedTracks(pl);
});

export {
    initPlaylist as init,
    appendToPlaylist as appendTo,
    removePlaylist as remove,
    updatePlaylist,
    initStoredTrack
};

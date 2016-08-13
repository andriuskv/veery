import * as settings from "./../settings.js";
import * as router from "./../router.js";
import * as main from "./../main.js";
import * as tab from "./../tab.js";
import * as sidebar from "./../sidebar.js";
import * as local from "./../local.js";
import * as player from "./../player/player.js";
import * as playlist from "./playlist.js";
import * as playlistView from "./playlist.view.js";

let timeout = 0;

function initPlaylist(pl, toggle) {
    const route = `playlist/${pl.id}`;

    router.add(route);
    playlist.setTrackIndexes(pl, settings.get("shuffle"));
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

    if (storedTrack.playlistId === id) {
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

    main.removeClassFromElement("track", "selected");
    playlistView.update(pl);

    if (currentTrack && playlist.isActive(pl.id)) {
        playlistView.showPlayingTrack(currentTrack.index, pl.id, true);
        playlist.setCurrentIndex(currentTrack.index);
    }
}

function filterTracks(tracks, trackElements, query) {
    tracks.forEach(track => {
        const trackElement = trackElements[track.index];
        const title = track.title ? track.title.toLowerCase() : "";
        const artist = track.artist ? track.artist.toLowerCase() : "";
        const album = track.album ? track.album.toLowerCase() : "";

        if (!title.includes(query) && !artist.includes(query) && !album.includes(query)) {
            trackElement.classList.add("hidden");
        }
        else {
            trackElement.classList.remove("hidden");
        }
    });
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

function selectTrackElement(element) {
    main.removeClassFromElement("track", "selected");
    element.classList.add("selected");
}

function removeTrack(pl, playlistElement, trackElement) {
    const index = Number.parseInt(trackElement.getAttribute("data-index"), 10);
    const currentTrack = playlist.getCurrentTrack();
    const currentIndex = currentTrack ? currentTrack.index : -1;
    const shuffle = settings.get("shuffle");
    const track = pl.tracks[index];
    const trackName = track.name || track.title;
    const storedTrack = player.storedTrack.get();

    if (storedTrack.playlistId === pl.id && storedTrack.name === trackName) {
        player.storedTrack.remove();
    }

    if (pl.id === "local-files") {
        local.worker.post({
            action: "remove",
            name: trackName
        });
    }

    playlistElement.removeChild(trackElement);
    pl.tracks.splice(index, 1);
    pl.tracks.forEach((track, index) => {
        track.index = index;
        playlistElement.children[index].setAttribute("data-index", index);
    });
    playlist.setTrackIndexes(pl, shuffle, true);
    playlist.save(pl);

    if (pl.id !== playlist.getActivePlaylistId()) {
        return;
    }

    if (currentTrack && currentIndex === index) {
        if (!settings.get("paused")) {
            player.playNext(0);
        }
        else {
            player.stop();
        }
    }
    else if (currentIndex > index && !shuffle) {
        playlist.decrementIndex();
    }
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

document.getElementById("js-tab-container").addEventListener("click", ({ target }) => {
    const item = main.getElementByAttr(target, "data-index");

    if (item) {
        playlist.setSelectedTrack({
            playlistId: settings.get("activeTabId"),
            index: Number.parseInt(item.attrValue, 10)
        });
        selectTrackElement(item.element);
    }
});

document.getElementById("js-filter-input").addEventListener("keyup", ({ target }) => {
    if (timeout) {
        clearTimeout(timeout);
    }

    timeout = setTimeout(() => {
        const pl = playlist.get(settings.get("activeTabId"));
        const trackElements = document.getElementById(`js-${pl.id}`).children;
        const query = target.value.trim().toLowerCase();

        filterTracks(pl.tracks, trackElements, query);
    }, 400);
});

window.addEventListener("keypress", event => {
    const key = event.key === "Delete" || event.keyCode === 127;
    const pl = playlist.get(settings.get("activeTabId"));

    if (!key || !pl) {
        return;
    }

    const playlistContainer = document.getElementById(`js-${pl.id}`);
    const selected = playlistContainer.querySelector(".track.selected");

    if (!selected) {
        return;
    }
    removeTrack(pl, playlistContainer, selected);
});

export {
    initPlaylist as init,
    appendToPlaylist as appendTo,
    removePlaylist as remove,
    updatePlaylist as update,
    initStoredTrack,
    filterTracks
};

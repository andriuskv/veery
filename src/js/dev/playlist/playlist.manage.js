import * as router from "./../router.js";
import * as main from "./../main.js";
import * as settings from "./../settings.js";
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
        main.toggleTab(`playlist-${pl.id}`);
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
            <span>
                <button class="icon-pencil font-btn playlist-entry-btn"
                    data-action="edit" title="Edit playlist title"></button>
                <button class="icon-trash font-btn playlist-entry-btn"
                    data-action="remove" title="Remove playlist"></button>
            </span>
        </li>
    `;

    playlistEntryContainer.insertAdjacentHTML("beforeend", entry);
}

function sortPlaylist(sortBy) {
    const pl = playlist.get(settings.get("activeTab"));
    let query = document.getElementById(`js-${pl.id}-filter-input`).value.trim();

    playlist.sort(pl, sortBy);
    updatePlaylist(pl);
    playlist.save(pl);

    if (query) {
        const trackElements = document.getElementById(`js-${pl.id}`).children;

        query = query.toLowerCase();
        filterTracks(pl.tracks, trackElements, query);
    }
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

function initStoredTrack(id) {
    const allPlaylistsInitialized = playlist.setAsInitialized(id);

    if (allPlaylistsInitialized) {
        player.storedTrack.init();
    }
}

function initPlaylists(playlistAffix) {
    let containsPlaylist = false;

    Object.keys(playlist.getAll()).forEach(id => {
        if (id.startsWith(playlistAffix)) {
            containsPlaylist = true;
            initStoredTrack(id);
        }
    });
    return containsPlaylist;
}

document.getElementById("js-tab-container").addEventListener("click", ({ target }) => {
    const sortBy = target.getAttribute("data-sort");

    if (sortBy) {
        sortPlaylist(sortBy);
        return;
    }
    const item = main.getElementByAttr(target, "data-index");

    if (item) {
        playlist.setSelectedTrack({
            playlistId: settings.get("activeTab"),
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
        const pl = playlist.get(settings.get("activeTab"));
        const trackElements = document.getElementById(`js-${pl.id}`).children;
        const query = target.value.trim().toLowerCase();

        filterTracks(pl.tracks, trackElements, query);
    }, 400);
});

window.addEventListener("keypress", event => {
    const key = event.key === "Delete" || event.keyCode === 127;
    const pl = playlist.get(settings.get("activeTab"));

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
    initPlaylists
};

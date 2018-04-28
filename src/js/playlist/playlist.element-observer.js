import { getTab, getVisiblePlaylist } from "../tab.js";
import { getCurrentTrack } from "./playlist.js";
import { getPlaylistTrackElements, createListItemContent, createGridItemContent } from "./playlist.view.js";
import { getPlayerState } from "../player/player.js";
import { getPlayPauseButtonIcon } from "../player/player.controls.js";

const observers = {};

function handleIntersectingEntry(entry) {
    const { tracks, type } = getVisiblePlaylist();
    const track = tracks[entry.getAttribute("data-index")];
    const currentTrack = getCurrentTrack();
    const paused = getPlayerState();
    const icon = getPlayPauseButtonIcon(paused && currentTrack && currentTrack.name === track.name);
    const item = type === "list" ? createListItemContent(track, icon) : createGridItemContent(track, icon);

    entry.insertAdjacentHTML("beforeend", item);
}

function callback(entries) {
    entries.forEach(({ isIntersecting, target }) => {
        if (isIntersecting) {
            handleIntersectingEntry(target);
        }
        else {
            target.innerHTML = "";
        }
    });
}

function observePlaylist(id) {
    if (observers[id]) {
        return;
    }
    observers[id] = new IntersectionObserver(callback, {
        root: getTab(id)
    });
    const elements = getPlaylistTrackElements(id);

    Array.from(elements).forEach(element => {
        observers[id].observe(element);
    });
}

function reObservePlaylist(id) {
    removePlaylistObserver(id);
    observePlaylist(id);
}

function removePlaylistObserver(id) {
    observers[id].disconnect();
    delete observers[id];
}

export {
    observePlaylist,
    reObservePlaylist,
    removePlaylistObserver
};

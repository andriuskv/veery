function getSidebarEntry(id) {
    return document.getElementById(`js-sidebar-entry-${id}`);
}

function createSidebarEntry(title, id) {
    const sidebarEntries = document.getElementById("js-sidebar-playlist-entries");
    const newEntry = `
        <li>
            <a href="#/playlist/${id}" id="js-sidebar-entry-${id}"
                class="btn btn-transparent sidebar-btn">
                <div>${title}</div>
            </a>
        </li>`;

    sidebarEntries.insertAdjacentHTML("beforeend", newEntry);
}

function editSidebarEntry(id, title) {
    const entry = getSidebarEntry(id);

    entry.children[0].textContent = title;
}

function removeSidebarEntry(id) {
    const entry = getSidebarEntry(id);

    entry.parentElement.removeChild(entry);
}

function createActiveIcon() {
    return `<span id="js-active-playlist-icon" class="icon-volume-up active-playlist-icon"></span>`;
}

function showActiveIcon(id) {
    const entry = getSidebarEntry(id);

    removeActiveIcon();
    entry.insertAdjacentHTML("beforeend", createActiveIcon());
}

function removeActiveIcon() {
    const activeIcon = document.getElementById("js-active-playlist-icon");

    if (activeIcon) {
        activeIcon.parentElement.removeChild(activeIcon);
    }
}

function setTrackArt(track) {
    const artwork = document.getElementById("js-player-track-art");

    if (track && track.thumbnail) {
        let art = track.thumbnail;

        if (typeof art === "object") {
            art = URL.createObjectURL(art);
        }
        artwork.src = art;
    }
    else {
        artwork.src = "./assets/images/album-art-placeholder.png";
    }
}

function showTrackInfo(track) {
    const trackInfo = document.getElementById("js-player-track-info");
    const [trackTitle, trackArtist] = trackInfo.children;

    setTrackArt(track);

    if (!track) {
        trackTitle.textContent = "";
        trackArtist.textContent = "";
        document.title = "ve2ry";
        return;
    }
    if (track.artist && track.title) {
        trackTitle.textContent = track.title;
        trackArtist.textContent = track.artist;
        document.title = `${track.artist} - ${track.title}`;
    }
    else {
        const title = track.name;

        trackTitle.textContent = "";
        trackArtist.textContent = title;
        document.title = title;
    }
}

export {
    createSidebarEntry,
    editSidebarEntry,
    removeSidebarEntry,
    getSidebarEntry,
    showTrackInfo,
    showActiveIcon,
    removeActiveIcon
};

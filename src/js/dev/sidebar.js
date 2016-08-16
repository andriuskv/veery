let activeSidebarIconElem = null;

function getEntry(id) {
    return document.querySelector(`[data-tab-item=playlist-${id}]`);
}

function createSidebarEntry(title, id) {
    const sidebarEntries = document.getElementById("js-sidebar-playlist-entries");
    const newEntry = `
        <li>
            <a href="#/playlist/${id}" class="btn btn-transparent sidebar-btn"
                data-tab-item="playlist-${id}">
                <span>${title}</span>
                <span class="icon-volume-up active-playlist-icon hidden"></span>
            </a>
        </li>`;

    sidebarEntries.insertAdjacentHTML("beforeend", newEntry);
}

function editSidebarEntry(id, title) {
    const entry = getEntry(id);

    entry.children[0].textContent = title;
}

function removeSidebarEntry(id) {
    const entry = getEntry(id);

    entry.parentElement.removeChild(entry);
}

function showActiveIcon(id) {
    const entry = getEntry(id);
    const element = entry.querySelector(".active-playlist-icon");

    element.classList.remove("hidden");
    activeSidebarIconElem = element;
}

function hideActiveIcon() {
    if (activeSidebarIconElem) {
        activeSidebarIconElem.classList.add("hidden");
        activeSidebarIconElem = null;
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
    createSidebarEntry as createEntry,
    editSidebarEntry as editEntry,
    removeSidebarEntry as removeEntry,
    showTrackInfo,
    showActiveIcon,
    hideActiveIcon
};

function getEntry(id) {
    return document.querySelector(`[data-tab-item=playlist-${id}]`);
}

function createSidebarEntry(title, id) {
    const sidebarEntries = document.getElementById("js-sidebar-playlist-entries");
    const newEntry = `
        <li>
            <a href="#/playlist/${id}" class="font-btn sidebar-btn js-tab-select-btn"
                data-tab-item="playlist-${id}">
                <span class="sidebar-playlist-title">${title}</span>
                <span class="icon-volume-up is-playlist-active hidden"></span>
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
    const icon = entry.querySelector(".is-playlist-active");

    icon.classList.remove("hidden");
}

function hideActiveIcon() {
    for (const btn of document.querySelectorAll(".js-tab-select-btn")) {
        const icon = btn.children[1];

        if (icon && !icon.classList.contains("hidden")) {
            icon.classList.add("hidden");
        }
    }
}

function showSidebarFooter() {
    const sidebarFooter = document.getElementById("js-sidebar-footer");

    if (!sidebarFooter.classList.contains("show")) {
        sidebarFooter.classList.add("show");
    }
}

function setTrackArt(track) {
    const artwork = document.getElementById("js-player-track-art");
    const artPlaceholder = "./assets/images/album-art-placeholder.png";

    if (track && track.thumbnail) {
        let art = track.thumbnail;

        if (typeof art === "object") {
            art = URL.createObjectURL(art);
        }
        artwork.src = art;
    }
    else {
        artwork.src = artPlaceholder;
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
        const title = track.name || track.title;

        trackTitle.textContent = "";
        trackArtist.textContent = title;
        document.title = title;
    }
    showSidebarFooter();
}

export {
    createSidebarEntry as createEntry,
    editSidebarEntry as editEntry,
    removeSidebarEntry as removeEntry,
    showTrackInfo,
    showActiveIcon,
    hideActiveIcon
};

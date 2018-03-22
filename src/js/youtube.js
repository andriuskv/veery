/* global gapi */

import { formatTime } from "./utils.js";
import { addImportedPlaylist, enableImportOption } from "./playlist/playlist.import.js";
import { showStatusIndicator, hideStatusIndicator } from "./playlist/playlist.manage.js";
import { getPlaylistById } from "./playlist/playlist.js";
import { showPlayerMessage } from "./player/player.view.js";
import { isGoogleAPIInitializing } from "./google-auth.js";

const fetchQueue = [];

function showMessage(message) {
    showPlayerMessage({
        title: "YouTube",
        body: message
    });
    enableImportOption("youtube");
}

function parseDuration(duration) {
    if (!duration.includes("H")) {
        duration = `0H${duration}`;
    }
    if (!duration.includes("M")) {
        const minIndex = duration.indexOf("H") + 1;
        duration = `${duration.slice(0, minIndex)}0M${duration.slice(minIndex)}`;
    }
    if (!duration.includes("S")) {
        duration = `${duration}0`;
    }
    return duration.match(/\d{1,}/g)
        .reverse()
        .reduce((total, value, index) => {
            total += value * 60 ** index;
            return total;
        }, 0);
}

async function getVideoDuration(items) {
    const ids = items.map(item => item.snippet.resourceId.videoId).join();
    const data = await fetchYoutube("videos", "contentDetails", "id", ids);

    return items.reduce((items, item) => {
        const durationItem = data.items.find(({ id }) => id === item.snippet.resourceId.videoId);

        if (durationItem) {
            item.durationInSeconds = parseDuration(durationItem.contentDetails.duration) - 1;
            items.push(item);
        }
        return items;
    }, []);
}

function fetchYoutube(path, part, filter, id, token) {
    let params = `part=${part}&${filter}=${id}&maxResults=50&key=${process.env.YOUTUBE_API_KEY}`;
    const googleAuth = gapi.auth2.getAuthInstance();

    if (token) {
        params += `&pageToken=${token}`;
    }
    if (googleAuth.isSignedIn.get()) {
        params += `&access_token=${googleAuth.currentUser.get().getAuthResponse().access_token}`;
    }
    return fetch(`https://www.googleapis.com/youtube/v3/${path}?${params}`)
        .then(response => response.json());
}

function filterInvalidItems(items) {
    return items.filter(item => {
        const title = item.snippet.title;

        return title !== "Deleted video" && title !== "Private video";
    });
}

function parseItems(items, id) {
    return items.map(track => ({
        id: track.snippet.resourceId.videoId,
        durationInSeconds: track.durationInSeconds,
        duration: formatTime(track.durationInSeconds),
        name: track.snippet.title,
        title: track.snippet.title,
        artist: "",
        album: "",
        thumbnail: track.snippet.thumbnails.medium.url,
        player: "youtube",
        playlistId: id
    }));
}

function handleError({ code, message }, id) {
    if (code === 403) {
        showMessage("You need to be sign in if you want to import private playlist");
    }
    else if (code === 404) {
        showMessage("Playlist was not found");
    }
    hideStatusIndicator(id);
    throw new Error(message);
}

async function fetchPlaylistItems(id, token) {
    const data = await fetchYoutube("playlistItems", "snippet", "playlistId", id, token);

    if (data.error) {
        handleError(data.error, id);
    }
    const validItems = filterInvalidItems(data.items);
    const items = await getVideoDuration(validItems);
    const tracks = parseItems(items, id);

    if (data.nextPageToken) {
        const nextPageItems = await fetchPlaylistItems(id, data.nextPageToken);

        return tracks.concat(nextPageItems);
    }
    return tracks;
}

function parseVideos(videos, latestIndex) {
    const items = filterInvalidItems(videos).map(item => {
        item.snippet.resourceId = { videoId: item.id };
        item.durationInSeconds = parseDuration(item.contentDetails.duration) - 1;
        return item;
    });

    return parseItems(items, "youtube", latestIndex);
}

async function getPlaylistTitleAndStatus(id) {
    const { items } = await fetchYoutube("playlists", "snippet,status", "id", id);

    return {
        title: items[0].snippet.title,
        status: items[0].status.privacyStatus
    };
}

async function addVideo(id, type) {
    const playlistId = "youtube";
    const pl = getPlaylistById(playlistId);

    if (!type) {
        type = pl ? "update" : "new";
    }

    if (pl) {
        showStatusIndicator(playlistId);
    }
    const { items } = await fetchYoutube("videos", "snippet,contentDetails", "id", id);
    const latestIndex = pl && (pl.tracks.length || 0);

    if (!items.length) {
        showMessage("Video was not found");
        hideStatusIndicator(playlistId);
        return;
    }
    addImportedPlaylist({
        title: "YouTube",
        id: playlistId,
        tracks: parseVideos(items, latestIndex),
        player: playlistId,
        type: "grid"
    }, type);
}

async function addPlaylist(url, id, type) {
    const pl = getPlaylistById(id);

    if (!type) {
        type = pl ? "update" : "new";
    }

    if (pl) {
        showStatusIndicator(id);
    }
    const tracks = await fetchPlaylistItems(id);
    const { title, status } = await getPlaylistTitleAndStatus(id);

    addImportedPlaylist({
        url,
        title,
        id,
        tracks,
        player: "youtube",
        type: "grid",
        isPrivate: status === "private"
    }, type);
}

function parseUrl(url) {
    let videoId = "";
    let playlistId = "";

    try {
        const { searchParams } = new URL(url);
        videoId = searchParams.get("v");
        playlistId = searchParams.get("list");
    }
    catch (e) {
        const videoMatch = url.match(/v=[a-zA-Z0-9\-_]+/);
        const playlistMatch = url.match(/list=[a-zA-Z0-9\-_]+/);

        if (videoMatch) {
            videoId = videoMatch[0].slice(2);
        }

        if (playlistMatch) {
            playlistId = playlistMatch[0].slice(5);
        }
    }

    return {
        videoId,
        playlistId
    };
}

function fetchYoutubeItem(url, type) {
    if (isGoogleAPIInitializing()) {
        addItemToFetchQueue(url, type);
        return;
    }
    const { videoId, playlistId } = parseUrl(url);

    if (videoId) {
        addVideo(videoId, type);
        return;
    }

    if (!playlistId) {
        showMessage("Invalid url");
    }
    else if (playlistId === "WL") {
        showMessage("Importing Watch Later playlist is not allowed");
    }
    else {
        addPlaylist(url, playlistId, type);
    }
}

function addItemToFetchQueue(url, type) {
    if (!fetchQueue.some(item => item.url === url)) {
        fetchQueue.push({ url, type });
    }
}

window.addEventListener("google-api-initialized", () => {
    fetchQueue.forEach(({ url, type }) => {
        fetchYoutubeItem(url, type);
    });
    fetchQueue.length = 0;
});

export {
    fetchYoutubeItem
};

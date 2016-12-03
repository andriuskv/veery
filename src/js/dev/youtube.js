import { formatTime } from "./main.js";
import { addImportedPlaylist, showNotice } from "./playlist/playlist.import.js";

function showYoutubeNotice(notice) {
    showNotice("youtube", notice);
}

function parseDuration(duration) {
    duration = duration.slice(2);

    if (!duration.includes("H")) {
        duration = `0H${duration}`;
    }
    if (!duration.includes("M")) {
        const minIndex = duration.indexOf("H") + 1;
        duration = `${duration.slice(0, minIndex)}0M${duration.slice(minIndex)}`;
    }
    duration = duration.includes("S") ? duration.slice(0, -1) : `${duration}0`;
    return duration.replace(/[HM]/g, ":")
        .split(":")
        .reverse()
        .reduce((total, value, index) => {
            total += value * 60 ** index;
            return total;
        }, 0);
}

async function getVideoDuration(items) {
    const ids = items.map(item => item.snippet.resourceId.videoId).join();
    const data = await getYoutube("videos", "contentDetails", "id", ids);

    return items.map((item, index) => {
        item.durationInSeconds = parseDuration(data.items[index].contentDetails.duration);
        return item;
    });
}

function getYoutube(path, part, filter, id, token) {
    const key = "";
    let params = `part=${part}&${filter}=${id}&maxResults=50&key=${key}`;

    if (token) {
        params += `&pageToken=${token}`;
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

function parseItems(items, lastIndex) {
    return items.map((track, index) => ({
        index: index + lastIndex,
        id: track.snippet.resourceId.videoId,
        durationInSeconds: track.durationInSeconds,
        duration: formatTime(track.durationInSeconds),
        name: track.snippet.title,
        title: track.snippet.title,
        artist: "",
        album: "",
        thumbnail: track.snippet.thumbnails.default.url,
        player: "youtube"
    }));
}

async function getPlaylistItems(id, token, lastIndex = 0) {
    const data = await getYoutube("playlistItems", "snippet", "playlistId", id, token);
    const validItems = filterInvalidItems(data.items);
    const items = await getVideoDuration(validItems);
    const tracks = parseItems(items, lastIndex);

    if (data.nextPageToken) {
        const nextPageItems = await getPlaylistItems(id, data.nextPageToken, tracks.length);

        return tracks.concat(nextPageItems);
    }
    return tracks;
}

async function getPlaylistTitle(id) {
    const { items } = await getYoutube("playlists", "snippet", "id", id);

    return items.length ? items[0].snippet.title: "";
}

async function fetchPlaylist(url) {
    const id = url.split("list=")[1];

    if (!id) {
        showYoutubeNotice("Invalid url");
        return;
    }
    const title = await getPlaylistTitle(id);

    if (!title) {
        showYoutubeNotice("Playlist was not found");
        return;
    }
    const tracks = await getPlaylistItems(id);
    const playlist = {
        id,
        url,
        title,
        tracks,
        player: "youtube",
        type: "grid"
    };

    addImportedPlaylist(playlist);
}

export {
    fetchPlaylist
};

import { formatTime } from "./utils.js";
import { addImportedPlaylist, showNotice } from "./playlist/playlist.import.js";
import { getPlaylistById } from "./playlist/playlist.js";

function showYoutubeNotice(notice) {
    showNotice("youtube", notice);
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

    return items.map((item, index) => {
        item.durationInSeconds = parseDuration(data.items[index].contentDetails.duration);
        return item;
    });
}

function fetchYoutube(path, part, filter, id, token) {
    let params = `part=${part}&${filter}=${id}&maxResults=50&key=${process.env.YOUTUBE_API_KEY}`;

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

function parseItems(items, id, timeStamp, lastIndex) {
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
        player: "youtube",
        playlistId: id,
        createdAt: timeStamp
    }));
}

async function fetchPlaylistItems(id, timeStamp, token, lastIndex = 0) {
    const data = await fetchYoutube("playlistItems", "snippet", "playlistId", id, token);
    const validItems = filterInvalidItems(data.items);
    const items = await getVideoDuration(validItems);
    const tracks = parseItems(items, id, timeStamp, lastIndex);

    if (data.nextPageToken) {
        lastIndex = tracks[tracks.length - 1].index + 1;
        const nextPageItems = await fetchPlaylistItems(id, timeStamp, data.nextPageToken, lastIndex);

        return tracks.concat(nextPageItems);
    }
    return tracks;
}

async function parseVideos(videos, latestIndex) {
    const validItems = filterInvalidItems(videos).map(item => {
        item.snippet.resourceId = { videoId: item.id };
        return item;
    });
    const timeStamp = new Date().getTime();
    const items = await getVideoDuration(validItems);

    return parseItems(items, "youtube", timeStamp, latestIndex);
}

async function getPlaylistTitle(id) {
    const { items } = await fetchYoutube("playlists", "snippet", "id", id);

    return items.length ? items[0].snippet.title: "";
}

async function addVideo(id) {
    const { items } = await fetchYoutube("videos", "snippet", "id", id);

    if (!items.length) {
        showYoutubeNotice("Video was not found");
        return;
    }
    const pl = getPlaylistById("youtube");
    const latestIndex = pl && pl.tracks.length || 0;
    const playlist = {
        title: "YouTube",
        id: "youtube",
        tracks: await parseVideos(items, latestIndex),
        player: "youtube",
        type: "grid"
    };
    addImportedPlaylist(playlist);
}

async function addPlaylist(url) {
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
    const timeStamp = new Date().getTime();
    const playlist = {
        url,
        title,
        id,
        tracks: await fetchPlaylistItems(id, timeStamp),
        player: "youtube",
        type: "grid"
    };

    addImportedPlaylist(playlist);
}

async function fetchYoutubeItem(url) {
    const match = url.match(/v=[a-zA-Z0-9\-]+/);

    if (match) {
        addVideo(match[0].slice(2));
        return;
    }
    addPlaylist(url);
}

export {
    fetchYoutubeItem
};

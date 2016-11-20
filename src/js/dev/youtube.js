import { formatTime } from "./main.js";
import { addImportedPlaylist, showNotice } from "./playlist/playlist.import.js";

function parseItems(playlist) {
    playlist.tracks = playlist.tracks.map((track, index) => ({
        index,
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
    delete playlist.token;
    return playlist;
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

function getVideoDuration(playlist) {
    playlist.id = playlist.items.map(item => item.snippet.resourceId.videoId).join();

    return getYoutube("videos", "contentDetails", "id", playlist)
        .then(data => {
            playlist.items = playlist.items.map((item, index) => {
                item.durationInSeconds = parseDuration(data.items[index].contentDetails.duration);
                return item;
            });
            return playlist;
        });
}

function getYoutube(path, part, filter, pl) {
    const key = "";
    let params = `part=${part}&${filter}=${pl.id}&maxResults=50&key=${key}`;

    if (pl.token) {
        params += `&pageToken=${pl.token}`;
    }
    return fetch(`https://www.googleapis.com/youtube/v3/${path}?${params}`)
        .then(response => response.json());
}

function filterInvalidVideos(playlist) {
    playlist.items = playlist.items.filter(item => {
        const title = item.snippet.title;

        return title !== "Deleted video" && title !== "Private video";
    });
    return playlist;
}

function getPlaylistItems(playlist) {
    return getYoutube("playlistItems", "snippet", "playlistId", playlist)
        .then(filterInvalidVideos)
        .then(getVideoDuration)
        .then(data => {
            playlist.token = data.nextPageToken;
            playlist.tracks.push(...data.items);

            return playlist.token ? getPlaylistItems(playlist) : playlist;
        });
}

function getPlaylistTitle(playlist) {
    return getYoutube("playlists", "snippet", "id", playlist)
        .then(data => {
            if (!data.items.length) {
                showNotice("youtube", "Playlist was not found");
                return;
            }
            playlist.title = data.items[0].snippet.title;
            return playlist;
        });
}

function fetchPlaylist(url) {
    if (!url.includes("list=")) {
        showNotice("youtube", "Invalid url");
        return;
    }
    const playlist = {
        url,
        id: url.split("list=")[1],
        tracks: [],
        player: "youtube",
        type: "grid"
    };

    getPlaylistTitle(playlist)
    .then(getPlaylistItems)
    .then(parseItems)
    .then(addImportedPlaylist)
    .catch(error => {
        console.log(error);
    });
}

export {
    fetchPlaylist
};

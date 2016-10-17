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
    return duration.replace(/[H,M]/g, ":").split(":")
    .reverse()
    .reduce((total, value, index) => {
        total += value * 60 ** index;
        return total;
    }, 0);
}

function getVideoDuration(playlist) {
    const ids = playlist.items.map(item => item.snippet.resourceId.videoId).join();

    return getYoutube("videos", "contentDetails", "id", ids)
    .then(data => {
        playlist.items = playlist.items.map((item, index) => {

            // Remove unnecessery parts
            const duration = data.items[index].contentDetails.duration.slice(2, -1);
            item.durationInSeconds = parseDuration(duration);
            return item;
        });
        return playlist;
    });
}

function getYoutube(path, part, filter, id, token) {
    const key = "";
    let params = `part=${part}&${filter}=${id}&maxResults=50&key=${key}`;

    if (token) {
        params += `&pageToken=${token}`;
    }
    return fetch(`https://www.googleapis.com/youtube/v3/${path}?${params}`)
    .then(response => response.json())
    .catch(error => {
        console.log(error);
    });
}

function filterInvalidVideos(playlist) {
    playlist.items = playlist.items.filter(item => {
        const title = item.snippet.title;

        return title !== "Deleted video" && title !== "Private video";
    });
    return playlist;
}

function getPlaylistItems(playlist) {
    return getYoutube("playlistItems", "snippet", "playlistId", playlist.id, playlist.token)
    .then(filterInvalidVideos)
    .then(getVideoDuration)
    .then(data => {
        playlist.token = data.nextPageToken;
        playlist.tracks.push(...data.items);

        if (playlist.token) {
            return getPlaylistItems(playlist);
        }
        return playlist;
    });
}

function getPlaylistTitle(data) {
    if (!data.items.length) {
        showNotice("youtube", "Playlist was not found");
        return;
    }
    return {
        id: data.items[0].id,
        title: data.items[0].snippet.title,
        tracks: []
    };
}

function fetchPlaylist(url) {
    if (!url.includes("list=")) {
        showNotice("youtube", "Invalid url");
        return;
    }
    const id = url.split("list=")[1];

    getYoutube("playlists", "snippet", "id", id)
    .then(getPlaylistTitle)
    .then(getPlaylistItems)
    .then(parseItems)
    .then(pl => {
        addImportedPlaylist("youtube", pl);
    })
    .catch(error => {
        console.log(error);
    });
}

export { fetchPlaylist };

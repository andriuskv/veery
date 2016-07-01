import { scriptLoader } from "./main.js";
import * as playlistAdd from "./playlist/playlist.add.js";

function parseItems(playlist) {
    playlist.id = "yt-pl-" + playlist.id;
    playlist.tracks = playlist.tracks.map((track, index) => ({
        index: index,
        id: track.snippet.resourceId.videoId,
        duration: track.snippet.duration,
        title: track.snippet.title,
        thumbnail: track.snippet.thumbnails.default.url
    }));
    delete playlist.token;
    return playlist;
}

function parseDuration(duration) {
    const units = ["H", "M", "S"];

    duration = duration.slice(2);
    return units.map(unit => {
        let newDuration = "";

        if (duration.includes(unit)) {
            duration = duration.split(unit);
            if (duration.length === 2) {
                const value = Number.parseInt(duration[0], 10);

                newDuration += value >= 10 ? value : "0" + value;
                if (unit !== "S") {
                    newDuration += ":";
                    duration = duration.slice(1)[0];
                }
            }
        }
        else if (unit === "S") {
            newDuration += "00";
        }
        return newDuration;
    }).join("");
}

function getVideoDuration(playlist) {
    const ids = playlist.items.map(item => item.snippet.resourceId.videoId).join();

    return getYoutube("videos", "contentDetails", "id", ids)
    .then(data => {
        playlist.items = playlist.items.map((item, index) => {
            item.snippet.duration = parseDuration(data.items[index].contentDetails.duration);
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

function getPlaylistItems(playlist) {
    return getYoutube("playlistItems", "snippet", "playlistId", playlist.id, playlist.token)
    .then(data => {
        data.items = data.items.filter(item => {
            const title = item.snippet.title;

            return title !== "Deleted video" && title !== "Private video";
        });
        return data;
    })
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

function fetchPlaylist(url) {
    const id = url.includes("list=") ? url.split("list=")[1] : url;

    getYoutube("playlists", "snippet", "id", id)
    .then(data => {
        if (!data.items.length) {
            playlistAdd.showNotice("Playlist was not found");
            return;
        }
        return {
            id: id,
            title: data.items[0].snippet.title,
            tracks: []
        };
    })
    .then(getPlaylistItems)
    .then(parseItems)
    .then(playlistAdd.add)
    .catch(error => {
        console.log(error);
    });
    scriptLoader.load("https://www.youtube.com/iframe_api");
}

export { fetchPlaylist };

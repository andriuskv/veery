import { dispatchCustomEvent, formatTime } from "./utils.js";
import { addTracksToPlaylist, clearPlaylistTracks } from "./playlist/playlist.manage.js";
import { getPlaylistById, createPlaylist, updatePlaylist } from "./playlist/playlist.js";
import { showPlayerMessage } from "./player/player.view.js";
import { initGoogleAPI, getAccessToken, getGoogleUser } from "./google-auth.js";
import { setArtwork } from "./artworks";

let userPlaylists = null;

function showYouTubeMessage(message) {
  showPlayerMessage({
    title: "YouTube",
    body: message
  });
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
  const accessToken = getAccessToken();
  let params = `part=${part}&${filter}=${id}&maxResults=50&key=${process.env.YOUTUBE_API_KEY}`;

  if (token) {
    params += `&pageToken=${token}`;
  }

  if (accessToken) {
    params += `&access_token=${accessToken}`;
  }
  return fetch(`https://www.googleapis.com/youtube/v3/${path}?${params}`)
    .then(response => response.json());
}

function filterDuplicateTracks(tracks, oldTracks) {
  return tracks.reduce((tracks, track) => {
    const duplicate = oldTracks.some(oldTrack => oldTrack.id === track.id);

    if (!duplicate) {
      tracks.push(track);
    }
    return tracks;
  }, []);
}

function filterInvalidItems(items) {
  return items.filter(item => {
    const title = item.snippet.title;

    return title !== "Deleted video" && title !== "Private video";
  });
}

function parseItems(items) {
  return items.map(track => {
    const id = track.snippet.resourceId.videoId;

    setArtwork(id, {
      image: {
        original: { url: track.snippet.thumbnails.medium.url }
      }
    });
    return {
      id,
      durationInSeconds: track.durationInSeconds,
      duration: formatTime(track.durationInSeconds),
      name: track.snippet.title,
      title: track.snippet.title,
      artist: "",
      album: "",
      artworkId: id,
      player: "youtube"
    };
  });
}

function handleError({ code, message }) {
  if (code === 403) {
    message = "You need to be sign in if you want to import private playlists";
  }
  else if (code === 404) {
    message = "Playlist was not found";
  }
  showYouTubeMessage(message);
  throw new Error(message);
}

async function fetchPlaylistItems(id, token) {
  const { error, items, nextPageToken } = await fetchYoutube("playlistItems", "snippet", "playlistId", id, token);

  if (error) {
    handleError(error);
  }
  const validItems = await getVideoDuration(filterInvalidItems(items));
  const tracks = parseItems(validItems);

  if (nextPageToken) {
    const nextPageItems = await fetchPlaylistItems(id, nextPageToken);

    return tracks.concat(nextPageItems);
  }
  return tracks;
}

function parseVideos(videos) {
  const items = filterInvalidItems(videos).map(item => {
    item.snippet.resourceId = { videoId: item.id };
    item.durationInSeconds = parseDuration(item.contentDetails.duration) - 1;
    return item;
  });

  return parseItems(items, "youtube");
}

async function getPlaylistTitleAndStatus(id) {
  const { items } = await fetchYoutube("playlists", "snippet,status", "id", id);
  const isPrivate = items[0].status.privacyStatus === "private";
  const data = {
    title: items[0].snippet.title,
    isPrivate
  };

  if (isPrivate) {
    data.user = getGoogleUser();
  }
  return data;
}

function getYouTubePlaylist(id, props) {
  return getPlaylistById(id) || createPlaylist({
    id,
    type: "grid",
    storePlaylist: true,
    ...props
  });
}

async function addVideo(id, videoId) {
  const pl = getYouTubePlaylist(id, { title: "YouTube" });
  const { items } = await fetchYoutube("videos", "snippet,contentDetails", "id", videoId);

  if (items.length) {
    const tracks = filterDuplicateTracks(parseVideos(items), pl.tracks);

    addTracksToPlaylist(pl, tracks);
  }
  else {
    showYouTubeMessage("Video was not found");
  }
}

async function addPlaylist(url, id, type) {
  const pl = getYouTubePlaylist(id, { url });
  const tracks = await fetchPlaylistItems(id);

  if (type === "sync") {
    clearPlaylistTracks(pl);
  }

  if (!pl.title) {
    updatePlaylist(pl.id, await getPlaylistTitleAndStatus(id));
  }
  addTracksToPlaylist(pl, filterDuplicateTracks(tracks, pl.tracks), { type: "sync" });
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

async function fetchYoutubeItem(url, type) {
  const { videoId, playlistId } = parseUrl(url);
  const id = playlistId || "youtube";

  if (!videoId && !playlistId) {
    showYouTubeMessage("Invalid url");
    return;
  }

  if (playlistId === "WL") {
    showYouTubeMessage("Importing <b>Watch Later</b> playlist is not allowed");
    return;
  }
  dispatchCustomEvent("import", {
    importing: true,
    option: "youtube",
    playlistId: id
  });

  try {
    if (videoId) {
      await addVideo(id, videoId);
    }
    else {
      await addPlaylist(url, id, type);
    }
  }
  catch (e) {
    console.log(e);
  }
  finally {
    dispatchCustomEvent("import", {
      importing: false,
      option: "youtube",
      playlistId: id
    });
  }
}

function parseYoutubeUserPlaylists(items) {
  return items.map(item => ({
    id: item.id,
    itemCount: item.contentDetails.itemCount,
    title: item.snippet.title,
    thumbnail: item.snippet.thumbnails.medium.url
  }));
}

function getYoutubeUserPlaylists() {
  return userPlaylists;
}

async function fetchYoutubeUserPlaylists() {
  const signedIn = await initGoogleAPI();

  if (!signedIn || userPlaylists) {
    return;
  }

  try {
    const response = await fetchYoutube("playlists", "snippet,contentDetails", "mine", true);
    userPlaylists = parseYoutubeUserPlaylists(response.items);
  }
  catch (e) {
    console.log(e);
  }
}

window.addEventListener("google-sign-out", () => {
  userPlaylists = null;
});

export {
  fetchYoutubeItem,
  getYoutubeUserPlaylists,
  fetchYoutubeUserPlaylists
};

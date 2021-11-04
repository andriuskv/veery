/* global gapi */

import { dispatchCustomEvent, scriptLoader, formatTime } from "../utils.js";
import { setArtwork } from "services/artwork";
import { getPlaylistById } from "services/playlist";

let initialized = false;
let userPlaylists = null;
let user = null;
let accessToken = "";

async function fetchYoutubeUserPlaylists() {
  const response = await fetchYoutube("playlists", "snippet,contentDetails,status", "mine", true);

  userPlaylists = parseYoutubeUserPlaylists(response.items);
  return userPlaylists;
}

async function addVideo(videoId, oldTracks) {
  const { items } = await fetchYoutube("videos", "snippet,contentDetails", "id", videoId);

  if (items.length) {
    const videos= parseVideos(items);

    if (oldTracks.length) {
      return filterDuplicateTracks(videos, oldTracks);
    }
    return videos;
  }
}

function filterDuplicateTracks(tracks, oldTracks) {
  return tracks.reduce((tracks, track) => {
    const duplicate = oldTracks.some(oldTrack => {
      return oldTrack.id === track.id;
    });

    if (!duplicate) {
      tracks.push(track);
    }
    return tracks;
  }, []);
}

function parseVideos(videos) {
  const items = filterInvalidItems(videos).map(item => {
    item.snippet.resourceId = { videoId: item.id };
    item.snippet.videoOwnerChannelTitle = item.snippet.channelTitle;
    item.durationInSeconds = parseDuration(item.contentDetails.duration) - 1;
    return item;
  });

  return parseItems(items);
}

async function fetchPlaylistTitleAndStatus(id) {
  const { items } = await fetchYoutube("playlists", "snippet,status", "id", id);

  if (items.length) {
    const isPrivate = items[0].status.privacyStatus === "private";
    const data = {
      title: items[0].snippet.title,
      isPrivate
    };

    if (isPrivate) {
      data.user = user;
    }
    return data;
  }
}

async function fetchPlaylistItems(id, token) {
  const { error, items, nextPageToken } = await fetchYoutube("playlistItems", "snippet", "playlistId", id, token);

  if (error) {
    console.log(error);
  }
  const validItems = await getVideoDuration(filterInvalidItems(items));
  const tracks = parseItems(validItems);
  const pl = getPlaylistById(id);
  const newTtracks = filterDuplicateTracks(tracks, pl.tracks);

  dispatchCustomEvent("youtube-tracks", { id, tracks: newTtracks });

  if (nextPageToken) {
    return fetchPlaylistItems(id, nextPageToken);
  }
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

function filterInvalidItems(items) {
  return items.filter(item => {
    const title = item.snippet.title;

    return title !== "Deleted video" && title !== "Private video";
  });
}

function getBiggestThumbnail(thumbnails) {
  for (const size of ["maxres", "high"]) {
    if (thumbnails[size]) {
      return thumbnails[size].url;
    }
  }
  return thumbnails.medium.url;
}

function parseItems(items) {
  return items.map(track => {
    const id = track.snippet.resourceId.videoId;

    setArtwork(id, {
      original: { url: getBiggestThumbnail(track.snippet.thumbnails) },
      small: { url: track.snippet.thumbnails.medium.url }
    }, true);

    return {
      id,
      durationInSeconds: track.durationInSeconds,
      duration: formatTime(track.durationInSeconds),
      name: track.snippet.title,
      title: track.snippet.title,
      artist: track.snippet.videoOwnerChannelTitle,
      album: "",
      artworkId: id,
      player: "youtube"
    };
  });
}

function parseYoutubeUserPlaylists(items) {
  return items.map(item => ({
    id: item.id,
    url: `https://youtube.com/playlist?list=${item.id}`,
    isPrivate: item.status.privacyStatus === "private",
    itemCount: item.contentDetails.itemCount,
    title: item.snippet.title,
    thumbnail: item.snippet.thumbnails.medium.url
  }));
}

function fetchYoutube(path, part, filter, id, token) {
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

function setUser(instance) {
  const currentUser = instance.currentUser.get();
  const profile = currentUser.getBasicProfile();

  accessToken = currentUser.getAuthResponse().access_token;

  user = {
    name: profile.getName(),
    email: profile.getEmail(),
    image: profile.getImageUrl()
  };
}

function getUser() {
  return user;
}

async function logoutUser() {
  const instance = gapi.auth2.getAuthInstance();

  accessToken = "";
  user = null;

  return instance.signOut();
}

async function initGoogleAPI(shouldSignIn) {
  if (initialized) {
    return user;
  }
  await scriptLoader.load({ src: "https://apis.google.com/js/platform.js" });
  await new Promise(resolve => gapi.load("auth2", resolve));
  const instance = await gapi.auth2.init({
    client_id: process.env.GOOGLE_CLIENT_ID,
    scope: "https://www.googleapis.com/auth/youtube.readonly"
  });

  if (instance.isSignedIn.get()) {
    setUser(instance);
  }
  else if (shouldSignIn) {
    await instance.signIn();
    setUser(instance);
  }
  initialized = true;
  return user;
}

export {
  fetchYoutubeUserPlaylists,
  fetchPlaylistTitleAndStatus,
  fetchPlaylistItems,
  initGoogleAPI,
  getUser,
  logoutUser,
  addVideo
};

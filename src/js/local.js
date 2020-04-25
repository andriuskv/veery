import parseAudioMetadata from "parse-audio-metadata";
import { formatTime, dispatchCustomEvent } from "./utils.js";
import { getPlaylistById, createPlaylist } from "./playlist/playlist.js";
import { addTracksToPlaylist } from "./playlist/playlist.manage.js";
import { importSettings } from "./playlist/playlist.import.js";
import { creatItemContent, getTrackElement } from "./playlist/playlist.view.js";
import { updatePlaylistEntry } from "./playlist/playlist.entries.js";
import { showPlayerMessage } from "./player/player.view.js";
import { isRouteActive } from "./router";
import { getArtworks, setArtwork, hashFile, hashString } from "./artworks";
import { getVisiblePlaylistId } from "./tab.js";
import { postMessageToWorker } from "./web-worker";

let needsPlaylistThumbnailRefresh = false;

function removeFileType(fileName) {
  return fileName.slice(0, fileName.lastIndexOf("."));
}

function filterUnsupportedFiles(files) {
  const audio = new Audio();
  const unsupportedTypes = [];

  files = files.reduce((files, file) => {
    if (audio.canPlayType(file.type)) {
      files.push(file);
    }
    else if (file.type.startsWith("audio")) {
      const { name } = file;

      unsupportedTypes.push(name.slice(name.lastIndexOf(".")));
    }
    return files;
  }, []);

  if (unsupportedTypes.length) {
    showPlayerMessage({
      title: "Local Files",
      body: `Can't play audio files with type: ${unsupportedTypes.join(", ")}`
    });
  }
  return files;
}

function filterDuplicateTracks(tracks, existingTracks) {
  return tracks.reduce((tracks, track) => {
    const name = removeFileType(track.name.trim());
    const duplicate = existingTracks.some(track => track.name === name);

    if (!duplicate) {
      tracks.push({
        audioTrack: track,
        name
      });
    }
    return tracks;
  }, []);
}

async function fetchTrackAlbum(track) {
  try {
    const key = process.env.LAST_FM_API_KEY;
    const apiRootURL = "https://ws.audioscrobbler.com/2.0/";
    const params = `?method=track.getInfo&api_key=${key}&artist=${track.artist}&track=${track.title}&format=json`;
    const json = await fetch(apiRootURL + params).then(response => response.json());

    if (json.track && json.track.album) {
      const { title, image } = json.track.album;

      if (!track.album && title) {
        track.album = title;
      }

      if (!track.artworkId && image) {
        const url = image[image.length - 1]["#text"];

        if (url) {
          const { origin, pathname } = new URL(url);
          const [imageName] = pathname.split("/").slice(-1);
          const directUrl = `${origin}/i/u/${imageName}`;
          const type = getFileType(imageName);
          const hash = await hashString(directUrl);
          track.artworkId = hash;

          setArtwork(hash, {
            image: {
              original: { url: directUrl },
              small: { url }
            },
            type
          });
        }
      }
    }
  } catch(e) {
    console.log(e);
  }
}

function getFileType(name) {
  const ext = name.split(".")[1];

  if (ext === "jpg") {
    return "image/jpeg";
  }
  return `image/${ext}`;
}

function parseTracks(tracks) {
  return tracks.map(track => ({
    needsMetadata: true,
    audioTrack: track.audioTrack,
    name: track.name,
    title: track.name,
    artist: "",
    album: "",
    durationInSeconds: 0,
    duration: "",
    player: "native"
  }));
}

async function addTracks(importOption, pl, files, parseTracks) {
  if (!files.length) {
    showPlayerMessage({
      title: `${importOption} files`,
      body: "No valid audio file found."
    });
    return;
  }
  const newTracks = filterDuplicateTracks(files, pl.tracks);

  if (!newTracks.length) {
    showPlayerMessage({
      title: `${importOption} files`,
      body: `Track${files.length > 1 ? "s" : ""} already exist`
    });
    return;
  }
  dispatchCustomEvent("import", {
    importing: true,
    option: importOption,
    playlistId: pl.id
  });

  try {
    const tracks = await parseTracks(newTracks);

    addTracksToPlaylist(pl, tracks);
    updateTracksWithMetadata();
  }
  catch (e) {
    console.log(e);
  }
  finally {
    dispatchCustomEvent("import", {
      importing: false,
      option: importOption,
      playlistId: pl.id
    });
  }
}

async function parseMetadata(track) {
  const { artist, title, album, duration, picture } = await parseAudioMetadata(track.audioTrack);

  track.title = title || track.name;
  track.artist = artist || "";
  track.album = album || "";
  track.durationInSeconds = duration;
  track.duration = formatTime(duration);

  if (picture) {
    track.picture = picture;
  }

  if (!track.album || !picture) {
    track.needsAlbum = true;
  }
}

function updateTrackElement(track, pl) {
  const element = getTrackElement(track.index, pl.id);
  needsPlaylistThumbnailRefresh = true;

  if (element && element.childElementCount) {
    element.innerHTML = creatItemContent(track, pl.id, pl.type);
  }
}

function resizeImage(image) {
  return new Promise((resolve) => {
    const canvasImage = new Image();
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    canvasImage.crossOrigin = "anonymous";

    canvasImage.onload = function() {
      let { width, height } = canvasImage;
      const minSize = Math.min(width, height, 256);

      if (width < height) {
        height = minSize / canvasImage.width * height;
        width = minSize;
      }
      else {
        width = minSize / canvasImage.height * width;
        height = minSize;
      }
      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(canvasImage, 0, 0, width, height);
      canvas.toBlob(resolve, image.type, 0.72);
      URL.revokeObjectURL(canvasImage.src);
    };
    canvasImage.src = URL.createObjectURL(image);
  });
}

async function parseTrackImage(track) {
  const [hash, image] = await Promise.all([hashFile(track.picture), resizeImage(track.picture)]);
  track.artworkId = hash;

  setArtwork(hash, {
    image: {
      original: { blob: track.picture },
      small: { blob: image }
    },
    type: track.picture.type
  });
  delete track.picture;
}

async function updateTrackWithMetadata(track, pl) {
  delete track.needsMetadata;
  await parseMetadata(track);

  if (pl.id === getVisiblePlaylistId()) {
    updateTrackElement(track, pl);
  }
  else if (isRouteActive("")) {
    updatePlaylistEntry(pl.id, pl.tracks, false);
  }
}

async function updateTrackWithImage(track, pl) {
  if (track.picture) {
    await parseTrackImage(track);

    if (pl.id === getVisiblePlaylistId()) {
      updateTrackElement(track, pl);
    }
  }
}

async function updateTrackWithAlbumInfo(track, pl) {
  if (track.needsAlbum) {
    delete track.needsAlbum;
    await fetchTrackAlbum(track);

    if (pl.id === getVisiblePlaylistId()) {
      updateTrackElement(track, pl);
    }
  }
}

async function updateTracksWithMetadata() {
  await updateTrackInfo(updateTrackWithMetadata);
  updateTrackInfo(updateTrackWithImage);
  updateTrackInfo(updateTrackWithAlbumInfo);
}

async function updateTrackInfo(callback) {
  const pl = getPlaylistById("local-files");

  for (const track of pl.tracks) {
    try {
      await callback(track, pl);
    } catch (e) {
      console.log(e);

      if (!getPlaylistById("local-files")) {
        return;
      }
    }
  }

  if (isRouteActive("")) {
    updatePlaylistEntry(pl.id, pl.tracks);
  }
  else {
    needsPlaylistThumbnailRefresh = true;
  }

  if (pl.storePlaylist) {
    postMessageToWorker({
      action: "update-tracks",
      artworks: getArtworks(),
      playlist: {
        id: pl.id,
        tracks: pl.tracks
      }
    });
  }
}

async function updateCurrentTrackWithMetadata(track) {
  const pl = getPlaylistById("local-files");

  if (track.needsMetadata) {
    delete track.needsMetadata;
    await parseMetadata(track);
  }

  if (track.picture) {
    await parseTrackImage(track);
  }
  else if (track.needsAlbum) {
    delete track.needsAlbum;
    await fetchTrackAlbum(track);
  }

  if (pl.id === getVisiblePlaylistId()) {
    updateTrackElement(track, pl);
  }
  else if (isRouteActive("")) {
    updatePlaylistEntry(pl.id, pl.tracks, true);
  }
  else {
    needsPlaylistThumbnailRefresh = true;
  }

  if (pl.storePlaylist) {
    postMessageToWorker({
      action: "update-tracks",
      artworks: getArtworks(),
      playlist: {
        id: pl.id,
        tracks: pl.tracks
      }
    });
  }
}

function refreshPlaylistThumbnail() {
  const pl = getPlaylistById("local-files");

  if (needsPlaylistThumbnailRefresh && pl) {
    requestAnimationFrame(() => {
      updatePlaylistEntry(pl.id, pl.tracks);
    });
  }
  needsPlaylistThumbnailRefresh = false;
}

function selectLocalFiles(files) {
  const supportedFiles = filterUnsupportedFiles(files);
  const id = "local-files";
  const pl = getPlaylistById(id) || createPlaylist({
    id,
    title: "Local Files",
    type: "list",
    storePlaylist: importSettings.getSetting(id, "storePlaylist")
  });

  addTracks("local", pl, supportedFiles, parseTracks);
}

function readFile(entry) {
  return new Promise(resolve => {
    entry.file(resolve);
  });
}

function readDirectory(dir) {
  return new Promise(resolve => {
    const reader = dir.createReader();
    const items = [];

    function readEntries() {
      reader.readEntries(async entries => {
        if (entries.length > 0) {
          for (const entry of entries) {
            if (entry.isFile) {
              const file = await readFile(entry);
              items.push(file);
            }
            else if (entry.isDirectory) {
              const files = await readDirectory(entry);
              items.push(...files);
            }
          }
          // Only 100 entries can be read at a time, so call readEntries recursively
          // until entries.length becomes 0.
          readEntries();
        } else {
          resolve(items);
        }
      });
    }
    readEntries();
  });
}

window.addEventListener("drop", event => {
  const { files, items } = event.dataTransfer;

  event.preventDefault();

  if (files.length) {
    if (items && items.length && items[0].webkitGetAsEntry) {
      const result = [];
      const promises = [];

      showPlayerMessage({
        id: "js-upload-notice",
        body: `
        <div class="upload-notice">
        <img src="./assets/images/spinner.svg" alt="">
        <span>Uploading...</span>
        </div>
        `
      });

      for (const item of items) {
        const entry = item.webkitGetAsEntry();

        if (entry.isDirectory) {
          promises.push(readDirectory(entry));
        }
        else if (entry.isFile) {
          result.push(item.getAsFile());
        }
      }
      Promise.all(promises).then(items => {
        selectLocalFiles([...items.flat().concat(result)]);
      }).catch(e => {
        console.log(e);
      }).finally(() => {
        document.getElementById("js-upload-notice").remove();
      });
    }
    else {
      selectLocalFiles([...files]);
    }
  }
});

window.addEventListener("dragover", event => {
  event.preventDefault();
});

export {
  addTracks,
  selectLocalFiles,
  updateCurrentTrackWithMetadata,
  refreshPlaylistThumbnail
};

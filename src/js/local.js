import parseAudioMetadata from "parse-audio-metadata";
import { formatTime, dispatchCustomEvent } from "./utils.js";
import { getPlaylistById, createPlaylist } from "./playlist/playlist.js";
import { addTracksToPlaylist } from "./playlist/playlist.manage.js";
import { importSettings } from "./playlist/playlist.import.js";
import { creatItemContent, getTrackElement } from "./playlist/playlist.view.js";
import { updatePlaylistEntry } from "./playlist/playlist.entries.js";
import { showPlayerMessage } from "./player/player.view.js";
import { getArtworks, setArtwork, hashFile, hashString } from "./artworks";
import { getVisiblePlaylistId } from "./tab.js";
import { postMessageToWorker } from "./web-worker.js";

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
      title: "Local files",
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
  if (track.album && track.artworkId) {
    return;
  }
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
          const hash = await hashString(`${origin}/i/u/${imageName}`);
          track.artworkId = hash;
          setArtwork(hash, {
            url: `${origin}/i/u/${imageName}`,
            type: getFileType(imageName)
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
      body: "No valid audio file found"
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

    if (requestIdleCallback) {
      requestIdleCallback(updateTrackInfo);
    }
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
  const hash = await hashFile(picture);

  track.title = title || track.name;
  track.artist = artist || "";
  track.album = album || "";
  track.durationInSeconds = duration;
  track.duration = formatTime(duration);

  if (hash) {
    track.artworkId = hash;
    setArtwork(hash, {
      file: picture,
      type: picture.type
    });
  }
  await fetchTrackAlbum(track);
}

async function updateTrackInfo() {
  const pl = getPlaylistById("local-files");

  if (!pl) {
    return;
  }
  const track = pl.tracks.find(track => track.needsMetadata);

  if (!track) {
    updatePlaylistEntry(pl.id, pl.tracks);

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
    return;
  }
  try {
    await updateTrackWithMetadata(track, pl);
  }
  catch (error) {
    console.log(error);
  }
  finally {
    requestIdleCallback(updateTrackInfo);
  }
}

async function updateTrackWithMetadata(track, { id, type, tracks }) {
  delete track.needsMetadata;
  await parseMetadata(track);

  if (id === getVisiblePlaylistId()) {
    const element = getTrackElement(track.index, id);

    if (element) {
      element.innerHTML = creatItemContent(track, id, type);
    }
  }
  updatePlaylistEntry(id, tracks, false);
}

function selectLocalFiles(files) {
  const supportedFiles = filterUnsupportedFiles(files);
  const id = "local-files";
  const pl = getPlaylistById(id) || createPlaylist({
    id,
    title: "Local files",
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
  updateTrackWithMetadata
};

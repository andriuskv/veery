import { dispatchCustomEvent, getRandomString } from "../utils.js";
import { setArtwork, saveArtworks, getArtwork } from "services/artwork";
const metadataCache = {};
let workerForOne = null;
let workerForMany = null;
let db = null;

async function initMetadataCache(idb) {
  try {
    db = idb;
    const cache = await db.getAll("metadata") || [];

    cache.forEach(item => {
      metadataCache[item.id] = item;
    });
  } catch {
    // The "metadata" store doesn't exist yet, so we don't do anything.
  }
}

async function saveMetadata() {
  const tx = db.transaction("metadata", "readwrite");

  await Promise.all([...Object.keys(metadataCache).map(key => {
    return tx.store.put(metadataCache[key]);
  }), tx.done]);
}

function removeFileType(fileName) {
  return fileName.slice(0, fileName.lastIndexOf("."));
}

function collectUniqueTracks(files, currentTracks) {
  return files.reduce((tracks, file) => {
    if (!file.type.startsWith("audio")) {
      return tracks;
    }
    const name = removeFileType(file.name.trim());
    const duplicate = currentTracks.some(track => track.name === name && track.audioTrack.size === file.size && track.audioTrack.lastModified === file.lastModified);

    if (!duplicate) {
      const metadata = metadataCache[`${file.name}//${file.size}//${file.lastModified}`];
      const artwork = getArtwork(metadata?.artworkId);

      tracks.push({
        needsMetadata: !(metadata && artwork),
        id: getRandomString(),
        date: file.lastModified,
        audioTrack: file,
        name,
        title: name,
        artist: "",
        album: "",
        durationInSeconds: 0,
        duration: "",
        player: "native",
        ...metadata
      });
    }
    return tracks;
  }, []);
}

function initWorker(payload, type) {
  return new Promise(resolve => {
    const props = {
      workerType: type,
      checkLastFm: localStorage.getItem("use-last.fm") === "true"
    };
    let worker = null;

    if (type === "one") {
      if (!workerForOne) {
        workerForOne = new Worker(new URL("../worker.js", import.meta.url), { type: "module" });
      }
      worker = workerForOne;
    }
    else if (type === "many") {
      if (!workerForMany) {
        workerForMany = new Worker(new URL("../worker.js", import.meta.url), { type: "module" });
      }
      worker = workerForMany;
    }
    worker.addEventListener("message", handleMessage(resolve));
    worker.postMessage({ payload, ...props });
  });
}

function handleMessage(resolve) {
  return function handleMessage({ target, data }) {
    const { type, track, artwork, workerType, done = false } = data;

    if (type === "track") {
      dispatchCustomEvent("track", { track, done });

      if (artwork) {
        setArtwork(track.artworkId, artwork);
      }
      const id = `${track.audioTrack.name}//${track.audioTrack.size}//${track.audioTrack.lastModified}`;
      metadataCache[id] = {
        id,
        artworkId: track.artworkId,
        title: track.title,
        artist: track.artist,
        album: track.album,
        durationInSeconds: track.durationInSeconds,
        duration: track.duration
      };

      if (done) {
        saveArtworks();
        saveMetadata();
        target.removeEventListener("message", handleMessage);
        target.terminate();

        resolve(track);

        if (workerType === "one") {
          workerForOne = null;
        }
        else if (workerType === "many") {
          workerForMany = null;
        }
      }
    }
  };
}

function updateTrackWithMetadata(track) {
  return initWorker(track, "one");
}

function updateTracksWithMetadata(tracks) {
  return initWorker(tracks, "many");
}

async function readItems(items) {
  const filePromises = [];
  const directoryPromises = [];

  for (const item of items) {
    if (item.kind === "file" && (item.type === "" || item.type.startsWith("audio"))) {
      const entry = item.webkitGetAsEntry();

      if (entry.isDirectory) {
        directoryPromises.push(readDirectory(entry));
      }
      else if (entry.isFile) {
        filePromises.push(readFile(entry));
      }
    }
  }

  const resolvedItems = await Promise.all([...directoryPromises, ...filePromises]);
  let files = [];

  for (const item of resolvedItems) {
    if (Array.isArray(item)) {
      files = files.concat(item);
    }
    else {
      files.push(item);
    }
  }

  return files;
}

function readDirectory(directory) {
  return new Promise(resolve => {
    const reader = directory.createReader();
    let items = [];

    function readEntries() {
      reader.readEntries(async entries => {
        if (entries.length > 0) {
          for (const entry of entries) {
            if (entry.isFile) {
              const file = await readFile(entry);

              if (file.type.startsWith("audio")) {
                items.push(file);
              }
            }
            else if (entry.isDirectory) {
              const files = await readDirectory(entry);
              items = items.concat(files);
            }
          }
          // readEntries returns only 100 entries at a time, so we need to call it multiple times.
          readEntries();
        } else {
          resolve(items);
        }
      });
    }
    readEntries();
  });
}

function readFile(entry) {
  return new Promise(resolve => {
    entry.file(resolve);
  });
}

window.addEventListener("drop", async event => {
  event.preventDefault();

  if (event.dataTransfer.items.length) {
    const files = await readItems(event.dataTransfer.items);

    if (files.length) {
      dispatchCustomEvent("file-handler", files);
    }
  }
});

window.addEventListener("dragover", event => {
  event.preventDefault();
});

let fileCache = [];
let first = true;

function getLauncherFileCache() {
  return fileCache;
}

document.addEventListener("paste", async event => {
  const clipboardItems = await navigator.clipboard.read();
  const blobs = [];

  event.preventDefault();

  for (const clipboardItem of clipboardItems) {
    const audioTypes = clipboardItem.types?.filter(type => type.startsWith("audio/"));

    for (const audioType of audioTypes) {
      const blob = await clipboardItem.getType(audioType);

      blobs.push(blob);
    }
  }

  if (blobs.length) {
    dispatchCustomEvent("file-handler", blobs);
  }
});

if ("launchQueue" in window && "files" in window.LaunchParams.prototype) {
  window.launchQueue.setConsumer(async launchParams => {
    if (!launchParams.files.length) {
      return;
    }
    const blobs = [];

    for (const fileHandle of launchParams.files) {
      const blob = await fileHandle.getFile();

      blobs.push(blob);
    }

    if (blobs.length) {
      if (first) {
        first = false;
        fileCache = [...blobs];
      }
      else {
        fileCache.length = 0;
      }
      dispatchCustomEvent("file-handler", blobs);
    }
  });
}

export {
  initMetadataCache,
  collectUniqueTracks,
  updateTrackWithMetadata,
  updateTracksWithMetadata,
  getLauncherFileCache
};

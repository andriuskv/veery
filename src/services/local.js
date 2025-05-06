import { dispatchCustomEvent, getRandomString } from "../utils.js";
import { setArtwork } from "services/artwork";

let workerForOne = null;
let workerForMany = null;

function removeFileType(fileName) {
  return fileName.slice(0, fileName.lastIndexOf("."));
}

function collectUniqueTracks(files, currentTracks) {
  return files.reduce((tracks, file) => {
    if (!file.type.startsWith("audio")) {
      return tracks;
    }
    const name = removeFileType(file.name.trim());
    const duplicate = currentTracks.some(track => track.name === name);

    if (!duplicate) {
      tracks.push({
        needsMetadata: true,
        id: getRandomString(),
        date: file.lastModified,
        audioTrack: file,
        name,
        title: name,
        artist: "",
        album: "",
        durationInSeconds: 0,
        duration: "",
        player: "native"
      });
    }
    return tracks;
  }, []);
}

function initWorker(payload, type) {
  return new Promise(resolve => {
    const props = {
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
    const { type, track, artwork, done = false } = data;

    if (type === "track") {
      dispatchCustomEvent("track", { track, done });

      if (artwork) {
        setArtwork(track.artworkId, artwork);
      }

      if (done) {
        target.removeEventListener("message", handleMessage);
        resolve(track);
      }
    }
    else if (type === "image") {
      resizeImage(track, data.image, done);
    }
  };
}

function updateTrackWithMetadata(track) {
  return initWorker(track, "one");
}

function updateTracksWithMetadata(tracks) {
  return initWorker(tracks, "many");
}

function resizeImage(track, { hash, file }, done) {
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
    canvas.toBlob(image => {
      setArtwork(hash, {
        original: { blob: file },
        small: { blob: image },
        type: file.type
      });
      dispatchCustomEvent("track", { track, done });
    }, file.type, 0.72);
    URL.revokeObjectURL(canvasImage.src);
  };
  canvasImage.src = URL.createObjectURL(file);
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

    dispatchCustomEvent("file-handler", files);
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
  collectUniqueTracks,
  updateTrackWithMetadata,
  updateTracksWithMetadata,
  getLauncherFileCache
};

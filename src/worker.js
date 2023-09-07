import parseAudioMetadata from "parse-audio-metadata";
import { formatTime, computeHash } from "./utils";

let left = 0;

onmessage = function(event) {
  const { payload, checkLastFm } = event.data;

  if (Array.isArray(payload)) {
    updateTracksWithMetadata(payload, checkLastFm);
  }
  else {
    left = 1;
    updateTrackWithMetadata(payload, checkLastFm);
  }
};

async function updateTracksWithMetadata(tracks, checkLastFm) {
  left = tracks.length;

  for (const track of tracks) {
    await updateTrackWithMetadata(track, checkLastFm);
  }
}

async function updateTrackWithMetadata(track, checkLastFm) {
  try {
    delete track.needsMetadata;
    await parseMetadata(track);
    parseAlbum(track, checkLastFm);
  } catch (e) {
    console.log(e);

    left -= 1;

    if (left <= 0) {
      postMessage({ type: "track", track, done: true });
    }
  }
}

async function parseMetadata(track) {
  const { artist, title, album, duration, picture } = await parseAudioMetadata(track.audioTrack);

  track.title = title || track.name;
  track.artist = artist || "";
  track.album = album || "";
  track.durationInSeconds = duration;
  track.duration = formatTime(duration);

  postMessage({ type: "track", track });

  if (picture) {
    track.picture = picture;
  }
}

async function parseAlbum(track, checkLastFm) {
  if (track.picture) {
    try {
      await parseTrackImage(track);
    } catch (e) {
      console.log(e);
    }
  }

  if (checkLastFm && (!track.album || !track.picture)) {
    await fetchTrackAlbum(track);
  }
  left -= 1;

  if (left <= 0) {
    postMessage({ type: "track", track, done: true });
  }
}

async function parseTrackImage(track) {
  const { picture } = track;
  delete track.picture;

  if ("OffscreenCanvas" in self) {
    const [hash, image] = await Promise.all([hashFile(picture), resizeImage(picture)]);
    track.artworkId = hash;

    postMessage({ type: "track", track, artwork: {
      original: { blob: picture },
      small: { blob: image },
      type: picture.type
    } });
  }
  else {
    const hash = await hashFile(picture);
    track.artworkId = hash;

    postMessage({
      type: "image",
      image: {
        hash,
        file: picture
      },
      done: left <= 1,
      track
    });
  }
}

async function resizeImage(image) {
  const bitmap = await createImageBitmap(image);
  let { width, height } = bitmap;
  const minSize = Math.min(width, height, 256);

  if (width < height) {
    height = minSize / bitmap.width * height;
    width = minSize;
  }
  else {
    width = minSize / bitmap.height * width;
    height = minSize;
  }
  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext("2d");

  ctx.drawImage(bitmap, 0, 0, width, height);

  return canvas.convertToBlob({
    type: image.type,
    quality: 0.72
  });
}

async function fetchTrackAlbum(track) {
  try {
    const key = process.env.LAST_FM_API_KEY;
    const apiRootURL = "https://ws.audioscrobbler.com/2.0/";
    const params = `?method=track.getInfo&api_key=${key}&artist=${track.artist}&track=${track.title}&format=json`;
    const json = await fetch(apiRootURL + params).then(response => response.json());

    if (json.track && json.track.album) {
      const { title, image } = json.track.album;
      let foundAlbum = false;
      let artwork = null;

      if (!track.album && title) {
        track.album = title;
        foundAlbum = true;
      }

      if (!track.artworkId && image) {
        const url = image[image.length - 1]["#text"];

        if (url) {
          const { origin, pathname } = new URL(url);
          const [imageName] = pathname.split("/").slice(-1);
          const directUrl = `${origin}/i/u/500x500/${imageName}`;
          const type = getFileType(imageName);
          const hash = await hashString(directUrl);

          track.artworkId = hash;

          artwork = {
            original: { url: directUrl },
            small: { url },
            type
          };
        }
      }

      if (foundAlbum || artwork) {
        postMessage({ type: "track", track, artwork });
      }
    }
  } catch(e) {
    console.log(e);
  }
}

function getFileType(name) {
  const ext = name.split(".").at(-1);

  if (ext === "jpg") {
    return "image/jpeg";
  }
  return `image/${ext}`;
}

async function hashFile(blob) {
  if (!blob) {
    return;
  }
  const buffer = await blob.arrayBuffer();
  return computeHash(buffer);
}

function hashString(string) {
  const encoder = new TextEncoder("utf-8");
  return computeHash(encoder.encode(string).buffer);
}

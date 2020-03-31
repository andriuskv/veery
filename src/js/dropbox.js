/* global Dropbox */

import parseAudioMetadata from "parse-audio-metadata";
import { scriptLoader, formatTime } from "./utils.js";
import { addTracks } from "./local.js";
import { getPlaylistById, createPlaylist } from "./playlist/playlist.js";
import { importSettings } from "./playlist/playlist.import.js";

function getTrackBlob(link) {
  return fetch(link).then(response => response.blob());
}

async function parseTracks(tracks, parsedTracks = []) {
  const track = tracks[parsedTracks.length];
  const audioTrack = await getTrackBlob(track.audioTrack.link);
  const { duration } = await parseAudioMetadata(audioTrack);

  parsedTracks.push({
    audioTrack,
    durationInSeconds: duration,
    title: track.name,
    artist: "",
    album: "",
    name: track.name,
    duration: formatTime(duration),
    player: "native"
  });

  if (parsedTracks.length === tracks.length) {
    return parsedTracks;
  }
  return parseTracks(tracks, parsedTracks);
}

async function showDropboxChooser() {
  await scriptLoader.load({
    src: "https://www.dropbox.com/static/api/2/dropins.js",
    id: "dropboxjs",
    "data-app-key": process.env.DROPBOX_API_KEY
  });

  Dropbox.choose({
    success(files) {
      const id = "dropbox";
      const pl = getPlaylistById(id) || createPlaylist({
        id,
        title: "Dropbox",
        type: "grid",
        storePlaylist: importSettings.getSetting(id, "storePlaylist")
      });

      addTracks(id, pl, files, parseTracks);
    },
    linkType: "direct",
    multiselect: true,
    extensions: ["audio"]
  });
}

export {
  showDropboxChooser
};

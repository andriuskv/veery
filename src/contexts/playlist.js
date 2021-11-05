import { createContext, useContext, useState, useEffect, useMemo } from "react";
import { openDB } from "idb";
import { dispatchCustomEvent } from "../utils.js";
import { resetSettings } from "services/settings";
import * as playlistService from "services/playlist";
import * as playerService from "services/player";
import * as artworkService from "services/artwork";
import { useNotification } from "contexts/notification";

const PlaylistContext = createContext();

function PlaylistProvider({ children }) {
  const { showNotification } = useNotification();
  const [playlists, setPlaylists] = useState(null);
  const value = useMemo(() => ({ playlists, createPlaylist, updatePlaylist, removePlaylist, addTracks, uploadFiles }), [playlists]);

  useEffect(() => {
    init();
  }, []);

  useEffect(() => {
    window.addEventListener("drop", handeFileDrop);
    window.addEventListener("dragover", handleDragOver);
    window.addEventListener("track", handleTrackUpdate);
    window.addEventListener("youtube-tracks", handleYoutubeTracksUpdate);

    return () => {
      window.removeEventListener("drop", handeFileDrop);
      window.addEventListener("dragover", handleDragOver);
      window.removeEventListener("track", handleTrackUpdate);
      window.removeEventListener("youtube-tracks", handleYoutubeTracksUpdate);
    };
  }, [playlists]);

  async function init() {
    const db = await getDb();

    if (!localStorage.getItem("reseted")) {
      localStorage.setItem("reseted", 1);
      localStorage.removeItem("veery-settings");
      resetSettings();
      await Promise.all([db.clear("artworks"), db.clear("playlists")]);
    }
    await Promise.all([artworkService.initArtworks(db), playlistService.initPlaylists(db)]);

    const playlists = playlistService.getPlaylists();

    setPlaylists(playlists);

    for (const playlist of Object.values(playlists)) {
      if (playlist.sync) {
        const { initGoogleAPI, fetchPlaylistItems } = await import("services/youtube");
        const user = await initGoogleAPI();

        await fetchPlaylistItems(playlist.id);

        dispatchCustomEvent("youtube-user-update", user);
      }
    }
  }

  async function getDb() {
    let db = null;

    try {
      db = await openDB("veery", 1, {
        upgrade(db) {
          db.createObjectStore("artworks", { keyPath: "id" });
          db.createObjectStore("playlists", { keyPath: "id" });
        }
      });
    } catch (e) {
      db = await new Promise(resolve => {
        const req = indexedDB.deleteDatabase("veery");

        req.onsuccess = function() {
          resolve(openDB("veery", 1, {
            upgrade(db) {
              db.createObjectStore("artworks", { keyPath: "id" });
              db.createObjectStore("playlists", { keyPath: "id" });
            }
          }));
        };
      });
    }
    return db;
  }

  async function handeFileDrop(event) {
    event.preventDefault();

    const { readItems } = await import("services/local");
    const files = await readItems(event.dataTransfer.items);

    if (files.length) {
      uploadFiles(files);
    }
  }

  function handleDragOver(event) {
    // Preload module here to prevent receiving empty item list in drop handler.
    import("services/local");
    event.preventDefault();
  }

  function handleTrackUpdate({ detail: { track, done } }) {
    const pl = playlists["local-files"];
    const index = pl.tracks.findIndex(({ name }) => track.name === name);

    if (index >= 0) {
      pl.tracks[index] = track;
      updatePlaylist(pl.id, { tracks: pl.tracks }, done);
    }
  }

  function handleYoutubeTracksUpdate({ detail: { id, tracks } }) {
    addTracks(id, tracks);
  }

  async function uploadFiles(files) {
    const { collectUniqueTracks, updateTracksWithMetadata } = await import("services/local");
    const id = "local-files";
    const pl = playlists[id];
    const playlistTracks = pl ? pl.tracks: [];
    const tracks = collectUniqueTracks(files, playlistTracks);

    if (tracks.length) {
      dispatchCustomEvent("update-indicator-status", { id, visible: true });

      if (pl) {
        addTracks(id, tracks, false);
      }
      else {
        createPlaylist({
          id,
          title: "Local Files",
          viewMode: "compact",
          tracks
        });
      }
      await updateTracksWithMetadata(tracks);
    }
    else {
      showNotification({ value: "No unique files found." });
    }
    dispatchCustomEvent("update-indicator-status", { id, visible: false });
  }

  function createPlaylist(playlist) {
    setPlaylists({
      ...playlists,
      [playlist.id]: playlistService.createPlaylist(playlist)
    });
  }

  function updatePlaylist(id, data, shouldUpdateThumbnail) {
    setPlaylists({
      ...playlists,
      [id]: playlistService.updatePlaylist(id, data, shouldUpdateThumbnail)
    });
  }

  function removePlaylist(id) {
    const playlists = playlistService.removePlaylist(id);
    setPlaylists({ ...playlists });
  }

  async function addTracks(id, tracks, shouldUpdateThumbnail = true) {
    const activePlaylistId = playerService.getActivePlaylistId();

    updatePlaylist(id, {
      tracks: await playlistService.addTracks(id, tracks, false)
    }, shouldUpdateThumbnail);

    if (id === activePlaylistId) {
      playerService.flagPlaybackOrderForUpdate();
    }
  }

  return <PlaylistContext.Provider value={value}>{children}</PlaylistContext.Provider>;
}

function usePlaylists() {
  return useContext(PlaylistContext);
}

export {
  PlaylistProvider,
  usePlaylists
};

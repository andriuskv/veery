import { createContext, useContext, useState, useEffect, useRef, useMemo } from "react";
import { openDB } from "idb";
import { dispatchCustomEvent } from "../utils.js";
import { resetSettings } from "services/settings";
import { setPlaylistViewActiveTrack, resetPlaylistViewActiveTrack } from "services/playlist-view";
import * as playlistService from "services/playlist";
import * as playerService from "services/player";
import * as artworkService from "services/artwork";
import { useNotification } from "contexts/notification";

const PlaylistContext = createContext();

function PlaylistProvider({ children }) {
  const { showNotification } = useNotification();
  const [playlists, setPlaylists] = useState(null);
  const value = useMemo(() => ({ playlists, createPlaylist, updatePlaylist, removePlaylist, addTracks, uploadFiles }), [playlists]);
  const first = useRef(true);

  useEffect(() => {
    init();
  }, []);

  useEffect(() => {
    if (playlists && first.current) {
      first.current = false;
      syncPlaylists();
    }
    window.addEventListener("drop", handleFileDrop);
    window.addEventListener("dragover", handleDragOver);
    window.addEventListener("track", handleTrackUpdate);
    window.addEventListener("youtube-tracks", handleYoutubeTracksUpdate);
    window.addEventListener("file-handler", handleFileHandler);

    return () => {
      window.removeEventListener("drop", handleFileDrop);
      window.addEventListener("dragover", handleDragOver);
      window.removeEventListener("track", handleTrackUpdate);
      window.removeEventListener("youtube-tracks", handleYoutubeTracksUpdate);
      window.removeEventListener("file-handler", handleFileHandler);
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

    setPlaylists(playlistService.getPlaylists());
  }

  function handleFileHandler({ detail }) {
    uploadFiles(detail);
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

  async function syncPlaylists() {
    for (const { id, sync } of Object.values(playlists)) {
      if (sync) {
        dispatchCustomEvent("update-indicator-status", { id, visible: true });

        const { initGoogleAPI, fetchPlaylistItems } = await import("services/youtube");
        const user = await initGoogleAPI();
        const tracks = await fetchPlaylistItems(id, "sync");
        const activeTrack = playerService.getActiveTrack();
        const activePlaylistId = playerService.getActivePlaylistId();

        updatePlaylist(id, { tracks: playlistService.setTrackIndexes(tracks) });

        if (id === activePlaylistId) {
          playerService.setPlaybackOrder(id);

          if (activeTrack) {
            resetPlaylistViewActiveTrack();
            setPlaylistViewActiveTrack(activeTrack.index, id);
          }
        }
        dispatchCustomEvent("youtube-user-update", user);
        dispatchCustomEvent("tracks", { id, type: "replace" });
        dispatchCustomEvent("update-indicator-status", { id, visible: false });
      }
    }
  }

  async function handleFileDrop(event) {
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
    const { id, tracks } = playlists["local-files"];
    const index = tracks.findIndex(({ id }) => track.id === id);

    if (index >= 0) {
      tracks[index] = track;
      updatePlaylist(id, { tracks }, done);
    }
  }

  function handleYoutubeTracksUpdate({ detail: { id, tracks, done } }) {
    addTracks(id, tracks, done);
    dispatchCustomEvent("tracks", { id, tracks });
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
        dispatchCustomEvent("tracks", { id, tracks });
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

  function updatePlaylist(id, data, done) {
    setPlaylists({
      ...playlists,
      [id]: playlistService.updatePlaylist(id, data, done)
    });
  }

  function removePlaylist(id) {
    const playlists = playlistService.removePlaylist(id);
    setPlaylists({ ...playlists });
  }

  function addTracks(id, tracks, done) {
    const activePlaylistId = playerService.getActivePlaylistId();

    updatePlaylist(id, {
      tracks: playlistService.addTracks(id, tracks, false)
    }, done);

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

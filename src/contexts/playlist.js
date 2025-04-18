import { createContext, use, useState, useEffect, useRef, useMemo } from "react";
import { openDB } from "idb";
import { dispatchCustomEvent } from "../utils.js";
import { setPlaylistViewActiveTrack, resetPlaylistViewActiveTrack } from "services/playlist-view";
import * as playlistService from "services/playlist";
import * as playerService from "services/player";
import * as artworkService from "services/artwork";
import { collectUniqueTracks, updateTracksWithMetadata, getLauncherFileCache } from "services/local";
import { useNotification } from "contexts/notification";

const PlaylistContext = createContext();

function PlaylistProvider({ children }) {
  const { showNotification } = useNotification();
  const [playlists, setPlaylists] = useState(null);
  const value = useMemo(() => ({ playlists, createPlaylist, updatePlaylist, removePlaylist, addTracks, uploadFiles, updatePlaylists }), [playlists]);
  const first = useRef(true);
  const skip = useRef(false);

  useEffect(() => {
    init();
  }, []);

  useEffect(() => {
    if (!playlists) {
      return;
    }

    if (first.current) {
      first.current = false;
      syncPlaylists();
    }
    window.addEventListener("track", handleTrackUpdate);
    window.addEventListener("youtube-tracks", handleYoutubeTracksUpdate);
    window.addEventListener("file-handler", handleFileHandler);

    return () => {
      window.removeEventListener("track", handleTrackUpdate);
      window.removeEventListener("youtube-tracks", handleYoutubeTracksUpdate);
      window.removeEventListener("file-handler", handleFileHandler);
    };
  }, [playlists]);

  async function init() {
    const cachedFiles = getLauncherFileCache();
    const db = await getDb();

    await Promise.all([artworkService.initArtworks(db), playlistService.initPlaylists(db)]);

    if (cachedFiles.length) {
      initLauncherFiles(cachedFiles);
      return;
    }
    skip.current = true;
    window.addEventListener("file-handler", async ({ detail }) => {
      await initLauncherFiles(detail);
      skip.current = false;
    }, { once: true });
    setPlaylists(playlistService.getPlaylists());
  }

  async function initLauncherFiles(files) {
    const prefs = JSON.parse(localStorage.getItem("local-files")) || null;
    const playlists = playlistService.getPlaylists();
    const playlist = playlistService.createPlaylist({
      id: "local-files",
      title: "Local Files",
      viewMode: "compact",
      tracks: collectUniqueTracks(files, []),
      ...prefs
    });

    setPlaylists({ ...playlists, "local-files": { ...playlist } });

    dispatchCustomEvent("update-indicator-status", { id: "local-files", visible: true });
    await updateTracksWithMetadata(playlist.tracks);
    dispatchCustomEvent("update-indicator-status", { id: "local-files", visible: false });
  }

  function handleFileHandler({ detail }) {
    if (skip.current) {
      skip.current = false;
      return;
    }
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
    } catch {
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

  function handleTrackUpdate({ detail: { track, done } }) {
    const { id, tracks } = playlists["local-files"];
    const index = tracks.findIndex(({ id }) => track.id === id);

    if (index >= 0) {
      tracks[index] = track;
      updatePlaylist(id, { tracks }, { done, sort: done });
    }
  }

  function handleYoutubeTracksUpdate({ detail: { id, tracks, done } }) {
    addTracks(id, tracks, done);
    dispatchCustomEvent("tracks", { id, tracks });
  }

  async function uploadFiles(files) {
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
        const prefs = JSON.parse(localStorage.getItem(id)) || null;

        createPlaylist({
          id,
          title: "Local Files",
          viewMode: "compact",
          tracks,
          ...prefs
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
    const newPlaylist = playlistService.createPlaylist(playlist);

    setPlaylists({
      ...playlists,
      [playlist.id]: newPlaylist
    });

    return newPlaylist;
  }

  function updatePlaylist(id, data, options) {
    const updatedPlaylist = playlistService.updatePlaylist(id, data, options);

    setPlaylists({
      ...playlists,
      [id]: updatedPlaylist
    });

    return updatedPlaylist;
  }

  function updatePlaylists(updatedPlaylists) {
    setPlaylists({
      ...playlists,
      ...updatedPlaylists
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
    }, { done });

    if (id === activePlaylistId) {
      playerService.setPlaybackOrder(activePlaylistId, playerService.getPlaybackIndex());
    }
  }

  return <PlaylistContext value={value}>{children}</PlaylistContext>;
}

function usePlaylists() {
  return use(PlaylistContext);
}

export {
  PlaylistProvider,
  usePlaylists
};

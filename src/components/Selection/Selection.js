import { useState, useEffect } from "react";
import { getRandomString } from "../../utils";
import { setTrackIndexes, getPlaylistById, updatePlaylist as updateServicePlaylist } from "services/playlist";
import { getSelectedElements, getElementIndexes, resetSelection, selectAllTracks, removeSelectedElements, selectTrackElementAtIndex } from "services/playlist-selection";
import { setPlaylistViewActiveTrack } from "services/playlist-view";
import { getActiveTrack, setPlaybackOrder } from "services/player";
import { usePlaylists } from "contexts/playlist";
import { usePlayer } from "contexts/player";
import { useQueue } from "contexts/queue";
import Icon from "components/Icon";
import Dropdown from "components/Dropdown";

export default function Selection({ playlist }) {
  const { updatePlaylist, updatePlaylists } = usePlaylists();
  const { initTrack, activePlaylistId, activeTrack } = usePlayer();
  const { enqueueTracks } = useQueue();
  const [selection, setSelection] = useState(false);

  useEffect(() => {
    window.addEventListener("keydown", handlePlaylistShortcuts);
    window.addEventListener("selection", handleSelection);

    return () => {
      window.removeEventListener("keydown", handlePlaylistShortcuts);
      window.removeEventListener("selection", handleSelection);
    };
  }, [playlist, activePlaylistId]);

  function handlePlaylistShortcuts(event) {
    const modifierKeyPressed = event.ctrlKey || event.shiftKey || event.altKey || event.metaKey;
    const { target, key } = event;

    if ((target instanceof HTMLInputElement && target.type === "text")) {
      return;
    }

    if (key === "Delete" && !modifierKeyPressed) {
      removeSelectedTracks();
      setSelection(false);
    }
    else if (key === "a" && event.ctrlKey) {
      event.preventDefault();

      if (playlist.tracks.length) {
        const shouldShowSelection = selectAllTracks();

        setSelection(shouldShowSelection);
      }
    }
  }

  function handleSelection({ detail: visible }) {
    setSelection(visible);
  }

  function hideSelection() {
    setSelection(false);
  }

  function cancelSelection() {
    resetSelection();
    hideSelection();
  }

  function enqueueSelectedTracks() {
    const elements = getSelectedElements();
    const items = [];
    let indexes = getElementIndexes(elements);

    if (!activeTrack) {
      const track = playlist.tracks[indexes[0]];

      // The first queue track will be replaced with an active track
      indexes = indexes.slice(1);
      initTrack(track, playlist.id);
    }

    for (const index of indexes) {
      items.push({
        id: getRandomString(),
        playlistId: playlist.id,
        track: playlist.tracks[index]
      });
    }
    enqueueTracks(items);
    cancelSelection();
  }

  function removeSearchTracks() {
    const elements = getSelectedElements();
    const indexes = getElementIndexes(elements);
    const firstSelectedTrackIndex = indexes[0];
    const searchTracksToKeep = [];
    const playlists = {};
    let oneOfActive = false;

    for (const track of playlist.tracks) {
      if (!indexes.includes(track.index)) {
        searchTracksToKeep.push(track);
      }
    }

    for (const index of indexes) {
      const track = playlist.tracks[index];

      if (playlists[track.playlistId]) {
        playlists[track.playlistId].push(track.playlistIndex);
      }
      else {
        playlists[track.playlistId] = [track.playlistIndex];
      }
    }
    const updatedPlaylists = {};

    for (const playlistId in playlists) {
      const playlist = getPlaylistById(playlistId);
      const tracksToKeep = [];
      const indexesToRemove = [];

      if (playlistId === activePlaylistId) {
        oneOfActive = true;
      }

      for (const index of playlists[playlistId]) {
        indexesToRemove.push(index);
      }

      for (const track of playlist.tracks) {
        if (!indexesToRemove.includes(track.index)) {
          tracksToKeep.push(track);
        }
      }
      updatedPlaylists[playlistId] = updateServicePlaylist(playlistId, { tracks: setTrackIndexes(tracksToKeep) });
    }
    updatedPlaylists.search = updateServicePlaylist("search", { tracks: setTrackIndexes(searchTracksToKeep) });

    updatePlaylists(updatedPlaylists);
    removeSelectedElements(elements, playlist);
    selectTrackElementAtIndex(firstSelectedTrackIndex);

    if (oneOfActive) {
      setPlaybackOrder(activePlaylistId);

      const activeTrack = getActiveTrack();

      if (activeTrack) {
        setPlaylistViewActiveTrack(activeTrack.index, activePlaylistId);
      }
    }
    hideSelection();
  }

  function removeSelectedTracks() {
    if (playlist.id === "search") {
      removeSearchTracks();
      return;
    }
    const elements = getSelectedElements();
    const indexes = getElementIndexes(elements);
    const firstSelectedTrackIndex = indexes[0];
    const tracksToKeep = [];

    for (const track of playlist.tracks) {
      if (!indexes.includes(track.index)) {
        tracksToKeep.push(track);
      }
    }
    updatePlaylist(playlist.id, { tracks: setTrackIndexes(tracksToKeep) });
    removeSelectedElements(elements, playlist);
    selectTrackElementAtIndex(firstSelectedTrackIndex);

    if (playlist.id === activePlaylistId) {
      setPlaybackOrder(playlist.id);

      const activeTrack = getActiveTrack();

      if (activeTrack) {
        setPlaylistViewActiveTrack(activeTrack.index, playlist.id);
      }
    }
    hideSelection();
  }

  if (!selection) {
    return null;
  }
  return (
    <Dropdown container={{ className: "js-selection-btn" }}>
      <button className="btn icon-text-btn dropdown-btn" onClick={enqueueSelectedTracks}>
        <Icon id="playlist-add"/>
        <span>Add to queue</span>
      </button>
      <button className="btn icon-text-btn dropdown-btn" onClick={removeSelectedTracks}>
        <Icon id="trash"/>
        <span>Remove selected</span>
      </button>
      <button className="btn icon-text-btn dropdown-btn" onClick={cancelSelection}>
        <Icon id="close"/>
        <span>Clear selection</span>
      </button>
    </Dropdown>
  );
}

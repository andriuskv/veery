import { useState, useEffect } from "react";
import { getRandomString } from "../../utils";
import { setTrackIndexes } from "services/playlist";
import { getSelectedElements, getElementIndexes, resetSelection, selectAllTracks, removeSelectedElements, selectTrackElementAtIndex } from "services/playlist-selection";
import { setPlaylistViewActiveTrack } from "services/playlist-view";
import { getActiveTrack, setPlaybackOrder } from "services/player";
import { usePlaylists } from "contexts/playlist";
import { usePlayer } from "contexts/player";
import { useQueue } from "contexts/queue";
import Icon from "components/Icon";
import Dropdown from "components/Dropdown";

export default function Selection({ playlist }) {
  const { updatePlaylist } = usePlaylists();
  const { activePlaylistId, activeTrack } = usePlayer();
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
    const indexes = getElementIndexes(elements);
    const items = [];

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

  function removeSelectedTracks() {
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
      {activeTrack ? (
        <button className="btn icon-text-btn dropdown-btn" onClick={enqueueSelectedTracks}>
          <Icon id="playlist-add"/>
          <span>Add to queue</span>
        </button>
      ) : null}
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

import { useState, useEffect, lazy, Suspense } from "react";
import { getSelectedElements, getElementIndexes, selectAllTracks, removeSelectedElements } from "services/playlist-selection";
import { createPlaylistView, setPlaylistViewActiveTrack } from "services/playlist-view";
import { getActiveTrack, updateActiveTrackIndex, setPlaybackOrder } from "services/player";
import { setTrackIndexes } from "services/playlist";
import { usePlaylists } from "contexts/playlist";
import { usePlayer } from "contexts/player";
import ViewModes from "components/ViewModes";
import Sort from "components/Sort";
import "./toolbar.css";
import Search from "./Search";

const Selection = lazy(() => import("./Selection"));

export default function Toolbar({ playlist, playlistRef, setMessage }) {
  const { updatePlaylist } = usePlaylists();
  const { activePlaylistId } = usePlayer();
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

  function removeSelectedTracks() {
    const elements = getSelectedElements();
    const indexes = getElementIndexes(elements);
    const tracksToKeep = [];

    for (const track of playlist.tracks) {
      if (!indexes.includes(track.index)) {
        tracksToKeep.push(track);
      }
    }
    updatePlaylist(playlist.id, { tracks: setTrackIndexes(tracksToKeep) });
    removeSelectedElements(elements, playlist);

    if (playlist.id === activePlaylistId) {
      setPlaybackOrder(playlist.id);

      const activeTrack = getActiveTrack();

      if (activeTrack) {
        setPlaylistViewActiveTrack(activeTrack.index, playlist.id);
      }
    }
    hideSelection();
  }

  function changeViewMode(viewMode) {
    playlist.viewMode = viewMode;

    updatePlaylist(playlist.id, { viewMode });
    createPlaylistView(playlistRef.current, playlist);
  }

  function updateSortedPlaylist({ sortBy, sortOrder }) {
    updateActiveTrackIndex(playlist.tracks, playlist.id);
    updatePlaylist(playlist.id, { sortBy, sortOrder });
  }

  return (
    <div className="playlist-toolbar">
      <ViewModes startViewMode={playlist.viewMode} changeViewMode={changeViewMode}/>
      {selection && (
        <Suspense fallback={null}>
          <Selection playlist={playlist} removeSelectedTracks={removeSelectedTracks} hide={hideSelection}/>
        </Suspense>
      )}
      <Search playlistId={playlist.id} setMessage={setMessage}/>
      <Sort playlist={playlist} playlistRef={playlistRef} updateSortedPlaylist={updateSortedPlaylist}/>
    </div>
  );
}

import { useState, useEffect, useLayoutEffect, useRef, useMemo } from "react";
import { createPlaylistView, cleanupPlaylistView } from "services/playlist-view";
import { getActiveTrack } from "services/player";
import { usePlaylists } from "contexts/playlist";
import { usePlayer } from "contexts/player";
import Icon from "components/Icon";
import ViewModes from "components/ViewModes";
import Sort from "components/Sort";
import Selection from "components/Selection";
import "./search.css";

export default function Search() {
  const { playlists, createPlaylist, updatePlaylist, removePlaylist } = usePlaylists();
  const { activePlaylistId, togglePlay, playAtIndex } = usePlayer();
  const [value, setValue] = useState("");
  const [tracks, setTracks] = useState([]);
  const [pending, setPending] = useState(false);
  const playlistRef = useRef(null);
  const timeoutId = useRef(0);
  const viewMode = useMemo(() => {
    const media = window.matchMedia("(max-width: 1024px)");
    return media.matches ? "grid": "compact";
  }, []);
  const playlist = playlists.search;
  const prefs = useRef(null);

  useEffect(() => {
    const searchTerm = localStorage.getItem("searchTerm") || "";
    prefs.current = JSON.parse(localStorage.getItem("search")) || null;

    if (searchTerm) {
      searchTracks(searchTerm);
      setValue(searchTerm);
    }

    return () => {
      removePlaylist("search");
      cleanupPlaylistView();
    };
  }, []);

  useLayoutEffect(() => {
    if (tracks.length) {
      const pl = playlist ? updatePlaylist("search", { tracks }) : createPlaylist({ id: "search", tracks, viewMode, ...prefs.current });

      createPlaylistView(playlistRef.current, pl);
    }
    else if (playlistRef.current) {
      playlistRef.current.innerHTML = null;
      cleanupPlaylistView();
      removePlaylist("search");
    }
  }, [tracks]);

  function handleInputChange({ target }) {
    setValue(target.value);
    setPending(true);
    clearTimeout(timeoutId.current);

    timeoutId.current = setTimeout(() => {
      if (target.value) {
        localStorage.setItem("searchTerm", target.value);
        searchTracks(target.value);
      }
      else {
        handleCleanup();
      }
    }, 400);
  }

  function updateSortedPlaylist({ sortBy, sortOrder }) {
    updatePlaylist("search", { sortBy, sortOrder });
  }

  function searchTracks(value) {
    let tracks = [];

    for (const playlist of Object.values(playlists)) {
      // Skip search playlist to prevent duplicate entries
      if (playlist.id === "search") {
        continue;
      }
      tracks = tracks.concat(playlist.tracks.map(track => {
        return {
          ...track,
          playlistId: playlist.id,
          playlistIndex: track.index
        };
      }));
    }
    const regex = new RegExp(`(${value})`, "i");
    const trackMatches = tracks.filter(track => {
      return regex.test(track.title) || regex.test(track.artist) || regex.test(track.album);
    }).map((track, index) => {
      return { ...track, index };
    });

    setTracks(trackMatches);
    setPending(false);
  }

  function handleCleanup() {
    clearTimeout(timeoutId.current);
    setValue("");
    setTracks([]);
    setPending(false);
    localStorage.removeItem("searchTerm");
  }

  function handleClick({ target, detail }) {
    const trackElement = target.closest(".track");

    if (!trackElement) {
      return;
    }

    if (detail === 2) {
      const track = playlist.tracks[trackElement.getAttribute("data-index")];

      playAtIndex(track.playlistIndex, track.playlistId);
    }
    else {
      const element = target.closest(".artwork-btn");

      if (!element) {
        return;
      }
      const track = playlist.tracks[trackElement.getAttribute("data-index")];
      const activeTrack = getActiveTrack();

      if (activeTrack && activePlaylistId === track.playlistId && track.playlistIndex === activeTrack.index) {
        togglePlay();
      }
      else {
        playAtIndex(track.playlistIndex, track.playlistId);
      }
    }
  }

  function renderSearchState() {
    if (value) {
      if (tracks.length) {
        return null;
      }
      else if (pending) {
        return <Icon id="spinner" className="search-playlist-spinner"/>;
      }
      return <p className="search-playlist-message">No matches found</p>;
    }
    else if (!tracks.length) {
      return <p className="search-playlist-message">Search for tracks across all playlists</p>;
    }
    return null;
  }

  if (!playlists) {
    return null;
  }
  return (
    <div className="search">
      <div className="search-top">
        <h2 className="search-title">Search</h2>
        <div className="search-form">
          <div className="search-form-input-container">
            <input type="text" className="input search-form-input" onChange={handleInputChange} value={value} placeholder="Enter search term"/>
            {value && (
              <button type="button" className="btn icon-btn search-form-input-clear-btn" onClick={handleCleanup} title="Clear">
                <Icon id="close" className="search-form-input-clear-btn-icon"/>
              </button>
            )}
          </div>
          <button className="btn icon-text-btn search-from-submit-btn">
            <Icon id="search"/>
            <span>Search</span>
          </button>
        </div>
      </div>
      <div className="search-playlist-container">
        {playlist ? (
          <div className="search-playlist-toolbar">
            <ViewModes playlist={playlist} playlistRef={playlistRef} updatePlaylist={updatePlaylist} hideMinimal={true}/>
            <Selection playlist={playlist} playlistRef={playlistRef}/>
            <Sort playlist={playlist} playlistRef={playlistRef} updateSortedPlaylist={updateSortedPlaylist}/>
          </div>
        ) : null}
        {renderSearchState()}
        <div className="playlist-view" ref={playlistRef} onClick={handleClick}></div>
      </div>
    </div>
  );
}

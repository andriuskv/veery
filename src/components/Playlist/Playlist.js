import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { createPlaylistView, cleanupPlaylistView, scrollActiveTrackIntoView } from "services/playlist-view";
import { isMobileSelectionEnabled } from "services/playlist-selection";
import { getActiveTrack } from "services/player";
import { usePlaylists } from "contexts/playlist";
import { usePlayer } from "contexts/player";
import "./playlist.css";
import Toolbar from "./Toolbar";

export default function Playlist() {
  const { id } = useParams();
  const { playlists, updatePlaylist } = usePlaylists();
  const { activePlaylistId, togglePlay, playAtIndex } = usePlayer();
  const [message, setMessage] = useState("");
  const rendered = useRef(false);
  const playlistRef = useRef(null);
  const playlist = playlists ? playlists[id] : null;

  useEffect(() => {
    return () => {
      rendered.current = false;

      setMessage("");
      cleanupPlaylistView();
    };
  }, [id]);

  useEffect(() => {
    if (!playlist || !playlistRef.current) {
      return;
    }

    if (!rendered.current) {
      const media = window.matchMedia("(max-width: 700px)");

      if (media.matches && playlist.viewMode !== "grid") {
        updatePlaylist(playlist.id, { viewMode: "grid" });
        return;
      }
      createPlaylistView(playlistRef.current, playlist);
      scrollActiveTrackIntoView(id);
      rendered.current = true;
    }
    else if (id === "local-files" && playlist.idle) {
      createPlaylistView(playlistRef.current, playlist);
    }
  }, [playlists, id]);

  function handleClick({ target, detail }) {
    const trackElement = target.closest(".track");

    if (!trackElement) {
      return;
    }

    if (detail === 2) {
      if (isMobileSelectionEnabled()) {
        return;
      }
      const index = Number(trackElement.getAttribute("data-index"));

      playAtIndex(index, id);
    }
    else {
      const element = target.closest(".artwork-btn");

      if (!element) {
        return;
      }
      const index = Number(trackElement.getAttribute("data-index"));
      const activeTrack = getActiveTrack();

      if (activeTrack && activePlaylistId === id && index === activeTrack.index) {
        togglePlay();
      }
      else {
        playAtIndex(index, id);
      }
    }
  }

  function renderMessage() {
    if (!playlist) {
      return <p className="playlist-message">Playlist not found</p>;
    }
    else if (!playlist.tracks.length) {
      return <p className="playlist-message">Playlist is empty</p>;
    }
    else if (message) {
      return <p className="playlist-message">{message}</p>;
    }
    return null;
  }

  if (!playlists) {
    return null;
  }
  return (
    <div className={`playlist${playlist?.tracks.length && !message ? "" : " empty"}`}>
      {playlist ? <Toolbar playlist={playlist} playlistRef={playlistRef} setMessage={setMessage}/> : null}
      <div className="playlist-view" ref={playlistRef} onClick={handleClick}></div>
      {renderMessage()}
    </div>
  );
}

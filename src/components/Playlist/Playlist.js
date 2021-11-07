import { useState, useEffect, useLayoutEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { reobserveTrack, createPlaylistView, cleanupPlaylistView, addTrackElements, scrollActiveTrackIntoView } from "services/playlist-view";
import { getActiveTrack } from "services/player";
import { usePlaylists } from "contexts/playlist";
import { usePlayer } from "contexts/player";
import "./playlist.css";
import Toolbar from "./Toolbar";

export default function Playlist() {
  const { id } = useParams();
  const { playlists, updatePlaylist } = usePlaylists();
  const { activePlaylistId, togglePlay, playAtIndex } = usePlayer();
  const [playlist, setPlaylist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const rendered = useRef(false);
  const playlistRef = useRef(null);

  useEffect(() => {
    return () => {
      rendered.current = false;

      setMessage("");
      cleanupPlaylistView();
    };
  }, [id]);

  useEffect(() => {
    if (!playlists) {
      return;
    }
    setLoading(false);
    setPlaylist(playlists[id]);
  }, [playlists, id]);

  useLayoutEffect(() => {
    if (playlist) {
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
      else if (!playlist.tracks.length) {
        cleanupPlaylistView();
      }
    }
  }, [playlist]);

  useEffect(() => {
    if (id === "local-files") {
      window.addEventListener("track", handleTrackUpdate);
    }
    else {
      window.addEventListener("youtube-tracks", handleYoutubeTrackUpdate);
    }
    return () => {
      window.removeEventListener("track", handleTrackUpdate);
      window.removeEventListener("youtube-tracks", handleYoutubeTrackUpdate);
    };
  }, [playlist]);

  function handleTrackUpdate({ detail: { track } }) {
    reobserveTrack(track, id);
  }

  function handleYoutubeTrackUpdate({ detail: { id: playlistId, tracks } }) {
    if (playlistId === id) {
      addTrackElements(tracks, playlistRef.current, playlist);
    }
  }

  function handleClick({ target, detail }) {
    const trackElement = target.closest(".track");

    if (!trackElement) {
      return;
    }

    if (detail === 2) {
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
    if (!playlist.tracks.length) {
      return <p className="playlist-message">Playlist is empty</p>;
    }
    else if (message) {
      return <p className="playlist-message">{message}</p>;
    }
    return null;
  }

  if (!playlists || loading) {
    return null;
  }
  else if (!playlist) {
    return (
      <div className="playlist empty">
        <p className="playlist-message">Playlist not found</p>
      </div>
    );
  }
  return (
    <div className={`playlist${playlist.tracks.length && !message ? "" : " empty"}`}>
      <Toolbar playlist={playlist} playlistRef={playlistRef} setMessage={setMessage}/>
      <div className="playlist-view" ref={playlistRef} onClick={handleClick}></div>
      {renderMessage()}
    </div>
  );
}

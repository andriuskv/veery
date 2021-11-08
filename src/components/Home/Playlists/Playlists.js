import { useState } from "react";
import { useLocation, Link } from "react-router-dom";
import { dispatchCustomEvent } from "../../../utils.js";
import { getPlaylistById, getPlaylistState, setTrackIndexes } from "services/playlist";
import { setPlaylistViewActiveTrack } from "services/playlist-view";
import { setPlaybackOrder } from "services/player";
import { usePlaylists } from "contexts/playlist";
import { usePlayer } from "contexts/player";
import Icon from "components/Icon";
import Dropdown from "components/Dropdown";
import "./playlists.css";

export default function Playlists({ youtube, setYoutube }) {
  const location = useLocation();
  const { playlists, removePlaylist, updatePlaylist } = usePlaylists();
  const { activePlaylistId, activeTrack, paused, trackLoading, togglePlay, playPlaylist } = usePlayer();
  const [playlistTitle, setPlaylistTitle] = useState(null);

  function togglePlaylistSync({ target }, id) {
    updatePlaylist(id, { sync: target.checked });
  }

  async function syncPlaylist(id) {
    const { initGoogleAPI, fetchPlaylistItems } = await import("services/youtube");
    let user = youtube.user;

    dispatchCustomEvent("update-indicator-status", { id, visible: true });
    setYoutube({ ...youtube, playlistId: id, fetching: true });

    if (!user) {
      user = await initGoogleAPI();

      if (location.pathname === "/") {
        setYoutube({ ...youtube, user, playlistId: id, fetching: true });
      }
    }
    const tracks = await fetchPlaylistItems(id, "sync");

    updatePlaylist(id, { tracks: setTrackIndexes(tracks) });
    dispatchCustomEvent("tracks", { id, type: "replace" });

    if (id === activePlaylistId) {
      setPlaybackOrder(id);

      if (activeTrack) {
        setPlaylistViewActiveTrack(activeTrack.index, id);
      }
    }

    if (location.pathname === "/") {
      setYoutube({ ...youtube, user });
    }
    dispatchCustomEvent("update-indicator-status", { id, visible: false });
  }

  function changeTitle(event, id) {
    const { title } = getPlaylistById(id);
    const newTitle = event.target.value;

    if (newTitle && newTitle !== title) {
      updatePlaylist(id, { title: newTitle });
    }
    setPlaylistTitle(null);
  }

  function blurTitleInput(event) {
    if (event.key === "Enter") {
      event.target.blur();
    }
  }

  function enableTitleChange(id, title) {
    setPlaylistTitle({ id, title });
  }

  function handlePlayButtonClick(id) {
    if (activePlaylistId === id) {
      togglePlay();
    }
    else {
      playPlaylist(id);
    }
  }

  function renderPlaylistThumbnail(id) {
    const { thumbnail } = getPlaylistState(id);

    return (
      <div className="playlist-entry-thumbnail-container">
        <Link to={`/playlist/${id}`} className={`playlist-entry-thumbnail t-${thumbnail.length}`}>
          {thumbnail.map(url => (
            <div className="playlist-entry-thumbnail-image-container" key={url}>
              <img src={url} className="artwork" alt=""/>
            </div>
          ))}
        </Link>
        {renderPlayButton(id)}
      </div>
    );
  }

  function renderPlayButton(id) {
    let state = {
      iconId: "play-circle",
      title: "Play"
    };

    if (activePlaylistId === id && !paused) {
      state = {
        iconId: "pause-circle",
        title: "Pause"
      };
    }

    return (
      <button className="btn icon-btn playlist-entry-play-btn" title={state.title} onClick={() => handlePlayButtonClick(id)}>
        <Icon id={state.iconId} className="playlist-entry-play-btn-icon"/>
        {activePlaylistId === id && trackLoading && <Icon id="spinner" className="play-pause-btn-spinner"/>}
      </button>
    );
  }

  if (!playlists) {
    return null;
  }
  return (
    Object.values(playlists).map(playlist => (
      <div className="playlist-entry" key={playlist.id}>
        {renderPlaylistThumbnail(playlist.id)}
        <div className="playlist-entry-content">
          {playlistTitle?.id === playlist.id ? (
            <input type="text" className="input playlist-entry-title-input" defaultValue={playlist.title}
              onBlur={event => changeTitle(event, playlist.id)}
              onKeyPress={blurTitleInput} autoFocus/>
          ) : (
            <h3 className="playlist-entry-title">{playlist.title}</h3>
          )}
          <div className="playlist-entry-bottom">
            {playlist.isPrivate ? (
              <span className="playlist-entry-bottom-item">
                <Icon id="lock" className="playlist-entry-bottom-icon" title={`Private to ${playlist.user.name}`}/>
              </span>
            ) : null}
            <span className="playlist-entry-bottom-item">{playlist.tracks.length} track{playlist.tracks.length === 1 ? "" : "s"}</span>
            <span className="playlist-entry-bottom-item">{getPlaylistState(playlist.id).duration}</span>
            <Dropdown
              container={{ className: "playlist-entry-dropdown-container" }}>
              <button className="btn icon-text-btn dropdown-btn" onClick={() => enableTitleChange(playlist.id, playlist.title)}>
                <Icon id="edit" className="dropdown-btn-icon"/>
                <span>Change Title</span>
              </button>
              {playlist.url ? (
                <>
                  <button className="btn icon-text-btn dropdown-btn" onClick={() => syncPlaylist(playlist.id)}
                    disabled={youtube.playlistId === playlist.id}>
                    <Icon id="sync" className="dropdown-btn-icon"/>
                    <span>Sync</span>
                  </button>
                  <a href={playlist.url} className="btn icon-text-btn dropdown-btn" target="_blank" rel="noreferrer">
                    <Icon id="link" className="dropdown-btn-icon"/>
                    <span>Open on YouTube</span>
                  </a>
                  <label className="checkbox-container playlist-entry-dropdown-setting">
                    <input type="checkbox" className="sr-only checkbox-input"
                      checked={playlist.sync}
                      onChange={event => togglePlaylistSync(event, playlist.id)}/>
                    <div className="checkbox">
                      <div className="checkbox-tick"></div>
                    </div>
                    <span className="checkbox-label">Sync on load</span>
                  </label>
                </>
              ) : null}
              <button className="btn icon-text-btn dropdown-btn" onClick={() => removePlaylist(playlist.id)}>
                <Icon id="trash" className="dropdown-btn-icon"/>
                <span>Remove</span>
              </button>
            </Dropdown>
          </div>
        </div>
      </div>
    ))
  );
}

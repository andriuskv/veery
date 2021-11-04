import { useState, useEffect, useRef } from "react";
import { usePlayer } from "contexts/player";
import { useQueue } from "contexts/queue";
import { getSetting } from "services/settings";
import * as queueService from "services/queue";
import * as playerService from "services/player";
import { getArtwork } from "services/artwork";
import { getPlayPauseButtonIcon } from "services/playlist-view";
import Icon from "components/Icon";
import "./queue.css";

export default function Queue({ nowPlayingVisible, youtubePlayerMaximized, toggleQueue }) {
  const { queue, dequeueTrack, resetQueue } = useQueue();
  const { paused, activeTrack, trackLoading, activePlaylistId, togglePlay, playAtIndex, playQueueTrack } = usePlayer();
  const [tracks, setTracks] = useState([]);
  const updated = useRef(false);

  useEffect(() => {
    updated.current = false;
  }, [activeTrack]);

  useEffect(() => {
    if (updated.current) {
      return;
    }
    updated.current = true;

    if (!activeTrack) {
      setTracks([]);
      return;
    }
    const mode = getSetting("repeat");

    if (mode === "repeat-one") {
      setTracks([activeTrack]);
    }
    else {
      const tracks = [];
      const playbackOrder = playerService.getPlaybackOrder();
      const start = queueService.getQueueStart();
      const playlistId = start ? start.playlistId : activePlaylistId;
      const excludes = playerService.getExcludedPlaybackItems();
      let playbackIndex = playerService.getPlaybackIndex();
      let i = 0;

      while (tracks.length < 10 && playbackIndex < playbackOrder.length) {
        i += 1;

        if (mode === "repeat-off") {
          if (playbackIndex === playbackOrder.length - 1) {
            break;
          }
          else {
            playbackIndex += 1;

            const track = playerService.getNextTrack(i, playlistId);

            if (!excludes.includes(track.index)) {
              tracks.push(track);
            }
          }
        }
        else if (mode === "repeat-all") {
          const track = playerService.getNextTrack(i, playlistId, true);

          if (!track) {
            break;
          }
          else if (track.id === activeTrack.id) {
            if (playbackOrder.length === 1) {
              setTracks([activeTrack]);
              return;
            }
            else {
              break;
            }
          }
          else if (!excludes.includes(track.index)) {
            tracks.push(track);
          }
        }
      }
      setTracks(tracks);
    }
  }, [activeTrack, tracks]);

  function playPlaylistTrack(track) {
    const start = queueService.getQueueStart();
    const playlistId = start ? start.playlistId : activePlaylistId;

    playAtIndex(track.index, playlistId);
  }

  function removeTrackFromPlayback(index) {
    const trackIndex = tracks.findIndex(track => track.index === index);

    tracks.splice(trackIndex, 1);
    setTracks([...tracks]);
    playerService.removeTrackFromPlayback(index);
    updated.current = false;
  }

  function renderTrack(track, id, playButton, removeButton = null) {
    return (
      <div className="track queue-track" key={id}>
        <div className="artwork-container">
          <img src={getArtwork(track.artworkId).small.url} className="artwork" alt=""/>
          {playButton}
        </div>
        <div className="track-info">
          <div className={`track-info-item track-title${track.artist ? "" : " multiline"}`}>{track.title}</div>
          {track.artist ? <div className="track-info-item">{track.artist}</div> : null}
          <div className="track-info-item-duration">{track.duration}</div>
        </div>
        {removeButton}
      </div>
    );
  }

  function renderNowPlayingTrack() {
    const { title, id } = getPlayPauseButtonIcon(paused);
    const playButton = (
      <button className="btn icon-btn artwork-btn" onClick={() => togglePlay(activeTrack)} title={title}>
        <Icon id={id} className="artwork-btn-icon"/>
        {trackLoading && <Icon id="spinner" className="play-pause-btn-spinner"/>}
      </button>
    );
    return renderTrack(activeTrack, activeTrack.id, playButton);
  }

  function renderQueueTrack(index, { id, playlistId, track }) {
    const playButton = (
      <button className="btn icon-btn artwork-btn" onClick={() => playQueueTrack(index, playlistId)} title="Play">
        <Icon id="play-circle" className="artwork-btn-icon"/>
      </button>
    );
    const removeButton = (
      <button className="btn icon-btn queue-item-remove-btn" onClick={() => dequeueTrack(index)} title="Remove">
        <Icon id="trash"/>
      </button>
    );

    return renderTrack(track, id, playButton, removeButton);
  }

  function renderPlaylistTrack(track) {
    const playButton = (
      <button className="btn icon-btn artwork-btn" onClick={() => playPlaylistTrack(track)} title="Play">
        <Icon id="play-circle" className="artwork-btn-icon"/>
      </button>
    );
    const removeButton = (
      <button className="btn icon-btn queue-item-remove-btn" onClick={() => removeTrackFromPlayback(track.index)} title="Remove">
        <Icon id="trash"/>
      </button>
    );

    return renderTrack(track, track.id, playButton, removeButton);
  }

  function renderNextInQueue() {
    return (
      <div className="queue-section">
        <div className="queue-section-top">
          <h4>Next In Queue</h4>
          <button className="btn queue-clear-btn" onClick={resetQueue}>Clear</button>
        </div>
        {queue.slice(0, 10).map((item, index) => renderQueueTrack(index, item))}
      </div>
    );
  }

  function renderNextInPlaylist() {
    return (
      <div className="queue-section">
        <div className="queue-section-top">
          <h4>Next In Playlist</h4>
        </div>
        {tracks.map(renderPlaylistTrack)}
      </div>
    );
  }

  return (
    <div className={`queue${nowPlayingVisible ? " transparent" : ""}${youtubePlayerMaximized ? " maximized" : ""}`}>
      <div className="queue-top">
        <h3 className="queue-title">Queue</h3>
        <button className="btn icon-btn" onClick={toggleQueue}>
          <Icon id="close"/>
        </button>
      </div>
      <div className="queue-middle">
        <div className="queue-section">
          <div className="queue-section-top">
            <h4>Now Playing</h4>
          </div>
          {renderNowPlayingTrack()}
        </div>
        {queue.length ? renderNextInQueue() : null}
        {tracks.length ? renderNextInPlaylist() : null}
      </div>
    </div>
  );
}

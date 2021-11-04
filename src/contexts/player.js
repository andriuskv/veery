import { createContext, useContext, useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { dispatchCustomEvent } from "../utils.js";
import { usePlaylists } from "contexts/playlist";
import { useQueue } from "contexts/queue";
import { getSetting } from "services/settings";
import * as savedTrackService from "services/savedTrack";
import * as playerService from "services/player";
import * as playlistService from "services/playlist";
import { togglePlayPauseBtns, showTrackElementSpinner, hideTrackElementSpinner } from "services/playlist-view";

const PlayerContext = createContext();

function PlayerProvider({ children }) {
  const location = useLocation();
  const { playlists } = usePlaylists();
  const { getNextQueueItem, getQueueItemAtIndex, resetQueue } = useQueue();
  const [activePlaylistId, setActivePlaylistId] = useState("");
  const [activeTrack, setActiveTrack] = useState(null);
  const [paused, setPaused] = useState(true);
  const [trackLoading, setTrackLoading] = useState(false);
  const initialized = useRef(false);

  useEffect(() => {
    window.addEventListener("player-state", handlePlayerState);
    window.addEventListener("reset-player", handlePlayerReset);

    return () => {
      window.removeEventListener("player-state", handlePlayerState);
      window.removeEventListener("reset-player", handlePlayerReset);
    };
  }, []);

  useEffect(() => {
    if (!playlists) {
      return;
    }

    if (paused) {
      const playlistId = location.pathname.split("/playlist/")[1];

      if (playlistId) {
        const playlist = playlistService.getPlaylistById(playlistId);

        if (playlist) {
          document.title = `${playlist.title} | Veery`;
        }
        else {
          document.title = "404 | Veery";
        }
      }
      else if (location.pathname === "/") {
        document.title = "Home | Veery";
      }
      else if (location.pathname.startsWith("/search")) {
        document.title = "Search | Veery";
      }
      else {
        document.title = "404 | Veery";
      }
    }
    else {
      const { title, artist } = activeTrack;
      document.title = `${artist && title ? `${artist} - ${title}` : title} | Veery`;
    }
  }, [playlists, paused, activeTrack, location]);

  useEffect(() => {
    window.addEventListener("track-start", handleTrackStart);
    window.addEventListener("track-end", handleTrackEnd);

    return () => {
      window.removeEventListener("track-start", handleTrackStart);
      window.removeEventListener("track-end", handleTrackEnd);
    };
  }, [activePlaylistId]);

  useEffect(() => {
    if (!activeTrack) {
      return;
    }
    navigator.mediaSession.setActionHandler("play", togglePlay);
    navigator.mediaSession.setActionHandler("pause", togglePlay);
    navigator.mediaSession.setActionHandler("previoustrack", playPrevious);
    navigator.mediaSession.setActionHandler("nexttrack", playNext);
    navigator.mediaSession.setActionHandler("seekforward", handleSeek);
    navigator.mediaSession.setActionHandler("seekbackward", handleSeek);
    navigator.mediaSession.setActionHandler("seekto", handleSeekTo);

    return () => {
      navigator.mediaSession.setActionHandler("play", null);
      navigator.mediaSession.setActionHandler("pause", null);
      navigator.mediaSession.setActionHandler("previoustrack", null);
      navigator.mediaSession.setActionHandler("nexttrack", null);
      navigator.mediaSession.setActionHandler("seekforward", null);
      navigator.mediaSession.setActionHandler("seekbackward", null);
      navigator.mediaSession.setActionHandler("seekto", null);
    };
  }, [paused, activeTrack]);

  useEffect(() => {
    if (!playlists || initialized.current) {
      return;
    }
    init();
  }, [playlists]);

  function init() {
    initialized.current = true;

    const savedTrack = savedTrackService.getTrack();

    if (!savedTrack) {
      return;
    }
    const { playlistId, trackId, currentTime } = savedTrack;
    const playlist = playlistService.getPlaylistById(playlistId);

    if (playlist) {
      const track = playlist.tracks.find(track => trackId === track.id);

      if (track) {
        setActiveTrack(track);
        setActivePlaylist(playlistId);
        playerService.setPlaybackOrder(playlistId, track.index);
        playerService.startTrack(track, playlistId, { currentTime, willPlay: false });
        return;
      }
    }
    savedTrackService.removeTrack();
  }

  function handlePlayerState({ detail: { loading, paused } }) {
    if (typeof paused === "boolean") {
      updatePlayerState(paused);
    }
    setTrackLoading(loading);

    if (loading) {
      showTrackElementSpinner();
    }
    else {
      hideTrackElementSpinner();
    }
  }

  function handleTrackStart({ detail: { track, playlistId } }) {
    setActiveTrack(track);

    if (playlistId !== activePlaylistId) {
      setActivePlaylist(playlistId);
    }
    setTrackLoading(true);
    updatePlayerState(false);
  }

  function handleTrackEnd() {
    const mode = getSetting("repeat");

    if (mode === "repeat-off" && playerService.isLastTrackInPlayback()) {
      playerService.stopPlayer();
    }
    else if (mode === "repeat-one") {
      playerService.repeatPlay();
    }
    else {
      const item = getNextQueueItem();
      playerService.playNext(item);
    }
  }

  function handlePlayerReset() {
    setActivePlaylistId("");
    setActiveTrack(null);
    setPaused(true);
  }

  function setActivePlaylist(id) {
    setActivePlaylistId(id);
    playerService.setActivePlaylistId(id);
  }

  function updatePlayerState(paused) {
    setPaused(paused);
    playerService.setPlayerState(paused);
    togglePlayPauseBtns(paused);
  }

  function togglePlayerState() {
    updatePlayerState(!paused);
  }

  function togglePlay() {
    playerService.togglePlay();
    togglePlayerState();
  }

  function playPrevious() {
    if (!activePlaylistId) {
      return;
    }

    if (playerService.canPlay(activePlaylistId)) {
      playerService.playPrevious({ scrollToTrack: true });
    }
    else {
      playerService.stopPlayer();
    }
  }

  function playNext() {
    if (!activePlaylistId) {
      return;
    }

    if (playerService.canPlay(activePlaylistId)) {
      const item = getNextQueueItem();
      playerService.playNext(item, { scrollToTrack: true });
    }
    else {
      playerService.stopPlayer();
    }
  }

  function playAtIndex(index, playlistId) {
    playerService.playAtIndex(index, playlistId);
    resetQueue();
  }

  function playPlaylist(playlistId, params) {
    if (playerService.canPlay(playlistId)) {
      playerService.playPlaylist(playlistId, params);
      resetQueue();
    }
  }

  function playQueueTrack(index, playlistId) {
    const track = getQueueItemAtIndex(index);

    playerService.playQueueTrack(track, playlistId);
  }

  function handleSeek({ action }) {
    let { currentTime } = savedTrackService.getTrack();

    if (action === "seekforward") {
      currentTime += 5;
    }
    else if (action === "seekbackward") {
      currentTime -= 5;
    }
    playerService.seekTo(currentTime);
    dispatchCustomEvent("current-time-update", currentTime);
  }

  function handleSeekTo({ seekTime }) {
    const currentTime = Math.round(seekTime);

    playerService.seekTo(currentTime);
    dispatchCustomEvent("current-time-update", currentTime);
  }

  return <PlayerContext.Provider value={{ paused, activePlaylistId, activeTrack, trackLoading, togglePlay, playPrevious, playNext, playAtIndex, playPlaylist, playQueueTrack }}>{children}</PlayerContext.Provider>;
}

function usePlayer() {
  return useContext(PlayerContext);
}

export {
  PlayerProvider,
  usePlayer
};

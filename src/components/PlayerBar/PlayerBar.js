import { useState, useEffect, useRef } from "react";
import { getSetting, setSetting } from "services/settings";
import * as playerService from "services/player";
import { getVisiblePlaylistId } from "services/playlist-view";
import { usePlayer } from "contexts/player";
import Icon from "components/Icon";
import "./player-bar.css";
import NowPlaying from "./NowPlaying";
import SeekSlider from "./SeekSlider";
import VolumeSlider from "./VolumeSlider";

export default function PlayerBar({ nowPlayingVisible, queueVisible, youtubePlayer, toggleNowPlaying, toggleQueue, toggleYoutubePlayer, showIndicator }) {
  const { paused, activePlaylistId, activeTrack, trackLoading, togglePlay, playPrevious, playNext, playPlaylist } = usePlayer();
  const [shuffled, setShuffled] = useState(() => getSetting("shuffle"));
  const [repeat, setRepeat] = useState(() => getRepeatState(getSetting("repeat")));
  const [volumeVisible, setVolumeVisible] = useState(false);
  const [settingLabel, setSettingLabel] = useState(null);

  const labelTimeoutId = useRef(0);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyboardShortcuts);

    return () => {
      window.removeEventListener("keydown", handleKeyboardShortcuts);
    };
  }, [paused, activePlaylistId]);

  function handleKeyboardShortcuts(event) {
    const { target, key } = event;

    if ((target instanceof HTMLInputElement && target.type === "text")) {
      return;
    }
    const modifierKeyPressed = event.ctrlKey || event.shiftKey || event.altKey || event.metaKey;

    if (modifierKeyPressed) {
      return;
    }

    if (key === "p") {
      handleTrackPlay(true);
    }
    else if (key === "[") {
      if (activePlaylistId) {
        playNext();
        showIndicator({ iconId: "next" });
      }
    }
    else if (key === "o") {
      if (activePlaylistId) {
        playPrevious();
        showIndicator({ iconId: "previous" });
      }
    }
  }

  function handleTrackPlay(shouldIndicate = false) {
    if (activePlaylistId) {
      togglePlay();

      if (shouldIndicate) {
        showIndicator({ iconId: paused ? "play" : "pause" });
      }
      return;
    }
    const id = getVisiblePlaylistId();

    playPlaylist(id, { scrollToTrack: true });
  }

  function showSettingLabel(label) {
    setSettingLabel(label);
    clearTimeout(labelTimeoutId.current);
    labelTimeoutId.current = setTimeout(() => {
      setSettingLabel(null);
    }, 1000);
  }

  function handleShuffle() {
    setShuffled(!shuffled);
    playerService.flagPlaybackOrderForUpdate();
    setSetting("shuffle",!shuffled);

    showSettingLabel({
      type: "shuffle",
      text: shuffled ? "No shuffle" : "Shuffle"
    });
  }

  function getRepeatState(mode) {
    const modes = {
      "repeat-off": {
        title: "Repeat",
        iconId: "repeat"
      },
      "repeat-all": {
        title: "Repeat one",
        iconId: "repeat",
        active: true
      },
      "repeat-one": {
        title: "No repeat",
        iconId: "repeat-one",
        active: true
      }
    };

    return modes[mode];
  }

  function handleRepeat() {
    const currentMode = getSetting("repeat");
    const modes = {
      "repeat-off": "repeat-all",
      "repeat-all": "repeat-one",
      "repeat-one": "repeat-off"
    };
    const nextMode = modes[currentMode];
    const nextState = getRepeatState(nextMode);
    const currentState = getRepeatState(currentMode);

    setRepeat(nextState);
    setSetting("repeat", nextMode);
    showSettingLabel({
      type: "repeat",
      text: currentState.title
    });
  }

  function toggleVolume() {
    setVolumeVisible(!volumeVisible);
  }

  function renderYoutubePlayerButton() {
    return (
      <button className={`btn icon-btn player-bar-tertiary-btn${youtubePlayer.mode !== "off" ? " active" : ""}`}
        onClick={toggleYoutubePlayer} title={youtubePlayer.title}>
        <Icon id={youtubePlayer.iconId} className="player-bar-tertiary-btn-icon"/>
      </button>
    );
  }

  return (
    <div className={`player-bar${nowPlayingVisible ? " transparent" : ""}${youtubePlayer.mode === "maximized" ? " youtube-player-maximized" : ""}${queueVisible ? " queue-visible" : ""}`}>
      <NowPlaying visible={nowPlayingVisible} toggleNowPlaying={toggleNowPlaying} youtubePlayerMaximized={youtubePlayer.mode === "maximized"}/>
      <SeekSlider showIndicator={showIndicator}/>
      <div className="player-bar-middle">
        <div className="player-bar-shuffle-container">
          {settingLabel?.type === "shuffle" && (
            <div className="player-bar-setting-label">{settingLabel.text}</div>
          )}
          <button className={`btn icon-btn player-bar-tertiary-btn${shuffled ? " active" : ""}`}
            onClick={handleShuffle} aria-label={shuffled ? "No shuffle" : "Shuffle"}>
            <Icon id="shuffle" className="player-bar-tertiary-btn-icon"/>
          </button>
        </div>
        <button className="btn icon-btn player-bar-secondary-btn" onClick={playPrevious} aria-label="Previous">
          <Icon id="previous" className="player-bar-secondary-btn-icon"/>
        </button>
        <button className="btn icon-btn player-bar-play-pause-btn" onClick={() => handleTrackPlay()} aria-label={paused ? "Play" : "Pause"}>
          <Icon id={paused ? "play-circle" : "pause-circle"} className="player-bar-play-pause-btn-icon"/>
          {trackLoading && <Icon id="spinner" className="play-pause-btn-spinner"/>}
        </button>
        <button className="btn icon-btn player-bar-secondary-btn" onClick={playNext} aria-label="Next">
          <Icon id="next" className="player-bar-secondary-btn-icon"/>
        </button>
        <div className="player-bar-repeat-container">
          {settingLabel?.type === "repeat" && (
            <div className="player-bar-setting-label">{settingLabel.text}</div>
          )}
          <button className={`btn icon-btn player-bar-tertiary-btn${repeat.active ? " active" : ""}`}
            onClick={handleRepeat} aria-label={repeat.title}>
            <Icon id={repeat.iconId} className="player-bar-tertiary-btn-icon"/>
          </button>
        </div>
      </div>
      <div className={`player-bar-right-controls${volumeVisible ? " visible" : ""}`}>
        {nowPlayingVisible && activeTrack?.player === "youtube" ? renderYoutubePlayerButton() : null}
        {activeTrack ? (
          <button className={`btn icon-btn player-bar-tertiary-btn${queueVisible ? " active" : ""}`}
            onClick={toggleQueue} title="Queue">
            <Icon id="queue" className="player-bar-tertiary-btn-icon"/>
          </button>
        ) : null}
        <VolumeSlider visible={volumeVisible} showIndicator={showIndicator}/>
      </div>
      <button className={`btn icon-btn player-bar-tertiary-btn player-bar-volume-toggle-btn${volumeVisible ? " active" : ""}`}
        onClick={toggleVolume} title="Volume">
        <Icon id="volume" className="player-bar-tertiary-btn-icon"/>
      </button>
    </div>
  );
}

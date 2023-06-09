import { useState, useEffect, useRef } from "react";
import { getSetting, setSetting, removeSetting } from "services/settings";
import * as playerService from "services/player";
import Icon from "components/Icon";
import "./volume-slider.css";
import Slider from "../Slider";

export default function VolumeSlider({ visible, showIndicator }) {
  const [mute, setMute] = useState(() => getSetting("mute"));
  const [volume, setVolume] = useState(() => getSetting("volume"));
  const [pointerIsDown, setPointerIsDown] = useState(false);
  const updating = useRef(false);
  const slider = useRef(null);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyboardShortcuts);

    return () => {
      window.removeEventListener("keydown", handleKeyboardShortcuts);
    };
  }, [mute, volume]);

  useEffect(() => {
    if (pointerIsDown) {
      window.addEventListener("pointermove", handlePointerMove);
      window.addEventListener("pointerup", handlePointerUp);
    }
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [mute, pointerIsDown]);

  function handleKeyboardShortcuts(event) {
    const modifierKeyPressed = event.ctrlKey || event.shiftKey || event.altKey || event.metaKey;
    const { target, key } = event;

    if ((target instanceof HTMLInputElement && target.type === "text")) {
      return;
    }

    if (event.shiftKey && (key === "ArrowUp" || key === "ArrowDown")) {
      updateVolumeOnKeyDown(key);
    }
    else if (!modifierKeyPressed && key === "m") {
      toggleMute(!mute, true);
    }
  }

  function updateVolume(volume) {
    setSetting("volume", volume);
    setVolume(volume);
    playerService.setVolume(volume);
  }

  function toggleMute(mute, indicate = false) {
    let volume = 0;

    setMute(mute);
    setSetting("mute", mute);

    if (mute) {
      if (indicate) {
        showIndicator({ iconId: "volume-off", text: "0%" });
      }
      setSetting("volume-before-mute", getSetting("volume"));
    }
    else {
      volume = getSetting("volume-before-mute");

      if (indicate) {
        showIndicator({ iconId: "volume", text: `${Math.round(volume * 100)}%` });
      }
      removeSetting("volume-before-mute");
    }
    updateVolume(volume);
  }

  function updateVolumeOnKeyDown(key) {
    let newVolume = volume;

    if (newVolume < 1 && key === "ArrowRight" || key === "ArrowUp") {
      if (!newVolume) {
        setMute(false);
        setSetting("mute", false);
        removeSetting("volume-before-mute");
      }
      newVolume += 0.05;

      if (newVolume > 1) {
        newVolume = 1;
      }
    }
    else if (newVolume && "ArrowLeft" || key === "ArrowDown") {
      newVolume -= 0.05;

      if (parseFloat(newVolume.toFixed(2)) <= 0) {
        toggleMute(true, true);
        return;
      }
    }
    updateVolume(newVolume);
    showIndicator({ iconId: "volume", text: `${Math.round(newVolume * 100)}%` });
  }

  function handleMute() {
    toggleMute(!mute);
  }

  function handlePointerDown(event) {
    if (event.button !== 0) {
      return;
    }
    setPointerIsDown(true);
    handlePointerMove(event);
  }

  function handlePointerMove({ pageX }) {
    if (updating.current) {
      return;
    }
    updating.current = true;

    requestAnimationFrame(() => {
      const { left, width } = slider.current.getBoundingClientRect();
      let volume = (pageX - left) / width;

      if (volume <= 0) {
        volume = 0;

        if (!mute) {
          toggleMute(true);
        }
      }
      else if (mute) {
        toggleMute(false);
      }
      else {
        if (volume > 1) {
          volume = 1;
        }
        updateVolume(volume);
      }
      updating.current = false;
    });
  }

  function handlePointerUp() {
    setPointerIsDown(false);
  }

  function handleKeyDown({ shiftKey, key }) {
    if (!shiftKey && key.startsWith("Arrow")) {
      updateVolumeOnKeyDown(key);
    }
  }

  return (
    <div className={`player-bar-volume-controls${visible ? " visible" : ""}`}>
      <button className={`btn icon-btn player-bar-tertiary-btn${mute ? " active" : ""}`}
        onClick={handleMute} title={mute ? "Unmute" : "Mute"}>
        <Icon id={mute ? "volume-off" : "volume"} className="player-bar-tertiary-btn-icon"/>
      </button>
      <Slider element={slider} className="player-bar-volume-bar-container" progress={volume * 100}
        pointerDownHandler={handlePointerDown} keyDownHandler={handleKeyDown}
        min="0" now={volume} max="1" nowText={`${Math.round(volume * 100)}%`} labelText="Volume slider"/>
    </div>
  );
}

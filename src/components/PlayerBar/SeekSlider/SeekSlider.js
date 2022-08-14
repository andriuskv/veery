import { useState, useEffect, useRef } from "react";
import { formatTime } from "../../../utils.js";
import * as savedTrackService from "services/savedTrack";
import { seekTo } from "services/player";
import { getQueueStart } from "services/queue";
import { usePlayer } from "contexts/player";
import "./seek-slider.css";
import Slider from "../Slider";

export default function SeekSlider({ showIndicator }) {
  const { activeTrack } = usePlayer();
  const [pointerIsDown, setPointerIsDown] = useState(false);
  const [{ formattedCurrentTime, currentTime, progress }, setProgress] = useState(() => ({
    currentTime: 0,
    formattedCurrentTime: "0:00",
    progress: 0
  }));
  const [label, setLabel] = useState(() => ({
    text: "0:00",
    progress: 0
  }));
  const updating = useRef(false);
  const slider = useRef(null);
  const first = useRef(true);

  useEffect(() => {
    if (!activeTrack) {
      return;
    }

    if (first.current) {
      first.current = false;
      const track = savedTrackService.getTrack();

      if (track) {
        setProgress({
          currentTime: track.currentTime,
          formattedCurrentTime: formatTime(track.currentTime),
          progress: track.currentTime / activeTrack.durationInSeconds * 100
        });
      }
    }
    return () => {
      setProgress({ currentTime: 0, formattedCurrentTime: "0:00", progress: 0 });
    };
  }, [activeTrack]);

  useEffect(() => {
    if (activeTrack) {
      window.addEventListener("keydown", handleKeyboardShortcuts);
    }
    return () => {
      window.removeEventListener("keydown", handleKeyboardShortcuts);
    };
  }, [currentTime, activeTrack]);

  useEffect(() => {
    if (activeTrack) {
      window.addEventListener("current-time-update", handleCurrentTimeChange);

      if (pointerIsDown) {
        window.addEventListener("pointermove", handlePointerMove);
        slider.current.removeEventListener("pointermove", handleLocalPointerMove);
        window.removeEventListener("current-time-update", handleCurrentTimeChange);
      }
      else {
        slider.current.addEventListener("pointermove", handleLocalPointerMove);
      }
    }
    return () => {
      if (slider.current) {
        slider.current.removeEventListener("pointermove", handleLocalPointerMove);
      }
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("current-time-update", handleCurrentTimeChange);
    };
  }, [pointerIsDown, activeTrack]);

  useEffect(() => {
    if (pointerIsDown) {
      window.addEventListener("pointerup", handlePointerUp);
    }
    return () => {
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [currentTime, pointerIsDown]);

  function handleKeyboardShortcuts(event) {
    const { target, key } = event;

    if ((target instanceof HTMLInputElement && target.type === "text")) {
      return;
    }

    if (event.shiftKey && (key === "ArrowRight" || key === "ArrowLeft") && target.getAttribute("role") !== "slider") {
      updateCurrentTimeOnKeyDown(key);
    }
  }

  function updateCurrentTimeOnKeyDown(key) {
    const duration = activeTrack.durationInSeconds;
    let newCurrentTime = currentTime;

    if (key === "ArrowRight" || key === "ArrowUp") {
      newCurrentTime += 5;

      if (newCurrentTime > duration) {
        newCurrentTime = duration;
      }
      showIndicator({ iconId: "fast-forward" });
    }
    else if (key === "ArrowLeft" || key === "ArrowDown") {
      newCurrentTime -= 5;

      if (newCurrentTime < 0) {
        newCurrentTime = 0;
      }
      showIndicator({ iconId: "rewind" });
    }
    setProgress({
      currentTime: newCurrentTime,
      formattedCurrentTime: formatTime(newCurrentTime),
      progress: newCurrentTime / activeTrack.durationInSeconds * 100
    });
    seekTo(newCurrentTime);
  }

  function handleCurrentTimeChange({ detail: currentTime }) {
    setProgress({
      currentTime,
      formattedCurrentTime: formatTime(currentTime),
      progress: currentTime / activeTrack.durationInSeconds * 100
    });
    navigator.mediaSession.setPositionState({
      duration: activeTrack.durationInSeconds,
      position: currentTime
    });

    if (activeTrack.player !== "native" && !getQueueStart()) {
      savedTrackService.updateTrack({ currentTime });
    }
  }

  function handlePointerDown(event) {
    if (!activeTrack || event.button !== 0) {
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
      let ratio = (pageX - left) / width;

      if (ratio < 0) {
        ratio = 0;
      }
      else if (ratio > 1) {
        ratio = 1;
      }
      const currentTime = Math.round(activeTrack.durationInSeconds * ratio);
      const progress = ratio * 100;

      setProgress({
        currentTime,
        formattedCurrentTime,
        progress
      });
      setLabel({
        text: formatTime(currentTime),
        progress
      });
      updating.current = false;
    });
  }

  function handleLocalPointerMove({ currentTarget, pageX }) {
    if (updating.current) {
      return;
    }
    updating.current = true;

    requestAnimationFrame(() => {
      const { left, width } = currentTarget.getBoundingClientRect();
      let ratio = (pageX - left) / width;

      if (ratio < 0) {
        ratio = 0;
      }
      else if (ratio > 1) {
        ratio = 1;
      }
      const currentTime = Math.round(activeTrack.durationInSeconds * ratio);

      setLabel({
        text: formatTime(currentTime),
        progress: ratio * 100
      });
      updating.current = false;
    });
  }

  function handlePointerUp() {
    setProgress({
      currentTime,
      formattedCurrentTime: formatTime(currentTime),
      progress
    });
    setPointerIsDown(false);
    seekTo(currentTime);
  }

  function handleKeyDown({ key }) {
    if (key.startsWith("Arrow")) {
      updateCurrentTimeOnKeyDown(key);
    }
  }

  if (activeTrack) {
    return (
      <div className="seek-slider-container">
        <div className="seek-slider-time" style={{ width: `${activeTrack.duration.length}ch`, textAlign: "right" }}>{formattedCurrentTime}</div>
        <Slider element={slider} progress={progress} label={label} key={activeTrack.id}
          pointerDownHandler={handlePointerDown} keyDownHandler={handleKeyDown}
          min="0" now={currentTime} max={activeTrack.durationInSeconds}
          nowText={`${formattedCurrentTime} / ${activeTrack.duration}`}
          labelText="Seek slider"/>
        <div className="seek-slider-time">{activeTrack.duration}</div>
      </div>
    );
  }
  return (
    <div className="seek-slider-container">
      <div className="seek-slider-time">0:00</div>
      <Slider inert={true}/>
      <div className="seek-slider-time">0:00</div>
    </div>
  );
}

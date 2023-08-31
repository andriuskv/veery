import { useLayoutEffect, useRef } from "react";
import { usePlayer } from "contexts/player";
import { getArtwork } from "services/artwork";
import "./now-playing.css";

export default function NowPlaying({ queueVisible, youtubePlayerVisible, showIndicator }) {
  const { paused, activeTrack, togglePlay } = usePlayer();
  const artworkRef = useRef(null);
  const isSameArtwork = useRef(false);
  const { isPlaceholder, small, original } = getArtwork(activeTrack.artworkId);

  useLayoutEffect(() => {
    const element = artworkRef.current;

    element.style.opacity = 0;
    element.style.transition = "none";

    if (isPlaceholder) {
      element.classList.remove("shadow");
      element.style.opacity = 1;
    }
    else if (isSameArtwork.current) {
      element.style.opacity = 1;
    }
    else {
      element.onload = function() {
        element.classList.add("shadow");
        element.style.transition = "0.2s opacity";
        element.style.opacity = 1;
      };
    }

    return () => {
      isSameArtwork.current = original.url === element.src;
      element.onload = null;
    };
  }, [activeTrack]);

  function handleArtworkClick() {
    togglePlay();

    if (!youtubePlayerVisible) {
      showIndicator({ iconId: paused ? "play" : "pause" });
    }
  }

  return (
    <div className={`now-playing${queueVisible ? " queue-visible" : ""}${isPlaceholder ? " placeholder" : ""}`}>
      <div className="now-playing-background" style={isPlaceholder ? {} : { "--background-url": `url(${small.url})` }}></div>
      <div className={`now-playing-artwork-container${youtubePlayerVisible ? " hidden" : ""}`}>
        <img src={original.url} className="now-playing-artwork" ref={artworkRef} onClick={handleArtworkClick} alt="" draggable="false"/>
      </div>
      <div className="now-playing-info">
        <div className="track-info-item track-title multiline">{activeTrack.title}</div>
        {activeTrack.artist ? <div className="track-info-item">{activeTrack.artist}</div> : null}
      </div>
    </div>
  );
}

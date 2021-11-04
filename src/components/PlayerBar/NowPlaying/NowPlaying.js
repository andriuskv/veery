import { useNavigate } from "react-router-dom";
import { getVisiblePlaylistId, scrollActiveTrackIntoView } from "services/playlist-view";
import { getArtwork } from "services/artwork";
import { usePlayer } from "contexts/player";
import Icon from "components/Icon";
import "./now-playing.css";

export default function NowPlaying({ visible, toggleNowPlaying, youtubePlayerMaximized }) {
  const navigate = useNavigate();
  const { activePlaylistId, activeTrack } = usePlayer();
  let artwork = "./assets/images/album-art-placeholder.png";
  let classNames = "";

  function jumpToTrack() {
    if (activePlaylistId === getVisiblePlaylistId()) {
      scrollActiveTrackIntoView(activePlaylistId);
    }
    else {
      navigate(`/playlist/${activePlaylistId}`);
    }

    if (visible) {
      toggleNowPlaying();
    }
  }

  function renderToggleButton() {
    return (
      <button className="btn icon-btn artwork-btn" onClick={toggleNowPlaying} title={visible ? "Hide" : "Expand"} key="a">
        <Icon id="menu-down" className={`artwork-btn-icon${visible ? "" : " rotated"}`}/>
      </button>
    );
  }

  if (visible && !youtubePlayerMaximized) {
    return (
      <div className="player-bar-now-playing">
        <div className="artwork-container player-bar-artwork-container">
          {renderToggleButton()}
        </div>
      </div>
    );
  }

  if (activeTrack) {
    const { isPlaceholder, small } = getArtwork(activeTrack.artworkId);
    artwork = small.url;
    classNames += " active";

    if (isPlaceholder) {
      classNames += " placeholder";
    }
  }
  return (
    <div className={`player-bar-now-playing${youtubePlayerMaximized ? " youtube-player-maximized" : ""}`}>
      <div className={`artwork-container player-bar-artwork-container${classNames}`}>
        <img src={artwork} className="artwork" alt=""/>
        {activeTrack ? renderToggleButton() : null}
      </div>
      {activeTrack ? (
        <div className="track-info">
          <div className="track-info-item track-title multiline" onClick={jumpToTrack}>{activeTrack.title}</div>
          {activeTrack.artist ? <div className="track-info-item">{activeTrack.artist}</div> : null}
        </div>
      ) : null}
    </div>
  );
}

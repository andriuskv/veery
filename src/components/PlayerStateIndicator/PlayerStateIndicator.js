import Icon from "components/Icon";
import "./player-state-indicator.css";

export default function PlayerStateIndicator({ indicator, nowPlayingVisible, youtubePlayerMaximized, queueVisible }) {
  let className = "";

  if (nowPlayingVisible) {
    className += " now-playing-visible";

    if (queueVisible) {
      className += " queue-visible";
    }

    if (youtubePlayerMaximized) {
      className += " youtube-player-maximized";
    }
  }

  return (
    <div className={`player-state-indicator${className}`}>
      {indicator.text && <div className="player-state-indicator-text">{indicator.text}</div>}
      <Icon id={indicator.iconId} className="player-state-indicator-icon"/>
    </div>
  );
}

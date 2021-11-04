import Icon from "components/Icon";
import "./player-state-indicator.css";

export default function PlayerStateIndicator({ indicator, nowPlayingVisible, shift }) {
  return (
    <div className={`player-state-indicator${nowPlayingVisible ? " now-playing-visible" : ""}${shift ? " shift-left" : ""}`}>
      {indicator.text && <div className="player-state-indicator-text">{indicator.text}</div>}
      <Icon id={indicator.iconId} className="player-state-indicator-icon"/>
    </div>
  );
}

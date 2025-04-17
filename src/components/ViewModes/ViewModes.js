import { createPlaylistView } from "services/playlist-view";
import Icon from "components/Icon";
import "./view-modes.css";

export default function ViewModes({ playlist, playlistRef, updatePlaylist, hideMinimal = false }) {
  function handleViewModeChange(event) {
    const viewMode = event.target.value;

    updatePlaylist(playlist.id, { viewMode });
    createPlaylistView(playlistRef.current, { ...playlist, viewMode });
  }

  return (
    <ul className="view-modes">
      {hideMinimal ? null : (
        <li className="view-mode-container">
          <label>
            <input type="radio" className="sr-only view-mode-radio-input" name="view-mode" value="minimal"
              checked={playlist.viewMode === "minimal"} onChange={handleViewModeChange}/>
            <Icon id="minimal" className="btn icon-btn view-mode-icon" title="Minimal"/>
          </label>
        </li>
      )}
      <li className="view-mode-container">
        <label>
          <input type="radio" className="sr-only view-mode-radio-input" name="view-mode" value="compact"
            checked={playlist.viewMode === "compact"} onChange={handleViewModeChange}/>
          <Icon id="compact" className="btn icon-btn view-mode-icon" title="Compact"/>
        </label>
      </li>
      <li className="view-mode-container">
        <label>
          <input type="radio" className="sr-only view-mode-radio-input" name="view-mode" value="grid"
            checked={playlist.viewMode === "grid"} onChange={handleViewModeChange}/>
          <Icon id="grid" className="btn icon-btn view-mode-icon" title="Grid"/>
        </label>
      </li>
    </ul>
  );
}

import { useState, useEffect } from "react";
import Icon from "components/Icon";
import "./view-modes.css";

export default function ViewModes({ startViewMode, changeViewMode, hideMinimal = false }) {
  const [viewMode, setViewMode] = useState(startViewMode);

  useEffect(() => {
    setViewMode(startViewMode);
  }, [startViewMode]);

  function handleViewModeChange(event) {
    setViewMode(event.target.value);
    changeViewMode(event.target.value);
  }

  return (
    <ul className="view-modes">
      {hideMinimal ? null : (
        <li className="view-mode-container">
          <label>
            <input type="radio" className="sr-only view-mode-radio-input" name="view-mode" value="minimal"
              checked={viewMode === "minimal"} onChange={handleViewModeChange}/>
            <Icon id="minimal" className="btn icon-btn view-mode-icon" title="Minimal"/>
          </label>
        </li>
      )}
      <li className="view-mode-container">
        <label>
          <input type="radio" className="sr-only view-mode-radio-input" name="view-mode" value="compact"
            checked={viewMode === "compact"} onChange={handleViewModeChange}/>
          <Icon id="compact" className="btn icon-btn view-mode-icon" title="Compact"/>
        </label>
      </li>
      <li className="view-mode-container">
        <label>
          <input type="radio" className="sr-only view-mode-radio-input" name="view-mode" value="grid"
            checked={viewMode === "grid"} onChange={handleViewModeChange}/>
          <Icon id="grid" className="btn icon-btn view-mode-icon" title="Grid"/>
        </label>
      </li>
    </ul>
  );
}

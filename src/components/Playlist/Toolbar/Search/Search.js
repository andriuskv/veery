import { useState, useEffect, useRef } from "react";
import { setSearchValue, searchPlaylist, resetSearchedPlaylist } from "services/playlist-view";
import Icon from "components/Icon";
import "./search.css";

export default function Search({ playlistId, setMessage }) {
  const [searchEnabled, setSearchEnabled] = useState(false);
  const [value, setValue] = useState("");
  const timeoutId = useRef(0);

  useEffect(() => {
    return () => {
      setValue("");
      setSearchEnabled(false);
      setSearchValue("");
    };
  }, [playlistId]);

  useEffect(() => {
    if (searchEnabled) {
      window.addEventListener("keydown", handleGlobalKeydown);
    }
    return () => {
      window.removeEventListener("keydown", handleGlobalKeydown);
    };
  }, [searchEnabled]);

  function enableSearch() {
    setSearchEnabled(true);
  }

  function handleInputChange({ target }) {
    setValue(target.value);
    setSearchValue(target.value);

    clearTimeout(timeoutId.current);
    timeoutId.current = setTimeout(() => {
      const tracksFound = searchPlaylist(target.value, playlistId);

      setMessage(tracksFound ? "" : "No tracks found");
    }, 400);
  }

  function handleInputKeydown({ target, key }) {
    if (key === "Enter") {
      target.blur();
    }
  }

  function handleGlobalKeydown({ key }) {
    if (key === "Escape") {
      handleCleanup();
    }
  }

  function handleCleanup() {
    setValue("");
    setMessage("");
    setSearchEnabled(false);
    setSearchValue("");
    resetSearchedPlaylist(playlistId);
  }

  if (searchEnabled) {
    return (
      <div className="playlist-toolbar-search">
        <div className="playlist-toolbar-search-input-container">
          <Icon id="search" className="playlist-toolbar-search-input-icon"/>
          <input type="text" className="input playlist-toolbar-search-input" placeholder="Search" value={value}
            onChange={handleInputChange} onKeyDown={handleInputKeydown} autoFocus/>
          <button className="btn icon-btn playlist-toolbar-search-reset-btn" onClick={handleCleanup} title="Clear">
            <Icon id="close"/>
          </button>
        </div>
      </div>
    );
  }
  return (
    <button className="btn icon-text-btn" onClick={enableSearch}>
      <Icon id="search"/>
      <span>Search</span>
    </button>
  );
}

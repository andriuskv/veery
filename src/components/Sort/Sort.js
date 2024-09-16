import { useEffect, useState } from "react";
import { setSortOrder } from "services/playlist";
import { createPlaylistView } from "services/playlist-view";
import Icon from "components/Icon";
import Dropdown from "components/Dropdown";
import "./sort.css";

export default function Sort({ playlist, playlistRef, updateSortedPlaylist }) {
  const [state, setState] = useState({ sortBy: playlist.sortBy, sortOrder: playlist.sortOrder });

  useEffect(() => {
    setState({ sortBy: playlist.sortBy, sortOrder: playlist.sortOrder });
  }, [playlist]);

  function handleOrderChange({ target }) {
    sortPlaylist(state.sortBy, Number(target.value));
  }

  function sortPlaylist(sortBy, sortOrder = 1) {
    if (sortBy === state.sortBy && sortOrder === state.sortOrder) {
      return;
    }
    setSortOrder({ ...playlist, sortBy, sortOrder });
    updateSortedPlaylist({ sortBy, sortOrder });
    setState({ sortBy, sortOrder });
    createPlaylistView(playlistRef.current, playlist);
  }

  return (
    <Dropdown
      toggle={{
        body: (
          <>
            <Icon id="sort"/>
            <span>Sort</span>
          </>
        ),
        className: "icon-text-btn sort-dropdown-toggle-btn"
      }}
      container={{ className: "sort-dropdown-container" }}>
      <div className="sort-dropdown-group">
        <button className={`btn text-btn dropdown-btn sort-dropdown-btn${state.sortBy === "index" ? " active" : ""}`}
          onClick={() => sortPlaylist("index")}>Index</button>
        <button className={`btn text-btn dropdown-btn sort-dropdown-btn${state.sortBy === "title" ? " active" : ""}`}
          onClick={() => sortPlaylist("title")}>Title</button>
        <button className={`btn text-btn dropdown-btn sort-dropdown-btn${state.sortBy === "artist" ? " active" : ""}`}
          onClick={() => sortPlaylist("artist")}>Artist</button>
        <button className={`btn text-btn dropdown-btn sort-dropdown-btn${state.sortBy === "album" ? " active" : ""}`}
          onClick={() => sortPlaylist("album")}>Album</button>
        <button className={`btn text-btn dropdown-btn sort-dropdown-btn${state.sortBy === "duration" ? " active" : ""}`}
          onClick={() => sortPlaylist("duration")}>Duration</button>
          {playlist.id === "local-files" ? (
            <button className={`btn text-btn dropdown-btn sort-dropdown-btn${state.sortBy === "date" ? " active" : ""}`}
              onClick={() => sortPlaylist("date")}>Date</button>
          ) : null}
      </div>
      <div className="sort-dropdown-group">
        <label className="dropdown-btn sort-dropdown-radio">
          <input type="radio" className="sr-only radio-input"
            name="sortOrder" value="1"
            onChange={handleOrderChange}
            checked={state.sortOrder === 1}/>
          <div className="radio"></div>
          <span className="radio-label">Ascending</span>
        </label>
        <label className="dropdown-btn sort-dropdown-radio">
          <input type="radio" className="sr-only radio-input"
            onChange={handleOrderChange}
            name="sortOrder" value="-1"
            checked={state.sortOrder === -1}/>
          <div className="radio"></div>
          <span className="radio-label">Descending</span>
        </label>
      </div>
    </Dropdown>
  );
}

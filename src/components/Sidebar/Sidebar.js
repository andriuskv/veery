import { useState, useEffect } from "react";
import { useLocation, NavLink } from "react-router-dom";
import { usePlaylists } from "contexts/playlist";
import { usePlayer } from "contexts/player";
import Icon from "components/Icon";
import "./sidebar.css";

export default function Sidebar({ nowPlayingVisible }) {
  const location = useLocation();
  const { playlists } = usePlaylists();
  const { activePlaylistId, paused } = usePlayer();
  const [indicatorStatus, setIndicatorStatus] = useState({});
  const [visible, setVisible] = useState(false);
  const [shouldRenderToolbar, setShouldRenderToolbar] = useState(false);

  useEffect(() => {
    window.addEventListener("update-indicator-status", handlePlaylistStatus);

    return () => {
      window.removeEventListener("update-indicator-status", handlePlaylistStatus);
    };
  }, []);

  useEffect(() => {
    if (visible) {
      hide();
    }
    setShouldRenderToolbar(!location.pathname.startsWith("/playlist/"));
  }, [location]);

  function handlePlaylistStatus({ detail: { id, visible }}) {
    if (visible) {
      setIndicatorStatus({ ...indicatorStatus, [id]: visible });
    }
    else {
      delete indicatorStatus[id];
      setIndicatorStatus({ ...indicatorStatus });
    }
  }

  function show() {
    setVisible(true);
  }

  function hide() {
    setVisible(false);
  }

  function handleContainerClick(event) {
    if (event.target === event.currentTarget) {
      hide();
    }
  }

  function renderIndicator(id) {
    const shouldRenderPlayIndicator = activePlaylistId === id && !paused;
    const shouldRenderUpdateIndicator = indicatorStatus[id];

    if (shouldRenderPlayIndicator || shouldRenderUpdateIndicator) {
      return (
        <div className="sidebar-playlist-status-container">
          {shouldRenderPlayIndicator && <span className="sidebar-active-playlist-indicator"></span>}
          {shouldRenderUpdateIndicator && <Icon id="spinner"/>}
        </div>
      );
    }
    return null;
  }

  function getNavLinkClassName({ isActive }) {
    let className = "btn icon-text-btn sidebar-link";

    if (isActive) {
      className += " active";
    }
    return className;
  }

  function renderShowButton() {
    const button = (
      <button onClick={show} className="btn icon-btn sidebar-show-btn">
        <Icon id="menu"/>
      </button>
    );

    if (shouldRenderToolbar) {
      return <div className="sidebar-toolbar">{button}</div>;
    }
    return button;
  }

  return (
    <>
      {renderShowButton()}
      <div className={`sidebar-container${visible ? "": " hidden"}${nowPlayingVisible ? " now-playing-visible" : ""}`} onClick={handleContainerClick}>
        <aside className="sidebar">
          <header className="sidebar-header">
            <h1 className="sidebar-header-title">Veery</h1>
          </header>
          <nav className="sidebar-links">
            <ul className="sidebar-general-links">
              <li>
                <NavLink to="/" className={getNavLinkClassName}>
                  <Icon id="home"/>
                  <span>Home</span>
                </NavLink>
              </li>
              <li>
                <NavLink to="/search" className={getNavLinkClassName}>
                  <Icon id="search"/>
                  <span>Search</span>
                </NavLink>
              </li>
            </ul>
            {playlists ? (
              <ul className="sidebar-playlist-links">
                {Object.values(playlists).map(playlist => (
                  <li key={playlist.id}>
                    <NavLink to={`/playlist/${playlist.id}`} className={getNavLinkClassName}>
                      <span className="sidebar-playlist-title">{playlist.title}</span>
                      {renderIndicator(playlist.id)}
                    </NavLink>
                  </li>
                ))}
              </ul>
            ) : null}
          </nav>
        </aside>
      </div>
    </>
  );
}

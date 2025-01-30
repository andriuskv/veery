import { useState, useEffect } from "react";
import { initGoogleAPI, logoutUser, fetchYoutubeUserPlaylists } from "services/youtube";
import { usePlaylists } from "contexts/playlist";
import Icon from "components/Icon";
import Dropdown from "components/Dropdown";
import "./import.css";

export default function Import({ youtube, setYoutube }) {
  const { uploadFiles } = usePlaylists();
  const [shouldUseLastfm, setShouldUseLastfm] = useState(() => {
    return localStorage.getItem("use-last.fm") === "true";
  });

  useEffect(() => {
    if (!youtube.user) {
      window.addEventListener("youtube-user-update", handleYoutubeUserUpdate);
    }
    return () => {
      window.removeEventListener("youtube-user-update", handleYoutubeUserUpdate);
    };
  }, [youtube.user]);

  function handleYoutubeUserUpdate({ detail: user }) {
    if (user) {
      setYoutube({ ...youtube, user });
    }
  }

  function handleFileChange({ target }) {
    uploadFiles([...target.files]);
    target.value = "";
  }

  function toggleLastfmUsage({ target }) {
    setShouldUseLastfm(target.checked);
    localStorage.setItem("use-last.fm", target.checked);
  }

  async function showYoutubeModal() {
    if (youtube.playlists) {
      setYoutube({ ...youtube, modalVisible: true });
    }
    else {
      setYoutube({ ...youtube, fetching: true });

      const user = await initGoogleAPI();

      if (user) {
        const playlists = await fetchYoutubeUserPlaylists();

        setYoutube({ user, playlists, modalVisible: true });
      }
      else {
        setYoutube({ modalVisible: true });
      }
    }
  }

  async function logoutYoutubeUser() {
    logoutUser();
    setYoutube({});
  }

  async function handleYouTubeSignIn() {
    setYoutube({ fetching: true });

    try {
      const user = await initGoogleAPI(true);
      setYoutube({ user });
    } catch (e) {
      console.log(e);
      setYoutube({});
    }
  }

  return (
    <div>
      <div className="import-option import-option-local">
        <div className="import-local-items">
          <label className="btn icon-text-btn import-option-btn import-local-item" onChange={handleFileChange}>
            <Icon id="file" className="import-option-btn-icon"/>
            <span>Files</span>
            <input type="file" className="sr-only" accept="audio/*" multiple/>
          </label>
          <label className="btn icon-text-btn import-option-btn import-local-item" onChange={handleFileChange}>
            <Icon id="folder" className="import-option-btn-icon"/>
            <span>Folder</span>
            <input type="file" className="sr-only" webkitdirectory="true" directory="true" allowdirs="true"/>
          </label>
        </div>
        <div className="import-local-settings">
          <label className="checkbox-container">
            <input type="checkbox" className="sr-only checkbox-input"
              onChange={toggleLastfmUsage}
              checked={shouldUseLastfm}/>
            <div className="checkbox">
              <div className="checkbox-tick"></div>
            </div>
            <span className="checkbox-label">Look for missing metadata</span>
          </label>
        </div>
      </div>
      <div className="import-option import-option-youtube">
        {youtube.fetching && <Icon id="spinner" className="import-youtube-spinner"/>}
        <button className="btn icon-text-btn import-option-btn import-youtube-modal-show-btn"
          onClick={showYoutubeModal} disabled={youtube.fetching}>
          <Icon id="youtube" className="import-option-btn-icon"/>
          <span>YouTube</span>
        </button>
        {youtube.user ? (
          <Dropdown toggle={{
            body: <img src={youtube.user.image} className="import-youtube-user-btn-image" alt=""/>,
            className: "import-youtube-user-toggle-btn"
          }}>
            <div className="import-youtube-user">
              <img src={youtube.user.image} className="import-youtube-user-image" alt=""/>
              <div>
                <div className="import-youtube-user-name">{youtube.user.name}</div>
                <div className="import-youtube-user-email">{youtube.user.email}</div>
              </div>
            </div>
            <div className="import-youtube-user-bottom">
              <button className="btn text-btn import-youtube-logout-btn" onClick={logoutYoutubeUser}>Sign Out</button>
            </div>
          </Dropdown>
        ) : (
          <button className="btn text-btn import-youtube-login-btn" onClick={handleYouTubeSignIn} disabled={youtube.fetching}>Sign In</button>
        )}
      </div>
    </div>
  );
}

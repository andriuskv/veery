import { useState } from "react";
import { useLocation } from "react-router-dom";
import { dispatchCustomEvent } from "../../../utils.js";
import { fetchPlaylistItems, fetchPlaylistTitleAndStatus, addVideo } from "services/youtube";
import { getPlaylistById } from "services/playlist";
import { usePlaylists } from "contexts/playlist";
import Icon from "components/Icon";
import Modal from "components/Modal";
import "./youtube-modal.css";
import Notification from "./Notification";

export default function YoutubeModal({ youtube, setYoutube }) {
  const location = useLocation();
  const { createPlaylist, addTracks } = usePlaylists();
  const [notification, setNotification] = useState(null);
  const [formDisabled, setFormDisabled] = useState(false);

  async function handleFormSubmit(event) {
    event.preventDefault();
    importPlaylist(event.target.elements.url.value);
  }

  async function importPlaylist(url) {
    let searchParams = null;

    try {
      ({ searchParams } = new URL(url));
    } catch {
      setNotification({ value: "Invalid URL." });
      return;
    }
    const playlistId = searchParams.get("list");
    const videoId = searchParams.get("v");

    if (!playlistId && !videoId) {
      setNotification({ value: "Invalid URL." });
      return;
    }
    else if (playlistId === "WL") {
      setNotification({ value: "Importing Watch Later playlist is not allowed." });
      return;
    }
    setFormDisabled(true);

    if (playlistId) {
      const pl = getPlaylistById(playlistId);

      dispatchCustomEvent("update-indicator-status", { id: playlistId, visible: true });

      if (pl) {
        delete youtube.modalVisible;
        setYoutube({ ...youtube, playlistId, loading: true });

        const tracks = await fetchPlaylistItems(playlistId, "reimport");

        addTracks(playlistId, tracks);
        dispatchCustomEvent("tracks", { id: playlistId, type: "replace" });
      }
      else {
        const response = await fetchPlaylistTitleAndStatus(playlistId);

        if (response) {
          delete youtube.modalVisible;
          setYoutube({ ...youtube, playlistId, loading: true });

          createPlaylist({
            id: playlistId,
            sync: false,
            viewMode: "grid",
            url,
            ...response
          });

          await fetchPlaylistItems(playlistId, "new");
        }
        else {
          setFormDisabled(false);
          setNotification({ value: "Playlist was not found." });
          return;
        }
      }

      if (location.pathname === "/") {
        setYoutube({ ...youtube, loading: false });
      }
      dispatchCustomEvent("update-indicator-status", { id: playlistId, visible: false });
    }
    else if (videoId) {
      const id = "youtube-videos";
      const pl = getPlaylistById(id);
      const tracks = await addVideo(videoId, pl ? pl.tracks: []);

      if (tracks) {
        delete youtube.modalVisible;
        setYoutube({ ...youtube });

        if (pl) {
          addTracks(pl.id, tracks);
        }
        else {
          createPlaylist({
            id,
            title: "YouTube Videos",
            sync: false,
            viewMode: "grid",
            tracks
          });
        }
      }
      else {
        setFormDisabled(false);
        setNotification({ value: "Video was not found." });
      }
    }
  }

  function hideModal() {
    delete youtube.modalVisible;
    setYoutube({ ...youtube });
  }

  function dismissNotification() {
    setNotification(null);
  }

  return (
    <Modal hide={hideModal}>
      <div className="modal-header">
        <Icon id="youtube" className="modal-header-icon"/>
        <h3 className="modal-title">YouTube Import</h3>
      </div>
      <form className="youtube-modal-form" onSubmit={handleFormSubmit}>
        <input type="text" className="input youtube-modal-form-input" name="url" placeholder="Enter playlist or video URL"
          disabled={formDisabled} autoFocus required/>
        <button className="btn text-btn youtube-modal-form-submit-btn" disabled={formDisabled}>Import</button>
      </form>
      {notification && (
        <Notification notification={notification} dismiss={dismissNotification}></Notification>
      )}
      {youtube.playlists ? (
        <ul className="youtube-modal-playlists">
          {youtube.playlists.map(playlist => (
            <li className="youtube-modal-playlist" key={playlist.id}>
              <button className="btn youtube-modal-playlist-btn" onClick={() => importPlaylist(playlist.url)}>
                <div className="youtube-modal-playlist-thumbnail-container artwork-container">
                  <img src={playlist.thumbnail} className="artwork" alt=""/>
                </div>
                <div className="youtube-modal-playlist-content">
                  <div>{playlist.title}</div>
                  <div className="youtube-modal-playlist-bottom">
                    {playlist.isPrivate ? (
                      <span className="youtube-modal-playlist-bottom-item">
                        <Icon id="lock" className="youtube-modal-playlist-bottom-icon" title="Private to you"/>
                      </span>
                    ) : null}
                    <span className="youtube-modal-playlist-bottom-item">{playlist.itemCount} track{playlist.itemCount === 1 ? "" : "s"}</span>
                  </div>
                </div>
                <div className="youtube-modal-playlist-action">Import</div>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      <div className="modal-bottom">
        <button className="btn text-btn" onClick={hideModal}>Cancel</button>
      </div>
    </Modal>
  );
}

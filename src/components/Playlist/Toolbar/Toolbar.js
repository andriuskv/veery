import { setPlaybackOrder } from "services/player";
import { usePlaylists } from "contexts/playlist";
import ViewModes from "components/ViewModes";
import Sort from "components/Sort";
import Selection from "components/Selection";
import "./toolbar.css";
import Search from "./Search";

export default function Toolbar({ playlist, playlistRef, setMessage }) {
  const { updatePlaylist } = usePlaylists();

  function updateSortedPlaylist({ sortBy, sortOrder }) {
    setPlaybackOrder(playlist.id);
    updatePlaylist(playlist.id, { sortBy, sortOrder });
  }

  return (
    <div className="playlist-toolbar">
      <ViewModes playlist={playlist} playlistRef={playlistRef} updatePlaylist={updatePlaylist}/>
      <Search playlistId={playlist.id} setMessage={setMessage}/>
      <Selection playlist={playlist}/>
      <Sort playlist={playlist} playlistRef={playlistRef} updateSortedPlaylist={updateSortedPlaylist}/>
    </div>
  );
}

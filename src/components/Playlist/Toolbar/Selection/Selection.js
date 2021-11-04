import { getRandomString } from "../../../../utils";
import { getSelectedElements, getElementIndexes, resetSelection } from "services/playlist-selection";
import { usePlayer } from "contexts/player";
import { useQueue } from "contexts/queue";
import Icon from "components/Icon";
import Dropdown from "components/Dropdown";

export default function Selection({ playlist, removeSelectedTracks, hide }) {
  const { activeTrack } = usePlayer();
  const { enqueueTracks } = useQueue();

  function cancelSelection() {
    resetSelection();
    hide();
  }

  function enqueueSelectedTracks() {
    const elements = getSelectedElements();
    const indexes = getElementIndexes(elements);
    const items = [];

    for (const index of indexes) {
      items.push({
        id: getRandomString(),
        playlistId: playlist.id,
        track: playlist.tracks[index]
      });
    }
    enqueueTracks(items);
    cancelSelection();
  }

  return (
    <Dropdown container={{ className: "js-selection-btn" }}>
      {activeTrack ? (
        <button className="btn icon-text-btn dropdown-btn" onClick={enqueueSelectedTracks}>
          <Icon id="playlist-add" title="Add to queue"/>
          <span>Add to queue</span>
        </button>
      ) : null}
      <button className="btn icon-text-btn dropdown-btn" onClick={removeSelectedTracks}>
        <Icon id="trash" title="Remove selected"/>
        <span>Remove selected</span>
      </button>
      <button className="btn icon-text-btn dropdown-btn" onClick={cancelSelection}>
        <Icon id="close" title="Cancel"/>
        <span>Clear selected</span>
      </button>
    </Dropdown>
  );
}

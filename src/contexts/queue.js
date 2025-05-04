import { createContext, use, useState, useMemo } from "react";
import * as queueService from "services/queue";

const QueueContext = createContext();

function QueueProvider({ children }) {
  const [queue, setQueue] = useState([]);
  const value = useMemo(() => ({ queue, enqueueTracks, resetQueue, dequeueTrack, getNextQueueItem, getQueueItemAtIndex, removePlaylistItems }), [queue]);

  function enqueueTracks(tracks) {
    setQueue([...queueService.enqueueTracks(tracks)]);
  }

  function resetQueue() {
    queueService.resetQueue();
    setQueue([]);
  }

  function removePlaylistItems(playlistId) {
    const queue = queueService.removePlaylistItems(playlistId);

    setQueue(queue);
  }

  function dequeueTrack(index) {
    const queue = queueService.dequeueTrack(index);

    setQueue([...queue]);
  }

  function getNextQueueItem() {
    const item = queueService.getNextQueueItem();

    if (item) {
      setQueue([...item.queue]);
      return item;
    }
    else if (queue.length) {
      setQueue([]);
    }
  }

  function getQueueItemAtIndex(index) {
    const { queue, track } = queueService.getQueueItemAtIndex(index);

    setQueue([...queue]);
    return track;
  }

  return <QueueContext value={value}>{children}</QueueContext>;
}

function useQueue() {
  return use(QueueContext);
}

export {
  QueueProvider,
  useQueue
};

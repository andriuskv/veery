import { createContext, useContext, useState, useMemo } from "react";
import * as queueService from "services/queue";

const QueueContext = createContext();

function QueueProvider({ children }) {
  const [queue, setQueue] = useState([]);
  const value = useMemo(() => ({ queue, enqueueTracks, resetQueue, dequeueTrack, getNextQueueItem, getQueueItemAtIndex }), [queue]);

  function enqueueTracks(tracks) {
    setQueue([...queueService.enqueueTracks(tracks)]);
  }

  function resetQueue() {
    queueService.resetQueue();
    setQueue([]);
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

  return <QueueContext.Provider value={value}>{children}</QueueContext.Provider>;
}

function useQueue() {
  return useContext(QueueContext);
}

export {
  QueueProvider,
  useQueue
};

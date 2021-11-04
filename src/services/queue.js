let queue = [];
let queueStart = null;

function getQueue() {
  return queue;
}

function getQueueStart() {
  return queueStart;
}

function setQueueStart(start) {
  queueStart = start;
}

function getNextQueueItem() {
  const item = queue.shift();

  if (!item) {
    return null;
  }
  return {
    queue,
    track: item.track,
    playlistId: item.playlistId
  };
}

function getQueueItemAtIndex(index) {
  const item = queue[index];

  queue = queue.slice(index + 1);
  return { queue, track: item.track };
}

function enqueueTracks(tracks) {
  queue = queue.concat(tracks);
  return queue;
}

function dequeueTrack(index) {
  queue.splice(index, 1);
  return queue;
}

function resetQueue() {
  queue.length = 0;
}

export {
  getQueue,
  getQueueStart,
  setQueueStart,
  getNextQueueItem,
  getQueueItemAtIndex,
  enqueueTracks,
  dequeueTrack,
  resetQueue
};

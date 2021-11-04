let track = JSON.parse(localStorage.getItem("track"));

function getTrack() {
  return track;
}

function updateTrack(data, save = true) {
  track = { ...track, ...data };

  if (save) {
    localStorage.setItem("track", JSON.stringify(track));
  }
}

function removeTrack() {
  track = null;
  localStorage.removeItem("track");
}

export {
  getTrack,
  updateTrack,
  removeTrack
};

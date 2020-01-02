const settings = Object.assign({
  playback: "normal",
  shuffle: false,
  mute: false,
  volume: 0.4
}, JSON.parse(localStorage.getItem("settings")) || {});

function setSetting(setting, value) {
  settings[setting] = value;
  saveSettings(settings);
}

function getSetting(setting) {
  return settings[setting];
}

function removeSetting(setting) {
  delete settings[setting];
  saveSettings(settings);
}

function saveSettings(settings) {
  localStorage.setItem("settings", JSON.stringify(settings));
}

export {
  setSetting,
  getSetting,
  removeSetting
};

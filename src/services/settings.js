
const settings = Object.assign({
  repeat: "repeat-off",
  shuffle: false,
  mute: false,
  volume: 0.2
}, JSON.parse(localStorage.getItem("veery-settings")) || {});
let timeoutId = 0;

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
  clearTimeout(timeoutId);
  timeoutId = setTimeout(() => {
    localStorage.setItem("veery-settings", JSON.stringify(settings));
  }, 2000);
}

export {
  setSetting,
  getSetting,
  removeSetting
};

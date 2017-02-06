const settings = Object.assign({
    repeat: false,
    shuffle: false,
    once: false,
    muted: false,
    volume: 0.2
}, JSON.parse(localStorage.getItem("settings")) || {});

function setSetting(setting, value) {
    settings[setting] = value;
    localStorage.setItem("settings", JSON.stringify(settings));
}

function getSetting(setting) {
    return settings[setting];
}

function removeSetting(setting) {
    delete settings[setting];
}

function getSettings() {
    return settings;
}

export {
    setSetting,
    getSetting,
    removeSetting,
    getSettings
};

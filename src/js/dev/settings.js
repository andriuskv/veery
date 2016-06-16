const settings = Object.assign({
    paused: true,
    repeat: false,
    shuffle: false,
    manual: false,
    volume: 0.2,
    seeking: false,
    activeTab: "add",
    player: ""
}, JSON.parse(localStorage.getItem("settings")) || {});

function set(setting, value) {
    if (settings.hasOwnProperty(setting)) {
        settings[setting] = value;
        localStorage.setItem("settings", JSON.stringify({
            repeat: settings.repeat,
            shuffle: settings.shuffle,
            volume: settings.volume
        }));
        return value;
    }
}

function get(setting) {
    return settings[setting];
}

export { set, get };

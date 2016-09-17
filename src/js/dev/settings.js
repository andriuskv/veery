const settings = Object.assign({
    paused: true,
    repeat: false,
    shuffle: false,
    manual: false,
    volume: 0.2,
    seeking: false,
    activeTabId: "add"
}, JSON.parse(localStorage.getItem("settings")) || {});

function set(setting, value) {
    if (settings.hasOwnProperty(setting)) {
        settings[setting] = value;

        if (setting === "repeate" || setting === "shuffle" || setting === "volume") {
            localStorage.setItem("settings", JSON.stringify({
                repeat: settings.repeat,
                shuffle: settings.shuffle,
                volume: settings.volume
            }));
        }
        return value;
    }
}

function get(setting) {
    return settings[setting];
}

export { set, get };

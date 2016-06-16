(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.worker = exports.addTracks = undefined;

var _main = require("./main.js");

var _playlistManage = require("./playlist/playlist.manage.js");

var playlistManage = _interopRequireWildcard(_playlistManage);

var _playlist = require("./playlist/playlist.js");

var playlist = _interopRequireWildcard(_playlist);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } } /* global parse_audio_metadata */

var worker = initWorker();

var progress = function () {
    var progress = document.getElementById("js-file-progress");

    function setAttrValue(attr, value) {
        progress.setAttribute(attr, value);
    }

    function toggleElement() {
        progress.classList.toggle("show");
        document.getElementById("js-local-notice").classList.toggle("show");
    }

    return {
        toggle: toggleElement,
        setAttrValue: setAttrValue
    };
}();

function initWorker() {
    var dbWorker = new Worker("js/workers/worker1.js");

    dbWorker.onmessage = function (event) {
        var _pl$tracks;

        var data = event.data;

        if (data.action === "init") {
            exports.worker = worker = initWorker();
            return;
        }
        var pl = getPlaylist();

        (_pl$tracks = pl.tracks).push.apply(_pl$tracks, _toConsumableArray(data.tracks));
        playlistManage.init(pl, "list", false);
    };
    dbWorker.onerror = function (event) {
        console.log(event);
    };
    return dbWorker;
}

function getPlaylist() {
    var localPlaylist = playlist.get("local-files");

    if (localPlaylist) {
        return localPlaylist;
    }
    return playlist.create({
        id: "local-files",
        title: "Local files"
    });
}

function getTrackDuration(track) {
    return new Promise(function (resolve) {
        var audioBlobURL = URL.createObjectURL(track);
        var audio = new Audio(audioBlobURL);

        audio.preload = "metadata";
        audio.addEventListener("loadedmetadata", function onMetadata() {
            var duration = (0, _main.formatTime)(audio.duration);

            audio.removeEventListener("loadedmetadata", onMetadata);
            audio = null;
            audioBlobURL = URL.revokeObjectURL(audioBlobURL);
            resolve(duration);
        });
    });
}

function removeFileType(fileName) {
    return fileName.slice(0, fileName.lastIndexOf("."));
}

function filterInvalidTracks(newTracks, playlistTracks) {
    var audio = new Audio();

    return newTracks.reduce(function (tracks, track) {
        var name = removeFileType(track.name.trim());
        var duplicate = playlistTracks.some(function (track) {
            return track.name === name;
        });

        if (!duplicate && audio.canPlayType(track.type)) {
            tracks.push({
                name: name,
                audioTrack: track
            });
        }
        return tracks;
    }, []);
}

function parseTrackMetadata(track) {
    return new Promise(function (resolve) {
        parse_audio_metadata(track, function (data) {
            resolve(data);
        });
    });
}

function parseTracks(tracks, parsedTracks, startIndex) {
    return Promise.all([parseTrackMetadata(tracks[0].audioTrack), getTrackDuration(tracks[0].audioTrack)]).then(function (data) {
        parsedTracks.push({
            index: startIndex + parsedTracks.length,
            title: data[0].title.trim(),
            artist: data[0].artist.trim(),
            album: data[0].album.trim(),
            name: tracks[0].name,
            thumbnail: data[0].picture,
            audioTrack: tracks[0].audioTrack,
            duration: data[1]
        });
        tracks.splice(0, 1);
        progress.setAttrValue("value", parsedTracks.length);
        if (tracks.length) {
            return parseTracks(tracks, parsedTracks, startIndex);
        }
        return parsedTracks;
    });
}

function addLocalTracks(localTracks) {
    var pl = getPlaylist();
    var playlistTracks = pl.tracks;
    var tracks = filterInvalidTracks([].concat(_toConsumableArray(localTracks)), playlistTracks);

    progress.setAttrValue("max", tracks.length);
    progress.toggle();

    parseTracks(tracks, [], playlistTracks.length).then(function (tracks) {
        var _pl$tracks2;

        progress.toggle();
        (_pl$tracks2 = pl.tracks).push.apply(_pl$tracks2, _toConsumableArray(tracks));

        if (document.getElementById("js-" + pl.id)) {
            playlistManage.appendTo(pl, tracks, "list", true);
        } else {
            playlistManage.init(pl, "list", true);
        }
        worker.postMessage({
            action: "update",
            playlist: playlistTracks
        });
    });
}

exports.addTracks = addLocalTracks;
exports.worker = worker;

},{"./main.js":2,"./playlist/playlist.js":9,"./playlist/playlist.manage.js":10}],2:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.formatTime = exports.removeClassFromElement = exports.getElementByAttr = exports.toggleTab = exports.scriptLoader = undefined;

var _settings = require("./settings.js");

var settings = _interopRequireWildcard(_settings);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

var scriptLoader = function () {
    var loaded = [];

    function loadScript(src, cb) {
        if (loaded.includes(src)) {
            return;
        }

        var script = document.createElement("script");

        script.setAttribute("src", src);
        document.getElementsByTagName("body")[0].appendChild(script);
        loaded.push(src);

        if (cb) {
            script.onload = function () {
                cb();
            };
        }
    }

    return {
        load: loadScript
    };
}();

function removeClassFromElement(className, classToRemove) {
    var element = document.querySelector("." + className + "." + classToRemove);

    if (element) {
        element.classList.remove(classToRemove);
    }
}

function toggleTab(id, ignoreSidebar) {
    removeClassFromElement("js-tab-select-btn", "active");
    removeClassFromElement("tab", "active");

    settings.set("activeTab", id);
    document.getElementById("js-tab-" + id).classList.add("active");

    if (!ignoreSidebar) {
        document.querySelector("[data-tab-item=" + id + "]").classList.add("active");
    }
}

function getElementByAttr(element, attr) {
    while (element) {
        var attrValue = element.getAttribute(attr);

        if (attrValue) {
            return { element: element, attrValue: attrValue };
        }
        element = element.parentElement;
    }
}

function formatTime(time) {
    var newTime = "";

    time = Math.floor(time);
    if (time >= 60) {
        var minutes = Math.floor(time / 60);

        newTime = minutes + ":";
    } else {
        newTime = "0:";
    }

    var seconds = time % 60;

    newTime += seconds < 10 ? "0" + seconds : seconds;
    return newTime;
}

exports.scriptLoader = scriptLoader;
exports.toggleTab = toggleTab;
exports.getElementByAttr = getElementByAttr;
exports.removeClassFromElement = removeClassFromElement;
exports.formatTime = formatTime;

},{"./settings.js":13}],3:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.updateSlider = exports.showTrackDuration = exports.setElapsedTime = exports.addClassOnPlayBtn = exports.togglePlayBtnClass = exports.elapsedTime = undefined;

var _settings = require("./../settings.js");

var settings = _interopRequireWildcard(_settings);

var _main = require("./../main.js");

var main = _interopRequireWildcard(_main);

var _playlist = require("./../playlist/playlist.js");

var playlist = _interopRequireWildcard(_playlist);

var _player = require("./player.js");

var player = _interopRequireWildcard(_player);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

var elapsedTime = function () {
    var timeout = 0;

    function stop() {
        if (timeout) {
            clearTimeout(timeout);
        }
    }

    function update(_ref) {
        var currentTime = _ref.currentTime;
        var duration = _ref.duration;

        var startTime = performance.now();

        return new Promise(function (resolve) {
            (function update(currentTime, startTime, elapsed) {
                var elapsedInPercent = currentTime / duration * 100;
                var ideal = performance.now() - startTime;
                var diff = ideal - elapsed;

                setElapsedTime(currentTime);
                if (!settings.get("seeking")) {
                    updateSlider("track", elapsedInPercent);
                }

                timeout = setTimeout(function () {
                    if (currentTime < duration) {
                        currentTime += 1;
                        elapsed += 1000;
                        update(currentTime, startTime, elapsed);
                    } else {
                        resolve();
                    }
                }, 1000 - diff);
            })(Math.floor(currentTime), startTime, 0);
        });
    }

    function start(track, cb) {
        stop();
        return update(track, cb);
    }

    return { stop: stop, start: start };
}();

function addClassOnPlayBtn(classToAdd) {
    var playBtn = document.getElementById("js-player-play");
    var classToRemove = "";
    var btnTitle = "";

    if (classToAdd === "icon-play") {
        classToRemove = "icon-pause";
        btnTitle = "Play";
    } else if (classToAdd === "icon-pause") {
        classToRemove = "icon-play";
        btnTitle = "Pause";
    }
    playBtn.classList.remove(classToRemove);
    playBtn.classList.add(classToAdd);
    playBtn.setAttribute("title", btnTitle);
}

function togglePlayBtnClass(paused) {
    if (paused) {
        addClassOnPlayBtn("icon-play");
    } else {
        addClassOnPlayBtn("icon-pause");
    }
}

function getElapsedValue(slider, screenX) {
    var trackSlider = document.getElementById("js-player-" + slider + "-slider");

    var _trackSlider$getBound = trackSlider.getBoundingClientRect();

    var left = _trackSlider$getBound.left;
    var width = _trackSlider$getBound.width;

    var value = (screenX - left) / width;

    if (value < 0) {
        value = 0;
    } else if (value > 1) {
        value = 1;
    }
    return value * 100;
}

function onVolumeTrackMousemove(event) {
    var volume = getElapsedValue("volume", event.screenX);

    updateSlider("volume", volume);
    player.setVolume(volume / 100);
}

function onVolumeTrackMouseup() {
    document.removeEventListener("mousemove", onVolumeTrackMousemove);
    document.removeEventListener("mouseup", onVolumeTrackMouseup);
}

function updateSlider(slider, percent) {
    var trackSlider = document.getElementById("js-player-" + slider + "-slider");
    var elapsed = trackSlider.children[0];
    var elapsedThumb = trackSlider.children[1];

    elapsed.style.width = percent + "%";
    elapsedThumb.style.left = percent + "%";
}

function setElapsedTime(time) {
    document.getElementById("js-player-elapsed").textContent = main.formatTime(time);
}

function showTrackDuration(duration) {
    var format = arguments.length <= 1 || arguments[1] === undefined ? true : arguments[1];

    var durationElem = document.getElementById("js-player-duration");

    durationElem.textContent = format ? main.formatTime(duration) : duration;
}

function onPlayerTrackMousemove(event) {
    updateSlider("track", getElapsedValue("track", event.screenX));
}

function onPlayerTrackMouseup(_ref2) {
    var screenX = _ref2.screenX;

    if (playlist.getCurrentTrack()) {
        player.seek(getElapsedValue("track", screenX));
    }

    settings.set("seeking", false);
    document.removeEventListener("mousemove", onPlayerTrackMousemove);
    document.removeEventListener("mouseup", onPlayerTrackMouseup);
}

document.getElementById("js-player-track").addEventListener("mousedown", function (event) {
    if (event.which !== 1 || !event.target.getAttribute("data-track-item") || !playlist.getCurrentTrack()) {
        return;
    }

    settings.set("seeking", true);
    updateSlider("track", getElapsedValue("track", event.screenX));
    document.addEventListener("mousemove", onPlayerTrackMousemove);
    document.addEventListener("mouseup", onPlayerTrackMouseup);
});

document.getElementById("js-volume-track").addEventListener("mousedown", function (event) {
    if (event.which !== 1 || !event.target.getAttribute("data-volume-item")) {
        return;
    }

    onVolumeTrackMousemove(event);
    document.addEventListener("mousemove", onVolumeTrackMousemove);
    document.addEventListener("mouseup", onVolumeTrackMouseup);
});

document.getElementById("js-player-controls").addEventListener("click", function (_ref3) {
    var target = _ref3.target;

    var item = target.getAttribute("data-control-item");

    switch (item) {
        case "previous":
            player.playNext(-1);
            break;
        case "play":
            player.play();
            break;
        case "stop":
            player.stop();
            break;
        case "next":
            player.playNext(1);
            break;
        case "repeat":
        case "shuffle":
            target.classList.toggle("active");
            player[item](target.classList.contains("active"));
            break;
        case "volume":
            document.getElementById("js-volume-track").classList.toggle("active");
            target.classList.toggle("active");
            break;
    }
});

window.addEventListener("DOMContentLoaded", function onLoad() {
    var repeat = settings.get("repeat");
    var shuffle = settings.get("shuffle");
    var volume = settings.get("volume");

    if (repeat) {
        document.querySelector("[data-control-item=\"repeat\"]").classList.add("active");
    }
    if (shuffle) {
        document.querySelector("[data-control-item=\"shuffle\"]").classList.add("active");
    }
    updateSlider("volume", volume * 100);
    window.removeEventListener("DOMContentLoaded", onLoad);
});

exports.elapsedTime = elapsedTime;
exports.togglePlayBtnClass = togglePlayBtnClass;
exports.addClassOnPlayBtn = addClassOnPlayBtn;
exports.setElapsedTime = setElapsedTime;
exports.showTrackDuration = showTrackDuration;
exports.updateSlider = updateSlider;

},{"./../main.js":2,"./../playlist/playlist.js":9,"./../settings.js":13,"./player.js":4}],4:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.onTrackEnd = exports.onTrackStart = exports.setVolume = exports.togglePlaying = exports.seek = exports.shuffle = exports.repeat = exports.stop = exports.playNext = exports.play = undefined;

var _main = require("./../main.js");

var main = _interopRequireWildcard(_main);

var _settings = require("./../settings.js");

var settings = _interopRequireWildcard(_settings);

var _sidebar = require("./../sidebar.js");

var sidebar = _interopRequireWildcard(_sidebar);

var _playlist = require("./../playlist/playlist.js");

var playlist = _interopRequireWildcard(_playlist);

var _playlistView = require("./../playlist/playlist.view.js");

var playlistView = _interopRequireWildcard(_playlistView);

var _playerControls = require("./player.controls.js");

var controls = _interopRequireWildcard(_playerControls);

var _playerNative = require("./player.native.js");

var nPlayer = _interopRequireWildcard(_playerNative);

var _playerYoutube = require("./player.youtube.js");

var ytPlayer = _interopRequireWildcard(_playerYoutube);

var _playerSoundcloud = require("./player.soundcloud.js");

var scPlayer = _interopRequireWildcard(_playerSoundcloud);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function onTrackStart(track, time) {
    var id = playlist.getActivePlaylistId();

    controls.showTrackDuration(track.duration, false);
    controls.addClassOnPlayBtn("icon-pause");
    sidebar.showTrackInfo(track);
    sidebar.showActiveIcon(id);
    playlistView.showPlayingTrack(track.index, id, settings.get("manual"));
    settings.set("paused", false);
    settings.set("manual", false);

    return controls.elapsedTime.start(time);
}

function onTrackEnd(repeatCb) {
    if (!settings.get("repeat")) {
        playNextTrack(1);
        return;
    }
    resetTrack();
    repeatCb();
}

function getPlayer(playlistId) {
    if (playlistId === "local-files") {
        return "native";
    } else if (playlistId.includes("yt-pl-")) {
        return "youtube";
    } else if (playlistId.includes("sc-pl-")) {
        return "soundcloud";
    }
}

function togglePlaying(playCb, pauseCb) {
    var paused = settings.get("paused");

    if (paused) {
        playCb();
    } else {
        pauseCb();
        controls.elapsedTime.stop();
        controls.addClassOnPlayBtn("icon-play");
    }
    settings.set("paused", !paused);
}

function playNewTrack(track, player) {
    if (player === "native") {
        nPlayer.playTrack(track);
    } else if (player === "youtube") {
        ytPlayer.playTrack(track);
    } else if (player === "soundcloud") {
        scPlayer.playTrack(track);
    }
}

function playFirstTrack(id) {
    if (!playlist.get(id)) {
        return;
    }

    var selected = document.getElementById("js-" + id).querySelector(".track.selected");
    var index = 0;

    if (selected) {
        index = Number.parseInt(selected.getAttribute("data-index"), 10);
        settings.set("manual", true);
    } else {
        playlist.setActive(id);
        index = playlist.getNextTrackIndex(0);
    }
    playTrackAtIndex(index, id);
}

function playTrack() {
    var player = settings.get("player");

    if (!player) {
        var id = settings.get("activeTab");

        playFirstTrack(id);
        return;
    }

    var index = playlist.getCurrentTrackIndex();
    var track = playlist.getTrackAtIndex(index);

    playlist.setCurrentTrack(track);

    if (player === "native") {
        nPlayer.play(track);
    } else if (player === "youtube") {
        ytPlayer.togglePlaying();
    } else if (player === "soundcloud") {
        scPlayer.togglePlaying();
    }
}

function playNextTrack(direction) {
    var player = settings.get("player");
    var currentTrack = playlist.getCurrentTrack();

    if (!player || !currentTrack) {
        return;
    }
    stopTrack(currentTrack, player);

    var track = playlist.getNextTrack(direction);

    playNewTrack(track, player);
}

function playTrackAtIndex(index, id) {
    var currentTrack = playlist.getCurrentTrack();

    if (!settings.get("paused") || currentTrack) {
        stopTrack(currentTrack);
    }

    var player = getPlayer(id);
    var pl = playlist.get(id);
    var track = pl.tracks[index];

    settings.set("player", player);
    playlist.setActive(pl.id);

    if (settings.get("shuffle") && !pl.shuffled) {
        playlist.shufflePlaybackOrder(true, pl);
        playlist.resetCurrentIndex();
    } else {
        playlist.setCurrentIndex(track.index);
    }

    playlist.setCurrentTrack(track);
    playNewTrack(track, player);
}

function stopTrack() {
    var track = arguments.length <= 0 || arguments[0] === undefined ? playlist.getCurrentTrack() : arguments[0];
    var player = arguments.length <= 1 || arguments[1] === undefined ? settings.get("player") : arguments[1];

    if (!track) {
        return;
    }

    if (player === "native") {
        nPlayer.stop(track);
    } else if (player === "youtube") {
        ytPlayer.stop();
    } else if (player === "soundcloud") {
        scPlayer.stop();
    }

    if (player) {
        sidebar.hideActiveIcon();
        main.removeClassFromElement("track", "playing");
        resetPlayer();
    }
}

function resetTrack() {
    sidebar.showTrackInfo();
    controls.elapsedTime.stop();
    controls.setElapsedTime(0);
    controls.updateSlider("track", 0);
    controls.showTrackDuration(0);
}

function resetPlayer() {
    resetTrack();
    settings.set("paused", true);
    playlist.setCurrentTrack(null);
    controls.addClassOnPlayBtn("icon-play");
}

function toggleRepeat(repeat) {
    settings.set("repeat", repeat);
}

function toggleShuffle(shuffle) {
    var pl = playlist.getActive() || playlist.get(settings.get("activeTab"));

    settings.set("shuffle", shuffle);
    if (pl) {
        playlist.shufflePlaybackOrder(shuffle, pl);
        playlist.resetCurrentIndex();
    }
}

function setVolume(volume) {
    var player = settings.get("player");

    settings.set("volume", volume);
    if (player === "native") {
        nPlayer.setVolume(volume);
    } else if (player === "youtube") {
        ytPlayer.setVolume(volume);
    } else if (player === "soundcloud") {
        scPlayer.setVolume(volume);
    }
}

function seekTime(percent) {
    var player = settings.get("player");
    var elapsed = 0;

    if (player === "native") {
        elapsed = nPlayer.getElapsed(percent);
    } else if (player === "youtube") {
        elapsed = ytPlayer.getElapsed(percent);
    } else if (player === "soundcloud") {
        elapsed = scPlayer.getElapsed(percent);
    }
    controls.setElapsedTime(elapsed);
}

document.getElementById("js-tab-container").addEventListener("dblclick", function (event) {
    var element = main.getElementByAttr(event.target, "data-index");

    if (element) {
        var id = settings.get("activeTab");

        settings.set("manual", true);
        playTrackAtIndex(element.attrValue, id);
    }
});

exports.play = playTrack;
exports.playNext = playNextTrack;
exports.stop = stopTrack;
exports.repeat = toggleRepeat;
exports.shuffle = toggleShuffle;
exports.seek = seekTime;
exports.togglePlaying = togglePlaying;
exports.setVolume = setVolume;
exports.onTrackStart = onTrackStart;
exports.onTrackEnd = onTrackEnd;

},{"./../main.js":2,"./../playlist/playlist.js":9,"./../playlist/playlist.view.js":11,"./../settings.js":13,"./../sidebar.js":14,"./player.controls.js":3,"./player.native.js":5,"./player.soundcloud.js":6,"./player.youtube.js":7}],5:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.setVolume = exports.getElapsed = exports.playTrack = exports.stop = exports.play = undefined;

var _settings = require("./../settings.js");

var settings = _interopRequireWildcard(_settings);

var _playlist = require("./../playlist/playlist.js");

var playlist = _interopRequireWildcard(_playlist);

var _player = require("./player.js");

var player = _interopRequireWildcard(_player);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function getTime(audio) {
    return {
        currentTime: audio.currentTime,
        duration: Math.floor(audio.duration)
    };
}

function playTrack(track) {
    console.log(track);
    track.audioBlobURL = URL.createObjectURL(track.audioTrack);
    track.audio = new Audio(track.audioBlobURL);

    track.audio.oncanplay = function () {
        track.audio.volume = settings.get("volume");
        track.audio.play();
    };

    track.audio.onplaying = function () {
        player.onTrackStart(track, getTime(track.audio)).then(function () {
            var play = track.audio.play.bind(track.audio);

            player.onTrackEnd(play);
        });
    };
}

function playTrackOnButtonPress(track) {
    var audio = track.audio;

    if (audio) {
        var play = audio.play.bind(audio);
        var pause = audio.pause.bind(audio);

        player.togglePlaying(play, pause);
        return;
    }
    playTrack(track);
}

function stopTrack(track) {
    URL.revokeObjectURL(track.audioBlobURL);
    track.audio.load();
    track.audio.oncanplay = null;
    track.audio.onplaying = null;
    track.audio.onended = null;
    delete track.audioBlobURL;
    delete track.audio;
}

function setVolume(volume) {
    var track = playlist.getCurrentTrack();

    if (track) {
        track.audio.volume = volume;
    }
}

function getElapsed(percent) {
    var _playlist$getCurrentT = playlist.getCurrentTrack();

    var audio = _playlist$getCurrentT.audio;

    if (audio) {
        var elapsed = audio.duration / 100 * percent;

        audio.currentTime = elapsed;
        return elapsed;
    }
    return 0;
}

exports.play = playTrackOnButtonPress;
exports.stop = stopTrack;
exports.playTrack = playTrack;
exports.getElapsed = getElapsed;
exports.setVolume = setVolume;

},{"./../playlist/playlist.js":9,"./../settings.js":13,"./player.js":4}],6:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.setVolume = exports.getElapsed = exports.togglePlaying = exports.playTrack = exports.stop = undefined;

var _settings = require("./../settings.js");

var settings = _interopRequireWildcard(_settings);

var _player = require("./player.js");

var player = _interopRequireWildcard(_player);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

/* global SC */

var scPlayer = null;

function getTime(player) {
    return {
        currentTime: player.currentTime() / 1000,
        duration: Math.floor(player.streamInfo.duration / 1000)
    };
}

function repeatTrack() {
    scPlayer.seek(0);
    scPlayer.play();
}

function playTrack(track) {
    if (scPlayer) {
        scPlayer.seek(0);
    }
    console.log(track);
    SC.stream("/tracks/" + track.id).then(function (trackPlayer) {
        scPlayer = trackPlayer;
        trackPlayer.setVolume(settings.get("volume"));
        trackPlayer.play();

        trackPlayer.on("play-resume", function () {
            player.onTrackStart(track, getTime(scPlayer)).then(function () {
                player.onTrackEnd(repeatTrack);
            });
        });
    }).catch(function (error) {
        console.log(error);
    });
}

function togglePlaying() {
    var play = scPlayer.play.bind(scPlayer);
    var pause = scPlayer.pause.bind(scPlayer);

    player.togglePlaying(play, pause);
}

function stopTrack() {
    scPlayer.seek(0);
    scPlayer.pause();
}

function setVolume(volume) {
    scPlayer.setVolume(volume);
}

function getElapsed(percent) {
    if (scPlayer) {
        var duration = scPlayer.streamInfo.duration / 1000;
        var elapsed = duration / 100 * percent;

        scPlayer.seek(elapsed * 1000);
        return elapsed;
    }
    return 0;
}

exports.stop = stopTrack;
exports.playTrack = playTrack;
exports.togglePlaying = togglePlaying;
exports.getElapsed = getElapsed;
exports.setVolume = setVolume;

},{"./../settings.js":13,"./player.js":4}],7:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.setVolume = exports.getElapsed = exports.togglePlaying = exports.playTrack = exports.stop = undefined;

var _settings = require("./../settings.js");

var settings = _interopRequireWildcard(_settings);

var _playlist = require("./../playlist/playlist.js");

var playlist = _interopRequireWildcard(_playlist);

var _player = require("./player.js");

var player = _interopRequireWildcard(_player);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

var ytPlayer = null; /* global YT */

function getTime(player) {
    return {
        currentTime: player.getCurrentTime(),
        duration: player.getDuration()
    };
}

function onPlayerStateChange(_ref) {
    var currentState = _ref.data;

    if (currentState === YT.PlayerState.PLAYING) {
        var track = playlist.getCurrentTrack() || playlist.getNextTrack(0);

        console.log(track);
        player.onTrackStart(track, getTime(ytPlayer)).then(function () {
            var play = ytPlayer.playVideo.bind(ytPlayer);

            player.onTrackEnd(play);
        });
    }
}

function onPlayerReady() {
    var track = playlist.getNextTrack(0);

    playTrack(track);
}

function onError(error) {
    console.log(error);
}

function initPlayer() {
    ytPlayer = new YT.Player("yt-player", {
        height: "390",
        width: "640",
        videoId: "",
        events: {
            onReady: onPlayerReady,
            onStateChange: onPlayerStateChange,
            onError: onError
        }
    });
}

function togglePlaying() {
    var play = ytPlayer.playVideo.bind(ytPlayer);
    var pause = ytPlayer.pauseVideo.bind(ytPlayer);

    player.togglePlaying(play, pause);
}

function playTrack(track) {
    if (ytPlayer) {
        setVolume(settings.get("volume"));
        ytPlayer.loadVideoById(track.id);
        return;
    }
    initPlayer();
}

function stopTrack() {
    ytPlayer.stopVideo();
}

function setVolume(volume) {
    ytPlayer.setVolume(volume * 100);
}

function getElapsed(percent) {
    var duration = ytPlayer.getDuration();
    var elapsed = duration / 100 * percent;

    ytPlayer.seekTo(elapsed, true);
    return elapsed;
}

exports.stop = stopTrack;
exports.playTrack = playTrack;
exports.togglePlaying = togglePlaying;
exports.getElapsed = getElapsed;
exports.setVolume = setVolume;

},{"./../playlist/playlist.js":9,"./../settings.js":13,"./player.js":4}],8:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.showErrorMessage = exports.add = undefined;

var _main = require("./../main.js");

var main = _interopRequireWildcard(_main);

var _sidebar = require("./../sidebar.js");

var sidebar = _interopRequireWildcard(_sidebar);

var _local = require("./../local.js");

var local = _interopRequireWildcard(_local);

var _youtube = require("./../youtube.js");

var yt = _interopRequireWildcard(_youtube);

var _soundcloud = require("./../soundcloud.js");

var sc = _interopRequireWildcard(_soundcloud);

var _playlist = require("./playlist.js");

var playlist = _interopRequireWildcard(_playlist);

var _playlistManage = require("./playlist.manage.js");

var playlistManage = _interopRequireWildcard(_playlistManage);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

var provider = "";

function showErrorMessage(message) {
    var element = document.getElementById("js-remote-notice");

    element.textContent = message;
    element.classList.add("show");

    setTimeout(function () {
        element.textContent = "";
        element.classList.remove("show");
    }, 4000);
}

function importPlaylist(name, value) {
    console.log("fetching " + name + " playlist");

    if (name === "youtube") {
        yt.fetchPlaylist(value);
    } else if (name === "soundcloud") {
        sc.fetchPlaylist(value);
    }
}

function addPlaylist(pl) {
    var existingPlaylist = playlist.get(pl.id);

    if (existingPlaylist) {
        playlistManage.remove(existingPlaylist.id);
    }
    playlistManage.init(playlist.create(pl), "grid", true);
}

function setProvider(item) {
    var newProvider = item.attrValue;

    if (newProvider !== provider) {
        provider = newProvider;
        main.removeClassFromElement("playlist-provider", "selected");
        item.element.classList.add("selected");
        document.getElementById("js-import-form-container").classList.add("show");
    }
    main.scriptLoader.load("js/libs/sdk.js", sc.init);
}

function showFilePicker(choice) {
    var filePicker = document.getElementById("js-file-chooser");
    var clickEvent = new MouseEvent("click");

    if (choice === "file") {
        filePicker.removeAttribute("webkitdirectory");
        filePicker.removeAttribute("directory");
        filePicker.setAttribute("multiple", true);
    } else if (choice === "folder") {
        filePicker.removeAttribute("multiple");
        filePicker.setAttribute("webkitdirectory", true);
        filePicker.setAttribute("directory", true);
    }
    filePicker.dispatchEvent(clickEvent);
    main.scriptLoader.load("js/libs/metadata-audio-parser.js");
}

function editPlaylistTitle(action, target, titleElement, playlistId) {
    target.setAttribute("title", action[0].toUpperCase() + action.slice(1));
    target.setAttribute("data-action", action);
    target.classList.toggle("active");

    if (action === "save") {
        titleElement.removeAttribute("readonly");
        titleElement.focus();
        titleElement.selectionStart = 0;
        titleElement.selectionEnd = titleElement.value.length;
    } else if (action === "edit") {
        var pl = playlist.get(playlistId);

        if (!titleElement.value) {
            titleElement.value = pl.title;
        }

        var newTitle = titleElement.value;

        if (newTitle !== pl.title) {
            pl.title = newTitle;
            sidebar.editEntry(playlistId, newTitle);
            titleElement.setAttribute("value", newTitle);
            playlist.save(pl);
        }
        titleElement.setAttribute("readonly", "readonly");
    }
}

document.getElementById("js-file-chooser").addEventListener("change", function (event) {
    local.addTracks(event.target.files);
    event.target.value = "";
});

document.getElementById("js-playlist-import-form").addEventListener("submit", function (event) {
    var form = event.target;

    var value = form.elements["playlist-id"].value.trim();

    if (value) {
        importPlaylist(provider, value);
        form.reset();
    }
    event.preventDefault();
});

document.getElementById("js-playlist-entries").addEventListener("click", function (_ref) {
    var target = _ref.target;

    var action = target.getAttribute("data-action");
    var entry = main.getElementByAttr(target, "data-id");

    if (!entry) {
        return;
    }

    if (action === "remove") {
        playlistManage.remove(entry.attrValue, entry.element);
        return;
    }

    var nextAction = "";

    if (action === "save") {
        nextAction = "edit";
    } else if (action === "edit") {
        nextAction = "save";
    }

    if (nextAction) {
        var titleElement = entry.element.querySelector(".playlist-entry-title");

        editPlaylistTitle(nextAction, target, titleElement, entry.attrValue);
    }
});

document.getElementById("js-playlist-add-options").addEventListener("click", function (_ref2) {
    var target = _ref2.target;

    var item = main.getElementByAttr(target, "data-choice");

    if (!item) {
        return;
    }

    var choice = item.attrValue;

    if (choice === "file" || choice === "folder") {
        showFilePicker(choice);
        return;
    }
    setProvider(item);
});

window.addEventListener("DOMContentLoaded", function onLoad() {
    Object.keys(localStorage).forEach(function (item) {
        if (item.startsWith("yt-pl-") || item.startsWith("sc-pl-")) {
            var pl = JSON.parse(localStorage.getItem(item));

            main.scriptLoader.load("https://www.youtube.com/iframe_api");
            main.scriptLoader.load("js/libs/sdk.js", sc.init);
            playlistManage.init(playlist.create(pl), "grid", false);
        }
    });
    window.removeEventListener("DOMContentLoaded", onLoad);
});

exports.add = addPlaylist;
exports.showErrorMessage = showErrorMessage;

},{"./../local.js":1,"./../main.js":2,"./../sidebar.js":14,"./../soundcloud.js":15,"./../youtube.js":16,"./playlist.js":9,"./playlist.manage.js":10}],9:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
var playlists = {};
var activePlaylistId = "";
var currentTrack = null;
var currentIndex = 0;

function getAllPlaylists() {
    return playlists;
}

function getPlaylistById(id) {
    return playlists[id];
}

function savePlaylist(pl) {
    var toSave = {
        id: pl.id,
        order: -pl.order,
        shuffled: pl.shuffled,
        sortedBy: pl.sortedBy,
        playbackOrder: pl.playbackOrder,
        title: pl.title
    };

    if (pl.id.startsWith("yt-pl-") || pl.id.startsWith("sc-pl-")) {
        toSave.tracks = pl.tracks;
    }

    localStorage.setItem(pl.id, JSON.stringify(toSave));
}

function createPlaylist(pl) {
    playlists[pl.id] = Object.assign({
        sortedBy: "",
        order: 0,
        shuffled: false,
        tracks: pl.tracks || [],
        playbackOrder: []
    }, pl, JSON.parse(localStorage.getItem(pl.id)) || {});
    console.log(playlists);
    return playlists[pl.id];
}

function removePlaylist(id) {
    delete playlists[id];
    localStorage.removeItem(id);
    console.log(playlists);
}

function setActivePlaylist(id) {
    if (playlists.hasOwnProperty(id)) {
        activePlaylistId = id;
    }
}

function getActivePlaylistId() {
    return activePlaylistId;
}

function isActive(id) {
    return id === activePlaylistId;
}

function getActivePlaylist() {
    return playlists[activePlaylistId];
}

function setCurrentTrack(track) {
    currentTrack = track;
}

function getCurrentTrack() {
    return currentTrack;
}

function setCurrentIndex(index) {
    var playlist = getActivePlaylist();

    currentIndex = playlist.playbackOrder.indexOf(Number.parseInt(index, 10));
    console.log(index, currentIndex);
}

function resetCurrentIndex() {
    var currentTrack = getCurrentTrack();

    if (currentTrack) {
        setCurrentIndex(currentTrack.index);
    }
}

function getCurrentTrackIndex() {
    var playlist = getActivePlaylist();

    return playlist.playbackOrder[currentIndex];
}

function setTrackIndexes(pl, shuffle) {
    if (!getPlaylistById(pl.id)) {
        console.log("setTrackIndexes", "creating playlist");
        pl = createPlaylist(pl);
    }

    pl.playbackOrder = pl.tracks.map(function (track) {
        return track.index;
    });

    if (shuffle) {
        shufflePlaybackOrder(true, pl);
        resetCurrentIndex();
    } else {
        savePlaylist(pl);
    }
}

function shuffleArray(array) {
    var index = array.length;

    while (index) {
        var randomIndex = Math.floor(Math.random() * index);

        index -= 1;
        var _ref = [array[randomIndex], array[index]];
        array[index] = _ref[0];
        array[randomIndex] = _ref[1];
    }
    return array;
}

function shufflePlaybackOrder(shuffle, pl) {
    pl.shuffled = shuffle;
    if (shuffle) {
        pl.playbackOrder = shuffleArray(pl.playbackOrder);
    } else {
        pl.playbackOrder.sort(function (a, b) {
            return a - b;
        });
    }
    console.log(pl.playbackOrder);
    savePlaylist(pl);
}

function decrementIndex() {
    currentIndex -= 1;
}

function getNextTrackIndex(direction) {
    var _getActivePlaylist = getActivePlaylist();

    var playbackOrder = _getActivePlaylist.playbackOrder;

    currentIndex += direction;
    if (currentIndex === playbackOrder.length) {
        currentIndex = 0;
    }
    if (currentIndex === -1) {
        currentIndex = playbackOrder.length - 1;
    }
    return playbackOrder[currentIndex];
}

function getTrackAtIndex(index) {
    var playlist = getActivePlaylist();

    return playlist.tracks[index];
}

function getNextTrack(direction) {
    var index = getNextTrackIndex(direction);
    var track = getTrackAtIndex(index);

    setCurrentTrack(track);
    setCurrentIndex(track.index);
    return track;
}

function sortArray(tracks, sort, order) {
    tracks.sort(function (a, b) {
        var aValue = a[sort].toLowerCase();
        var bValue = b[sort].toLowerCase();

        if (aValue < bValue) {
            return -1 * order;
        }
        if (aValue > bValue) {
            return 1 * order;
        }
        return 0;
    });
}

function sortPlaylist(pl, sortBy) {
    if (pl.sortedBy === sortBy && pl.order === 1) {
        pl.order = -1;
    } else {
        pl.order = 1;
    }
    pl.sortedBy = sortBy;
    sortArray(pl.tracks, sortBy, pl.order);
    savePlaylist(pl);
}

exports.get = getPlaylistById;
exports.create = createPlaylist;
exports.remove = removePlaylist;
exports.save = savePlaylist;
exports.sort = sortPlaylist;
exports.getAll = getAllPlaylists;
exports.getActive = getActivePlaylist;
exports.setActive = setActivePlaylist;
exports.isActive = isActive;
exports.getActivePlaylistId = getActivePlaylistId;
exports.setCurrentTrack = setCurrentTrack;
exports.getCurrentTrack = getCurrentTrack;
exports.getNextTrackIndex = getNextTrackIndex;
exports.getNextTrack = getNextTrack;
exports.setCurrentIndex = setCurrentIndex;
exports.resetCurrentIndex = resetCurrentIndex;
exports.getCurrentTrackIndex = getCurrentTrackIndex;
exports.getTrackAtIndex = getTrackAtIndex;
exports.setTrackIndexes = setTrackIndexes;
exports.shufflePlaybackOrder = shufflePlaybackOrder;
exports.decrementIndex = decrementIndex;

},{}],10:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.remove = exports.appendTo = exports.init = undefined;

var _router = require("./../router.js");

var router = _interopRequireWildcard(_router);

var _main = require("./../main.js");

var main = _interopRequireWildcard(_main);

var _settings = require("./../settings.js");

var settings = _interopRequireWildcard(_settings);

var _sidebar = require("./../sidebar.js");

var sidebar = _interopRequireWildcard(_sidebar);

var _local = require("./../local.js");

var local = _interopRequireWildcard(_local);

var _player = require("./../player/player.js");

var player = _interopRequireWildcard(_player);

var _playlist = require("./playlist.js");

var playlist = _interopRequireWildcard(_playlist);

var _playlistView = require("./playlist.view.js");

var playlistView = _interopRequireWildcard(_playlistView);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

var timeout = 0;

function initPlaylist(pl, view, toggle) {
    var route = "playlist/" + pl.id;

    if (!pl.playbackOrder.length) {
        playlist.setTrackIndexes(pl, settings.get("shuffle"));
    }

    router.add(route);
    playlistView.add(pl, view);
    sidebar.createEntry(pl.title, pl.id);
    createPlaylistEntry(pl.title, pl.id);

    if (pl.sortedBy) {
        playlist.sort(pl, pl.sortedBy);
        updatePlaylist(pl);
    }

    if (toggle && router.isActive("add")) {
        router.toggle(route);
    } else if (router.isActive(pl.id)) {
        main.toggleTab(pl.id);
    }
}

function appendToPlaylist(pl, tracks, view, toggle) {
    playlist.setTrackIndexes(pl, settings.get("shuffle"));
    playlistView.append(pl.id, tracks, view);

    if (toggle) {
        var route = "playlist/" + pl.id;

        router.toggle(route);
    }
}

function removePlaylist(id, entry) {
    playlistView.remove(id);

    if (id === "local-files") {
        local.worker.postMessage({ action: "clear" });
    }

    if (playlist.isActive(id)) {
        player.stop();
    }

    if (!entry) {
        entry = document.querySelector("[data-id=" + id + "]");
    }
    entry.parentElement.removeChild(entry);

    playlist.remove(id);
    sidebar.removeEntry(id);
}

function updatePlaylist(pl) {
    var currentTrack = playlist.getCurrentTrack();

    main.removeClassFromElement("track", "selected");
    playlistView.update(pl);

    if (currentTrack && playlist.isActive(pl.id)) {
        playlistView.showPlayingTrack(currentTrack.index, pl.id, false);
        playlist.setCurrentIndex(currentTrack.index);
    }
}

function filterTracks(tracks, trackElements, query) {
    tracks.forEach(function (track) {
        var trackElement = trackElements[track.index];
        var title = track.title ? track.title.toLowerCase() : "";
        var artist = track.artist ? track.artist.toLowerCase() : "";
        var album = track.album ? track.album.toLowerCase() : "";

        if (!title.includes(query) && !artist.includes(query) && !album.includes(query)) {
            trackElement.classList.add("hidden");
        } else {
            trackElement.classList.remove("hidden");
        }
    });
}

function createPlaylistEntry(title, id) {
    var playlistEntryContainer = document.getElementById("js-playlist-entries");
    var entry = "\n        <li class=\"playlist-entry\" data-id=" + id + ">\n            <input type=\"text\" class=\"input playlist-entry-title\" value=\"" + title + "\" readonly>\n            <span>\n                <button class=\"icon-pencil font-btn playlist-entry-btn\"\n                    data-action=\"edit\" title=\"Edit playlist title\"></button>\n                <button class=\"icon-trash font-btn playlist-entry-btn\"\n                    data-action=\"remove\" title=\"Remove playlist\"></button>\n            </span>\n        </li>\n    ";

    playlistEntryContainer.insertAdjacentHTML("beforeend", entry);
}

function sortPlaylist(sortBy) {
    var pl = playlist.get(settings.get("activeTab"));
    var query = document.getElementById("js-" + pl.id + "-filter-input").value.trim();

    playlist.sort(pl, sortBy);
    updatePlaylist(pl);

    if (query) {
        var trackElements = document.getElementById("js-" + pl.id).children;

        query = query.toLowerCase();
        filterTracks(pl.tracks, trackElements, query);
    }
}

function selectedTrackElement(element) {
    main.removeClassFromElement("track", "selected");
    element.classList.add("selected");
}

function removeTrack(pl, playlistElement, trackElement) {
    var index = Number.parseInt(trackElement.getAttribute("data-index"), 10);
    var currentTrack = playlist.getCurrentTrack();
    var currentIndex = currentTrack ? currentTrack.index : -1;
    var shuffle = settings.get("shuffle");

    if (pl.id === "local-files") {
        var trackName = pl.tracks[index].name;

        local.worker.postMessage({
            action: "remove",
            name: trackName
        });
    } else if (pl.id.startsWith("yt-pl-") || pl.id.startsWith("sc-pl-")) {
        pl.deleted = pl.deleted || [];
        pl.deleted.push(pl.tracks[index].id);
    }

    playlistElement.removeChild(trackElement);
    pl.tracks.splice(index, 1);
    pl.tracks.forEach(function (track, index) {
        track.index = index;
        playlistElement.children[index].setAttribute("data-index", index);
    });
    playlist.setTrackIndexes(pl, shuffle, true);

    if (currentTrack && currentIndex === index) {
        if (!settings.get("paused")) {
            player.playNext(0);
        } else {
            player.stop();
        }
    } else if (currentIndex > index && !shuffle) {
        playlist.decrementIndex();
    }
}

document.getElementById("js-tab-container").addEventListener("click", function (_ref) {
    var target = _ref.target;

    var sortBy = target.getAttribute("data-sort");

    if (sortBy) {
        sortPlaylist(sortBy);
        return;
    }

    var item = main.getElementByAttr(target, "data-index");

    if (item) {
        selectedTrackElement(item.element);
    }
});

window.addEventListener("keyup", function (_ref2) {
    var target = _ref2.target;

    if (timeout) {
        clearTimeout(timeout);
    }

    timeout = setTimeout(function () {
        if (target.classList.contains("filter-input")) {
            var pl = playlist.get(settings.get("activeTab"));
            var trackElements = document.getElementById("js-" + pl.id).children;
            var query = target.value.trim().toLowerCase();

            filterTracks(pl.tracks, trackElements, query);
        }
    }, 400);
});

window.addEventListener("keypress", function (event) {
    var key = event.key === "Delete" || event.keyCode === 127;
    var pl = playlist.get(settings.get("activeTab"));

    if (!key || !pl) {
        return;
    }

    var playlistContainer = document.getElementById("js-" + pl.id);
    var selected = playlistContainer.querySelector(".track.selected");

    if (!selected) {
        return;
    }
    removeTrack(pl, playlistContainer, selected);
});

exports.init = initPlaylist;
exports.appendTo = appendToPlaylist;
exports.remove = removePlaylist;

},{"./../local.js":1,"./../main.js":2,"./../player/player.js":4,"./../router.js":12,"./../settings.js":13,"./../sidebar.js":14,"./playlist.js":9,"./playlist.view.js":11}],11:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.showPlayingTrack = exports.scrollToTrack = exports.append = exports.update = exports.remove = exports.add = undefined;

var _main = require("./../main.js");

function createListItem(track) {
    return "\n        <li class=\"list-item track\" data-index=\"" + track.index + "\">\n            <span>" + track.title + "</span>\n            <span>" + track.artist + "</span>\n            <span>" + track.album + "</span>\n            <span>" + track.duration + "</span>\n        </li>\n    ";
}

function createList(id, items) {
    return "\n        <ul class=\"list list-view-header\">\n            <li class=\"list-view-header-item\">\n                <span data-sort=\"title\">TITLE</span>\n            </li>\n            <li class=\"list-view-header-item\">\n                <span data-sort=\"artist\">ARTIST</span>\n            </li>\n            <li class=\"list-view-header-item\">\n                <span data-sort=\"album\">ALBUM</span>\n            </li>\n            <li class=\"list-view-header-item\">\n                <span data-sort=\"duration\">LENGTH</span>\n            </li>\n        </ul>\n        <ul id=\"js-" + id + "\" class=\"list list-view\">" + items + "</ul>\n    ";
}

function createGridItem(item) {
    var title = item.title;

    if (title.length > 64) {
        title = title.slice(0, 64) + "...";
    }
    return "\n        <li class=\"grid-item track\" data-index=\"" + item.index + "\">\n            <div class=\"grid-item-thumb-container\">\n                <div class=\"grid-item-duration\">" + item.duration + "</div>\n                <img src=\"" + item.thumbnail + "\" class=\"grid-item-thumb\">\n            </div>\n            <div title=\"" + item.title + "\">" + title + "</div>\n        </li>\n    ";
}

function createGrid(id, items) {
    return "\n        <div class=\"grid-view-sort-select\">\n            <button class=\"font-btn\" data-sort=\"title\">Title</button>\n            <button class=\"font-btn\" data-sort=\"duration\">Duration</button>\n        </div>\n        <ul id=\"js-" + id + "\" class=\"list grid-view\">" + items + "</ul>\n    ";
}

function createItems(cb, tracks) {
    return tracks.map(function (item) {
        return cb(item);
    }).join("");
}

function createPlaylistTab(_ref, view) {
    var id = _ref.id;
    var tracks = _ref.tracks;

    var playlist = "";

    if (view === "list") {
        playlist = createList(id, createItems(createListItem, tracks));
    } else if (view === "grid") {
        playlist = createGrid(id, createItems(createGridItem, tracks));
    }

    return "\n        <div id=\"js-tab-" + id + "\" class=\"tab\">\n            <div class=\"playlist-header\">\n                <input type=\"text\" class=\"input filter-input\"\n                    id=\"js-" + id + "-filter-input\"\n                    placeholder=\"Filter\">\n            </div>\n            <div class=\"playlist-container\">" + playlist + "</div>\n        </div>\n    ";
}

function addPlaylistTab(pl, view) {
    var tab = createPlaylistTab(pl, view);
    var container = document.getElementById("js-tab-container");

    container.insertAdjacentHTML("beforeend", tab);
}

function appendToPlaylist(id, tracks, view) {
    var playlist = document.getElementById("js-" + id);
    var cb = null;

    if (view === "list") {
        cb = createListItem;
    } else if (view === "grid") {
        cb = createGridItem;
    }
    playlist.insertAdjacentHTML("beforeend", createItems(cb, tracks));
}

function updateTrackListView(track, trackElement) {
    trackElement[0].textContent = track.title;
    trackElement[1].textContent = track.artist;
    trackElement[2].textContent = track.album;
    trackElement[3].textContent = track.duration;
}

function updateTrackGridView(track, trackElement) {
    var title = track.title.length > 64 ? track.title.slice(0, 64) + "..." : track.title;

    trackElement[0].children[0].textContent = track.duration;
    trackElement[0].children[1].setAttribute("src", track.thumbnail);
    trackElement[1].setAttribute("title", track.title);
    trackElement[1].textContent = title;
}

function updatePlaylist(pl) {
    var trackElements = document.getElementById("js-" + pl.id).children;
    var cb = null;

    if (pl.id === "local-files") {
        cb = updateTrackListView;
    } else {
        cb = updateTrackGridView;
    }

    pl.tracks.forEach(function (track, index) {
        var trackElement = trackElements[index].children;

        track.index = index;
        cb(track, trackElement);
    });
}

function removePlaylistTab(id) {
    var playlistTab = document.getElementById("js-tab-" + id);

    playlistTab.parentElement.removeChild(playlistTab);
}

function scrollToTrack(trackElement, playlistElement) {
    var elementHeight = trackElement.offsetHeight;
    var trackTop = trackElement.offsetTop;
    var playlistScrollTop = playlistElement.scrollTop;
    var playlistClientHeight = playlistElement.clientHeight;
    var visiblePlaylistOffset = playlistScrollTop + playlistClientHeight;

    if (trackTop - elementHeight < playlistScrollTop || trackTop > visiblePlaylistOffset) {
        playlistElement.scrollTop = trackTop - playlistClientHeight / 2;
    }
}

function showPlayingTrack(index, id, manual) {
    var container = document.getElementById("js-" + id);
    var track = container.children[index];

    (0, _main.removeClassFromElement)("track", "playing");
    track.classList.add("playing");

    if (!manual) {
        scrollToTrack(track, container);
    }
}

exports.add = addPlaylistTab;
exports.remove = removePlaylistTab;
exports.update = updatePlaylist;
exports.append = appendToPlaylist;
exports.scrollToTrack = scrollToTrack;
exports.showPlayingTrack = showPlayingTrack;

},{"./../main.js":2}],12:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.isActive = exports.toggle = exports.add = undefined;

var _main = require("./main.js");

var main = _interopRequireWildcard(_main);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

var routes = ["add", "404"];

function contains(hash) {
    return routes.some(function (route) {
        return route === hash;
    });
}

function isActive(route) {
    return window.location.hash.includes(route);
}

function isPlaylistRoute(route) {
    return (/^playlist\/.+/.test(route)
    );
}

function addRoute(route) {
    if (!contains(route)) {
        routes.push(route);
    }
}

function toggleRoute(route) {
    window.location.hash = "/" + route;
}

function toggleTab(route) {
    var tab = "";

    if (!route) {
        toggleRoute("add");
        return;
    }
    if (route !== "404" && !contains(route)) {
        toggleRoute("404");
        return;
    }

    if (isPlaylistRoute(route)) {
        tab = route.slice(route.lastIndexOf("/") + 1);
    } else {
        tab = route.replace(/\//g, "-");
    }

    if (tab && document.getElementById("js-tab-" + tab)) {
        main.toggleTab(tab, tab === "404");
        return;
    }
}

window.addEventListener("hashchange", function (event) {
    var route = event.newURL.split("#/")[1];

    toggleTab(route);
});

window.addEventListener("DOMContentLoaded", function addPlaylistRoutes() {
    var route = window.location.hash.slice(2);

    Object.keys(localStorage).forEach(function (item) {
        if (item !== "settings") {
            addRoute("playlist/" + item);
        }
    });
    toggleTab(route);
    window.removeEventListener("DOMContentLoaded", addPlaylistRoutes);
});

exports.add = addRoute;
exports.toggle = toggleRoute;
exports.isActive = isActive;

},{"./main.js":2}],13:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
var settings = Object.assign({
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

exports.set = set;
exports.get = get;

},{}],14:[function(require,module,exports){
"use strict";

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

Object.defineProperty(exports, "__esModule", {
    value: true
});
function getEntry(id) {
    return document.querySelector("[data-tab-item=" + id + "]");
}

function createSidebarEntry(title, id) {
    var sidebarEntries = document.getElementById("js-sidebar-playlist-entries");
    var newEntry = "\n        <li>\n            <a href=\"#/playlist/" + id + "\" class=\"font-btn sidebar-btn js-tab-select-btn\"\n                data-tab-item=\"" + id + "\">\n                <span class=\"sidebar-playlist-title\">" + title + "</span>\n                <span class=\"icon-volume-up is-playlist-active hidden\"></span>\n            </a>\n        </li>";

    sidebarEntries.insertAdjacentHTML("beforeend", newEntry);
}

function editSidebarEntry(id, title) {
    var entry = getEntry(id);

    entry.children[0].textContent = title;
}

function removeSidebarEntry(id) {
    var entry = getEntry(id);

    entry.parentElement.removeChild(entry);
}

function showActiveIcon(id) {
    var entry = getEntry(id);
    var icon = entry.querySelector(".is-playlist-active");

    icon.classList.remove("hidden");
}

function hideActiveIcon() {
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
        for (var _iterator = document.querySelectorAll(".js-tab-select-btn")[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            var btn = _step.value;

            var icon = btn.children[1];

            if (icon && !icon.classList.contains("hidden")) {
                icon.classList.add("hidden");
            }
        }
    } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
    } finally {
        try {
            if (!_iteratorNormalCompletion && _iterator.return) {
                _iterator.return();
            }
        } finally {
            if (_didIteratorError) {
                throw _iteratorError;
            }
        }
    }
}

function showSidebarFooter() {
    var sidebarFooter = document.getElementById("js-sidebar-footer");

    if (!sidebarFooter.classList.contains("show")) {
        sidebarFooter.classList.add("show");
    }
}

function setTrackArt(track) {
    var artwork = document.getElementById("js-player-track-art");
    var artPlaceholder = "./assets/images/album-art-placeholder.png";

    if (track && track.thumbnail) {
        var art = track.thumbnail;

        if ((typeof art === "undefined" ? "undefined" : _typeof(art)) === "object") {
            art = URL.createObjectURL(art);
        }
        artwork.src = art;
    } else {
        artwork.src = artPlaceholder;
    }
}

function showTrackInfo(track) {
    var trackInfo = document.getElementById("js-player-track-info");

    var _trackInfo$children = _slicedToArray(trackInfo.children, 2);

    var trackTitle = _trackInfo$children[0];
    var trackArtist = _trackInfo$children[1];

    setTrackArt(track);

    if (!track) {
        trackTitle.textContent = "";
        trackArtist.textContent = "";
        document.title = "ve2ry";
        return;
    }
    if (track.artist && track.title) {
        trackTitle.textContent = track.title;
        trackArtist.textContent = track.artist;
        document.title = track.artist + " - " + track.title;
    } else {
        var title = track.name || track.title;

        trackTitle.textContent = "";
        trackArtist.textContent = title;
        document.title = title;
    }
    showSidebarFooter();
}

exports.createEntry = createSidebarEntry;
exports.editEntry = editSidebarEntry;
exports.removeEntry = removeSidebarEntry;
exports.showTrackInfo = showTrackInfo;
exports.showActiveIcon = showActiveIcon;
exports.hideActiveIcon = hideActiveIcon;

},{}],15:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.fetchPlaylist = exports.init = undefined;

var _main = require("./main.js");

var _playlistAdd = require("./playlist/playlist.add.js");

var playlistAdd = _interopRequireWildcard(_playlistAdd);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

/* global SC */

function init() {
    SC.initialize({
        client_id: ""
    });
}

function parseTracks(tracks) {
    return tracks.map(function (track, index) {
        return {
            duration: (0, _main.formatTime)(track.duration / 1000),
            id: track.id,
            index: index,
            thumbnail: track.artwork_url || "assets/images/album-art-placeholder.png",
            title: track.title
        };
    });
}

function fetchPlaylist(url) {
    SC.resolve(url).then(function (playlist) {
        if (Array.isArray(playlist)) {
            return {
                id: "sc-pl-" + playlist[0].user_id,
                title: playlist[0].user.username + " tracks",
                tracks: parseTracks(playlist)
            };
        }
        return {
            id: "sc-pl-" + playlist.id,
            title: playlist.title,
            tracks: parseTracks(playlist.tracks)
        };
    }).then(playlistAdd.add).catch(function (error) {
        console.log(error);
        if (error.status === 404) {
            playlistAdd.showErrorMessage("Playlist was not found");
        }
    });
}

exports.init = init;
exports.fetchPlaylist = fetchPlaylist;

},{"./main.js":2,"./playlist/playlist.add.js":8}],16:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.fetchPlaylist = undefined;

var _main = require("./main.js");

var _playlistAdd = require("./playlist/playlist.add.js");

var playlistAdd = _interopRequireWildcard(_playlistAdd);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function parseItems(playlist) {
    playlist.id = "yt-pl-" + playlist.id;
    playlist.tracks = playlist.tracks.map(function (track, index) {
        return {
            index: index,
            id: track.snippet.resourceId.videoId,
            duration: track.snippet.duration,
            title: track.snippet.title,
            thumbnail: track.snippet.thumbnails.default.url
        };
    });
    delete playlist.token;
    return playlist;
}

function parseDuration(duration) {
    var units = ["H", "M", "S"];

    duration = duration.slice(2);
    return units.map(function (unit) {
        var newDuration = "";

        if (duration.includes(unit)) {
            duration = duration.split(unit);
            if (duration.length === 2) {
                var value = Number.parseInt(duration[0], 10);

                newDuration += value >= 10 ? value : "0" + value;
                if (unit !== "S") {
                    newDuration += ":";
                    duration = duration.slice(1)[0];
                }
            }
        } else if (unit === "S") {
            newDuration += "00";
        }
        return newDuration;
    }).join("");
}

function getVideoDuration(playlist) {
    var ids = playlist.items.map(function (item) {
        return item.snippet.resourceId.videoId;
    }).join();

    return getYoutube("videos", "contentDetails", "id", ids).then(function (data) {
        playlist.items = playlist.items.map(function (item, index) {
            item.snippet.duration = parseDuration(data.items[index].contentDetails.duration);
            return item;
        });
        return playlist;
    });
}

function getYoutube(path, part, filter, id, token) {
    var key = "";
    var params = "part=" + part + "&" + filter + "=" + id + "&maxResults=50&key=" + key;

    if (token) {
        params += "&pageToken=" + token;
    }
    return fetch("https://www.googleapis.com/youtube/v3/" + path + "?" + params).then(function (response) {
        return response.json();
    }).catch(function (error) {
        console.log(error);
    });
}

function getPlaylistItems(playlist) {
    return getYoutube("playlistItems", "snippet", "playlistId", playlist.id, playlist.token).then(function (data) {
        data.items = data.items.filter(function (item) {
            var title = item.snippet.title;

            return title !== "Deleted video" && title !== "Private video";
        });
        return data;
    }).then(getVideoDuration).then(function (data) {
        var _playlist$tracks;

        playlist.token = data.nextPageToken;
        (_playlist$tracks = playlist.tracks).push.apply(_playlist$tracks, _toConsumableArray(data.items));

        if (playlist.token) {
            return getPlaylistItems(playlist);
        }
        return playlist;
    });
}

function fetchPlaylist(url) {
    var id = url.includes("list=") ? url.split("list=")[1] : url;

    getYoutube("playlists", "snippet", "id", id).then(function (data) {
        if (!data.items.length) {
            playlistAdd.showErrorMessage("Playlist was not found");
            return;
        }
        return {
            id: id,
            title: data.items[0].snippet.title,
            tracks: []
        };
    }).then(getPlaylistItems).then(parseItems).then(playlistAdd.add).catch(function (error) {
        console.log(error);
    });
    _main.scriptLoader.load("https://www.youtube.com/iframe_api");
}

exports.fetchPlaylist = fetchPlaylist;

},{"./main.js":2,"./playlist/playlist.add.js":8}],17:[function(require,module,exports){
"use strict";

require("./dev/settings.js");

require("./dev/router.js");

require("./dev/main.js");

require("./dev/sidebar.js");

require("./dev/local.js");

require("./dev/youtube.js");

require("./dev/soundcloud.js");

require("./dev/playlist/playlist.add.js");

require("./dev/playlist/playlist.manage.js");

require("./dev/playlist/playlist.view.js");

require("./dev/playlist/playlist.js");

require("./dev/player/player.controls.js");

require("./dev/player/player.js");

require("./dev/player/player.native.js");

require("./dev/player/player.youtube.js");

require("./dev/player/player.soundcloud.js");

},{"./dev/local.js":1,"./dev/main.js":2,"./dev/player/player.controls.js":3,"./dev/player/player.js":4,"./dev/player/player.native.js":5,"./dev/player/player.soundcloud.js":6,"./dev/player/player.youtube.js":7,"./dev/playlist/playlist.add.js":8,"./dev/playlist/playlist.js":9,"./dev/playlist/playlist.manage.js":10,"./dev/playlist/playlist.view.js":11,"./dev/router.js":12,"./dev/settings.js":13,"./dev/sidebar.js":14,"./dev/soundcloud.js":15,"./dev/youtube.js":16}]},{},[17])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvanMvZGV2L2xvY2FsLmpzIiwic3JjL2pzL2Rldi9tYWluLmpzIiwic3JjL2pzL2Rldi9wbGF5ZXIvcGxheWVyLmNvbnRyb2xzLmpzIiwic3JjL2pzL2Rldi9wbGF5ZXIvcGxheWVyLmpzIiwic3JjL2pzL2Rldi9wbGF5ZXIvcGxheWVyLm5hdGl2ZS5qcyIsInNyYy9qcy9kZXYvcGxheWVyL3BsYXllci5zb3VuZGNsb3VkLmpzIiwic3JjL2pzL2Rldi9wbGF5ZXIvcGxheWVyLnlvdXR1YmUuanMiLCJzcmMvanMvZGV2L3BsYXlsaXN0L3BsYXlsaXN0LmFkZC5qcyIsInNyYy9qcy9kZXYvcGxheWxpc3QvcGxheWxpc3QuanMiLCJzcmMvanMvZGV2L3BsYXlsaXN0L3BsYXlsaXN0Lm1hbmFnZS5qcyIsInNyYy9qcy9kZXYvcGxheWxpc3QvcGxheWxpc3Qudmlldy5qcyIsInNyYy9qcy9kZXYvcm91dGVyLmpzIiwic3JjL2pzL2Rldi9zZXR0aW5ncy5qcyIsInNyYy9qcy9kZXYvc2lkZWJhci5qcyIsInNyYy9qcy9kZXYvc291bmRjbG91ZC5qcyIsInNyYy9qcy9kZXYveW91dHViZS5qcyIsInNyYy9qcy9pbmRleC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7Ozs7Ozs7O0lDR1k7Ozs7SUFDQTs7Ozs7O0FBRVosSUFBSSxTQUFTLFlBQVQ7O0FBRUosSUFBTSxXQUFXLFlBQVk7QUFDekIsUUFBTSxXQUFXLFNBQVMsY0FBVCxDQUF3QixrQkFBeEIsQ0FBWCxDQURtQjs7QUFHekIsYUFBUyxZQUFULENBQXNCLElBQXRCLEVBQTRCLEtBQTVCLEVBQW1DO0FBQy9CLGlCQUFTLFlBQVQsQ0FBc0IsSUFBdEIsRUFBNEIsS0FBNUIsRUFEK0I7S0FBbkM7O0FBSUEsYUFBUyxhQUFULEdBQXlCO0FBQ3JCLGlCQUFTLFNBQVQsQ0FBbUIsTUFBbkIsQ0FBMEIsTUFBMUIsRUFE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bnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIvKiBnbG9iYWwgcGFyc2VfYXVkaW9fbWV0YWRhdGEgKi9cblxuaW1wb3J0IHsgZm9ybWF0VGltZSB9IGZyb20gXCIuL21haW4uanNcIjtcbmltcG9ydCAqIGFzIHBsYXlsaXN0TWFuYWdlIGZyb20gXCIuL3BsYXlsaXN0L3BsYXlsaXN0Lm1hbmFnZS5qc1wiO1xuaW1wb3J0ICogYXMgcGxheWxpc3QgZnJvbSBcIi4vcGxheWxpc3QvcGxheWxpc3QuanNcIjtcblxubGV0IHdvcmtlciA9IGluaXRXb3JrZXIoKTtcblxuY29uc3QgcHJvZ3Jlc3MgPSAoZnVuY3Rpb24oKSB7XG4gICAgY29uc3QgcHJvZ3Jlc3MgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImpzLWZpbGUtcHJvZ3Jlc3NcIik7XG5cbiAgICBmdW5jdGlvbiBzZXRBdHRyVmFsdWUoYXR0ciwgdmFsdWUpIHtcbiAgICAgICAgcHJvZ3Jlc3Muc2V0QXR0cmlidXRlKGF0dHIsIHZhbHVlKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiB0b2dnbGVFbGVtZW50KCkge1xuICAgICAgICBwcm9ncmVzcy5jbGFzc0xpc3QudG9nZ2xlKFwic2hvd1wiKTtcbiAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJqcy1sb2NhbC1ub3RpY2VcIikuY2xhc3NMaXN0LnRvZ2dsZShcInNob3dcIik7XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgdG9nZ2xlOiB0b2dnbGVFbGVtZW50LFxuICAgICAgICBzZXRBdHRyVmFsdWVcbiAgICB9O1xufSkoKTtcblxuZnVuY3Rpb24gaW5pdFdvcmtlcigpIHtcbiAgICBjb25zdCBkYldvcmtlciA9IG5ldyBXb3JrZXIoXCJqcy93b3JrZXJzL3dvcmtlcjEuanNcIik7XG5cbiAgICBkYldvcmtlci5vbm1lc3NhZ2UgPSBmdW5jdGlvbihldmVudCkge1xuICAgICAgICBjb25zdCBkYXRhID0gZXZlbnQuZGF0YTtcblxuICAgICAgICBpZiAoZGF0YS5hY3Rpb24gPT09IFwiaW5pdFwiKSB7XG4gICAgICAgICAgICB3b3JrZXIgPSBpbml0V29ya2VyKCk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgcGwgPSBnZXRQbGF5bGlzdCgpO1xuXG4gICAgICAgIHBsLnRyYWNrcy5wdXNoKC4uLmRhdGEudHJhY2tzKTtcbiAgICAgICAgcGxheWxpc3RNYW5hZ2UuaW5pdChwbCwgXCJsaXN0XCIsIGZhbHNlKTtcbiAgICB9O1xuICAgIGRiV29ya2VyLm9uZXJyb3IgPSBmdW5jdGlvbihldmVudCkge1xuICAgICAgICBjb25zb2xlLmxvZyhldmVudCk7XG4gICAgfTtcbiAgICByZXR1cm4gZGJXb3JrZXI7XG59XG5cbmZ1bmN0aW9uIGdldFBsYXlsaXN0KCkge1xuICAgIGNvbnN0IGxvY2FsUGxheWxpc3QgPSBwbGF5bGlzdC5nZXQoXCJsb2NhbC1maWxlc1wiKTtcblxuICAgIGlmIChsb2NhbFBsYXlsaXN0KSB7XG4gICAgICAgIHJldHVybiBsb2NhbFBsYXlsaXN0O1xuICAgIH1cbiAgICByZXR1cm4gcGxheWxpc3QuY3JlYXRlKHtcbiAgICAgICAgaWQ6IFwibG9jYWwtZmlsZXNcIixcbiAgICAgICAgdGl0bGU6IFwiTG9jYWwgZmlsZXNcIlxuICAgIH0pO1xufVxuXG5mdW5jdGlvbiBnZXRUcmFja0R1cmF0aW9uKHRyYWNrKSB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKHJlc29sdmUgPT4ge1xuICAgICAgICBsZXQgYXVkaW9CbG9iVVJMID0gVVJMLmNyZWF0ZU9iamVjdFVSTCh0cmFjayk7XG4gICAgICAgIGxldCBhdWRpbyA9IG5ldyBBdWRpbyhhdWRpb0Jsb2JVUkwpO1xuXG4gICAgICAgIGF1ZGlvLnByZWxvYWQgPSBcIm1ldGFkYXRhXCI7XG4gICAgICAgIGF1ZGlvLmFkZEV2ZW50TGlzdGVuZXIoXCJsb2FkZWRtZXRhZGF0YVwiLCBmdW5jdGlvbiBvbk1ldGFkYXRhKCkge1xuICAgICAgICAgICAgY29uc3QgZHVyYXRpb24gPSBmb3JtYXRUaW1lKGF1ZGlvLmR1cmF0aW9uKTtcblxuICAgICAgICAgICAgYXVkaW8ucmVtb3ZlRXZlbnRMaXN0ZW5lcihcImxvYWRlZG1ldGFkYXRhXCIsIG9uTWV0YWRhdGEpO1xuICAgICAgICAgICAgYXVkaW8gPSBudWxsO1xuICAgICAgICAgICAgYXVkaW9CbG9iVVJMID0gVVJMLnJldm9rZU9iamVjdFVSTChhdWRpb0Jsb2JVUkwpO1xuICAgICAgICAgICAgcmVzb2x2ZShkdXJhdGlvbik7XG4gICAgICAgIH0pO1xuICAgIH0pO1xufVxuXG5mdW5jdGlvbiByZW1vdmVGaWxlVHlwZShmaWxlTmFtZSkge1xuICAgIHJldHVybiBmaWxlTmFtZS5zbGljZSgwLCBmaWxlTmFtZS5sYXN0SW5kZXhPZihcIi5cIikpO1xufVxuXG5mdW5jdGlvbiBmaWx0ZXJJbnZhbGlkVHJhY2tzKG5ld1RyYWNrcywgcGxheWxpc3RUcmFja3MpIHtcbiAgICBjb25zdCBhdWRpbyA9IG5ldyBBdWRpbygpO1xuXG4gICAgcmV0dXJuIG5ld1RyYWNrcy5yZWR1Y2UoKHRyYWNrcywgdHJhY2spID0+IHtcbiAgICAgICAgY29uc3QgbmFtZSA9IHJlbW92ZUZpbGVUeXBlKHRyYWNrLm5hbWUudHJpbSgpKTtcbiAgICAgICAgY29uc3QgZHVwbGljYXRlID0gcGxheWxpc3RUcmFja3Muc29tZSh0cmFjayA9PiB0cmFjay5uYW1lID09PSBuYW1lKTtcblxuICAgICAgICBpZiAoIWR1cGxpY2F0ZSAmJiBhdWRpby5jYW5QbGF5VHlwZSh0cmFjay50eXBlKSkge1xuICAgICAgICAgICAgdHJhY2tzLnB1c2goe1xuICAgICAgICAgICAgICAgIG5hbWU6IG5hbWUsXG4gICAgICAgICAgICAgICAgYXVkaW9UcmFjazogdHJhY2tcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0cmFja3M7XG4gICAgfSwgW10pO1xufVxuXG5mdW5jdGlvbiBwYXJzZVRyYWNrTWV0YWRhdGEodHJhY2spIHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UocmVzb2x2ZSA9PiB7XG4gICAgICAgIHBhcnNlX2F1ZGlvX21ldGFkYXRhKHRyYWNrLCBkYXRhID0+IHtcbiAgICAgICAgICAgIHJlc29sdmUoZGF0YSk7XG4gICAgICAgIH0pO1xuICAgIH0pO1xufVxuXG5mdW5jdGlvbiBwYXJzZVRyYWNrcyh0cmFja3MsIHBhcnNlZFRyYWNrcywgc3RhcnRJbmRleCkge1xuICAgIHJldHVybiBQcm9taXNlLmFsbChbXG4gICAgICAgIHBhcnNlVHJhY2tNZXRhZGF0YSh0cmFja3NbMF0uYXVkaW9UcmFjayksXG4gICAgICAgIGdldFRyYWNrRHVyYXRpb24odHJhY2tzWzBdLmF1ZGlvVHJhY2spXG4gICAgXSlcbiAgICAudGhlbihkYXRhID0+IHtcbiAgICAgICAgcGFyc2VkVHJhY2tzLnB1c2goe1xuICAgICAgICAgICAgaW5kZXg6IHN0YXJ0SW5kZXggKyBwYXJzZWRUcmFja3MubGVuZ3RoLFxuICAgICAgICAgICAgdGl0bGU6IGRhdGFbMF0udGl0bGUudHJpbSgpLFxuICAgICAgICAgICAgYXJ0aXN0OiBkYXRhWzBdLmFydGlzdC50cmltKCksXG4gICAgICAgICAgICBhbGJ1bTogZGF0YVswXS5hbGJ1bS50cmltKCksXG4gICAgICAgICAgICBuYW1lOiB0cmFja3NbMF0ubmFtZSxcbiAgICAgICAgICAgIHRodW1ibmFpbDogZGF0YVswXS5waWN0dXJlLFxuICAgICAgICAgICAgYXVkaW9UcmFjazogdHJhY2tzWzBdLmF1ZGlvVHJhY2ssXG4gICAgICAgICAgICBkdXJhdGlvbjogZGF0YVsxXVxuICAgICAgICB9KTtcbiAgICAgICAgdHJhY2tzLnNwbGljZSgwLCAxKTtcbiAgICAgICAgcHJvZ3Jlc3Muc2V0QXR0clZhbHVlKFwidmFsdWVcIiwgcGFyc2VkVHJhY2tzLmxlbmd0aCk7XG4gICAgICAgIGlmICh0cmFja3MubGVuZ3RoKSB7XG4gICAgICAgICAgICByZXR1cm4gcGFyc2VUcmFja3ModHJhY2tzLCBwYXJzZWRUcmFja3MsIHN0YXJ0SW5kZXgpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBwYXJzZWRUcmFja3M7XG4gICAgfSk7XG59XG5cbmZ1bmN0aW9uIGFkZExvY2FsVHJhY2tzKGxvY2FsVHJhY2tzKSB7XG4gICAgY29uc3QgcGwgPSBnZXRQbGF5bGlzdCgpO1xuICAgIGNvbnN0IHBsYXlsaXN0VHJhY2tzID0gcGwudHJhY2tzO1xuICAgIGNvbnN0IHRyYWNrcyA9IGZpbHRlckludmFsaWRUcmFja3MoWy4uLmxvY2FsVHJhY2tzXSwgcGxheWxpc3RUcmFja3MpO1xuXG4gICAgcHJvZ3Jlc3Muc2V0QXR0clZhbHVlKFwibWF4XCIsIHRyYWNrcy5sZW5ndGgpO1xuICAgIHByb2dyZXNzLnRvZ2dsZSgpO1xuXG4gICAgcGFyc2VUcmFja3ModHJhY2tzLCBbXSwgcGxheWxpc3RUcmFja3MubGVuZ3RoKVxuICAgIC50aGVuKHRyYWNrcyA9PiB7XG4gICAgICAgIHByb2dyZXNzLnRvZ2dsZSgpO1xuICAgICAgICBwbC50cmFja3MucHVzaCguLi50cmFja3MpO1xuXG4gICAgICAgIGlmIChkb2N1bWVudC5nZXRFbGVtZW50QnlJZChganMtJHtwbC5pZH1gKSkge1xuICAgICAgICAgICAgcGxheWxpc3RNYW5hZ2UuYXBwZW5kVG8ocGwsIHRyYWNrcywgXCJsaXN0XCIsIHRydWUpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgcGxheWxpc3RNYW5hZ2UuaW5pdChwbCwgXCJsaXN0XCIsIHRydWUpO1xuICAgICAgICB9XG4gICAgICAgIHdvcmtlci5wb3N0TWVzc2FnZSh7XG4gICAgICAgICAgICBhY3Rpb246IFwidXBkYXRlXCIsXG4gICAgICAgICAgICBwbGF5bGlzdDogcGxheWxpc3RUcmFja3NcbiAgICAgICAgfSk7XG4gICAgfSk7XG59XG5cbmV4cG9ydCB7XG4gICAgYWRkTG9jYWxUcmFja3MgYXMgYWRkVHJhY2tzLFxuICAgIHdvcmtlclxufTtcbiIsImltcG9ydCAqIGFzIHNldHRpbmdzIGZyb20gXCIuL3NldHRpbmdzLmpzXCI7XG5cbmNvbnN0IHNjcmlwdExvYWRlciA9IChmdW5jdGlvbigpIHtcbiAgICBjb25zdCBsb2FkZWQgPSBbXTtcblxuICAgIGZ1bmN0aW9uIGxvYWRTY3JpcHQoc3JjLCBjYikge1xuICAgICAgICBpZiAobG9hZGVkLmluY2x1ZGVzKHNyYykpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHNjcmlwdCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzY3JpcHRcIik7XG5cbiAgICAgICAgc2NyaXB0LnNldEF0dHJpYnV0ZShcInNyY1wiLCBzcmMpO1xuICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZShcImJvZHlcIilbMF0uYXBwZW5kQ2hpbGQoc2NyaXB0KTtcbiAgICAgICAgbG9hZGVkLnB1c2goc3JjKTtcblxuICAgICAgICBpZiAoY2IpIHtcbiAgICAgICAgICAgIHNjcmlwdC5vbmxvYWQgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICBjYigpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICAgIGxvYWQ6IGxvYWRTY3JpcHRcbiAgICB9O1xuXG59KSgpO1xuXG5mdW5jdGlvbiByZW1vdmVDbGFzc0Zyb21FbGVtZW50KGNsYXNzTmFtZSwgY2xhc3NUb1JlbW92ZSkge1xuICAgIGNvbnN0IGVsZW1lbnQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGAuJHtjbGFzc05hbWV9LiR7Y2xhc3NUb1JlbW92ZX1gKTtcblxuICAgIGlmIChlbGVtZW50KSB7XG4gICAgICAgIGVsZW1lbnQuY2xhc3NMaXN0LnJlbW92ZShjbGFzc1RvUmVtb3ZlKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIHRvZ2dsZVRhYihpZCwgaWdub3JlU2lkZWJhcikge1xuICAgIHJlbW92ZUNsYXNzRnJvbUVsZW1lbnQoXCJqcy10YWItc2VsZWN0LWJ0blwiLCBcImFjdGl2ZVwiKTtcbiAgICByZW1vdmVDbGFzc0Zyb21FbGVtZW50KFwidGFiXCIsIFwiYWN0aXZlXCIpO1xuXG4gICAgc2V0dGluZ3Muc2V0KFwiYWN0aXZlVGFiXCIsIGlkKTtcbiAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChganMtdGFiLSR7aWR9YCkuY2xhc3NMaXN0LmFkZChcImFjdGl2ZVwiKTtcblxuICAgIGlmICghaWdub3JlU2lkZWJhcikge1xuICAgICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGBbZGF0YS10YWItaXRlbT0ke2lkfV1gKS5jbGFzc0xpc3QuYWRkKFwiYWN0aXZlXCIpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gZ2V0RWxlbWVudEJ5QXR0cihlbGVtZW50LCBhdHRyKSB7XG4gICAgd2hpbGUgKGVsZW1lbnQpIHtcbiAgICAgICAgY29uc3QgYXR0clZhbHVlID0gZWxlbWVudC5nZXRBdHRyaWJ1dGUoYXR0cik7XG5cbiAgICAgICAgaWYgKGF0dHJWYWx1ZSkge1xuICAgICAgICAgICAgcmV0dXJuIHsgZWxlbWVudCwgYXR0clZhbHVlIH07XG4gICAgICAgIH1cbiAgICAgICAgZWxlbWVudCA9IGVsZW1lbnQucGFyZW50RWxlbWVudDtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGZvcm1hdFRpbWUodGltZSkge1xuICAgIGxldCBuZXdUaW1lID0gXCJcIjtcblxuICAgIHRpbWUgPSBNYXRoLmZsb29yKHRpbWUpO1xuICAgIGlmICh0aW1lID49IDYwKSB7XG4gICAgICAgIGNvbnN0IG1pbnV0ZXMgPSBNYXRoLmZsb29yKHRpbWUgLyA2MCk7XG5cbiAgICAgICAgbmV3VGltZSA9IGAke21pbnV0ZXN9OmA7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICBuZXdUaW1lID0gXCIwOlwiO1xuICAgIH1cblxuICAgIGNvbnN0IHNlY29uZHMgPSB0aW1lICUgNjA7XG5cbiAgICBuZXdUaW1lICs9IHNlY29uZHMgPCAxMCA/IGAwJHtzZWNvbmRzfWAgOiBzZWNvbmRzO1xuICAgIHJldHVybiBuZXdUaW1lO1xufVxuXG5leHBvcnQge1xuICAgIHNjcmlwdExvYWRlcixcbiAgICB0b2dnbGVUYWIsXG4gICAgZ2V0RWxlbWVudEJ5QXR0cixcbiAgICByZW1vdmVDbGFzc0Zyb21FbGVtZW50LFxuICAgIGZvcm1hdFRpbWVcbn07XG4iLCJpbXBvcnQgKiBhcyBzZXR0aW5ncyBmcm9tIFwiLi8uLi9zZXR0aW5ncy5qc1wiO1xuaW1wb3J0ICogYXMgbWFpbiBmcm9tIFwiLi8uLi9tYWluLmpzXCI7XG5pbXBvcnQgKiBhcyBwbGF5bGlzdCBmcm9tIFwiLi8uLi9wbGF5bGlzdC9wbGF5bGlzdC5qc1wiO1xuaW1wb3J0ICogYXMgcGxheWVyIGZyb20gXCIuL3BsYXllci5qc1wiO1xuXG5jb25zdCBlbGFwc2VkVGltZSA9IChmdW5jdGlvbigpIHtcbiAgICBsZXQgdGltZW91dCA9IDA7XG5cbiAgICBmdW5jdGlvbiBzdG9wKCkge1xuICAgICAgICBpZiAodGltZW91dCkge1xuICAgICAgICAgICAgY2xlYXJUaW1lb3V0KHRpbWVvdXQpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gdXBkYXRlKHsgY3VycmVudFRpbWUsIGR1cmF0aW9uIH0pIHtcbiAgICAgICAgY29uc3Qgc3RhcnRUaW1lID0gcGVyZm9ybWFuY2Uubm93KCk7XG5cbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKHJlc29sdmUgPT4ge1xuICAgICAgICAgICAgKGZ1bmN0aW9uIHVwZGF0ZShjdXJyZW50VGltZSwgc3RhcnRUaW1lLCBlbGFwc2VkKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgZWxhcHNlZEluUGVyY2VudCA9IGN1cnJlbnRUaW1lIC8gZHVyYXRpb24gKiAxMDA7XG4gICAgICAgICAgICAgICAgY29uc3QgaWRlYWwgPSBwZXJmb3JtYW5jZS5ub3coKSAtIHN0YXJ0VGltZTtcbiAgICAgICAgICAgICAgICBjb25zdCBkaWZmID0gaWRlYWwgLSBlbGFwc2VkO1xuXG4gICAgICAgICAgICAgICAgc2V0RWxhcHNlZFRpbWUoY3VycmVudFRpbWUpO1xuICAgICAgICAgICAgICAgIGlmICghc2V0dGluZ3MuZ2V0KFwic2Vla2luZ1wiKSkge1xuICAgICAgICAgICAgICAgICAgICB1cGRhdGVTbGlkZXIoXCJ0cmFja1wiLCBlbGFwc2VkSW5QZXJjZW50KTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB0aW1lb3V0ID0gc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChjdXJyZW50VGltZSA8IGR1cmF0aW9uKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjdXJyZW50VGltZSArPSAxO1xuICAgICAgICAgICAgICAgICAgICAgICAgZWxhcHNlZCArPSAxMDAwO1xuICAgICAgICAgICAgICAgICAgICAgICAgdXBkYXRlKGN1cnJlbnRUaW1lLCBzdGFydFRpbWUsIGVsYXBzZWQpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSwgMTAwMCAtIGRpZmYpO1xuICAgICAgICAgICAgfSkoTWF0aC5mbG9vcihjdXJyZW50VGltZSksIHN0YXJ0VGltZSwgMCk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHN0YXJ0KHRyYWNrLCBjYikge1xuICAgICAgICBzdG9wKCk7XG4gICAgICAgIHJldHVybiB1cGRhdGUodHJhY2ssIGNiKTtcbiAgICB9XG5cbiAgICByZXR1cm4geyBzdG9wLCBzdGFydCB9O1xufSkoKTtcblxuZnVuY3Rpb24gYWRkQ2xhc3NPblBsYXlCdG4oY2xhc3NUb0FkZCkge1xuICAgIGNvbnN0IHBsYXlCdG4gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImpzLXBsYXllci1wbGF5XCIpO1xuICAgIGxldCBjbGFzc1RvUmVtb3ZlID0gXCJcIjtcbiAgICBsZXQgYnRuVGl0bGUgPSBcIlwiO1xuXG4gICAgaWYgKGNsYXNzVG9BZGQgPT09IFwiaWNvbi1wbGF5XCIpIHtcbiAgICAgICAgY2xhc3NUb1JlbW92ZSA9IFwiaWNvbi1wYXVzZVwiO1xuICAgICAgICBidG5UaXRsZSA9IFwiUGxheVwiO1xuICAgIH1cbiAgICBlbHNlIGlmIChjbGFzc1RvQWRkID09PSBcImljb24tcGF1c2VcIikge1xuICAgICAgICBjbGFzc1RvUmVtb3ZlID0gXCJpY29uLXBsYXlcIjtcbiAgICAgICAgYnRuVGl0bGUgPSBcIlBhdXNlXCI7XG4gICAgfVxuICAgIHBsYXlCdG4uY2xhc3NMaXN0LnJlbW92ZShjbGFzc1RvUmVtb3ZlKTtcbiAgICBwbGF5QnRuLmNsYXNzTGlzdC5hZGQoY2xhc3NUb0FkZCk7XG4gICAgcGxheUJ0bi5zZXRBdHRyaWJ1dGUoXCJ0aXRsZVwiLCBidG5UaXRsZSk7XG59XG5cbmZ1bmN0aW9uIHRvZ2dsZVBsYXlCdG5DbGFzcyhwYXVzZWQpIHtcbiAgICBpZiAocGF1c2VkKSB7XG4gICAgICAgIGFkZENsYXNzT25QbGF5QnRuKFwiaWNvbi1wbGF5XCIpO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgYWRkQ2xhc3NPblBsYXlCdG4oXCJpY29uLXBhdXNlXCIpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gZ2V0RWxhcHNlZFZhbHVlKHNsaWRlciwgc2NyZWVuWCkge1xuICAgIGNvbnN0IHRyYWNrU2xpZGVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoYGpzLXBsYXllci0ke3NsaWRlcn0tc2xpZGVyYCk7XG4gICAgY29uc3QgeyBsZWZ0LCB3aWR0aCB9ID0gdHJhY2tTbGlkZXIuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgbGV0IHZhbHVlID0gKHNjcmVlblggLSBsZWZ0KSAvIHdpZHRoO1xuXG4gICAgaWYgKHZhbHVlIDwgMCkge1xuICAgICAgICB2YWx1ZSA9IDA7XG4gICAgfVxuICAgIGVsc2UgaWYgKHZhbHVlID4gMSkge1xuICAgICAgICB2YWx1ZSA9IDE7XG4gICAgfVxuICAgIHJldHVybiB2YWx1ZSAqIDEwMDtcbn1cblxuZnVuY3Rpb24gb25Wb2x1bWVUcmFja01vdXNlbW92ZShldmVudCkge1xuICAgIGNvbnN0IHZvbHVtZSA9IGdldEVsYXBzZWRWYWx1ZShcInZvbHVtZVwiLCBldmVudC5zY3JlZW5YKTtcblxuICAgIHVwZGF0ZVNsaWRlcihcInZvbHVtZVwiLCB2b2x1bWUpO1xuICAgIHBsYXllci5zZXRWb2x1bWUodm9sdW1lIC8gMTAwKTtcbn1cblxuZnVuY3Rpb24gb25Wb2x1bWVUcmFja01vdXNldXAoKSB7XG4gICAgZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcihcIm1vdXNlbW92ZVwiLCBvblZvbHVtZVRyYWNrTW91c2Vtb3ZlKTtcbiAgICBkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKFwibW91c2V1cFwiLCBvblZvbHVtZVRyYWNrTW91c2V1cCk7XG59XG5cbmZ1bmN0aW9uIHVwZGF0ZVNsaWRlcihzbGlkZXIsIHBlcmNlbnQpIHtcbiAgICBjb25zdCB0cmFja1NsaWRlciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGBqcy1wbGF5ZXItJHtzbGlkZXJ9LXNsaWRlcmApO1xuICAgIGNvbnN0IGVsYXBzZWQgPSB0cmFja1NsaWRlci5jaGlsZHJlblswXTtcbiAgICBjb25zdCBlbGFwc2VkVGh1bWIgPSB0cmFja1NsaWRlci5jaGlsZHJlblsxXTtcblxuICAgIGVsYXBzZWQuc3R5bGUud2lkdGggPSBgJHtwZXJjZW50fSVgO1xuICAgIGVsYXBzZWRUaHVtYi5zdHlsZS5sZWZ0ID0gYCR7cGVyY2VudH0lYDtcbn1cblxuZnVuY3Rpb24gc2V0RWxhcHNlZFRpbWUodGltZSkge1xuICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwianMtcGxheWVyLWVsYXBzZWRcIikudGV4dENvbnRlbnQgPSBtYWluLmZvcm1hdFRpbWUodGltZSk7XG59XG5cbmZ1bmN0aW9uIHNob3dUcmFja0R1cmF0aW9uKGR1cmF0aW9uLCBmb3JtYXQgPSB0cnVlKSB7XG4gICAgY29uc3QgZHVyYXRpb25FbGVtID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJqcy1wbGF5ZXItZHVyYXRpb25cIik7XG5cbiAgICBkdXJhdGlvbkVsZW0udGV4dENvbnRlbnQgPSBmb3JtYXQgPyBtYWluLmZvcm1hdFRpbWUoZHVyYXRpb24pIDogZHVyYXRpb247XG59XG5cbmZ1bmN0aW9uIG9uUGxheWVyVHJhY2tNb3VzZW1vdmUoZXZlbnQpIHtcbiAgICB1cGRhdGVTbGlkZXIoXCJ0cmFja1wiLCBnZXRFbGFwc2VkVmFsdWUoXCJ0cmFja1wiLCBldmVudC5zY3JlZW5YKSk7XG59XG5cbmZ1bmN0aW9uIG9uUGxheWVyVHJhY2tNb3VzZXVwKHsgc2NyZWVuWCB9KSB7XG4gICAgaWYgKHBsYXlsaXN0LmdldEN1cnJlbnRUcmFjaygpKSB7XG4gICAgICAgIHBsYXllci5zZWVrKGdldEVsYXBzZWRWYWx1ZShcInRyYWNrXCIsIHNjcmVlblgpKTtcbiAgICB9XG5cbiAgICBzZXR0aW5ncy5zZXQoXCJzZWVraW5nXCIsIGZhbHNlKTtcbiAgICBkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKFwibW91c2Vtb3ZlXCIsIG9uUGxheWVyVHJhY2tNb3VzZW1vdmUpO1xuICAgIGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJtb3VzZXVwXCIsIG9uUGxheWVyVHJhY2tNb3VzZXVwKTtcbn1cblxuZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJqcy1wbGF5ZXItdHJhY2tcIikuYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNlZG93blwiLCBldmVudCA9PiB7XG4gICAgaWYgKGV2ZW50LndoaWNoICE9PSAxIHx8XG4gICAgICAgICFldmVudC50YXJnZXQuZ2V0QXR0cmlidXRlKFwiZGF0YS10cmFjay1pdGVtXCIpIHx8XG4gICAgICAgICFwbGF5bGlzdC5nZXRDdXJyZW50VHJhY2soKSkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgc2V0dGluZ3Muc2V0KFwic2Vla2luZ1wiLCB0cnVlKTtcbiAgICB1cGRhdGVTbGlkZXIoXCJ0cmFja1wiLCBnZXRFbGFwc2VkVmFsdWUoXCJ0cmFja1wiLCBldmVudC5zY3JlZW5YKSk7XG4gICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNlbW92ZVwiLCBvblBsYXllclRyYWNrTW91c2Vtb3ZlKTtcbiAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKFwibW91c2V1cFwiLCBvblBsYXllclRyYWNrTW91c2V1cCk7XG59KTtcblxuZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJqcy12b2x1bWUtdHJhY2tcIikuYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNlZG93blwiLCBldmVudCA9PiB7XG4gICAgaWYgKGV2ZW50LndoaWNoICE9PSAxIHx8ICFldmVudC50YXJnZXQuZ2V0QXR0cmlidXRlKFwiZGF0YS12b2x1bWUtaXRlbVwiKSkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgb25Wb2x1bWVUcmFja01vdXNlbW92ZShldmVudCk7XG4gICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNlbW92ZVwiLCBvblZvbHVtZVRyYWNrTW91c2Vtb3ZlKTtcbiAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKFwibW91c2V1cFwiLCBvblZvbHVtZVRyYWNrTW91c2V1cCk7XG59KTtcblxuZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJqcy1wbGF5ZXItY29udHJvbHNcIikuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICh7IHRhcmdldCB9KSA9PiB7XG4gICAgY29uc3QgaXRlbSA9IHRhcmdldC5nZXRBdHRyaWJ1dGUoXCJkYXRhLWNvbnRyb2wtaXRlbVwiKTtcblxuICAgIHN3aXRjaCAoaXRlbSkge1xuICAgICAgICBjYXNlIFwicHJldmlvdXNcIjpcbiAgICAgICAgICAgIHBsYXllci5wbGF5TmV4dCgtMSk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBcInBsYXlcIjpcbiAgICAgICAgICAgIHBsYXllci5wbGF5KCk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBcInN0b3BcIjpcbiAgICAgICAgICAgIHBsYXllci5zdG9wKCk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBcIm5leHRcIjpcbiAgICAgICAgICAgIHBsYXllci5wbGF5TmV4dCgxKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIFwicmVwZWF0XCI6XG4gICAgICAgIGNhc2UgXCJzaHVmZmxlXCI6XG4gICAgICAgICAgICB0YXJnZXQuY2xhc3NMaXN0LnRvZ2dsZShcImFjdGl2ZVwiKTtcbiAgICAgICAgICAgIHBsYXllcltpdGVtXSh0YXJnZXQuY2xhc3NMaXN0LmNvbnRhaW5zKFwiYWN0aXZlXCIpKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIFwidm9sdW1lXCI6XG4gICAgICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImpzLXZvbHVtZS10cmFja1wiKS5jbGFzc0xpc3QudG9nZ2xlKFwiYWN0aXZlXCIpO1xuICAgICAgICAgICAgdGFyZ2V0LmNsYXNzTGlzdC50b2dnbGUoXCJhY3RpdmVcIik7XG4gICAgICAgICAgICBicmVhaztcbiAgICB9XG59KTtcblxud2luZG93LmFkZEV2ZW50TGlzdGVuZXIoXCJET01Db250ZW50TG9hZGVkXCIsIGZ1bmN0aW9uIG9uTG9hZCgpIHtcbiAgICBjb25zdCByZXBlYXQgPSBzZXR0aW5ncy5nZXQoXCJyZXBlYXRcIik7XG4gICAgY29uc3Qgc2h1ZmZsZSA9IHNldHRpbmdzLmdldChcInNodWZmbGVcIik7XG4gICAgY29uc3Qgdm9sdW1lID0gc2V0dGluZ3MuZ2V0KFwidm9sdW1lXCIpO1xuXG4gICAgaWYgKHJlcGVhdCkge1xuICAgICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGBbZGF0YS1jb250cm9sLWl0ZW09XCJyZXBlYXRcIl1gKS5jbGFzc0xpc3QuYWRkKFwiYWN0aXZlXCIpO1xuICAgIH1cbiAgICBpZiAoc2h1ZmZsZSkge1xuICAgICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGBbZGF0YS1jb250cm9sLWl0ZW09XCJzaHVmZmxlXCJdYCkuY2xhc3NMaXN0LmFkZChcImFjdGl2ZVwiKTtcbiAgICB9XG4gICAgdXBkYXRlU2xpZGVyKFwidm9sdW1lXCIsIHZvbHVtZSAqIDEwMCk7XG4gICAgd2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJET01Db250ZW50TG9hZGVkXCIsIG9uTG9hZCk7XG59KTtcblxuZXhwb3J0IHtcbiAgICBlbGFwc2VkVGltZSxcbiAgICB0b2dnbGVQbGF5QnRuQ2xhc3MsXG4gICAgYWRkQ2xhc3NPblBsYXlCdG4sXG4gICAgc2V0RWxhcHNlZFRpbWUsXG4gICAgc2hvd1RyYWNrRHVyYXRpb24sXG4gICAgdXBkYXRlU2xpZGVyXG59O1xuIiwiaW1wb3J0ICogYXMgbWFpbiBmcm9tIFwiLi8uLi9tYWluLmpzXCI7XG5pbXBvcnQgKiBhcyBzZXR0aW5ncyBmcm9tIFwiLi8uLi9zZXR0aW5ncy5qc1wiO1xuaW1wb3J0ICogYXMgc2lkZWJhciBmcm9tIFwiLi8uLi9zaWRlYmFyLmpzXCI7XG5pbXBvcnQgKiBhcyBwbGF5bGlzdCBmcm9tIFwiLi8uLi9wbGF5bGlzdC9wbGF5bGlzdC5qc1wiO1xuaW1wb3J0ICogYXMgcGxheWxpc3RWaWV3IGZyb20gXCIuLy4uL3BsYXlsaXN0L3BsYXlsaXN0LnZpZXcuanNcIjtcbmltcG9ydCAqIGFzIGNvbnRyb2xzIGZyb20gXCIuL3BsYXllci5jb250cm9scy5qc1wiO1xuaW1wb3J0ICogYXMgblBsYXllciBmcm9tIFwiLi9wbGF5ZXIubmF0aXZlLmpzXCI7XG5pbXBvcnQgKiBhcyB5dFBsYXllciBmcm9tIFwiLi9wbGF5ZXIueW91dHViZS5qc1wiO1xuaW1wb3J0ICogYXMgc2NQbGF5ZXIgZnJvbSBcIi4vcGxheWVyLnNvdW5kY2xvdWQuanNcIjtcblxuZnVuY3Rpb24gb25UcmFja1N0YXJ0KHRyYWNrLCB0aW1lKSB7XG4gICAgY29uc3QgaWQgPSBwbGF5bGlzdC5nZXRBY3RpdmVQbGF5bGlzdElkKCk7XG5cbiAgICBjb250cm9scy5zaG93VHJhY2tEdXJhdGlvbih0cmFjay5kdXJhdGlvbiwgZmFsc2UpO1xuICAgIGNvbnRyb2xzLmFkZENsYXNzT25QbGF5QnRuKFwiaWNvbi1wYXVzZVwiKTtcbiAgICBzaWRlYmFyLnNob3dUcmFja0luZm8odHJhY2spO1xuICAgIHNpZGViYXIuc2hvd0FjdGl2ZUljb24oaWQpO1xuICAgIHBsYXlsaXN0Vmlldy5zaG93UGxheWluZ1RyYWNrKHRyYWNrLmluZGV4LCBpZCwgc2V0dGluZ3MuZ2V0KFwibWFudWFsXCIpKTtcbiAgICBzZXR0aW5ncy5zZXQoXCJwYXVzZWRcIiwgZmFsc2UpO1xuICAgIHNldHRpbmdzLnNldChcIm1hbnVhbFwiLCBmYWxzZSk7XG5cbiAgICByZXR1cm4gY29udHJvbHMuZWxhcHNlZFRpbWUuc3RhcnQodGltZSk7XG59XG5cbmZ1bmN0aW9uIG9uVHJhY2tFbmQocmVwZWF0Q2IpIHtcbiAgICBpZiAoIXNldHRpbmdzLmdldChcInJlcGVhdFwiKSkge1xuICAgICAgICBwbGF5TmV4dFRyYWNrKDEpO1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIHJlc2V0VHJhY2soKTtcbiAgICByZXBlYXRDYigpO1xufVxuXG5mdW5jdGlvbiBnZXRQbGF5ZXIocGxheWxpc3RJZCkge1xuICAgIGlmIChwbGF5bGlzdElkID09PSBcImxvY2FsLWZpbGVzXCIpIHtcbiAgICAgICAgcmV0dXJuIFwibmF0aXZlXCI7XG4gICAgfVxuICAgIGVsc2UgaWYgKHBsYXlsaXN0SWQuaW5jbHVkZXMoXCJ5dC1wbC1cIikpIHtcbiAgICAgICAgcmV0dXJuIFwieW91dHViZVwiO1xuICAgIH1cbiAgICBlbHNlIGlmIChwbGF5bGlzdElkLmluY2x1ZGVzKFwic2MtcGwtXCIpKSB7XG4gICAgICAgIHJldHVybiBcInNvdW5kY2xvdWRcIjtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIHRvZ2dsZVBsYXlpbmcocGxheUNiLCBwYXVzZUNiKSB7XG4gICAgY29uc3QgcGF1c2VkID0gc2V0dGluZ3MuZ2V0KFwicGF1c2VkXCIpO1xuXG4gICAgaWYgKHBhdXNlZCkge1xuICAgICAgICBwbGF5Q2IoKTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIHBhdXNlQ2IoKTtcbiAgICAgICAgY29udHJvbHMuZWxhcHNlZFRpbWUuc3RvcCgpO1xuICAgICAgICBjb250cm9scy5hZGRDbGFzc09uUGxheUJ0bihcImljb24tcGxheVwiKTtcbiAgICB9XG4gICAgc2V0dGluZ3Muc2V0KFwicGF1c2VkXCIsICFwYXVzZWQpO1xufVxuXG5mdW5jdGlvbiBwbGF5TmV3VHJhY2sodHJhY2ssIHBsYXllcikge1xuICAgIGlmIChwbGF5ZXIgPT09IFwibmF0aXZlXCIpIHtcbiAgICAgICAgblBsYXllci5wbGF5VHJhY2sodHJhY2spO1xuICAgIH1cbiAgICBlbHNlIGlmIChwbGF5ZXIgPT09IFwieW91dHViZVwiKSB7XG4gICAgICAgIHl0UGxheWVyLnBsYXlUcmFjayh0cmFjayk7XG4gICAgfVxuICAgIGVsc2UgaWYgKHBsYXllciA9PT0gXCJzb3VuZGNsb3VkXCIpIHtcbiAgICAgICAgc2NQbGF5ZXIucGxheVRyYWNrKHRyYWNrKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIHBsYXlGaXJzdFRyYWNrKGlkKSB7XG4gICAgaWYgKCFwbGF5bGlzdC5nZXQoaWQpKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBzZWxlY3RlZCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGBqcy0ke2lkfWApLnF1ZXJ5U2VsZWN0b3IoXCIudHJhY2suc2VsZWN0ZWRcIik7XG4gICAgbGV0IGluZGV4ID0gMDtcblxuICAgIGlmIChzZWxlY3RlZCkge1xuICAgICAgICBpbmRleCA9IE51bWJlci5wYXJzZUludChzZWxlY3RlZC5nZXRBdHRyaWJ1dGUoXCJkYXRhLWluZGV4XCIpLCAxMCk7XG4gICAgICAgIHNldHRpbmdzLnNldChcIm1hbnVhbFwiLCB0cnVlKTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIHBsYXlsaXN0LnNldEFjdGl2ZShpZCk7XG4gICAgICAgIGluZGV4ID0gcGxheWxpc3QuZ2V0TmV4dFRyYWNrSW5kZXgoMCk7XG4gICAgfVxuICAgIHBsYXlUcmFja0F0SW5kZXgoaW5kZXgsIGlkKTtcbn1cblxuZnVuY3Rpb24gcGxheVRyYWNrKCkge1xuICAgIGNvbnN0IHBsYXllciA9IHNldHRpbmdzLmdldChcInBsYXllclwiKTtcblxuICAgIGlmICghcGxheWVyKSB7XG4gICAgICAgIGNvbnN0IGlkID0gc2V0dGluZ3MuZ2V0KFwiYWN0aXZlVGFiXCIpO1xuXG4gICAgICAgIHBsYXlGaXJzdFRyYWNrKGlkKTtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IGluZGV4ID0gcGxheWxpc3QuZ2V0Q3VycmVudFRyYWNrSW5kZXgoKTtcbiAgICBjb25zdCB0cmFjayA9IHBsYXlsaXN0LmdldFRyYWNrQXRJbmRleChpbmRleCk7XG5cbiAgICBwbGF5bGlzdC5zZXRDdXJyZW50VHJhY2sodHJhY2spO1xuXG4gICAgaWYgKHBsYXllciA9PT0gXCJuYXRpdmVcIikge1xuICAgICAgICBuUGxheWVyLnBsYXkodHJhY2spO1xuICAgIH1cbiAgICBlbHNlIGlmIChwbGF5ZXIgPT09IFwieW91dHViZVwiKSB7XG4gICAgICAgIHl0UGxheWVyLnRvZ2dsZVBsYXlpbmcoKTtcbiAgICB9XG4gICAgZWxzZSBpZiAocGxheWVyID09PSBcInNvdW5kY2xvdWRcIikge1xuICAgICAgICBzY1BsYXllci50b2dnbGVQbGF5aW5nKCk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBwbGF5TmV4dFRyYWNrKGRpcmVjdGlvbikge1xuICAgIGNvbnN0IHBsYXllciA9IHNldHRpbmdzLmdldChcInBsYXllclwiKTtcbiAgICBjb25zdCBjdXJyZW50VHJhY2sgPSBwbGF5bGlzdC5nZXRDdXJyZW50VHJhY2soKTtcblxuICAgIGlmICghcGxheWVyIHx8ICFjdXJyZW50VHJhY2spIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBzdG9wVHJhY2soY3VycmVudFRyYWNrLCBwbGF5ZXIpO1xuXG4gICAgY29uc3QgdHJhY2sgPSBwbGF5bGlzdC5nZXROZXh0VHJhY2soZGlyZWN0aW9uKTtcblxuICAgIHBsYXlOZXdUcmFjayh0cmFjaywgcGxheWVyKTtcbn1cblxuZnVuY3Rpb24gcGxheVRyYWNrQXRJbmRleChpbmRleCwgaWQpIHtcbiAgICBjb25zdCBjdXJyZW50VHJhY2sgPSBwbGF5bGlzdC5nZXRDdXJyZW50VHJhY2soKTtcblxuICAgIGlmICghc2V0dGluZ3MuZ2V0KFwicGF1c2VkXCIpIHx8IGN1cnJlbnRUcmFjaykge1xuICAgICAgICBzdG9wVHJhY2soY3VycmVudFRyYWNrKTtcbiAgICB9XG5cbiAgICBjb25zdCBwbGF5ZXIgPSBnZXRQbGF5ZXIoaWQpO1xuICAgIGNvbnN0IHBsID0gcGxheWxpc3QuZ2V0KGlkKTtcbiAgICBjb25zdCB0cmFjayA9IHBsLnRyYWNrc1tpbmRleF07XG5cbiAgICBzZXR0aW5ncy5zZXQoXCJwbGF5ZXJcIiwgcGxheWVyKTtcbiAgICBwbGF5bGlzdC5zZXRBY3RpdmUocGwuaWQpO1xuXG4gICAgaWYgKHNldHRpbmdzLmdldChcInNodWZmbGVcIikgJiYgIXBsLnNodWZmbGVkKSB7XG4gICAgICAgIHBsYXlsaXN0LnNodWZmbGVQbGF5YmFja09yZGVyKHRydWUsIHBsKTtcbiAgICAgICAgcGxheWxpc3QucmVzZXRDdXJyZW50SW5kZXgoKTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIHBsYXlsaXN0LnNldEN1cnJlbnRJbmRleCh0cmFjay5pbmRleCk7XG4gICAgfVxuXG4gICAgcGxheWxpc3Quc2V0Q3VycmVudFRyYWNrKHRyYWNrKTtcbiAgICBwbGF5TmV3VHJhY2sodHJhY2ssIHBsYXllcik7XG59XG5cbmZ1bmN0aW9uIHN0b3BUcmFjayh0cmFjayA9IHBsYXlsaXN0LmdldEN1cnJlbnRUcmFjaygpLCBwbGF5ZXIgPSBzZXR0aW5ncy5nZXQoXCJwbGF5ZXJcIikpIHtcbiAgICBpZiAoIXRyYWNrKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAocGxheWVyID09PSBcIm5hdGl2ZVwiKSB7XG4gICAgICAgIG5QbGF5ZXIuc3RvcCh0cmFjayk7XG4gICAgfVxuICAgIGVsc2UgaWYgKHBsYXllciA9PT0gXCJ5b3V0dWJlXCIpIHtcbiAgICAgICAgeXRQbGF5ZXIuc3RvcCgpO1xuICAgIH1cbiAgICBlbHNlIGlmIChwbGF5ZXIgPT09IFwic291bmRjbG91ZFwiKSB7XG4gICAgICAgIHNjUGxheWVyLnN0b3AoKTtcbiAgICB9XG5cbiAgICBpZiAocGxheWVyKSB7XG4gICAgICAgIHNpZGViYXIuaGlkZUFjdGl2ZUljb24oKTtcbiAgICAgICAgbWFpbi5yZW1vdmVDbGFzc0Zyb21FbGVtZW50KFwidHJhY2tcIiwgXCJwbGF5aW5nXCIpO1xuICAgICAgICByZXNldFBsYXllcigpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gcmVzZXRUcmFjaygpIHtcbiAgICBzaWRlYmFyLnNob3dUcmFja0luZm8oKTtcbiAgICBjb250cm9scy5lbGFwc2VkVGltZS5zdG9wKCk7XG4gICAgY29udHJvbHMuc2V0RWxhcHNlZFRpbWUoMCk7XG4gICAgY29udHJvbHMudXBkYXRlU2xpZGVyKFwidHJhY2tcIiwgMCk7XG4gICAgY29udHJvbHMuc2hvd1RyYWNrRHVyYXRpb24oMCk7XG59XG5cbmZ1bmN0aW9uIHJlc2V0UGxheWVyKCkge1xuICAgIHJlc2V0VHJhY2soKTtcbiAgICBzZXR0aW5ncy5zZXQoXCJwYXVzZWRcIiwgdHJ1ZSk7XG4gICAgcGxheWxpc3Quc2V0Q3VycmVudFRyYWNrKG51bGwpO1xuICAgIGNvbnRyb2xzLmFkZENsYXNzT25QbGF5QnRuKFwiaWNvbi1wbGF5XCIpO1xufVxuXG5mdW5jdGlvbiB0b2dnbGVSZXBlYXQocmVwZWF0KSB7XG4gICAgc2V0dGluZ3Muc2V0KFwicmVwZWF0XCIsIHJlcGVhdCk7XG59XG5cbmZ1bmN0aW9uIHRvZ2dsZVNodWZmbGUoc2h1ZmZsZSkge1xuICAgIGNvbnN0IHBsID0gcGxheWxpc3QuZ2V0QWN0aXZlKCkgfHwgcGxheWxpc3QuZ2V0KHNldHRpbmdzLmdldChcImFjdGl2ZVRhYlwiKSk7XG5cbiAgICBzZXR0aW5ncy5zZXQoXCJzaHVmZmxlXCIsIHNodWZmbGUpO1xuICAgIGlmIChwbCkge1xuICAgICAgICBwbGF5bGlzdC5zaHVmZmxlUGxheWJhY2tPcmRlcihzaHVmZmxlLCBwbCk7XG4gICAgICAgIHBsYXlsaXN0LnJlc2V0Q3VycmVudEluZGV4KCk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBzZXRWb2x1bWUodm9sdW1lKSB7XG4gICAgY29uc3QgcGxheWVyID0gc2V0dGluZ3MuZ2V0KFwicGxheWVyXCIpO1xuXG4gICAgc2V0dGluZ3Muc2V0KFwidm9sdW1lXCIsIHZvbHVtZSk7XG4gICAgaWYgKHBsYXllciA9PT0gXCJuYXRpdmVcIikge1xuICAgICAgICBuUGxheWVyLnNldFZvbHVtZSh2b2x1bWUpO1xuICAgIH1cbiAgICBlbHNlIGlmIChwbGF5ZXIgPT09IFwieW91dHViZVwiKSB7XG4gICAgICAgIHl0UGxheWVyLnNldFZvbHVtZSh2b2x1bWUpO1xuICAgIH1cbiAgICBlbHNlIGlmIChwbGF5ZXIgPT09IFwic291bmRjbG91ZFwiKSB7XG4gICAgICAgIHNjUGxheWVyLnNldFZvbHVtZSh2b2x1bWUpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gc2Vla1RpbWUocGVyY2VudCkge1xuICAgIGNvbnN0IHBsYXllciA9IHNldHRpbmdzLmdldChcInBsYXllclwiKTtcbiAgICBsZXQgZWxhcHNlZCA9IDA7XG5cbiAgICBpZiAocGxheWVyID09PSBcIm5hdGl2ZVwiKSB7XG4gICAgICAgIGVsYXBzZWQgPSBuUGxheWVyLmdldEVsYXBzZWQocGVyY2VudCk7XG4gICAgfVxuICAgIGVsc2UgaWYgKHBsYXllciA9PT0gXCJ5b3V0dWJlXCIpIHtcbiAgICAgICAgZWxhcHNlZCA9IHl0UGxheWVyLmdldEVsYXBzZWQocGVyY2VudCk7XG4gICAgfVxuICAgIGVsc2UgaWYgKHBsYXllciA9PT0gXCJzb3VuZGNsb3VkXCIpIHtcbiAgICAgICAgZWxhcHNlZCA9IHNjUGxheWVyLmdldEVsYXBzZWQocGVyY2VudCk7XG4gICAgfVxuICAgIGNvbnRyb2xzLnNldEVsYXBzZWRUaW1lKGVsYXBzZWQpO1xufVxuXG5kb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImpzLXRhYi1jb250YWluZXJcIikuYWRkRXZlbnRMaXN0ZW5lcihcImRibGNsaWNrXCIsIGV2ZW50ID0+IHtcbiAgICBjb25zdCBlbGVtZW50ID0gbWFpbi5nZXRFbGVtZW50QnlBdHRyKGV2ZW50LnRhcmdldCwgXCJkYXRhLWluZGV4XCIpO1xuXG4gICAgaWYgKGVsZW1lbnQpIHtcbiAgICAgICAgY29uc3QgaWQgPSBzZXR0aW5ncy5nZXQoXCJhY3RpdmVUYWJcIik7XG5cbiAgICAgICAgc2V0dGluZ3Muc2V0KFwibWFudWFsXCIsIHRydWUpO1xuICAgICAgICBwbGF5VHJhY2tBdEluZGV4KGVsZW1lbnQuYXR0clZhbHVlLCBpZCk7XG4gICAgfVxufSk7XG5cbmV4cG9ydCB7XG4gICAgcGxheVRyYWNrIGFzIHBsYXksXG4gICAgcGxheU5leHRUcmFjayBhcyBwbGF5TmV4dCxcbiAgICBzdG9wVHJhY2sgYXMgc3RvcCxcbiAgICB0b2dnbGVSZXBlYXQgYXMgcmVwZWF0LFxuICAgIHRvZ2dsZVNodWZmbGUgYXMgc2h1ZmZsZSxcbiAgICBzZWVrVGltZSBhcyBzZWVrLFxuICAgIHRvZ2dsZVBsYXlpbmcsXG4gICAgc2V0Vm9sdW1lLFxuICAgIG9uVHJhY2tTdGFydCxcbiAgICBvblRyYWNrRW5kXG59O1xuIiwiaW1wb3J0ICogYXMgc2V0dGluZ3MgZnJvbSBcIi4vLi4vc2V0dGluZ3MuanNcIjtcbmltcG9ydCAqIGFzIHBsYXlsaXN0IGZyb20gXCIuLy4uL3BsYXlsaXN0L3BsYXlsaXN0LmpzXCI7XG5pbXBvcnQgKiBhcyBwbGF5ZXIgZnJvbSBcIi4vcGxheWVyLmpzXCI7XG5cbmZ1bmN0aW9uIGdldFRpbWUoYXVkaW8pIHtcbiAgICByZXR1cm4ge1xuICAgICAgICBjdXJyZW50VGltZTogYXVkaW8uY3VycmVudFRpbWUsXG4gICAgICAgIGR1cmF0aW9uOiBNYXRoLmZsb29yKGF1ZGlvLmR1cmF0aW9uKVxuICAgIH07XG59XG5cbmZ1bmN0aW9uIHBsYXlUcmFjayh0cmFjaykge1xuICAgIGNvbnNvbGUubG9nKHRyYWNrKTtcbiAgICB0cmFjay5hdWRpb0Jsb2JVUkwgPSBVUkwuY3JlYXRlT2JqZWN0VVJMKHRyYWNrLmF1ZGlvVHJhY2spO1xuICAgIHRyYWNrLmF1ZGlvID0gbmV3IEF1ZGlvKHRyYWNrLmF1ZGlvQmxvYlVSTCk7XG5cbiAgICB0cmFjay5hdWRpby5vbmNhbnBsYXkgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdHJhY2suYXVkaW8udm9sdW1lID0gc2V0dGluZ3MuZ2V0KFwidm9sdW1lXCIpO1xuICAgICAgICB0cmFjay5hdWRpby5wbGF5KCk7XG4gICAgfTtcblxuICAgIHRyYWNrLmF1ZGlvLm9ucGxheWluZyA9IGZ1bmN0aW9uKCkge1xuICAgICAgICBwbGF5ZXIub25UcmFja1N0YXJ0KHRyYWNrLCBnZXRUaW1lKHRyYWNrLmF1ZGlvKSlcbiAgICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgcGxheSA9IHRyYWNrLmF1ZGlvLnBsYXkuYmluZCh0cmFjay5hdWRpbyk7XG5cbiAgICAgICAgICAgIHBsYXllci5vblRyYWNrRW5kKHBsYXkpO1xuICAgICAgICB9KTtcbiAgICB9O1xufVxuXG5mdW5jdGlvbiBwbGF5VHJhY2tPbkJ1dHRvblByZXNzKHRyYWNrKSB7XG4gICAgY29uc3QgYXVkaW8gPSB0cmFjay5hdWRpbztcblxuICAgIGlmIChhdWRpbykge1xuICAgICAgICBjb25zdCBwbGF5ID0gYXVkaW8ucGxheS5iaW5kKGF1ZGlvKTtcbiAgICAgICAgY29uc3QgcGF1c2UgPSBhdWRpby5wYXVzZS5iaW5kKGF1ZGlvKTtcblxuICAgICAgICBwbGF5ZXIudG9nZ2xlUGxheWluZyhwbGF5LCBwYXVzZSk7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgcGxheVRyYWNrKHRyYWNrKTtcbn1cblxuZnVuY3Rpb24gc3RvcFRyYWNrKHRyYWNrKSB7XG4gICAgVVJMLnJldm9rZU9iamVjdFVSTCh0cmFjay5hdWRpb0Jsb2JVUkwpO1xuICAgIHRyYWNrLmF1ZGlvLmxvYWQoKTtcbiAgICB0cmFjay5hdWRpby5vbmNhbnBsYXkgPSBudWxsO1xuICAgIHRyYWNrLmF1ZGlvLm9ucGxheWluZyA9IG51bGw7XG4gICAgdHJhY2suYXVkaW8ub25lbmRlZCA9IG51bGw7XG4gICAgZGVsZXRlIHRyYWNrLmF1ZGlvQmxvYlVSTDtcbiAgICBkZWxldGUgdHJhY2suYXVkaW87XG59XG5cbmZ1bmN0aW9uIHNldFZvbHVtZSh2b2x1bWUpIHtcbiAgICBjb25zdCB0cmFjayA9IHBsYXlsaXN0LmdldEN1cnJlbnRUcmFjaygpO1xuXG4gICAgaWYgKHRyYWNrKSB7XG4gICAgICAgIHRyYWNrLmF1ZGlvLnZvbHVtZSA9IHZvbHVtZTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGdldEVsYXBzZWQocGVyY2VudCkge1xuICAgIGNvbnN0IHsgYXVkaW8gfSA9IHBsYXlsaXN0LmdldEN1cnJlbnRUcmFjaygpO1xuXG4gICAgaWYgKGF1ZGlvKSB7XG4gICAgICAgIGNvbnN0IGVsYXBzZWQgPSBhdWRpby5kdXJhdGlvbiAvIDEwMCAqIHBlcmNlbnQ7XG5cbiAgICAgICAgYXVkaW8uY3VycmVudFRpbWUgPSBlbGFwc2VkO1xuICAgICAgICByZXR1cm4gZWxhcHNlZDtcbiAgICB9XG4gICAgcmV0dXJuIDA7XG59XG5cbmV4cG9ydCB7XG4gICAgcGxheVRyYWNrT25CdXR0b25QcmVzcyBhcyBwbGF5LFxuICAgIHN0b3BUcmFjayBhcyBzdG9wLFxuICAgIHBsYXlUcmFjayxcbiAgICBnZXRFbGFwc2VkLFxuICAgIHNldFZvbHVtZVxufTtcbiIsIi8qIGdsb2JhbCBTQyAqL1xuXG5pbXBvcnQgKiBhcyBzZXR0aW5ncyBmcm9tIFwiLi8uLi9zZXR0aW5ncy5qc1wiO1xuaW1wb3J0ICogYXMgcGxheWVyIGZyb20gXCIuL3BsYXllci5qc1wiO1xuXG5sZXQgc2NQbGF5ZXIgPSBudWxsO1xuXG5mdW5jdGlvbiBnZXRUaW1lKHBsYXllcikge1xuICAgIHJldHVybiB7XG4gICAgICAgIGN1cnJlbnRUaW1lOiBwbGF5ZXIuY3VycmVudFRpbWUoKSAvIDEwMDAsXG4gICAgICAgIGR1cmF0aW9uOiBNYXRoLmZsb29yKHBsYXllci5zdHJlYW1JbmZvLmR1cmF0aW9uIC8gMTAwMClcbiAgICB9O1xufVxuXG5mdW5jdGlvbiByZXBlYXRUcmFjaygpIHtcbiAgICBzY1BsYXllci5zZWVrKDApO1xuICAgIHNjUGxheWVyLnBsYXkoKTtcbn1cblxuZnVuY3Rpb24gcGxheVRyYWNrKHRyYWNrKSB7XG4gICAgaWYgKHNjUGxheWVyKSB7XG4gICAgICAgIHNjUGxheWVyLnNlZWsoMCk7XG4gICAgfVxuICAgIGNvbnNvbGUubG9nKHRyYWNrKTtcbiAgICBTQy5zdHJlYW0oYC90cmFja3MvJHt0cmFjay5pZH1gKS50aGVuKHRyYWNrUGxheWVyID0+IHtcbiAgICAgICAgc2NQbGF5ZXIgPSB0cmFja1BsYXllcjtcbiAgICAgICAgdHJhY2tQbGF5ZXIuc2V0Vm9sdW1lKHNldHRpbmdzLmdldChcInZvbHVtZVwiKSk7XG4gICAgICAgIHRyYWNrUGxheWVyLnBsYXkoKTtcblxuICAgICAgICB0cmFja1BsYXllci5vbihcInBsYXktcmVzdW1lXCIsICgpID0+IHtcbiAgICAgICAgICAgIHBsYXllci5vblRyYWNrU3RhcnQodHJhY2ssIGdldFRpbWUoc2NQbGF5ZXIpKVxuICAgICAgICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgICAgIHBsYXllci5vblRyYWNrRW5kKHJlcGVhdFRyYWNrKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9KVxuICAgIC5jYXRjaChlcnJvciA9PiB7XG4gICAgICAgIGNvbnNvbGUubG9nKGVycm9yKTtcbiAgICB9KTtcbn1cblxuZnVuY3Rpb24gdG9nZ2xlUGxheWluZygpIHtcbiAgICBjb25zdCBwbGF5ID0gc2NQbGF5ZXIucGxheS5iaW5kKHNjUGxheWVyKTtcbiAgICBjb25zdCBwYXVzZSA9IHNjUGxheWVyLnBhdXNlLmJpbmQoc2NQbGF5ZXIpO1xuXG4gICAgcGxheWVyLnRvZ2dsZVBsYXlpbmcocGxheSwgcGF1c2UpO1xufVxuXG5mdW5jdGlvbiBzdG9wVHJhY2soKSB7XG4gICAgc2NQbGF5ZXIuc2VlaygwKTtcbiAgICBzY1BsYXllci5wYXVzZSgpO1xufVxuXG5mdW5jdGlvbiBzZXRWb2x1bWUodm9sdW1lKSB7XG4gICAgc2NQbGF5ZXIuc2V0Vm9sdW1lKHZvbHVtZSk7XG59XG5cbmZ1bmN0aW9uIGdldEVsYXBzZWQocGVyY2VudCkge1xuICAgIGlmIChzY1BsYXllcikge1xuICAgICAgICBjb25zdCBkdXJhdGlvbiA9IHNjUGxheWVyLnN0cmVhbUluZm8uZHVyYXRpb24gLyAxMDAwO1xuICAgICAgICBjb25zdCBlbGFwc2VkID0gZHVyYXRpb24gLyAxMDAgKiBwZXJjZW50O1xuXG4gICAgICAgIHNjUGxheWVyLnNlZWsoZWxhcHNlZCAqIDEwMDApO1xuICAgICAgICByZXR1cm4gZWxhcHNlZDtcbiAgICB9XG4gICAgcmV0dXJuIDA7XG59XG5cbmV4cG9ydCB7XG4gICAgc3RvcFRyYWNrIGFzIHN0b3AsXG4gICAgcGxheVRyYWNrLFxuICAgIHRvZ2dsZVBsYXlpbmcsXG4gICAgZ2V0RWxhcHNlZCxcbiAgICBzZXRWb2x1bWVcbn07XG4iLCIvKiBnbG9iYWwgWVQgKi9cblxuaW1wb3J0ICogYXMgc2V0dGluZ3MgZnJvbSBcIi4vLi4vc2V0dGluZ3MuanNcIjtcbmltcG9ydCAqIGFzIHBsYXlsaXN0IGZyb20gXCIuLy4uL3BsYXlsaXN0L3BsYXlsaXN0LmpzXCI7XG5pbXBvcnQgKiBhcyBwbGF5ZXIgZnJvbSBcIi4vcGxheWVyLmpzXCI7XG5cbmxldCB5dFBsYXllciA9IG51bGw7XG5cbmZ1bmN0aW9uIGdldFRpbWUocGxheWVyKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgY3VycmVudFRpbWU6IHBsYXllci5nZXRDdXJyZW50VGltZSgpLFxuICAgICAgICBkdXJhdGlvbjogIHBsYXllci5nZXREdXJhdGlvbigpXG4gICAgfTtcbn1cblxuZnVuY3Rpb24gb25QbGF5ZXJTdGF0ZUNoYW5nZSh7IGRhdGE6IGN1cnJlbnRTdGF0ZSB9KSB7XG4gICAgaWYgKGN1cnJlbnRTdGF0ZSA9PT0gWVQuUGxheWVyU3RhdGUuUExBWUlORykge1xuICAgICAgICBjb25zdCB0cmFjayA9IHBsYXlsaXN0LmdldEN1cnJlbnRUcmFjaygpIHx8IHBsYXlsaXN0LmdldE5leHRUcmFjaygwKTtcblxuICAgICAgICBjb25zb2xlLmxvZyh0cmFjayk7XG4gICAgICAgIHBsYXllci5vblRyYWNrU3RhcnQodHJhY2ssIGdldFRpbWUoeXRQbGF5ZXIpKVxuICAgICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBwbGF5ID0geXRQbGF5ZXIucGxheVZpZGVvLmJpbmQoeXRQbGF5ZXIpO1xuXG4gICAgICAgICAgICBwbGF5ZXIub25UcmFja0VuZChwbGF5KTtcbiAgICAgICAgfSk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBvblBsYXllclJlYWR5KCkge1xuICAgIGNvbnN0IHRyYWNrID0gcGxheWxpc3QuZ2V0TmV4dFRyYWNrKDApO1xuXG4gICAgcGxheVRyYWNrKHRyYWNrKTtcbn1cblxuZnVuY3Rpb24gb25FcnJvcihlcnJvcikge1xuICAgIGNvbnNvbGUubG9nKGVycm9yKTtcbn1cblxuZnVuY3Rpb24gaW5pdFBsYXllcigpIHtcbiAgICB5dFBsYXllciA9IG5ldyBZVC5QbGF5ZXIoXCJ5dC1wbGF5ZXJcIiwge1xuICAgICAgICBoZWlnaHQ6IFwiMzkwXCIsXG4gICAgICAgIHdpZHRoOiBcIjY0MFwiLFxuICAgICAgICB2aWRlb0lkOiBcIlwiLFxuICAgICAgICBldmVudHM6IHtcbiAgICAgICAgICAgIG9uUmVhZHk6IG9uUGxheWVyUmVhZHksXG4gICAgICAgICAgICBvblN0YXRlQ2hhbmdlOiBvblBsYXllclN0YXRlQ2hhbmdlLFxuICAgICAgICAgICAgb25FcnJvclxuICAgICAgICB9XG4gICAgfSk7XG59XG5cbmZ1bmN0aW9uIHRvZ2dsZVBsYXlpbmcoKSB7XG4gICAgY29uc3QgcGxheSA9IHl0UGxheWVyLnBsYXlWaWRlby5iaW5kKHl0UGxheWVyKTtcbiAgICBjb25zdCBwYXVzZSA9IHl0UGxheWVyLnBhdXNlVmlkZW8uYmluZCh5dFBsYXllcik7XG5cbiAgICBwbGF5ZXIudG9nZ2xlUGxheWluZyhwbGF5LCBwYXVzZSk7XG59XG5cbmZ1bmN0aW9uIHBsYXlUcmFjayh0cmFjaykge1xuICAgIGlmICh5dFBsYXllcikge1xuICAgICAgICBzZXRWb2x1bWUoc2V0dGluZ3MuZ2V0KFwidm9sdW1lXCIpKTtcbiAgICAgICAgeXRQbGF5ZXIubG9hZFZpZGVvQnlJZCh0cmFjay5pZCk7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaW5pdFBsYXllcigpO1xufVxuXG5mdW5jdGlvbiBzdG9wVHJhY2soKSB7XG4gICAgeXRQbGF5ZXIuc3RvcFZpZGVvKCk7XG59XG5cbmZ1bmN0aW9uIHNldFZvbHVtZSh2b2x1bWUpIHtcbiAgICB5dFBsYXllci5zZXRWb2x1bWUodm9sdW1lICogMTAwKTtcbn1cblxuZnVuY3Rpb24gZ2V0RWxhcHNlZChwZXJjZW50KSB7XG4gICAgY29uc3QgZHVyYXRpb24gPSB5dFBsYXllci5nZXREdXJhdGlvbigpO1xuICAgIGNvbnN0IGVsYXBzZWQgPSBkdXJhdGlvbiAvIDEwMCAqIHBlcmNlbnQ7XG5cbiAgICB5dFBsYXllci5zZWVrVG8oZWxhcHNlZCwgdHJ1ZSk7XG4gICAgcmV0dXJuIGVsYXBzZWQ7XG59XG5cbmV4cG9ydCB7XG4gICAgc3RvcFRyYWNrIGFzIHN0b3AsXG4gICAgcGxheVRyYWNrLFxuICAgIHRvZ2dsZVBsYXlpbmcsXG4gICAgZ2V0RWxhcHNlZCxcbiAgICBzZXRWb2x1bWVcbn07XG4iLCJpbXBvcnQgKiBhcyBtYWluIGZyb20gXCIuLy4uL21haW4uanNcIjtcbmltcG9ydCAqIGFzIHNpZGViYXIgZnJvbSBcIi4vLi4vc2lkZWJhci5qc1wiO1xuaW1wb3J0ICogYXMgbG9jYWwgZnJvbSBcIi4vLi4vbG9jYWwuanNcIjtcbmltcG9ydCAqIGFzIHl0IGZyb20gXCIuLy4uL3lvdXR1YmUuanNcIjtcbmltcG9ydCAqIGFzIHNjIGZyb20gXCIuLy4uL3NvdW5kY2xvdWQuanNcIjtcbmltcG9ydCAqIGFzIHBsYXlsaXN0IGZyb20gXCIuL3BsYXlsaXN0LmpzXCI7XG5pbXBvcnQgKiBhcyBwbGF5bGlzdE1hbmFnZSBmcm9tIFwiLi9wbGF5bGlzdC5tYW5hZ2UuanNcIjtcblxubGV0IHByb3ZpZGVyID0gXCJcIjtcblxuZnVuY3Rpb24gc2hvd0Vycm9yTWVzc2FnZShtZXNzYWdlKSB7XG4gICAgY29uc3QgZWxlbWVudCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwianMtcmVtb3RlLW5vdGljZVwiKTtcblxuICAgIGVsZW1lbnQudGV4dENvbnRlbnQgPSBtZXNzYWdlO1xuICAgIGVsZW1lbnQuY2xhc3NMaXN0LmFkZChcInNob3dcIik7XG5cbiAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgZWxlbWVudC50ZXh0Q29udGVudCA9IFwiXCI7XG4gICAgICAgIGVsZW1lbnQuY2xhc3NMaXN0LnJlbW92ZShcInNob3dcIik7XG4gICAgfSwgNDAwMCk7XG59XG5cbmZ1bmN0aW9uIGltcG9ydFBsYXlsaXN0KG5hbWUsIHZhbHVlKSB7XG4gICAgY29uc29sZS5sb2coYGZldGNoaW5nICR7bmFtZX0gcGxheWxpc3RgKTtcblxuICAgIGlmIChuYW1lID09PSBcInlvdXR1YmVcIikge1xuICAgICAgICB5dC5mZXRjaFBsYXlsaXN0KHZhbHVlKTtcbiAgICB9XG4gICAgZWxzZSBpZiAobmFtZSA9PT0gXCJzb3VuZGNsb3VkXCIpIHtcbiAgICAgICAgc2MuZmV0Y2hQbGF5bGlzdCh2YWx1ZSk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBhZGRQbGF5bGlzdChwbCkge1xuICAgIGNvbnN0IGV4aXN0aW5nUGxheWxpc3QgPSBwbGF5bGlzdC5nZXQocGwuaWQpO1xuXG4gICAgaWYgKGV4aXN0aW5nUGxheWxpc3QpIHtcbiAgICAgICAgcGxheWxpc3RNYW5hZ2UucmVtb3ZlKGV4aXN0aW5nUGxheWxpc3QuaWQpO1xuICAgIH1cbiAgICBwbGF5bGlzdE1hbmFnZS5pbml0KHBsYXlsaXN0LmNyZWF0ZShwbCksIFwiZ3JpZFwiLCB0cnVlKTtcbn1cblxuZnVuY3Rpb24gc2V0UHJvdmlkZXIoaXRlbSkge1xuICAgIGNvbnN0IG5ld1Byb3ZpZGVyID0gaXRlbS5hdHRyVmFsdWU7XG5cbiAgICBpZiAobmV3UHJvdmlkZXIgIT09IHByb3ZpZGVyKSB7XG4gICAgICAgIHByb3ZpZGVyID0gbmV3UHJvdmlkZXI7XG4gICAgICAgIG1haW4ucmVtb3ZlQ2xhc3NGcm9tRWxlbWVudChcInBsYXlsaXN0LXByb3ZpZGVyXCIsIFwic2VsZWN0ZWRcIik7XG4gICAgICAgIGl0ZW0uZWxlbWVudC5jbGFzc0xpc3QuYWRkKFwic2VsZWN0ZWRcIik7XG4gICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwianMtaW1wb3J0LWZvcm0tY29udGFpbmVyXCIpLmNsYXNzTGlzdC5hZGQoXCJzaG93XCIpO1xuICAgIH1cbiAgICBtYWluLnNjcmlwdExvYWRlci5sb2FkKFwianMvbGlicy9zZGsuanNcIiwgc2MuaW5pdCk7XG59XG5cbmZ1bmN0aW9uIHNob3dGaWxlUGlja2VyKGNob2ljZSkge1xuICAgIGNvbnN0IGZpbGVQaWNrZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImpzLWZpbGUtY2hvb3NlclwiKTtcbiAgICBjb25zdCBjbGlja0V2ZW50ID0gbmV3IE1vdXNlRXZlbnQoXCJjbGlja1wiKTtcblxuICAgIGlmIChjaG9pY2UgPT09IFwiZmlsZVwiKSB7XG4gICAgICAgIGZpbGVQaWNrZXIucmVtb3ZlQXR0cmlidXRlKFwid2Via2l0ZGlyZWN0b3J5XCIpO1xuICAgICAgICBmaWxlUGlja2VyLnJlbW92ZUF0dHJpYnV0ZShcImRpcmVjdG9yeVwiKTtcbiAgICAgICAgZmlsZVBpY2tlci5zZXRBdHRyaWJ1dGUoXCJtdWx0aXBsZVwiLCB0cnVlKTtcbiAgICB9XG4gICAgZWxzZSBpZiAoY2hvaWNlID09PSBcImZvbGRlclwiKSB7XG4gICAgICAgIGZpbGVQaWNrZXIucmVtb3ZlQXR0cmlidXRlKFwibXVsdGlwbGVcIik7XG4gICAgICAgIGZpbGVQaWNrZXIuc2V0QXR0cmlidXRlKFwid2Via2l0ZGlyZWN0b3J5XCIsIHRydWUpO1xuICAgICAgICBmaWxlUGlja2VyLnNldEF0dHJpYnV0ZShcImRpcmVjdG9yeVwiLCB0cnVlKTtcbiAgICB9XG4gICAgZmlsZVBpY2tlci5kaXNwYXRjaEV2ZW50KGNsaWNrRXZlbnQpO1xuICAgIG1haW4uc2NyaXB0TG9hZGVyLmxvYWQoXCJqcy9saWJzL21ldGFkYXRhLWF1ZGlvLXBhcnNlci5qc1wiKTtcbn1cblxuZnVuY3Rpb24gZWRpdFBsYXlsaXN0VGl0bGUoYWN0aW9uLCB0YXJnZXQsIHRpdGxlRWxlbWVudCwgcGxheWxpc3RJZCkge1xuICAgIHRhcmdldC5zZXRBdHRyaWJ1dGUoXCJ0aXRsZVwiLCBhY3Rpb25bMF0udG9VcHBlckNhc2UoKSArIGFjdGlvbi5zbGljZSgxKSk7XG4gICAgdGFyZ2V0LnNldEF0dHJpYnV0ZShcImRhdGEtYWN0aW9uXCIsIGFjdGlvbik7XG4gICAgdGFyZ2V0LmNsYXNzTGlzdC50b2dnbGUoXCJhY3RpdmVcIik7XG5cbiAgICBpZiAoYWN0aW9uID09PSBcInNhdmVcIikge1xuICAgICAgICB0aXRsZUVsZW1lbnQucmVtb3ZlQXR0cmlidXRlKFwicmVhZG9ubHlcIik7XG4gICAgICAgIHRpdGxlRWxlbWVudC5mb2N1cygpO1xuICAgICAgICB0aXRsZUVsZW1lbnQuc2VsZWN0aW9uU3RhcnQgPSAwO1xuICAgICAgICB0aXRsZUVsZW1lbnQuc2VsZWN0aW9uRW5kID0gdGl0bGVFbGVtZW50LnZhbHVlLmxlbmd0aDtcbiAgICB9XG4gICAgZWxzZSBpZiAoYWN0aW9uID09PSBcImVkaXRcIikge1xuICAgICAgICBjb25zdCBwbCA9IHBsYXlsaXN0LmdldChwbGF5bGlzdElkKTtcblxuICAgICAgICBpZiAoIXRpdGxlRWxlbWVudC52YWx1ZSkge1xuICAgICAgICAgICAgdGl0bGVFbGVtZW50LnZhbHVlID0gcGwudGl0bGU7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBuZXdUaXRsZSA9IHRpdGxlRWxlbWVudC52YWx1ZTtcblxuICAgICAgICBpZiAobmV3VGl0bGUgIT09IHBsLnRpdGxlKSB7XG4gICAgICAgICAgICBwbC50aXRsZSA9IG5ld1RpdGxlO1xuICAgICAgICAgICAgc2lkZWJhci5lZGl0RW50cnkocGxheWxpc3RJZCwgbmV3VGl0bGUpO1xuICAgICAgICAgICAgdGl0bGVFbGVtZW50LnNldEF0dHJpYnV0ZShcInZhbHVlXCIsIG5ld1RpdGxlKTtcbiAgICAgICAgICAgIHBsYXlsaXN0LnNhdmUocGwpO1xuICAgICAgICB9XG4gICAgICAgIHRpdGxlRWxlbWVudC5zZXRBdHRyaWJ1dGUoXCJyZWFkb25seVwiLCBcInJlYWRvbmx5XCIpO1xuICAgIH1cbn1cblxuZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJqcy1maWxlLWNob29zZXJcIikuYWRkRXZlbnRMaXN0ZW5lcihcImNoYW5nZVwiLCBldmVudCA9PiB7XG4gICAgbG9jYWwuYWRkVHJhY2tzKGV2ZW50LnRhcmdldC5maWxlcyk7XG4gICAgZXZlbnQudGFyZ2V0LnZhbHVlID0gXCJcIjtcbn0pO1xuXG5kb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImpzLXBsYXlsaXN0LWltcG9ydC1mb3JtXCIpLmFkZEV2ZW50TGlzdGVuZXIoXCJzdWJtaXRcIiwgZXZlbnQgPT4ge1xuICAgIGNvbnN0IHsgdGFyZ2V0OiBmb3JtIH0gPSBldmVudDtcbiAgICBjb25zdCB2YWx1ZSA9IGZvcm0uZWxlbWVudHNbXCJwbGF5bGlzdC1pZFwiXS52YWx1ZS50cmltKCk7XG5cbiAgICBpZiAodmFsdWUpIHtcbiAgICAgICAgaW1wb3J0UGxheWxpc3QocHJvdmlkZXIsIHZhbHVlKTtcbiAgICAgICAgZm9ybS5yZXNldCgpO1xuICAgIH1cbiAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xufSk7XG5cbmRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwianMtcGxheWxpc3QtZW50cmllc1wiKS5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKHsgdGFyZ2V0IH0pID0+IHtcbiAgICBjb25zdCBhY3Rpb24gPSB0YXJnZXQuZ2V0QXR0cmlidXRlKFwiZGF0YS1hY3Rpb25cIik7XG4gICAgY29uc3QgZW50cnkgPSBtYWluLmdldEVsZW1lbnRCeUF0dHIodGFyZ2V0LCBcImRhdGEtaWRcIik7XG5cbiAgICBpZiAoIWVudHJ5KSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAoYWN0aW9uID09PSBcInJlbW92ZVwiKSB7XG4gICAgICAgIHBsYXlsaXN0TWFuYWdlLnJlbW92ZShlbnRyeS5hdHRyVmFsdWUsIGVudHJ5LmVsZW1lbnQpO1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgbGV0IG5leHRBY3Rpb24gPSBcIlwiO1xuXG4gICAgaWYgKGFjdGlvbiA9PT0gXCJzYXZlXCIpIHtcbiAgICAgICAgbmV4dEFjdGlvbiA9IFwiZWRpdFwiO1xuICAgIH1cbiAgICBlbHNlIGlmIChhY3Rpb24gPT09IFwiZWRpdFwiKSB7XG4gICAgICAgIG5leHRBY3Rpb24gPSBcInNhdmVcIjtcbiAgICB9XG5cbiAgICBpZiAobmV4dEFjdGlvbikge1xuICAgICAgICBjb25zdCB0aXRsZUVsZW1lbnQgPSBlbnRyeS5lbGVtZW50LnF1ZXJ5U2VsZWN0b3IoXCIucGxheWxpc3QtZW50cnktdGl0bGVcIik7XG5cbiAgICAgICAgZWRpdFBsYXlsaXN0VGl0bGUobmV4dEFjdGlvbiwgdGFyZ2V0LCB0aXRsZUVsZW1lbnQsIGVudHJ5LmF0dHJWYWx1ZSk7XG4gICAgfVxufSk7XG5cbmRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwianMtcGxheWxpc3QtYWRkLW9wdGlvbnNcIikuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICh7IHRhcmdldCB9KSA9PiB7XG4gICAgY29uc3QgaXRlbSA9IG1haW4uZ2V0RWxlbWVudEJ5QXR0cih0YXJnZXQsIFwiZGF0YS1jaG9pY2VcIik7XG5cbiAgICBpZiAoIWl0ZW0pIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IGNob2ljZSA9IGl0ZW0uYXR0clZhbHVlO1xuXG4gICAgaWYgKGNob2ljZSA9PT0gXCJmaWxlXCIgfHwgY2hvaWNlID09PSBcImZvbGRlclwiKSB7XG4gICAgICAgIHNob3dGaWxlUGlja2VyKGNob2ljZSk7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgc2V0UHJvdmlkZXIoaXRlbSk7XG59KTtcblxud2luZG93LmFkZEV2ZW50TGlzdGVuZXIoXCJET01Db250ZW50TG9hZGVkXCIsIGZ1bmN0aW9uIG9uTG9hZCgpIHtcbiAgICBPYmplY3Qua2V5cyhsb2NhbFN0b3JhZ2UpLmZvckVhY2goaXRlbSA9PiB7XG4gICAgICAgIGlmIChpdGVtLnN0YXJ0c1dpdGgoXCJ5dC1wbC1cIikgfHwgaXRlbS5zdGFydHNXaXRoKFwic2MtcGwtXCIpKSB7XG4gICAgICAgICAgICBjb25zdCBwbCA9IEpTT04ucGFyc2UobG9jYWxTdG9yYWdlLmdldEl0ZW0oaXRlbSkpO1xuXG4gICAgICAgICAgICBtYWluLnNjcmlwdExvYWRlci5sb2FkKFwiaHR0cHM6Ly93d3cueW91dHViZS5jb20vaWZyYW1lX2FwaVwiKTtcbiAgICAgICAgICAgIG1haW4uc2NyaXB0TG9hZGVyLmxvYWQoXCJqcy9saWJzL3Nkay5qc1wiLCBzYy5pbml0KTtcbiAgICAgICAgICAgIHBsYXlsaXN0TWFuYWdlLmluaXQocGxheWxpc3QuY3JlYXRlKHBsKSwgXCJncmlkXCIsIGZhbHNlKTtcbiAgICAgICAgfVxuICAgIH0pO1xuICAgIHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKFwiRE9NQ29udGVudExvYWRlZFwiLCBvbkxvYWQpO1xufSk7XG5cbmV4cG9ydCB7XG4gICAgYWRkUGxheWxpc3QgYXMgYWRkLFxuICAgIHNob3dFcnJvck1lc3NhZ2Vcbn07XG4iLCJjb25zdCBwbGF5bGlzdHMgPSB7fTtcbmxldCBhY3RpdmVQbGF5bGlzdElkID0gXCJcIjtcbmxldCBjdXJyZW50VHJhY2sgPSBudWxsO1xubGV0IGN1cnJlbnRJbmRleCA9IDA7XG5cbmZ1bmN0aW9uIGdldEFsbFBsYXlsaXN0cygpIHtcbiAgICByZXR1cm4gcGxheWxpc3RzO1xufVxuXG5mdW5jdGlvbiBnZXRQbGF5bGlzdEJ5SWQoaWQpIHtcbiAgICByZXR1cm4gcGxheWxpc3RzW2lkXTtcbn1cblxuZnVuY3Rpb24gc2F2ZVBsYXlsaXN0KHBsKSB7XG4gICAgY29uc3QgdG9TYXZlID0ge1xuICAgICAgICBpZDogcGwuaWQsXG4gICAgICAgIG9yZGVyOiAtcGwub3JkZXIsXG4gICAgICAgIHNodWZmbGVkOiBwbC5zaHVmZmxlZCxcbiAgICAgICAgc29ydGVkQnk6IHBsLnNvcnRlZEJ5LFxuICAgICAgICBwbGF5YmFja09yZGVyOiBwbC5wbGF5YmFja09yZGVyLFxuICAgICAgICB0aXRsZTogcGwudGl0bGVcbiAgICB9O1xuXG4gICAgaWYgKHBsLmlkLnN0YXJ0c1dpdGgoXCJ5dC1wbC1cIikgfHwgcGwuaWQuc3RhcnRzV2l0aChcInNjLXBsLVwiKSkge1xuICAgICAgICB0b1NhdmUudHJhY2tzID0gcGwudHJhY2tzO1xuICAgIH1cblxuICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKHBsLmlkLCBKU09OLnN0cmluZ2lmeSh0b1NhdmUpKTtcbn1cblxuZnVuY3Rpb24gY3JlYXRlUGxheWxpc3QocGwpIHtcbiAgICBwbGF5bGlzdHNbcGwuaWRdID0gT2JqZWN0LmFzc2lnbih7XG4gICAgICAgIHNvcnRlZEJ5OiBcIlwiLFxuICAgICAgICBvcmRlcjogMCxcbiAgICAgICAgc2h1ZmZsZWQ6IGZhbHNlLFxuICAgICAgICB0cmFja3M6IHBsLnRyYWNrcyB8fCBbXSxcbiAgICAgICAgcGxheWJhY2tPcmRlcjogW11cbiAgICB9LCBwbCwgSlNPTi5wYXJzZShsb2NhbFN0b3JhZ2UuZ2V0SXRlbShwbC5pZCkpIHx8IHt9KTtcbiAgICBjb25zb2xlLmxvZyhwbGF5bGlzdHMpO1xuICAgIHJldHVybiBwbGF5bGlzdHNbcGwuaWRdO1xufVxuXG5mdW5jdGlvbiByZW1vdmVQbGF5bGlzdChpZCkge1xuICAgIGRlbGV0ZSBwbGF5bGlzdHNbaWRdO1xuICAgIGxvY2FsU3RvcmFnZS5yZW1vdmVJdGVtKGlkKTtcbiAgICBjb25zb2xlLmxvZyhwbGF5bGlzdHMpO1xufVxuXG5mdW5jdGlvbiBzZXRBY3RpdmVQbGF5bGlzdChpZCkge1xuICAgIGlmIChwbGF5bGlzdHMuaGFzT3duUHJvcGVydHkoaWQpKSB7XG4gICAgICAgIGFjdGl2ZVBsYXlsaXN0SWQgPSBpZDtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGdldEFjdGl2ZVBsYXlsaXN0SWQoKSB7XG4gICAgcmV0dXJuIGFjdGl2ZVBsYXlsaXN0SWQ7XG59XG5cbmZ1bmN0aW9uIGlzQWN0aXZlKGlkKSB7XG4gICAgcmV0dXJuIGlkID09PSBhY3RpdmVQbGF5bGlzdElkO1xufVxuXG5mdW5jdGlvbiBnZXRBY3RpdmVQbGF5bGlzdCgpIHtcbiAgICByZXR1cm4gcGxheWxpc3RzW2FjdGl2ZVBsYXlsaXN0SWRdO1xufVxuXG5mdW5jdGlvbiBzZXRDdXJyZW50VHJhY2sodHJhY2spIHtcbiAgICBjdXJyZW50VHJhY2sgPSB0cmFjaztcbn1cblxuZnVuY3Rpb24gZ2V0Q3VycmVudFRyYWNrKCkge1xuICAgIHJldHVybiBjdXJyZW50VHJhY2s7XG59XG5cbmZ1bmN0aW9uIHNldEN1cnJlbnRJbmRleChpbmRleCkge1xuICAgIGNvbnN0IHBsYXlsaXN0ID0gZ2V0QWN0aXZlUGxheWxpc3QoKTtcblxuICAgIGN1cnJlbnRJbmRleCA9IHBsYXlsaXN0LnBsYXliYWNrT3JkZXIuaW5kZXhPZihOdW1iZXIucGFyc2VJbnQoaW5kZXgsIDEwKSk7XG4gICAgY29uc29sZS5sb2coaW5kZXgsIGN1cnJlbnRJbmRleCk7XG59XG5cbmZ1bmN0aW9uIHJlc2V0Q3VycmVudEluZGV4KCkge1xuICAgIGNvbnN0IGN1cnJlbnRUcmFjayA9IGdldEN1cnJlbnRUcmFjaygpO1xuXG4gICAgaWYgKGN1cnJlbnRUcmFjaykge1xuICAgICAgICBzZXRDdXJyZW50SW5kZXgoY3VycmVudFRyYWNrLmluZGV4KTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGdldEN1cnJlbnRUcmFja0luZGV4KCkge1xuICAgIGNvbnN0IHBsYXlsaXN0ID0gZ2V0QWN0aXZlUGxheWxpc3QoKTtcblxuICAgIHJldHVybiBwbGF5bGlzdC5wbGF5YmFja09yZGVyW2N1cnJlbnRJbmRleF07XG59XG5cbmZ1bmN0aW9uIHNldFRyYWNrSW5kZXhlcyhwbCwgc2h1ZmZsZSkge1xuICAgIGlmICghZ2V0UGxheWxpc3RCeUlkKHBsLmlkKSkge1xuICAgICAgICBjb25zb2xlLmxvZyhcInNldFRyYWNrSW5kZXhlc1wiLCBcImNyZWF0aW5nIHBsYXlsaXN0XCIpO1xuICAgICAgICBwbCA9IGNyZWF0ZVBsYXlsaXN0KHBsKTtcbiAgICB9XG5cbiAgICBwbC5wbGF5YmFja09yZGVyID0gcGwudHJhY2tzLm1hcCh0cmFjayA9PiB0cmFjay5pbmRleCk7XG5cbiAgICBpZiAoc2h1ZmZsZSkge1xuICAgICAgICBzaHVmZmxlUGxheWJhY2tPcmRlcih0cnVlLCBwbCk7XG4gICAgICAgIHJlc2V0Q3VycmVudEluZGV4KCk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICBzYXZlUGxheWxpc3QocGwpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gc2h1ZmZsZUFycmF5KGFycmF5KSB7XG4gICAgbGV0IGluZGV4ID0gYXJyYXkubGVuZ3RoO1xuXG4gICAgd2hpbGUgKGluZGV4KSB7XG4gICAgICAgIGNvbnN0IHJhbmRvbUluZGV4ID0gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogaW5kZXgpO1xuXG4gICAgICAgIGluZGV4IC09IDE7XG4gICAgICAgIFthcnJheVtpbmRleF0sIGFycmF5W3JhbmRvbUluZGV4XV0gPSBbYXJyYXlbcmFuZG9tSW5kZXhdLCBhcnJheVtpbmRleF1dO1xuICAgIH1cbiAgICByZXR1cm4gYXJyYXk7XG59XG5cbmZ1bmN0aW9uIHNodWZmbGVQbGF5YmFja09yZGVyKHNodWZmbGUsIHBsKSB7XG4gICAgcGwuc2h1ZmZsZWQgPSBzaHVmZmxlO1xuICAgIGlmIChzaHVmZmxlKSB7XG4gICAgICAgIHBsLnBsYXliYWNrT3JkZXIgPSBzaHVmZmxlQXJyYXkocGwucGxheWJhY2tPcmRlcik7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICBwbC5wbGF5YmFja09yZGVyLnNvcnQoKGEsIGIpID0+IGEgLSBiKTtcbiAgICB9XG4gICAgY29uc29sZS5sb2cocGwucGxheWJhY2tPcmRlcik7XG4gICAgc2F2ZVBsYXlsaXN0KHBsKTtcbn1cblxuZnVuY3Rpb24gZGVjcmVtZW50SW5kZXgoKSB7XG4gICAgY3VycmVudEluZGV4IC09IDE7XG59XG5cbmZ1bmN0aW9uIGdldE5leHRUcmFja0luZGV4KGRpcmVjdGlvbikge1xuICAgIGNvbnN0IHsgcGxheWJhY2tPcmRlciB9ID0gZ2V0QWN0aXZlUGxheWxpc3QoKTtcblxuICAgIGN1cnJlbnRJbmRleCArPSBkaXJlY3Rpb247XG4gICAgaWYgKGN1cnJlbnRJbmRleCA9PT0gcGxheWJhY2tPcmRlci5sZW5ndGgpIHtcbiAgICAgICAgY3VycmVudEluZGV4ID0gMDtcbiAgICB9XG4gICAgaWYgKGN1cnJlbnRJbmRleCA9PT0gLTEpIHtcbiAgICAgICAgY3VycmVudEluZGV4ID0gcGxheWJhY2tPcmRlci5sZW5ndGggLSAxO1xuICAgIH1cbiAgICByZXR1cm4gcGxheWJhY2tPcmRlcltjdXJyZW50SW5kZXhdO1xufVxuXG5mdW5jdGlvbiBnZXRUcmFja0F0SW5kZXgoaW5kZXgpIHtcbiAgICBjb25zdCBwbGF5bGlzdCA9IGdldEFjdGl2ZVBsYXlsaXN0KCk7XG5cbiAgICByZXR1cm4gcGxheWxpc3QudHJhY2tzW2luZGV4XTtcbn1cblxuZnVuY3Rpb24gZ2V0TmV4dFRyYWNrKGRpcmVjdGlvbikge1xuICAgIGNvbnN0IGluZGV4ID0gZ2V0TmV4dFRyYWNrSW5kZXgoZGlyZWN0aW9uKTtcbiAgICBjb25zdCB0cmFjayA9IGdldFRyYWNrQXRJbmRleChpbmRleCk7XG5cbiAgICBzZXRDdXJyZW50VHJhY2sodHJhY2spO1xuICAgIHNldEN1cnJlbnRJbmRleCh0cmFjay5pbmRleCk7XG4gICAgcmV0dXJuIHRyYWNrO1xufVxuXG5mdW5jdGlvbiBzb3J0QXJyYXkodHJhY2tzLCBzb3J0LCBvcmRlcikge1xuICAgIHRyYWNrcy5zb3J0KChhLCBiKSA9PiB7XG4gICAgICAgIGNvbnN0IGFWYWx1ZSA9IGFbc29ydF0udG9Mb3dlckNhc2UoKTtcbiAgICAgICAgY29uc3QgYlZhbHVlID0gYltzb3J0XS50b0xvd2VyQ2FzZSgpO1xuXG4gICAgICAgIGlmIChhVmFsdWUgPCBiVmFsdWUpIHtcbiAgICAgICAgICAgIHJldHVybiAtMSAqIG9yZGVyO1xuICAgICAgICB9XG4gICAgICAgIGlmIChhVmFsdWUgPiBiVmFsdWUpIHtcbiAgICAgICAgICAgIHJldHVybiAxICogb3JkZXI7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIDA7XG4gICAgfSk7XG59XG5cbmZ1bmN0aW9uIHNvcnRQbGF5bGlzdChwbCwgc29ydEJ5KSB7XG4gICAgaWYgKHBsLnNvcnRlZEJ5ID09PSBzb3J0QnkgJiYgcGwub3JkZXIgPT09IDEpIHtcbiAgICAgICAgcGwub3JkZXIgPSAtMTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIHBsLm9yZGVyID0gMTtcbiAgICB9XG4gICAgcGwuc29ydGVkQnkgPSBzb3J0Qnk7XG4gICAgc29ydEFycmF5KHBsLnRyYWNrcywgc29ydEJ5LCBwbC5vcmRlcik7XG4gICAgc2F2ZVBsYXlsaXN0KHBsKTtcbn1cblxuZXhwb3J0IHtcbiAgICBnZXRQbGF5bGlzdEJ5SWQgYXMgZ2V0LFxuICAgIGNyZWF0ZVBsYXlsaXN0IGFzIGNyZWF0ZSxcbiAgICByZW1vdmVQbGF5bGlzdCBhcyByZW1vdmUsXG4gICAgc2F2ZVBsYXlsaXN0IGFzIHNhdmUsXG4gICAgc29ydFBsYXlsaXN0IGFzIHNvcnQsXG4gICAgZ2V0QWxsUGxheWxpc3RzIGFzIGdldEFsbCxcbiAgICBnZXRBY3RpdmVQbGF5bGlzdCBhcyBnZXRBY3RpdmUsXG4gICAgc2V0QWN0aXZlUGxheWxpc3QgYXMgc2V0QWN0aXZlLFxuICAgIGlzQWN0aXZlLFxuICAgIGdldEFjdGl2ZVBsYXlsaXN0SWQsXG4gICAgc2V0Q3VycmVudFRyYWNrLFxuICAgIGdldEN1cnJlbnRUcmFjayxcbiAgICBnZXROZXh0VHJhY2tJbmRleCxcbiAgICBnZXROZXh0VHJhY2ssXG4gICAgc2V0Q3VycmVudEluZGV4LFxuICAgIHJlc2V0Q3VycmVudEluZGV4LFxuICAgIGdldEN1cnJlbnRUcmFja0luZGV4LFxuICAgIGdldFRyYWNrQXRJbmRleCxcbiAgICBzZXRUcmFja0luZGV4ZXMsXG4gICAgc2h1ZmZsZVBsYXliYWNrT3JkZXIsXG4gICAgZGVjcmVtZW50SW5kZXhcbn07XG4iLCJpbXBvcnQgKiBhcyByb3V0ZXIgZnJvbSBcIi4vLi4vcm91dGVyLmpzXCI7XG5pbXBvcnQgKiBhcyBtYWluIGZyb20gXCIuLy4uL21haW4uanNcIjtcbmltcG9ydCAqIGFzIHNldHRpbmdzIGZyb20gXCIuLy4uL3NldHRpbmdzLmpzXCI7XG5pbXBvcnQgKiBhcyBzaWRlYmFyIGZyb20gXCIuLy4uL3NpZGViYXIuanNcIjtcbmltcG9ydCAqIGFzIGxvY2FsIGZyb20gXCIuLy4uL2xvY2FsLmpzXCI7XG5pbXBvcnQgKiBhcyBwbGF5ZXIgZnJvbSBcIi4vLi4vcGxheWVyL3BsYXllci5qc1wiO1xuaW1wb3J0ICogYXMgcGxheWxpc3QgZnJvbSBcIi4vcGxheWxpc3QuanNcIjtcbmltcG9ydCAqIGFzIHBsYXlsaXN0VmlldyBmcm9tIFwiLi9wbGF5bGlzdC52aWV3LmpzXCI7XG5cbmxldCB0aW1lb3V0ID0gMDtcblxuZnVuY3Rpb24gaW5pdFBsYXlsaXN0KHBsLCB2aWV3LCB0b2dnbGUpIHtcbiAgICBjb25zdCByb3V0ZSA9IGBwbGF5bGlzdC8ke3BsLmlkfWA7XG5cbiAgICBpZiAoIXBsLnBsYXliYWNrT3JkZXIubGVuZ3RoKSB7XG4gICAgICAgIHBsYXlsaXN0LnNldFRyYWNrSW5kZXhlcyhwbCwgc2V0dGluZ3MuZ2V0KFwic2h1ZmZsZVwiKSk7XG4gICAgfVxuXG4gICAgcm91dGVyLmFkZChyb3V0ZSk7XG4gICAgcGxheWxpc3RWaWV3LmFkZChwbCwgdmlldyk7XG4gICAgc2lkZWJhci5jcmVhdGVFbnRyeShwbC50aXRsZSwgcGwuaWQpO1xuICAgIGNyZWF0ZVBsYXlsaXN0RW50cnkocGwudGl0bGUsIHBsLmlkKTtcblxuICAgIGlmIChwbC5zb3J0ZWRCeSkge1xuICAgICAgICBwbGF5bGlzdC5zb3J0KHBsLCBwbC5zb3J0ZWRCeSk7XG4gICAgICAgIHVwZGF0ZVBsYXlsaXN0KHBsKTtcbiAgICB9XG5cbiAgICBpZiAodG9nZ2xlICYmIHJvdXRlci5pc0FjdGl2ZShcImFkZFwiKSkge1xuICAgICAgICByb3V0ZXIudG9nZ2xlKHJvdXRlKTtcbiAgICB9XG4gICAgZWxzZSBpZiAocm91dGVyLmlzQWN0aXZlKHBsLmlkKSkge1xuICAgICAgICBtYWluLnRvZ2dsZVRhYihwbC5pZCk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBhcHBlbmRUb1BsYXlsaXN0KHBsLCB0cmFja3MsIHZpZXcsIHRvZ2dsZSkge1xuICAgIHBsYXlsaXN0LnNldFRyYWNrSW5kZXhlcyhwbCwgc2V0dGluZ3MuZ2V0KFwic2h1ZmZsZVwiKSk7XG4gICAgcGxheWxpc3RWaWV3LmFwcGVuZChwbC5pZCwgdHJhY2tzLCB2aWV3KTtcblxuICAgIGlmICh0b2dnbGUpIHtcbiAgICAgICAgY29uc3Qgcm91dGUgPSBgcGxheWxpc3QvJHtwbC5pZH1gO1xuXG4gICAgICAgIHJvdXRlci50b2dnbGUocm91dGUpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gcmVtb3ZlUGxheWxpc3QoaWQsIGVudHJ5KSB7XG4gICAgcGxheWxpc3RWaWV3LnJlbW92ZShpZCk7XG5cbiAgICBpZiAoaWQgPT09IFwibG9jYWwtZmlsZXNcIikge1xuICAgICAgICBsb2NhbC53b3JrZXIucG9zdE1lc3NhZ2UoeyBhY3Rpb246IFwiY2xlYXJcIiB9KTtcbiAgICB9XG5cbiAgICBpZiAocGxheWxpc3QuaXNBY3RpdmUoaWQpKSB7XG4gICAgICAgIHBsYXllci5zdG9wKCk7XG4gICAgfVxuXG4gICAgaWYgKCFlbnRyeSkge1xuICAgICAgICBlbnRyeSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYFtkYXRhLWlkPSR7aWR9XWApO1xuICAgIH1cbiAgICBlbnRyeS5wYXJlbnRFbGVtZW50LnJlbW92ZUNoaWxkKGVudHJ5KTtcblxuICAgIHBsYXlsaXN0LnJlbW92ZShpZCk7XG4gICAgc2lkZWJhci5yZW1vdmVFbnRyeShpZCk7XG59XG5cbmZ1bmN0aW9uIHVwZGF0ZVBsYXlsaXN0KHBsKSB7XG4gICAgY29uc3QgY3VycmVudFRyYWNrID0gcGxheWxpc3QuZ2V0Q3VycmVudFRyYWNrKCk7XG5cbiAgICBtYWluLnJlbW92ZUNsYXNzRnJvbUVsZW1lbnQoXCJ0cmFja1wiLCBcInNlbGVjdGVkXCIpO1xuICAgIHBsYXlsaXN0Vmlldy51cGRhdGUocGwpO1xuXG4gICAgaWYgKGN1cnJlbnRUcmFjayAmJiBwbGF5bGlzdC5pc0FjdGl2ZShwbC5pZCkpIHtcbiAgICAgICAgcGxheWxpc3RWaWV3LnNob3dQbGF5aW5nVHJhY2soY3VycmVudFRyYWNrLmluZGV4LCBwbC5pZCwgZmFsc2UpO1xuICAgICAgICBwbGF5bGlzdC5zZXRDdXJyZW50SW5kZXgoY3VycmVudFRyYWNrLmluZGV4KTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGZpbHRlclRyYWNrcyh0cmFja3MsIHRyYWNrRWxlbWVudHMsIHF1ZXJ5KSB7XG4gICAgdHJhY2tzLmZvckVhY2godHJhY2sgPT4ge1xuICAgICAgICBjb25zdCB0cmFja0VsZW1lbnQgPSB0cmFja0VsZW1lbnRzW3RyYWNrLmluZGV4XTtcbiAgICAgICAgY29uc3QgdGl0bGUgPSB0cmFjay50aXRsZSA/IHRyYWNrLnRpdGxlLnRvTG93ZXJDYXNlKCkgOiBcIlwiO1xuICAgICAgICBjb25zdCBhcnRpc3QgPSB0cmFjay5hcnRpc3QgPyB0cmFjay5hcnRpc3QudG9Mb3dlckNhc2UoKSA6IFwiXCI7XG4gICAgICAgIGNvbnN0IGFsYnVtID0gdHJhY2suYWxidW0gPyB0cmFjay5hbGJ1bS50b0xvd2VyQ2FzZSgpIDogXCJcIjtcblxuICAgICAgICBpZiAoIXRpdGxlLmluY2x1ZGVzKHF1ZXJ5KSAmJiAhYXJ0aXN0LmluY2x1ZGVzKHF1ZXJ5KSAmJiAhYWxidW0uaW5jbHVkZXMocXVlcnkpKSB7XG4gICAgICAgICAgICB0cmFja0VsZW1lbnQuY2xhc3NMaXN0LmFkZChcImhpZGRlblwiKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHRyYWNrRWxlbWVudC5jbGFzc0xpc3QucmVtb3ZlKFwiaGlkZGVuXCIpO1xuICAgICAgICB9XG4gICAgfSk7XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZVBsYXlsaXN0RW50cnkodGl0bGUsIGlkKSB7XG4gICAgY29uc3QgcGxheWxpc3RFbnRyeUNvbnRhaW5lciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwianMtcGxheWxpc3QtZW50cmllc1wiKTtcbiAgICBjb25zdCBlbnRyeSA9IGBcbiAgICAgICAgPGxpIGNsYXNzPVwicGxheWxpc3QtZW50cnlcIiBkYXRhLWlkPSR7aWR9PlxuICAgICAgICAgICAgPGlucHV0IHR5cGU9XCJ0ZXh0XCIgY2xhc3M9XCJpbnB1dCBwbGF5bGlzdC1lbnRyeS10aXRsZVwiIHZhbHVlPVwiJHt0aXRsZX1cIiByZWFkb25seT5cbiAgICAgICAgICAgIDxzcGFuPlxuICAgICAgICAgICAgICAgIDxidXR0b24gY2xhc3M9XCJpY29uLXBlbmNpbCBmb250LWJ0biBwbGF5bGlzdC1lbnRyeS1idG5cIlxuICAgICAgICAgICAgICAgICAgICBkYXRhLWFjdGlvbj1cImVkaXRcIiB0aXRsZT1cIkVkaXQgcGxheWxpc3QgdGl0bGVcIj48L2J1dHRvbj5cbiAgICAgICAgICAgICAgICA8YnV0dG9uIGNsYXNzPVwiaWNvbi10cmFzaCBmb250LWJ0biBwbGF5bGlzdC1lbnRyeS1idG5cIlxuICAgICAgICAgICAgICAgICAgICBkYXRhLWFjdGlvbj1cInJlbW92ZVwiIHRpdGxlPVwiUmVtb3ZlIHBsYXlsaXN0XCI+PC9idXR0b24+XG4gICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgIDwvbGk+XG4gICAgYDtcblxuICAgIHBsYXlsaXN0RW50cnlDb250YWluZXIuaW5zZXJ0QWRqYWNlbnRIVE1MKFwiYmVmb3JlZW5kXCIsIGVudHJ5KTtcbn1cblxuZnVuY3Rpb24gc29ydFBsYXlsaXN0KHNvcnRCeSkge1xuICAgIGNvbnN0IHBsID0gcGxheWxpc3QuZ2V0KHNldHRpbmdzLmdldChcImFjdGl2ZVRhYlwiKSk7XG4gICAgbGV0IHF1ZXJ5ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoYGpzLSR7cGwuaWR9LWZpbHRlci1pbnB1dGApLnZhbHVlLnRyaW0oKTtcblxuICAgIHBsYXlsaXN0LnNvcnQocGwsIHNvcnRCeSk7XG4gICAgdXBkYXRlUGxheWxpc3QocGwpO1xuXG4gICAgaWYgKHF1ZXJ5KSB7XG4gICAgICAgIGNvbnN0IHRyYWNrRWxlbWVudHMgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChganMtJHtwbC5pZH1gKS5jaGlsZHJlbjtcblxuICAgICAgICBxdWVyeSA9IHF1ZXJ5LnRvTG93ZXJDYXNlKCk7XG4gICAgICAgIGZpbHRlclRyYWNrcyhwbC50cmFja3MsIHRyYWNrRWxlbWVudHMsIHF1ZXJ5KTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIHNlbGVjdGVkVHJhY2tFbGVtZW50KGVsZW1lbnQpIHtcbiAgICBtYWluLnJlbW92ZUNsYXNzRnJvbUVsZW1lbnQoXCJ0cmFja1wiLCBcInNlbGVjdGVkXCIpO1xuICAgIGVsZW1lbnQuY2xhc3NMaXN0LmFkZChcInNlbGVjdGVkXCIpO1xufVxuXG5mdW5jdGlvbiByZW1vdmVUcmFjayhwbCwgcGxheWxpc3RFbGVtZW50LCB0cmFja0VsZW1lbnQpIHtcbiAgICBjb25zdCBpbmRleCA9IE51bWJlci5wYXJzZUludCh0cmFja0VsZW1lbnQuZ2V0QXR0cmlidXRlKFwiZGF0YS1pbmRleFwiKSwgMTApO1xuICAgIGNvbnN0IGN1cnJlbnRUcmFjayA9IHBsYXlsaXN0LmdldEN1cnJlbnRUcmFjaygpO1xuICAgIGNvbnN0IGN1cnJlbnRJbmRleCA9IGN1cnJlbnRUcmFjayA/IGN1cnJlbnRUcmFjay5pbmRleCA6IC0xO1xuICAgIGNvbnN0IHNodWZmbGUgPSBzZXR0aW5ncy5nZXQoXCJzaHVmZmxlXCIpO1xuXG4gICAgaWYgKHBsLmlkID09PSBcImxvY2FsLWZpbGVzXCIpIHtcbiAgICAgICAgY29uc3QgeyBuYW1lOiB0cmFja05hbWUgfSA9IHBsLnRyYWNrc1tpbmRleF07XG5cbiAgICAgICAgbG9jYWwud29ya2VyLnBvc3RNZXNzYWdlKHtcbiAgICAgICAgICAgIGFjdGlvbjogXCJyZW1vdmVcIixcbiAgICAgICAgICAgIG5hbWU6IHRyYWNrTmFtZVxuICAgICAgICB9KTtcbiAgICB9XG4gICAgZWxzZSBpZiAocGwuaWQuc3RhcnRzV2l0aChcInl0LXBsLVwiKSB8fCBwbC5pZC5zdGFydHNXaXRoKFwic2MtcGwtXCIpKSB7XG4gICAgICAgIHBsLmRlbGV0ZWQgPSBwbC5kZWxldGVkIHx8IFtdO1xuICAgICAgICBwbC5kZWxldGVkLnB1c2gocGwudHJhY2tzW2luZGV4XS5pZCk7XG4gICAgfVxuXG4gICAgcGxheWxpc3RFbGVtZW50LnJlbW92ZUNoaWxkKHRyYWNrRWxlbWVudCk7XG4gICAgcGwudHJhY2tzLnNwbGljZShpbmRleCwgMSk7XG4gICAgcGwudHJhY2tzLmZvckVhY2goKHRyYWNrLCBpbmRleCkgPT4ge1xuICAgICAgICB0cmFjay5pbmRleCA9IGluZGV4O1xuICAgICAgICBwbGF5bGlzdEVsZW1lbnQuY2hpbGRyZW5baW5kZXhdLnNldEF0dHJpYnV0ZShcImRhdGEtaW5kZXhcIiwgaW5kZXgpO1xuICAgIH0pO1xuICAgIHBsYXlsaXN0LnNldFRyYWNrSW5kZXhlcyhwbCwgc2h1ZmZsZSwgdHJ1ZSk7XG5cbiAgICBpZiAoY3VycmVudFRyYWNrICYmIGN1cnJlbnRJbmRleCA9PT0gaW5kZXgpIHtcbiAgICAgICAgaWYgKCFzZXR0aW5ncy5nZXQoXCJwYXVzZWRcIikpIHtcbiAgICAgICAgICAgIHBsYXllci5wbGF5TmV4dCgwKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHBsYXllci5zdG9wKCk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgZWxzZSBpZiAoY3VycmVudEluZGV4ID4gaW5kZXggJiYgIXNodWZmbGUpIHtcbiAgICAgICAgcGxheWxpc3QuZGVjcmVtZW50SW5kZXgoKTtcbiAgICB9XG59XG5cbmRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwianMtdGFiLWNvbnRhaW5lclwiKS5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKHsgdGFyZ2V0IH0pID0+IHtcbiAgICBjb25zdCBzb3J0QnkgPSB0YXJnZXQuZ2V0QXR0cmlidXRlKFwiZGF0YS1zb3J0XCIpO1xuXG4gICAgaWYgKHNvcnRCeSkge1xuICAgICAgICBzb3J0UGxheWxpc3Qoc29ydEJ5KTtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IGl0ZW0gPSBtYWluLmdldEVsZW1lbnRCeUF0dHIodGFyZ2V0LCBcImRhdGEtaW5kZXhcIik7XG5cbiAgICBpZiAoaXRlbSkge1xuICAgICAgICBzZWxlY3RlZFRyYWNrRWxlbWVudChpdGVtLmVsZW1lbnQpO1xuICAgIH1cbn0pO1xuXG53aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcihcImtleXVwXCIsICh7IHRhcmdldCB9KSA9PiB7XG4gICAgaWYgKHRpbWVvdXQpIHtcbiAgICAgICAgY2xlYXJUaW1lb3V0KHRpbWVvdXQpO1xuICAgIH1cblxuICAgIHRpbWVvdXQgPSBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgaWYgKHRhcmdldC5jbGFzc0xpc3QuY29udGFpbnMoXCJmaWx0ZXItaW5wdXRcIikpIHtcbiAgICAgICAgICAgIGNvbnN0IHBsID0gcGxheWxpc3QuZ2V0KHNldHRpbmdzLmdldChcImFjdGl2ZVRhYlwiKSk7XG4gICAgICAgICAgICBjb25zdCB0cmFja0VsZW1lbnRzID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoYGpzLSR7cGwuaWR9YCkuY2hpbGRyZW47XG4gICAgICAgICAgICBjb25zdCBxdWVyeSA9IHRhcmdldC52YWx1ZS50cmltKCkudG9Mb3dlckNhc2UoKTtcblxuICAgICAgICAgICAgZmlsdGVyVHJhY2tzKHBsLnRyYWNrcywgdHJhY2tFbGVtZW50cywgcXVlcnkpO1xuICAgICAgICB9XG4gICAgfSwgNDAwKTtcbn0pO1xuXG53aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcihcImtleXByZXNzXCIsIGV2ZW50ID0+IHtcbiAgICBjb25zdCBrZXkgPSBldmVudC5rZXkgPT09IFwiRGVsZXRlXCIgfHwgZXZlbnQua2V5Q29kZSA9PT0gMTI3O1xuICAgIGNvbnN0IHBsID0gcGxheWxpc3QuZ2V0KHNldHRpbmdzLmdldChcImFjdGl2ZVRhYlwiKSk7XG5cbiAgICBpZiAoIWtleSB8fCAhcGwpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IHBsYXlsaXN0Q29udGFpbmVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoYGpzLSR7cGwuaWR9YCk7XG4gICAgY29uc3Qgc2VsZWN0ZWQgPSBwbGF5bGlzdENvbnRhaW5lci5xdWVyeVNlbGVjdG9yKFwiLnRyYWNrLnNlbGVjdGVkXCIpO1xuXG4gICAgaWYgKCFzZWxlY3RlZCkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIHJlbW92ZVRyYWNrKHBsLCBwbGF5bGlzdENvbnRhaW5lciwgc2VsZWN0ZWQpO1xufSk7XG5cbmV4cG9ydCB7XG4gICAgaW5pdFBsYXlsaXN0IGFzIGluaXQsXG4gICAgYXBwZW5kVG9QbGF5bGlzdCBhcyBhcHBlbmRUbyxcbiAgICByZW1vdmVQbGF5bGlzdCBhcyByZW1vdmVcbn07XG4iLCJpbXBvcnQgeyByZW1vdmVDbGFzc0Zyb21FbGVtZW50IH0gZnJvbSBcIi4vLi4vbWFpbi5qc1wiO1xuXG5mdW5jdGlvbiBjcmVhdGVMaXN0SXRlbSh0cmFjaykge1xuICAgIHJldHVybiBgXG4gICAgICAgIDxsaSBjbGFzcz1cImxpc3QtaXRlbSB0cmFja1wiIGRhdGEtaW5kZXg9XCIke3RyYWNrLmluZGV4fVwiPlxuICAgICAgICAgICAgPHNwYW4+JHt0cmFjay50aXRsZX08L3NwYW4+XG4gICAgICAgICAgICA8c3Bhbj4ke3RyYWNrLmFydGlzdH08L3NwYW4+XG4gICAgICAgICAgICA8c3Bhbj4ke3RyYWNrLmFsYnVtfTwvc3Bhbj5cbiAgICAgICAgICAgIDxzcGFuPiR7dHJhY2suZHVyYXRpb259PC9zcGFuPlxuICAgICAgICA8L2xpPlxuICAgIGA7XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZUxpc3QoaWQsIGl0ZW1zKSB7XG4gICAgcmV0dXJuIGBcbiAgICAgICAgPHVsIGNsYXNzPVwibGlzdCBsaXN0LXZpZXctaGVhZGVyXCI+XG4gICAgICAgICAgICA8bGkgY2xhc3M9XCJsaXN0LXZpZXctaGVhZGVyLWl0ZW1cIj5cbiAgICAgICAgICAgICAgICA8c3BhbiBkYXRhLXNvcnQ9XCJ0aXRsZVwiPlRJVExFPC9zcGFuPlxuICAgICAgICAgICAgPC9saT5cbiAgICAgICAgICAgIDxsaSBjbGFzcz1cImxpc3Qtdmlldy1oZWFkZXItaXRlbVwiPlxuICAgICAgICAgICAgICAgIDxzcGFuIGRhdGEtc29ydD1cImFydGlzdFwiPkFSVElTVDwvc3Bhbj5cbiAgICAgICAgICAgIDwvbGk+XG4gICAgICAgICAgICA8bGkgY2xhc3M9XCJsaXN0LXZpZXctaGVhZGVyLWl0ZW1cIj5cbiAgICAgICAgICAgICAgICA8c3BhbiBkYXRhLXNvcnQ9XCJhbGJ1bVwiPkFMQlVNPC9zcGFuPlxuICAgICAgICAgICAgPC9saT5cbiAgICAgICAgICAgIDxsaSBjbGFzcz1cImxpc3Qtdmlldy1oZWFkZXItaXRlbVwiPlxuICAgICAgICAgICAgICAgIDxzcGFuIGRhdGEtc29ydD1cImR1cmF0aW9uXCI+TEVOR1RIPC9zcGFuPlxuICAgICAgICAgICAgPC9saT5cbiAgICAgICAgPC91bD5cbiAgICAgICAgPHVsIGlkPVwianMtJHtpZH1cIiBjbGFzcz1cImxpc3QgbGlzdC12aWV3XCI+JHtpdGVtc308L3VsPlxuICAgIGA7XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZUdyaWRJdGVtKGl0ZW0pIHtcbiAgICBsZXQgdGl0bGUgPSBpdGVtLnRpdGxlO1xuXG4gICAgaWYgKHRpdGxlLmxlbmd0aCA+IDY0KSB7XG4gICAgICAgIHRpdGxlID0gYCR7dGl0bGUuc2xpY2UoMCwgNjQpfS4uLmA7XG4gICAgfVxuICAgIHJldHVybiBgXG4gICAgICAgIDxsaSBjbGFzcz1cImdyaWQtaXRlbSB0cmFja1wiIGRhdGEtaW5kZXg9XCIke2l0ZW0uaW5kZXh9XCI+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzPVwiZ3JpZC1pdGVtLXRodW1iLWNvbnRhaW5lclwiPlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJncmlkLWl0ZW0tZHVyYXRpb25cIj4ke2l0ZW0uZHVyYXRpb259PC9kaXY+XG4gICAgICAgICAgICAgICAgPGltZyBzcmM9XCIke2l0ZW0udGh1bWJuYWlsfVwiIGNsYXNzPVwiZ3JpZC1pdGVtLXRodW1iXCI+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDxkaXYgdGl0bGU9XCIke2l0ZW0udGl0bGV9XCI+JHt0aXRsZX08L2Rpdj5cbiAgICAgICAgPC9saT5cbiAgICBgO1xufVxuXG5mdW5jdGlvbiBjcmVhdGVHcmlkKGlkLCBpdGVtcykge1xuICAgIHJldHVybiBgXG4gICAgICAgIDxkaXYgY2xhc3M9XCJncmlkLXZpZXctc29ydC1zZWxlY3RcIj5cbiAgICAgICAgICAgIDxidXR0b24gY2xhc3M9XCJmb250LWJ0blwiIGRhdGEtc29ydD1cInRpdGxlXCI+VGl0bGU8L2J1dHRvbj5cbiAgICAgICAgICAgIDxidXR0b24gY2xhc3M9XCJmb250LWJ0blwiIGRhdGEtc29ydD1cImR1cmF0aW9uXCI+RHVyYXRpb248L2J1dHRvbj5cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIDx1bCBpZD1cImpzLSR7aWR9XCIgY2xhc3M9XCJsaXN0IGdyaWQtdmlld1wiPiR7aXRlbXN9PC91bD5cbiAgICBgO1xufVxuXG5mdW5jdGlvbiBjcmVhdGVJdGVtcyhjYiwgdHJhY2tzKSB7XG4gICAgcmV0dXJuIHRyYWNrcy5tYXAoaXRlbSA9PiBjYihpdGVtKSkuam9pbihcIlwiKTtcbn1cblxuZnVuY3Rpb24gY3JlYXRlUGxheWxpc3RUYWIoeyBpZCwgdHJhY2tzIH0sIHZpZXcpIHtcbiAgICBsZXQgcGxheWxpc3QgPSBcIlwiO1xuXG4gICAgaWYgKHZpZXcgPT09IFwibGlzdFwiKSB7XG4gICAgICAgIHBsYXlsaXN0ID0gY3JlYXRlTGlzdChpZCwgY3JlYXRlSXRlbXMoY3JlYXRlTGlzdEl0ZW0sIHRyYWNrcykpO1xuICAgIH1cbiAgICBlbHNlIGlmICh2aWV3ID09PSBcImdyaWRcIikge1xuICAgICAgICBwbGF5bGlzdCA9IGNyZWF0ZUdyaWQoaWQsIGNyZWF0ZUl0ZW1zKGNyZWF0ZUdyaWRJdGVtLCB0cmFja3MpKTtcbiAgICB9XG5cbiAgICByZXR1cm4gYFxuICAgICAgICA8ZGl2IGlkPVwianMtdGFiLSR7aWR9XCIgY2xhc3M9XCJ0YWJcIj5cbiAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJwbGF5bGlzdC1oZWFkZXJcIj5cbiAgICAgICAgICAgICAgICA8aW5wdXQgdHlwZT1cInRleHRcIiBjbGFzcz1cImlucHV0IGZpbHRlci1pbnB1dFwiXG4gICAgICAgICAgICAgICAgICAgIGlkPVwianMtJHtpZH0tZmlsdGVyLWlucHV0XCJcbiAgICAgICAgICAgICAgICAgICAgcGxhY2Vob2xkZXI9XCJGaWx0ZXJcIj5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPGRpdiBjbGFzcz1cInBsYXlsaXN0LWNvbnRhaW5lclwiPiR7cGxheWxpc3R9PC9kaXY+XG4gICAgICAgIDwvZGl2PlxuICAgIGA7XG59XG5cbmZ1bmN0aW9uIGFkZFBsYXlsaXN0VGFiKHBsLCB2aWV3KSB7XG4gICAgY29uc3QgdGFiID0gY3JlYXRlUGxheWxpc3RUYWIocGwsIHZpZXcpO1xuICAgIGNvbnN0IGNvbnRhaW5lciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwianMtdGFiLWNvbnRhaW5lclwiKTtcblxuICAgIGNvbnRhaW5lci5pbnNlcnRBZGphY2VudEhUTUwoXCJiZWZvcmVlbmRcIiwgdGFiKTtcbn1cblxuZnVuY3Rpb24gYXBwZW5kVG9QbGF5bGlzdChpZCwgdHJhY2tzLCB2aWV3KSB7XG4gICAgY29uc3QgcGxheWxpc3QgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChganMtJHtpZH1gKTtcbiAgICBsZXQgY2IgPSBudWxsO1xuXG4gICAgaWYgKHZpZXcgPT09IFwibGlzdFwiKSB7XG4gICAgICAgIGNiID0gY3JlYXRlTGlzdEl0ZW07XG4gICAgfVxuICAgIGVsc2UgaWYgKHZpZXcgPT09IFwiZ3JpZFwiKSB7XG4gICAgICAgIGNiID0gY3JlYXRlR3JpZEl0ZW07XG4gICAgfVxuICAgIHBsYXlsaXN0Lmluc2VydEFkamFjZW50SFRNTChcImJlZm9yZWVuZFwiLCBjcmVhdGVJdGVtcyhjYiwgdHJhY2tzKSk7XG59XG5cbmZ1bmN0aW9uIHVwZGF0ZVRyYWNrTGlzdFZpZXcodHJhY2ssIHRyYWNrRWxlbWVudCkge1xuICAgIHRyYWNrRWxlbWVudFswXS50ZXh0Q29udGVudCA9IHRyYWNrLnRpdGxlO1xuICAgIHRyYWNrRWxlbWVudFsxXS50ZXh0Q29udGVudCA9IHRyYWNrLmFydGlzdDtcbiAgICB0cmFja0VsZW1lbnRbMl0udGV4dENvbnRlbnQgPSB0cmFjay5hbGJ1bTtcbiAgICB0cmFja0VsZW1lbnRbM10udGV4dENvbnRlbnQgPSB0cmFjay5kdXJhdGlvbjtcbn1cblxuZnVuY3Rpb24gdXBkYXRlVHJhY2tHcmlkVmlldyh0cmFjaywgdHJhY2tFbGVtZW50KSB7XG4gICAgY29uc3QgdGl0bGUgPSB0cmFjay50aXRsZS5sZW5ndGggPiA2NCA/IGAke3RyYWNrLnRpdGxlLnNsaWNlKDAsIDY0KX0uLi5gIDogdHJhY2sudGl0bGU7XG5cbiAgICB0cmFja0VsZW1lbnRbMF0uY2hpbGRyZW5bMF0udGV4dENvbnRlbnQgPSB0cmFjay5kdXJhdGlvbjtcbiAgICB0cmFja0VsZW1lbnRbMF0uY2hpbGRyZW5bMV0uc2V0QXR0cmlidXRlKFwic3JjXCIsIHRyYWNrLnRodW1ibmFpbCk7XG4gICAgdHJhY2tFbGVtZW50WzFdLnNldEF0dHJpYnV0ZShcInRpdGxlXCIsIHRyYWNrLnRpdGxlKTtcbiAgICB0cmFja0VsZW1lbnRbMV0udGV4dENvbnRlbnQgPSB0aXRsZTtcbn1cblxuZnVuY3Rpb24gdXBkYXRlUGxheWxpc3QocGwpIHtcbiAgICBjb25zdCB0cmFja0VsZW1lbnRzID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoYGpzLSR7cGwuaWR9YCkuY2hpbGRyZW47XG4gICAgbGV0IGNiID0gbnVsbDtcblxuICAgIGlmIChwbC5pZCA9PT0gXCJsb2NhbC1maWxlc1wiKSB7XG4gICAgICAgIGNiID0gdXBkYXRlVHJhY2tMaXN0VmlldztcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIGNiID0gdXBkYXRlVHJhY2tHcmlkVmlldztcbiAgICB9XG5cbiAgICBwbC50cmFja3MuZm9yRWFjaCgodHJhY2ssIGluZGV4KSA9PiB7XG4gICAgICAgIGNvbnN0IHRyYWNrRWxlbWVudCA9IHRyYWNrRWxlbWVudHNbaW5kZXhdLmNoaWxkcmVuO1xuXG4gICAgICAgIHRyYWNrLmluZGV4ID0gaW5kZXg7XG4gICAgICAgIGNiKHRyYWNrLCB0cmFja0VsZW1lbnQpO1xuICAgIH0pO1xufVxuXG5mdW5jdGlvbiByZW1vdmVQbGF5bGlzdFRhYihpZCkge1xuICAgIGNvbnN0IHBsYXlsaXN0VGFiID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoYGpzLXRhYi0ke2lkfWApO1xuXG4gICAgcGxheWxpc3RUYWIucGFyZW50RWxlbWVudC5yZW1vdmVDaGlsZChwbGF5bGlzdFRhYik7XG59XG5cbmZ1bmN0aW9uIHNjcm9sbFRvVHJhY2sodHJhY2tFbGVtZW50LCBwbGF5bGlzdEVsZW1lbnQpIHtcbiAgICBjb25zdCBlbGVtZW50SGVpZ2h0ID0gdHJhY2tFbGVtZW50Lm9mZnNldEhlaWdodDtcbiAgICBjb25zdCB0cmFja1RvcCA9IHRyYWNrRWxlbWVudC5vZmZzZXRUb3A7XG4gICAgY29uc3QgcGxheWxpc3RTY3JvbGxUb3AgPSBwbGF5bGlzdEVsZW1lbnQuc2Nyb2xsVG9wO1xuICAgIGNvbnN0IHBsYXlsaXN0Q2xpZW50SGVpZ2h0ID0gcGxheWxpc3RFbGVtZW50LmNsaWVudEhlaWdodDtcbiAgICBjb25zdCB2aXNpYmxlUGxheWxpc3RPZmZzZXQgPSBwbGF5bGlzdFNjcm9sbFRvcCArIHBsYXlsaXN0Q2xpZW50SGVpZ2h0O1xuXG4gICAgaWYgKHRyYWNrVG9wIC0gZWxlbWVudEhlaWdodCA8IHBsYXlsaXN0U2Nyb2xsVG9wIHx8IHRyYWNrVG9wID4gdmlzaWJsZVBsYXlsaXN0T2Zmc2V0KSB7XG4gICAgICAgIHBsYXlsaXN0RWxlbWVudC5zY3JvbGxUb3AgPSB0cmFja1RvcCAtIHBsYXlsaXN0Q2xpZW50SGVpZ2h0IC8gMjtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIHNob3dQbGF5aW5nVHJhY2soaW5kZXgsIGlkLCBtYW51YWwpIHtcbiAgICBjb25zdCBjb250YWluZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChganMtJHtpZH1gKTtcbiAgICBjb25zdCB0cmFjayA9IGNvbnRhaW5lci5jaGlsZHJlbltpbmRleF07XG5cbiAgICByZW1vdmVDbGFzc0Zyb21FbGVtZW50KFwidHJhY2tcIiwgXCJwbGF5aW5nXCIpO1xuICAgIHRyYWNrLmNsYXNzTGlzdC5hZGQoXCJwbGF5aW5nXCIpO1xuXG4gICAgaWYgKCFtYW51YWwpIHtcbiAgICAgICAgc2Nyb2xsVG9UcmFjayh0cmFjaywgY29udGFpbmVyKTtcbiAgICB9XG59XG5cbmV4cG9ydCB7XG4gICAgYWRkUGxheWxpc3RUYWIgYXMgYWRkLFxuICAgIHJlbW92ZVBsYXlsaXN0VGFiIGFzIHJlbW92ZSxcbiAgICB1cGRhdGVQbGF5bGlzdCBhcyB1cGRhdGUsXG4gICAgYXBwZW5kVG9QbGF5bGlzdCBhcyBhcHBlbmQsXG4gICAgc2Nyb2xsVG9UcmFjayxcbiAgICBzaG93UGxheWluZ1RyYWNrXG59O1xuIiwiaW1wb3J0ICogYXMgbWFpbiBmcm9tIFwiLi9tYWluLmpzXCI7XG5cbmNvbnN0IHJvdXRlcyA9IFtcbiAgICBcImFkZFwiLFxuICAgIFwiNDA0XCJcbl07XG5cbmZ1bmN0aW9uIGNvbnRhaW5zKGhhc2gpIHtcbiAgICByZXR1cm4gcm91dGVzLnNvbWUocm91dGUgPT4gcm91dGUgPT09IGhhc2gpO1xufVxuXG5mdW5jdGlvbiBpc0FjdGl2ZShyb3V0ZSkge1xuICAgIHJldHVybiB3aW5kb3cubG9jYXRpb24uaGFzaC5pbmNsdWRlcyhyb3V0ZSk7XG59XG5cbmZ1bmN0aW9uIGlzUGxheWxpc3RSb3V0ZShyb3V0ZSkge1xuICAgIHJldHVybiAvXnBsYXlsaXN0XFwvLisvLnRlc3Qocm91dGUpO1xufVxuXG5mdW5jdGlvbiBhZGRSb3V0ZShyb3V0ZSkge1xuICAgIGlmICghY29udGFpbnMocm91dGUpKSB7XG4gICAgICAgIHJvdXRlcy5wdXNoKHJvdXRlKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIHRvZ2dsZVJvdXRlKHJvdXRlKSB7XG4gICAgd2luZG93LmxvY2F0aW9uLmhhc2ggPSBcIi9cIiArIHJvdXRlO1xufVxuXG5mdW5jdGlvbiB0b2dnbGVUYWIocm91dGUpIHtcbiAgICBsZXQgdGFiID0gXCJcIjtcblxuICAgIGlmICghcm91dGUpIHtcbiAgICAgICAgdG9nZ2xlUm91dGUoXCJhZGRcIik7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaWYgKHJvdXRlICE9PSBcIjQwNFwiICYmICFjb250YWlucyhyb3V0ZSkpIHtcbiAgICAgICAgdG9nZ2xlUm91dGUoXCI0MDRcIik7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAoaXNQbGF5bGlzdFJvdXRlKHJvdXRlKSkge1xuICAgICAgICB0YWIgPSByb3V0ZS5zbGljZShyb3V0ZS5sYXN0SW5kZXhPZihcIi9cIikgKyAxKTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIHRhYiA9IHJvdXRlLnJlcGxhY2UoL1xcLy9nLCBcIi1cIik7XG4gICAgfVxuXG4gICAgaWYgKHRhYiAmJiBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChganMtdGFiLSR7dGFifWApKSB7XG4gICAgICAgIG1haW4udG9nZ2xlVGFiKHRhYiwgdGFiID09PSBcIjQwNFwiKTtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbn1cblxud2luZG93LmFkZEV2ZW50TGlzdGVuZXIoXCJoYXNoY2hhbmdlXCIsIGV2ZW50ID0+IHtcbiAgICBjb25zdCByb3V0ZSA9IGV2ZW50Lm5ld1VSTC5zcGxpdChcIiMvXCIpWzFdO1xuXG4gICAgdG9nZ2xlVGFiKHJvdXRlKTtcbn0pO1xuXG53aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcihcIkRPTUNvbnRlbnRMb2FkZWRcIiwgZnVuY3Rpb24gYWRkUGxheWxpc3RSb3V0ZXMoKSB7XG4gICAgY29uc3Qgcm91dGUgPSB3aW5kb3cubG9jYXRpb24uaGFzaC5zbGljZSgyKTtcblxuICAgIE9iamVjdC5rZXlzKGxvY2FsU3RvcmFnZSkuZm9yRWFjaChpdGVtID0+IHtcbiAgICAgICAgaWYgKGl0ZW0gIT09IFwic2V0dGluZ3NcIikge1xuICAgICAgICAgICAgYWRkUm91dGUoYHBsYXlsaXN0LyR7aXRlbX1gKTtcbiAgICAgICAgfVxuICAgIH0pO1xuICAgIHRvZ2dsZVRhYihyb3V0ZSk7XG4gICAgd2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJET01Db250ZW50TG9hZGVkXCIsIGFkZFBsYXlsaXN0Um91dGVzKTtcbn0pO1xuXG5leHBvcnQge1xuICAgIGFkZFJvdXRlIGFzIGFkZCxcbiAgICB0b2dnbGVSb3V0ZSBhcyB0b2dnbGUsXG4gICAgaXNBY3RpdmVcbn07XG4iLCJjb25zdCBzZXR0aW5ncyA9IE9iamVjdC5hc3NpZ24oe1xuICAgIHBhdXNlZDogdHJ1ZSxcbiAgICByZXBlYXQ6IGZhbHNlLFxuICAgIHNodWZmbGU6IGZhbHNlLFxuICAgIG1hbnVhbDogZmFsc2UsXG4gICAgdm9sdW1lOiAwLjIsXG4gICAgc2Vla2luZzogZmFsc2UsXG4gICAgYWN0aXZlVGFiOiBcImFkZFwiLFxuICAgIHBsYXllcjogXCJcIlxufSwgSlNPTi5wYXJzZShsb2NhbFN0b3JhZ2UuZ2V0SXRlbShcInNldHRpbmdzXCIpKSB8fCB7fSk7XG5cbmZ1bmN0aW9uIHNldChzZXR0aW5nLCB2YWx1ZSkge1xuICAgIGlmIChzZXR0aW5ncy5oYXNPd25Qcm9wZXJ0eShzZXR0aW5nKSkge1xuICAgICAgICBzZXR0aW5nc1tzZXR0aW5nXSA9IHZhbHVlO1xuICAgICAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbShcInNldHRpbmdzXCIsIEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgICAgIHJlcGVhdDogc2V0dGluZ3MucmVwZWF0LFxuICAgICAgICAgICAgc2h1ZmZsZTogc2V0dGluZ3Muc2h1ZmZsZSxcbiAgICAgICAgICAgIHZvbHVtZTogc2V0dGluZ3Mudm9sdW1lXG4gICAgICAgIH0pKTtcbiAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gZ2V0KHNldHRpbmcpIHtcbiAgICByZXR1cm4gc2V0dGluZ3Nbc2V0dGluZ107XG59XG5cbmV4cG9ydCB7IHNldCwgZ2V0IH07XG4iLCJmdW5jdGlvbiBnZXRFbnRyeShpZCkge1xuICAgIHJldHVybiBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGBbZGF0YS10YWItaXRlbT0ke2lkfV1gKTtcbn1cblxuZnVuY3Rpb24gY3JlYXRlU2lkZWJhckVudHJ5KHRpdGxlLCBpZCkge1xuICAgIGNvbnN0IHNpZGViYXJFbnRyaWVzID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJqcy1zaWRlYmFyLXBsYXlsaXN0LWVudHJpZXNcIik7XG4gICAgY29uc3QgbmV3RW50cnkgPSBgXG4gICAgICAgIDxsaT5cbiAgICAgICAgICAgIDxhIGhyZWY9XCIjL3BsYXlsaXN0LyR7aWR9XCIgY2xhc3M9XCJmb250LWJ0biBzaWRlYmFyLWJ0biBqcy10YWItc2VsZWN0LWJ0blwiXG4gICAgICAgICAgICAgICAgZGF0YS10YWItaXRlbT1cIiR7aWR9XCI+XG4gICAgICAgICAgICAgICAgPHNwYW4gY2xhc3M9XCJzaWRlYmFyLXBsYXlsaXN0LXRpdGxlXCI+JHt0aXRsZX08L3NwYW4+XG4gICAgICAgICAgICAgICAgPHNwYW4gY2xhc3M9XCJpY29uLXZvbHVtZS11cCBpcy1wbGF5bGlzdC1hY3RpdmUgaGlkZGVuXCI+PC9zcGFuPlxuICAgICAgICAgICAgPC9hPlxuICAgICAgICA8L2xpPmA7XG5cbiAgICBzaWRlYmFyRW50cmllcy5pbnNlcnRBZGphY2VudEhUTUwoXCJiZWZvcmVlbmRcIiwgbmV3RW50cnkpO1xufVxuXG5mdW5jdGlvbiBlZGl0U2lkZWJhckVudHJ5KGlkLCB0aXRsZSkge1xuICAgIGNvbnN0IGVudHJ5ID0gZ2V0RW50cnkoaWQpO1xuXG4gICAgZW50cnkuY2hpbGRyZW5bMF0udGV4dENvbnRlbnQgPSB0aXRsZTtcbn1cblxuZnVuY3Rpb24gcmVtb3ZlU2lkZWJhckVudHJ5KGlkKSB7XG4gICAgY29uc3QgZW50cnkgPSBnZXRFbnRyeShpZCk7XG5cbiAgICBlbnRyeS5wYXJlbnRFbGVtZW50LnJlbW92ZUNoaWxkKGVudHJ5KTtcbn1cblxuZnVuY3Rpb24gc2hvd0FjdGl2ZUljb24oaWQpIHtcbiAgICBjb25zdCBlbnRyeSA9IGdldEVudHJ5KGlkKTtcbiAgICBjb25zdCBpY29uID0gZW50cnkucXVlcnlTZWxlY3RvcihcIi5pcy1wbGF5bGlzdC1hY3RpdmVcIik7XG5cbiAgICBpY29uLmNsYXNzTGlzdC5yZW1vdmUoXCJoaWRkZW5cIik7XG59XG5cbmZ1bmN0aW9uIGhpZGVBY3RpdmVJY29uKCkge1xuICAgIGZvciAoY29uc3QgYnRuIG9mIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoXCIuanMtdGFiLXNlbGVjdC1idG5cIikpIHtcbiAgICAgICAgY29uc3QgaWNvbiA9IGJ0bi5jaGlsZHJlblsxXTtcblxuICAgICAgICBpZiAoaWNvbiAmJiAhaWNvbi5jbGFzc0xpc3QuY29udGFpbnMoXCJoaWRkZW5cIikpIHtcbiAgICAgICAgICAgIGljb24uY2xhc3NMaXN0LmFkZChcImhpZGRlblwiKTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuZnVuY3Rpb24gc2hvd1NpZGViYXJGb290ZXIoKSB7XG4gICAgY29uc3Qgc2lkZWJhckZvb3RlciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwianMtc2lkZWJhci1mb290ZXJcIik7XG5cbiAgICBpZiAoIXNpZGViYXJGb290ZXIuY2xhc3NMaXN0LmNvbnRhaW5zKFwic2hvd1wiKSkge1xuICAgICAgICBzaWRlYmFyRm9vdGVyLmNsYXNzTGlzdC5hZGQoXCJzaG93XCIpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gc2V0VHJhY2tBcnQodHJhY2spIHtcbiAgICBjb25zdCBhcnR3b3JrID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJqcy1wbGF5ZXItdHJhY2stYXJ0XCIpO1xuICAgIGNvbnN0IGFydFBsYWNlaG9sZGVyID0gXCIuL2Fzc2V0cy9pbWFnZXMvYWxidW0tYXJ0LXBsYWNlaG9sZGVyLnBuZ1wiO1xuXG4gICAgaWYgKHRyYWNrICYmIHRyYWNrLnRodW1ibmFpbCkge1xuICAgICAgICBsZXQgYXJ0ID0gdHJhY2sudGh1bWJuYWlsO1xuXG4gICAgICAgIGlmICh0eXBlb2YgYXJ0ID09PSBcIm9iamVjdFwiKSB7XG4gICAgICAgICAgICBhcnQgPSBVUkwuY3JlYXRlT2JqZWN0VVJMKGFydCk7XG4gICAgICAgIH1cbiAgICAgICAgYXJ0d29yay5zcmMgPSBhcnQ7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICBhcnR3b3JrLnNyYyA9IGFydFBsYWNlaG9sZGVyO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gc2hvd1RyYWNrSW5mbyh0cmFjaykge1xuICAgIGNvbnN0IHRyYWNrSW5mbyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwianMtcGxheWVyLXRyYWNrLWluZm9cIik7XG4gICAgY29uc3QgW3RyYWNrVGl0bGUsIHRyYWNrQXJ0aXN0XSA9IHRyYWNrSW5mby5jaGlsZHJlbjtcblxuICAgIHNldFRyYWNrQXJ0KHRyYWNrKTtcblxuICAgIGlmICghdHJhY2spIHtcbiAgICAgICAgdHJhY2tUaXRsZS50ZXh0Q29udGVudCA9IFwiXCI7XG4gICAgICAgIHRyYWNrQXJ0aXN0LnRleHRDb250ZW50ID0gXCJcIjtcbiAgICAgICAgZG9jdW1lbnQudGl0bGUgPSBcInZlMnJ5XCI7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaWYgKHRyYWNrLmFydGlzdCAmJiB0cmFjay50aXRsZSkge1xuICAgICAgICB0cmFja1RpdGxlLnRleHRDb250ZW50ID0gdHJhY2sudGl0bGU7XG4gICAgICAgIHRyYWNrQXJ0aXN0LnRleHRDb250ZW50ID0gdHJhY2suYXJ0aXN0O1xuICAgICAgICBkb2N1bWVudC50aXRsZSA9IGAke3RyYWNrLmFydGlzdH0gLSAke3RyYWNrLnRpdGxlfWA7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICBjb25zdCB0aXRsZSA9IHRyYWNrLm5hbWUgfHwgdHJhY2sudGl0bGU7XG5cbiAgICAgICAgdHJhY2tUaXRsZS50ZXh0Q29udGVudCA9IFwiXCI7XG4gICAgICAgIHRyYWNrQXJ0aXN0LnRleHRDb250ZW50ID0gdGl0bGU7XG4gICAgICAgIGRvY3VtZW50LnRpdGxlID0gdGl0bGU7XG4gICAgfVxuICAgIHNob3dTaWRlYmFyRm9vdGVyKCk7XG59XG5cbmV4cG9ydCB7XG4gICAgY3JlYXRlU2lkZWJhckVudHJ5IGFzIGNyZWF0ZUVudHJ5LFxuICAgIGVkaXRTaWRlYmFyRW50cnkgYXMgZWRpdEVudHJ5LFxuICAgIHJlbW92ZVNpZGViYXJFbnRyeSBhcyByZW1vdmVFbnRyeSxcbiAgICBzaG93VHJhY2tJbmZvLFxuICAgIHNob3dBY3RpdmVJY29uLFxuICAgIGhpZGVBY3RpdmVJY29uXG59O1xuIiwiLyogZ2xvYmFsIFNDICovXG5cbmltcG9ydCB7IGZvcm1hdFRpbWUgfSBmcm9tIFwiLi9tYWluLmpzXCI7XG5pbXBvcnQgKiBhcyBwbGF5bGlzdEFkZCBmcm9tIFwiLi9wbGF5bGlzdC9wbGF5bGlzdC5hZGQuanNcIjtcblxuZnVuY3Rpb24gaW5pdCgpIHtcbiAgICBTQy5pbml0aWFsaXplKHtcbiAgICAgICAgY2xpZW50X2lkOiBcIlwiXG4gICAgfSk7XG59XG5cbmZ1bmN0aW9uIHBhcnNlVHJhY2tzKHRyYWNrcykge1xuICAgIHJldHVybiB0cmFja3MubWFwKCh0cmFjaywgaW5kZXgpID0+ICh7XG4gICAgICAgIGR1cmF0aW9uOiBmb3JtYXRUaW1lKHRyYWNrLmR1cmF0aW9uIC8gMTAwMCksXG4gICAgICAgIGlkOiB0cmFjay5pZCxcbiAgICAgICAgaW5kZXg6IGluZGV4LFxuICAgICAgICB0aHVtYm5haWw6IHRyYWNrLmFydHdvcmtfdXJsIHx8IFwiYXNzZXRzL2ltYWdlcy9hbGJ1bS1hcnQtcGxhY2Vob2xkZXIucG5nXCIsXG4gICAgICAgIHRpdGxlOiB0cmFjay50aXRsZVxuICAgIH0pKTtcbn1cblxuZnVuY3Rpb24gZmV0Y2hQbGF5bGlzdCh1cmwpIHtcbiAgICBTQy5yZXNvbHZlKHVybCkudGhlbihwbGF5bGlzdCA9PiB7XG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KHBsYXlsaXN0KSkge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBpZDogYHNjLXBsLSR7cGxheWxpc3RbMF0udXNlcl9pZH1gLFxuICAgICAgICAgICAgICAgIHRpdGxlOiBgJHtwbGF5bGlzdFswXS51c2VyLnVzZXJuYW1lfSB0cmFja3NgLFxuICAgICAgICAgICAgICAgIHRyYWNrczogcGFyc2VUcmFja3MocGxheWxpc3QpXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBpZDogYHNjLXBsLSR7cGxheWxpc3QuaWR9YCxcbiAgICAgICAgICAgIHRpdGxlOiBwbGF5bGlzdC50aXRsZSxcbiAgICAgICAgICAgIHRyYWNrczogcGFyc2VUcmFja3MocGxheWxpc3QudHJhY2tzKVxuICAgICAgICB9O1xuICAgIH0pXG4gICAgLnRoZW4ocGxheWxpc3RBZGQuYWRkKVxuICAgIC5jYXRjaChlcnJvciA9PiB7XG4gICAgICAgIGNvbnNvbGUubG9nKGVycm9yKTtcbiAgICAgICAgaWYgKGVycm9yLnN0YXR1cyA9PT0gNDA0KSB7XG4gICAgICAgICAgICBwbGF5bGlzdEFkZC5zaG93RXJyb3JNZXNzYWdlKFwiUGxheWxpc3Qgd2FzIG5vdCBmb3VuZFwiKTtcbiAgICAgICAgfVxuICAgIH0pO1xufVxuXG5leHBvcnQgeyBpbml0LCBmZXRjaFBsYXlsaXN0IH07XG4iLCJpbXBvcnQgeyBzY3JpcHRMb2FkZXIgfSBmcm9tIFwiLi9tYWluLmpzXCI7XG5pbXBvcnQgKiBhcyBwbGF5bGlzdEFkZCBmcm9tIFwiLi9wbGF5bGlzdC9wbGF5bGlzdC5hZGQuanNcIjtcblxuZnVuY3Rpb24gcGFyc2VJdGVtcyhwbGF5bGlzdCkge1xuICAgIHBsYXlsaXN0LmlkID0gXCJ5dC1wbC1cIiArIHBsYXlsaXN0LmlkO1xuICAgIHBsYXlsaXN0LnRyYWNrcyA9IHBsYXlsaXN0LnRyYWNrcy5tYXAoKHRyYWNrLCBpbmRleCkgPT4gKHtcbiAgICAgICAgaW5kZXg6IGluZGV4LFxuICAgICAgICBpZDogdHJhY2suc25pcHBldC5yZXNvdXJjZUlkLnZpZGVvSWQsXG4gICAgICAgIGR1cmF0aW9uOiB0cmFjay5zbmlwcGV0LmR1cmF0aW9uLFxuICAgICAgICB0aXRsZTogdHJhY2suc25pcHBldC50aXRsZSxcbiAgICAgICAgdGh1bWJuYWlsOiB0cmFjay5zbmlwcGV0LnRodW1ibmFpbHMuZGVmYXVsdC51cmxcbiAgICB9KSk7XG4gICAgZGVsZXRlIHBsYXlsaXN0LnRva2VuO1xuICAgIHJldHVybiBwbGF5bGlzdDtcbn1cblxuZnVuY3Rpb24gcGFyc2VEdXJhdGlvbihkdXJhdGlvbikge1xuICAgIGNvbnN0IHVuaXRzID0gW1wiSFwiLCBcIk1cIiwgXCJTXCJdO1xuXG4gICAgZHVyYXRpb24gPSBkdXJhdGlvbi5zbGljZSgyKTtcbiAgICByZXR1cm4gdW5pdHMubWFwKHVuaXQgPT4ge1xuICAgICAgICBsZXQgbmV3RHVyYXRpb24gPSBcIlwiO1xuXG4gICAgICAgIGlmIChkdXJhdGlvbi5pbmNsdWRlcyh1bml0KSkge1xuICAgICAgICAgICAgZHVyYXRpb24gPSBkdXJhdGlvbi5zcGxpdCh1bml0KTtcbiAgICAgICAgICAgIGlmIChkdXJhdGlvbi5sZW5ndGggPT09IDIpIHtcbiAgICAgICAgICAgICAgICBjb25zdCB2YWx1ZSA9IE51bWJlci5wYXJzZUludChkdXJhdGlvblswXSwgMTApO1xuXG4gICAgICAgICAgICAgICAgbmV3RHVyYXRpb24gKz0gdmFsdWUgPj0gMTAgPyB2YWx1ZSA6IFwiMFwiICsgdmFsdWU7XG4gICAgICAgICAgICAgICAgaWYgKHVuaXQgIT09IFwiU1wiKSB7XG4gICAgICAgICAgICAgICAgICAgIG5ld0R1cmF0aW9uICs9IFwiOlwiO1xuICAgICAgICAgICAgICAgICAgICBkdXJhdGlvbiA9IGR1cmF0aW9uLnNsaWNlKDEpWzBdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmICh1bml0ID09PSBcIlNcIikge1xuICAgICAgICAgICAgbmV3RHVyYXRpb24gKz0gXCIwMFwiO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBuZXdEdXJhdGlvbjtcbiAgICB9KS5qb2luKFwiXCIpO1xufVxuXG5mdW5jdGlvbiBnZXRWaWRlb0R1cmF0aW9uKHBsYXlsaXN0KSB7XG4gICAgY29uc3QgaWRzID0gcGxheWxpc3QuaXRlbXMubWFwKGl0ZW0gPT4gaXRlbS5zbmlwcGV0LnJlc291cmNlSWQudmlkZW9JZCkuam9pbigpO1xuXG4gICAgcmV0dXJuIGdldFlvdXR1YmUoXCJ2aWRlb3NcIiwgXCJjb250ZW50RGV0YWlsc1wiLCBcImlkXCIsIGlkcylcbiAgICAudGhlbihkYXRhID0+IHtcbiAgICAgICAgcGxheWxpc3QuaXRlbXMgPSBwbGF5bGlzdC5pdGVtcy5tYXAoKGl0ZW0sIGluZGV4KSA9PiB7XG4gICAgICAgICAgICBpdGVtLnNuaXBwZXQuZHVyYXRpb24gPSBwYXJzZUR1cmF0aW9uKGRhdGEuaXRlbXNbaW5kZXhdLmNvbnRlbnREZXRhaWxzLmR1cmF0aW9uKTtcbiAgICAgICAgICAgIHJldHVybiBpdGVtO1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIHBsYXlsaXN0O1xuICAgIH0pO1xufVxuXG5mdW5jdGlvbiBnZXRZb3V0dWJlKHBhdGgsIHBhcnQsIGZpbHRlciwgaWQsIHRva2VuKSB7XG4gICAgY29uc3Qga2V5ID0gXCJcIjtcbiAgICBsZXQgcGFyYW1zID0gYHBhcnQ9JHtwYXJ0fSYke2ZpbHRlcn09JHtpZH0mbWF4UmVzdWx0cz01MCZrZXk9JHtrZXl9YDtcblxuICAgIGlmICh0b2tlbikge1xuICAgICAgICBwYXJhbXMgKz0gYCZwYWdlVG9rZW49JHt0b2tlbn1gO1xuICAgIH1cbiAgICByZXR1cm4gZmV0Y2goYGh0dHBzOi8vd3d3Lmdvb2dsZWFwaXMuY29tL3lvdXR1YmUvdjMvJHtwYXRofT8ke3BhcmFtc31gKVxuICAgIC50aGVuKHJlc3BvbnNlID0+IHJlc3BvbnNlLmpzb24oKSlcbiAgICAuY2F0Y2goZXJyb3IgPT4ge1xuICAgICAgICBjb25zb2xlLmxvZyhlcnJvcik7XG4gICAgfSk7XG59XG5cbmZ1bmN0aW9uIGdldFBsYXlsaXN0SXRlbXMocGxheWxpc3QpIHtcbiAgICByZXR1cm4gZ2V0WW91dHViZShcInBsYXlsaXN0SXRlbXNcIiwgXCJzbmlwcGV0XCIsIFwicGxheWxpc3RJZFwiLCBwbGF5bGlzdC5pZCwgcGxheWxpc3QudG9rZW4pXG4gICAgLnRoZW4oZGF0YSA9PiB7XG4gICAgICAgIGRhdGEuaXRlbXMgPSBkYXRhLml0ZW1zLmZpbHRlcihpdGVtID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHRpdGxlID0gaXRlbS5zbmlwcGV0LnRpdGxlO1xuXG4gICAgICAgICAgICByZXR1cm4gdGl0bGUgIT09IFwiRGVsZXRlZCB2aWRlb1wiICYmIHRpdGxlICE9PSBcIlByaXZhdGUgdmlkZW9cIjtcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBkYXRhO1xuICAgIH0pXG4gICAgLnRoZW4oZ2V0VmlkZW9EdXJhdGlvbilcbiAgICAudGhlbihkYXRhID0+IHtcbiAgICAgICAgcGxheWxpc3QudG9rZW4gPSBkYXRhLm5leHRQYWdlVG9rZW47XG4gICAgICAgIHBsYXlsaXN0LnRyYWNrcy5wdXNoKC4uLmRhdGEuaXRlbXMpO1xuXG4gICAgICAgIGlmIChwbGF5bGlzdC50b2tlbikge1xuICAgICAgICAgICAgcmV0dXJuIGdldFBsYXlsaXN0SXRlbXMocGxheWxpc3QpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBwbGF5bGlzdDtcbiAgICB9KTtcbn1cblxuZnVuY3Rpb24gZmV0Y2hQbGF5bGlzdCh1cmwpIHtcbiAgICBjb25zdCBpZCA9IHVybC5pbmNsdWRlcyhcImxpc3Q9XCIpID8gdXJsLnNwbGl0KFwibGlzdD1cIilbMV0gOiB1cmw7XG5cbiAgICBnZXRZb3V0dWJlKFwicGxheWxpc3RzXCIsIFwic25pcHBldFwiLCBcImlkXCIsIGlkKVxuICAgIC50aGVuKGRhdGEgPT4ge1xuICAgICAgICBpZiAoIWRhdGEuaXRlbXMubGVuZ3RoKSB7XG4gICAgICAgICAgICBwbGF5bGlzdEFkZC5zaG93RXJyb3JNZXNzYWdlKFwiUGxheWxpc3Qgd2FzIG5vdCBmb3VuZFwiKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgaWQ6IGlkLFxuICAgICAgICAgICAgdGl0bGU6IGRhdGEuaXRlbXNbMF0uc25pcHBldC50aXRsZSxcbiAgICAgICAgICAgIHRyYWNrczogW11cbiAgICAgICAgfTtcbiAgICB9KVxuICAgIC50aGVuKGdldFBsYXlsaXN0SXRlbXMpXG4gICAgLnRoZW4ocGFyc2VJdGVtcylcbiAgICAudGhlbihwbGF5bGlzdEFkZC5hZGQpXG4gICAgLmNhdGNoKGVycm9yID0+IHtcbiAgICAgICAgY29uc29sZS5sb2coZXJyb3IpO1xuICAgIH0pO1xuICAgIHNjcmlwdExvYWRlci5sb2FkKFwiaHR0cHM6Ly93d3cueW91dHViZS5jb20vaWZyYW1lX2FwaVwiKTtcbn1cblxuZXhwb3J0IHsgZmV0Y2hQbGF5bGlzdCB9O1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbnJlcXVpcmUoXCIuL2Rldi9zZXR0aW5ncy5qc1wiKTtcblxucmVxdWlyZShcIi4vZGV2L3JvdXRlci5qc1wiKTtcblxucmVxdWlyZShcIi4vZGV2L21haW4uanNcIik7XG5cbnJlcXVpcmUoXCIuL2Rldi9zaWRlYmFyLmpzXCIpO1xuXG5yZXF1aXJlKFwiLi9kZXYvbG9jYWwuanNcIik7XG5cbnJlcXVpcmUoXCIuL2Rldi95b3V0dWJlLmpzXCIpO1xuXG5yZXF1aXJlKFwiLi9kZXYvc291bmRjbG91ZC5qc1wiKTtcblxucmVxdWlyZShcIi4vZGV2L3BsYXlsaXN0L3BsYXlsaXN0LmFkZC5qc1wiKTtcblxucmVxdWlyZShcIi4vZGV2L3BsYXlsaXN0L3BsYXlsaXN0Lm1hbmFnZS5qc1wiKTtcblxucmVxdWlyZShcIi4vZGV2L3BsYXlsaXN0L3BsYXlsaXN0LnZpZXcuanNcIik7XG5cbnJlcXVpcmUoXCIuL2Rldi9wbGF5bGlzdC9wbGF5bGlzdC5qc1wiKTtcblxucmVxdWlyZShcIi4vZGV2L3BsYXllci9wbGF5ZXIuY29udHJvbHMuanNcIik7XG5cbnJlcXVpcmUoXCIuL2Rldi9wbGF5ZXIvcGxheWVyLmpzXCIpO1xuXG5yZXF1aXJlKFwiLi9kZXYvcGxheWVyL3BsYXllci5uYXRpdmUuanNcIik7XG5cbnJlcXVpcmUoXCIuL2Rldi9wbGF5ZXIvcGxheWVyLnlvdXR1YmUuanNcIik7XG5cbnJlcXVpcmUoXCIuL2Rldi9wbGF5ZXIvcGxheWVyLnNvdW5kY2xvdWQuanNcIik7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1kYXRhOmFwcGxpY2F0aW9uL2pzb247YmFzZTY0LGV5SjJaWEp6YVc5dUlqb3pMQ0p6YjNWeVkyVnpJanBiWFN3aWJtRnRaWE1pT2x0ZExDSnRZWEJ3YVc1bmN5STZJaUlzSW1acGJHVWlPaUpwYm1SbGVDNXFjeUlzSW5OdmRYSmpaWE5EYjI1MFpXNTBJanBiWFgwPSJdfQ==

import * as main from "./../main.js";
import * as settings from "./../settings.js";
import * as sidebar from "./../sidebar.js";
import * as playlist from "./../playlist/playlist.js";
import * as playlistView from "./../playlist/playlist.view.js";
import * as controls from "./player.controls.js";
import * as nPlayer from "./player.native.js";
import * as ytPlayer from "./player.youtube.js";
import * as scPlayer from "./player.soundcloud.js";

function onTrackStart(track, time) {
    const id = playlist.getActivePlaylistId();

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
    controls.resetTrackSlider();
    repeatCb();
}

function getPlayer(playlistId) {
    if (playlistId === "local-files") {
        return "native";
    }
    else if (playlistId.includes("yt-pl-")) {
        return "youtube";
    }
    else if (playlistId.includes("sc-pl-")) {
        return "soundcloud";
    }
}

function toggleTrackPlaying(playCb, pauseCb) {
    const paused = settings.get("paused");

    if (paused) {
        playCb();
    }
    else {
        pauseCb();
        controls.elapsedTime.stop();
        controls.addClassOnPlayBtn("icon-play");
    }
    settings.set("paused", !paused);
}

function playNewTrack(track, player) {
    if (player === "native") {
        nPlayer.playTrack(track);
    }
    else if (player === "youtube") {
        ytPlayer.playTrack(track);
    }
    else if (player === "soundcloud") {
        scPlayer.playTrack(track);
    }
}

function playFirstTrack(id) {
    const selectedTrack = playlist.getSelectedTrack();
    let index = 0;

    if (selectedTrack) {
        index = selectedTrack.index;
        settings.set("manual", true);
    }
    else {
        index = playlist.getNextTrackIndex(0);
    }
    playTrackAtIndex(index, id);
}

function togglePlaying(player) {
    const track = playlist.getTrackAtCurrentIndex();

    if (!track) {
        return;
    }
    playlist.setCurrentTrack(track);

    if (player === "native") {
        nPlayer.play(track);
    }
    else if (player === "youtube") {
        ytPlayer.togglePlaying();
    }
    else if (player === "soundcloud") {
        scPlayer.togglePlaying();
    }
}

function playTrack() {
    const player = settings.get("player");

    if (!player) {
        const id = settings.get("activeTab");

        if (playlist.get(id)) {
            playlist.setActive(id);
            playFirstTrack(id);
        }
        return;
    }
    togglePlaying(player);
}

function playNextTrack(direction) {
    const player = settings.get("player");
    const currentTrack = playlist.getCurrentTrack();

    if (!player || !currentTrack) {
        return;
    }
    stopTrack(currentTrack, player);

    const track = playlist.getNextTrack(direction);

    if (track) {
        playNewTrack(track, player);
    }
}

function playTrackAtIndex(index, id) {
    const currentTrack = playlist.getCurrentTrack();
    const player = getPlayer(id);
    const pl = playlist.get(id);
    const track = pl.tracks[index];

    if (!settings.get("paused") || currentTrack) {
        stopTrack(currentTrack);
    }

    if (!track) {
        return;
    }
    settings.set("player", player);

    if (settings.get("shuffle") && !pl.shuffled) {
        playlist.shufflePlaybackOrder(true, pl);
        playlist.resetCurrentIndex();
    }
    else {
        playlist.setCurrentIndex(track.index);
    }
    playlist.setCurrentTrack(track);
    playNewTrack(track, player);
}

function stopTrack(track = playlist.getCurrentTrack(), player = settings.get("player")) {
    if (!track) {
        return;
    }

    if (player === "native") {
        nPlayer.stop(track);
    }
    else if (player === "youtube") {
        ytPlayer.stop();
    }
    else if (player === "soundcloud") {
        scPlayer.stop();
    }

    if (player) {
        sidebar.hideActiveIcon();
        main.removeClassFromElement("track", "playing");
        resetPlayer();
    }
}

function resetPlayer() {
    settings.set("paused", true);
    playlist.setCurrentTrack(null);
    controls.resetTrackSlider();
    controls.showTrackDuration(0);
    controls.addClassOnPlayBtn("icon-play");
    sidebar.showTrackInfo();
}

function toggleRepeat(repeat) {
    settings.set("repeat", repeat);
}

function toggleShuffle(shuffle) {
    const pl = playlist.getActive() || playlist.get(settings.get("activeTab"));

    settings.set("shuffle", shuffle);
    if (pl) {
        playlist.shufflePlaybackOrder(shuffle, pl);
        playlist.resetCurrentIndex();
    }
}

function setVolume(volume) {
    const player = settings.get("player");

    settings.set("volume", volume);
    if (player === "native") {
        nPlayer.setVolume(volume);
    }
    else if (player === "youtube") {
        ytPlayer.setVolume(volume);
    }
    else if (player === "soundcloud") {
        scPlayer.setVolume(volume);
    }
}

function seekTime(percent) {
    const player = settings.get("player");
    let elapsed = 0;

    if (player === "native") {
        elapsed = nPlayer.getElapsed(percent);
    }
    else if (player === "youtube") {
        elapsed = ytPlayer.getElapsed(percent);
    }
    else if (player === "soundcloud") {
        elapsed = scPlayer.getElapsed(percent);
    }
    controls.setElapsedTime(elapsed);
}

document.getElementById("js-tab-container").addEventListener("dblclick", ({ target }) => {
    const element = main.getElementByAttr(target, "data-index");

    if (element) {
        const index = element.attrValue;
        const id = settings.get("activeTab");

        settings.set("manual", true);
        playlist.setActive(id);
        playTrackAtIndex(index, id);
    }
});

export {
    playTrack as play,
    playNextTrack as playNext,
    stopTrack as stop,
    toggleRepeat as repeat,
    toggleShuffle as shuffle,
    seekTime as seek,
    toggleTrackPlaying,
    setVolume,
    onTrackStart,
    onTrackEnd
};

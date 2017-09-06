import { getElementById, getElementByAttr, getImage } from "../utils.js";

let animationId = 0;
let timeoutId = 0;
let animationTarget = null;
let isRendered = false;

function resetAnimationTarget() {
    clearTimeout(timeoutId);
    cancelAnimationFrame(animationId);

    animationTarget.style.textIndent = "0";
    timeoutId = 0;
    animationTarget = null;
}

function indentText(element, width, maxWidth, x = 0) {
    x = Math.abs(x) < width + 10 ? x - 1 : maxWidth;
    element.style.textIndent = `${x}px`;
    animationId = requestAnimationFrame(() => {
        indentText(element, width, maxWidth, x);
    });
}

function createMediaContainer() {
    document.querySelector(".player").insertAdjacentHTML("afterbegin", `
        <div id="js-media-container" class="media-container">
            <div class="media-btn-container">
                <button id="js-yt-player-watch" class="btn btn-icon hidden" title="Watch on YouTube">
                    <svg viewBox="0 0 24 24">
                        <use href="#youtube"></use>
                    </svg>
                </button>
                <button id="js-media-close-btn" class="btn btn-icon" data-item="close" title="Close">
                    <svg viewBox="0 0 24 24">
                        <use href="#close"></use>
                    </svg>
                </button>
            </div>
            <div id="js-yt-player" class="yt-player hidden"></div>
            <img src="" id="js-media-image" class="media-image hidden" alt="">
        </div>
    `);
    getElementById("js-media-close-btn").addEventListener("click", hideMedia);
}

function hideMedia() {
    getElementById("js-media-container").classList.remove("visible");
}

function handleMousemove({ currentTarget, target }) {
    if (currentTarget === target) {
        return;
    }

    if (animationTarget && target !== animationTarget) {
        resetAnimationTarget();
    }
    else if (timeoutId) {
        return;
    }
    const width = target.scrollWidth;
    const maxWidth = target.parentElement.offsetWidth - 16;

    if (width > maxWidth) {
        animationTarget = target;
        timeoutId = setTimeout(indentText, 400, target, width, maxWidth);

        currentTarget.addEventListener("mouseleave", handleMouseleave);
    }
}

function handleMouseleave({ currentTarget }) {
    currentTarget.removeEventListener("mouseleave", handleMouseleave);

    if (animationTarget) {
        resetAnimationTarget();
    }
}

function handleClickOnArt({ target }) {
    const element = getElementByAttr("data-button", target);

    if (!element) {
        return;
    }
    getElementById("js-media-container").classList.toggle("visible");
}

function renderNowPlaying(track) {
    const trackArtist = track.artist && track.title ? track.artist : track.name;
    const trackTitle = trackArtist !== track.name ? `<div class="track-title">${track.title}</div>` : "";
    const nowPlayingView = `
        <div id="js-now-playing-art-container" class="now-playing-art-container">
            <div class="now-playing-art-button-container">
                <button class="btn btn-icon" title="Expand" data-button="expand">
                    <svg viewBox="0 0 24 24">
                        <use href="#expand"></use>
                    </svg>
                </button>
            </div>
            <img src=${getImage(track.thumbnail)} class="artwork" alt="">
        </div>
        <div id="js-track-name" class="track-name">
            ${trackTitle}
            <div class="track-artist">${trackArtist}</div>
        </div>
    `;

    getElementById("js-now-playing").insertAdjacentHTML("beforeend", nowPlayingView);
    getElementById("js-track-name").addEventListener("mousemove", handleMousemove);
    getElementById("js-now-playing-art-container").addEventListener("click", handleClickOnArt);
}

function removeNowPlaying() {
    if (!isRendered) {
        return;
    }
    isRendered = false;
    document.title = "Veery";

    getElementById("js-track-name").removeEventListener("mousemove", handleMousemove);
    getElementById("js-now-playing-art-container").removeEventListener("click", handleClickOnArt);
    getElementById("js-now-playing").innerHTML = "";
}

function showNowPlaying(track) {
    if (isRendered) {
        removeNowPlaying();
    }
    isRendered = true;
    document.title = track.artist && track.title ? `${track.artist} - ${track.title}` : track.name;

    renderNowPlaying(track);
}

export {
    showNowPlaying,
    removeNowPlaying,
    createMediaContainer
};

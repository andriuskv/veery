import { removeElement, getElementById, getElementByAttr, getImage, setElementIconAndTitle } from "../utils.js";

let animationId = 0;
let timeoutId = 0;
let animationTarget = null;
let isEnlarged = false;

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
    const maxWidth = target.parentElement.offsetWidth - 8;

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

function toggleYoutubePlayer() {
    getElementById("js-yt-player-container").classList.toggle("visible");
    getElementById("js-sidebar-container").classList.add("contracted");
}

function getArtBtnState(isEnlarged) {
    const data = {
        on: {
            id: "up-arrow",
            title: "Enlarge artwork"
        },
        off: {
            id: "down-arrow",
            title: "Lower artwork"
        }
    };

    return isEnlarged ? data.off : data.on;
}

function toggleArtworkSize(button) {
    isEnlarged = !isEnlarged;

    getElementById("js-now-playing").classList.toggle("enlarged");
    setElementIconAndTitle(button, getArtBtnState(isEnlarged));
}

function handleClickOnArt({ target }) {
    const element = getElementByAttr("data-button", target);

    if (!element) {
        return;
    }
    const { attrValue, elementRef } = element;

    if (attrValue === "youtube") {
        toggleYoutubePlayer();
    }
    else if (attrValue === "size") {
        toggleArtworkSize(elementRef);
    }
}

function getArtButtons(player) {
    const { id, title } = getArtBtnState(isEnlarged);

    return `
        <div id="js-track-art-button-container" class="track-art-button-container">
            <button class='btn btn-icon artwork-size-btn' title="${title}" data-button="size">
                <svg viewBox="0 0 24 24">
                    <use href="#${id}" class="js-icon"></use>
                </svg>
            </button>
            ${player === "youtube" ? `
                <button class="btn btn-icon" title="Toggle YouTube player" data-button="youtube">
                    <svg viewBox="0 0 24 24">
                        <use href="#expand"></use>
                    </svg>
                </button>
            ` : ""}
        </div>
    `;
}

function getTrackArtTemplate(thumbnail, player) {
    if (typeof thumbnail === "string" && thumbnail.includes("assets")) {
        return "";
    }
    const buttons = getArtButtons(player);

    return `
        <div class="track-art-container">
            <div class="track-art-wrapper">
                ${buttons}
                <img src=${getImage(thumbnail)} class="track-art" alt="">
            </div>
        </div>
    `;
}

function initNowPlayingElement(track) {
    const trackArtist = track.artist && track.title ? track.artist : track.name;
    const trackTitle = trackArtist !== track.name ? `<div class="track-title">${track.title}</div>` : "";
    const trackArt = getTrackArtTemplate(track.thumbnail, track.player);
    const nowPlayingView = `
        <div id="js-now-playing" class="now-playing${trackArt && isEnlarged ? " enlarged" : ""}">
            ${trackArt}
            <div id="js-track-name" class="track-name ">
                ${trackTitle}
                <div class="track-artist">${trackArtist}</div>
            </div>
        </div>
    `;

    getElementById("js-sidebar-container").classList.remove("hidden");
    getElementById("js-sidebar").insertAdjacentHTML("beforeend", nowPlayingView);
    getElementById("js-track-name").addEventListener("mousemove", handleMousemove);

    if (trackArt) {
        getElementById("js-track-art-button-container").addEventListener("click", handleClickOnArt);
    }
}

function removeNowPlayingElement(element) {
    const buttonContainer = getElementById("js-track-art-button-container");

    getElementById("js-sidebar-container").classList.add("hidden");
    getElementById("js-track-name").removeEventListener("mousemove", handleMousemove);

    if (buttonContainer) {
        buttonContainer.removeEventListener("click", handleClickOnArt);
    }
    removeElement(element);
}

function showNowPlaying(track) {
    const nowPlayingElement = getElementById("js-now-playing");

    if (nowPlayingElement) {
        removeNowPlayingElement(nowPlayingElement);
    }

    if (!track) {
        document.title = "Veery";
        return;
    }
    initNowPlayingElement(track);
    document.title = track.artist && track.title ? `${track.artist} - ${track.title}` : track.name;
}

export {
    showNowPlaying
};

const scriptLoader = (function() {
    const loaded = [];

    function loadScript(attrs) {
        if (loaded.includes(attrs.src)) {
            return Promise.resolve();
        }
        return new Promise(resolve => {
            const script = document.createElement("script");

            Object.keys(attrs).forEach(attr => {
                script.setAttribute(attr, attrs[attr]);
            });
            document.getElementsByTagName("body")[0].appendChild(script);
            loaded.push(attrs.src);

            script.onload = resolve;
        });
    }

    return {
        load: loadScript
    };
})();

function capitalize(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function removeElement(element) {
    element.parentElement.removeChild(element);
}

function removeElements(elements) {
    elements.forEach(removeElement);
}

function removeElementClass(selector, classToRemove) {
    const element = document.querySelector(selector);

    if (element) {
        element.classList.remove(classToRemove);
    }
}

function getElementByAttr(attr, element, endElement = null) {
    while (element && element !== endElement) {
        if (element.hasAttribute(attr)) {
            return {
                elementRef: element,
                attrValue: element.getAttribute(attr)
            };
        }
        element = element.parentElement;
    }
}

function isOutsideElement(element, targetElement) {
    return targetElement ? !targetElement.contains(element) : false;
}

function getSeconds(time) {
    const seconds = time % 60;

    return seconds < 10 ? `0${seconds}` : seconds;
}

function getMinutes(time) {
    const minutes = Math.floor(time / 60 % 60);

    return time >= 3600 && minutes < 10 ? `0${minutes}` : minutes;
}

function getHours(time) {
    const hours = Math.floor(time / 3600);

    return hours ? `${hours}:` : "";
}

function formatTime(time) {
    const seconds = getSeconds(time);
    const minutes = getMinutes(time);
    const hours = getHours(time);

    return `${hours}${minutes}:${seconds}`;
}

function dispatchCustomEvent(eventName, data) {
    const event = new CustomEvent(eventName, { detail: data });

    window.dispatchEvent(event);
}

function getImage(image) {
    return typeof image === "object" ? URL.createObjectURL(image) : image;
}

function setElementIconAndTitle(element, { id, title }) {
    element.setAttribute("title", title);
    element.querySelector(".js-icon").setAttribute("href", `#${id}`);
}

function addSpinner(element, id = "", classList = "spinner") {
    element.insertAdjacentHTML("beforeend", `
        <img src="./assets/images/ring-alt.svg" id="${id}" class="${classList}" alt="">
    `);
}

function enableBtn(element) {
    element.disabled = false;

    if (element.lastElementChild.tagName === "IMG") {
        removeElement(element.lastElementChild);
    }
}

function disableBtn(element, id, classList) {
    element.disabled = true;
    addSpinner(element, id, classList);
}

export {
    scriptLoader,
    capitalize,
    removeElement,
    removeElements,
    removeElementClass,
    getElementByAttr,
    isOutsideElement,
    formatTime,
    dispatchCustomEvent,
    getImage,
    setElementIconAndTitle,
    addSpinner,
    enableBtn,
    disableBtn
};

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

function removeElement(element) {
    element.remove();
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

function getScrollParent(element) {
    if (!element) {
        return;
    }

    if (element.scrollHeight > element.clientHeight) {
        return element;
    }
    return getScrollParent(element.parentElement);
}

function isOutsideElement(element, targetElement) {
    return targetElement ? !targetElement.contains(element) : false;
}

function getSeconds(time) {
    return time % 60;
}

function getMinutes(time) {
    return Math.floor(time / 60 % 60);
}

function getHours(time) {
    return Math.floor(time / 3600);
}

function padTime(time, pad = true) {
    return pad && time < 10 ? `0${time}` : time;
}

function formatTime(time, showHours = false) {
    const hours = getHours(time);
    const minutes = getMinutes(time);
    const seconds = getSeconds(time);
    showHours = showHours || hours;

    return `${showHours ? `${hours}:` : ""}${padTime(minutes, showHours)}:${padTime(seconds)}`;
}

function dispatchCustomEvent(eventName, data) {
    const event = new CustomEvent(eventName, { detail: data });

    window.dispatchEvent(event);
}

function setElementIconAndTitle(element, { id, title }) {
    element.setAttribute("title", title);
    element.querySelector("use").setAttribute("href", `#${id}`);
}

function shuffleArray(array) {
    let index = array.length;

    while (index) {
        const randomIndex = Math.floor(Math.random() * index);

        index -= 1;
        [array[index], array[randomIndex]] = [array[randomIndex], array[index]];
    }
    return array;
}

function getIcon(config) {
    const elementId = config.elementId ? `id=${config.elementId}` : "";
    const className = config.className ? `class="${config.className}"` : "";
    const title = config.title ? `<title>${config.title}</title>` : "";

    return `
        <svg viewBox="0 0 24 24" ${elementId} ${className}>
            ${title}
            <use href="#${config.iconId}"></use>
        </svg>
    `;
}

export {
    scriptLoader,
    removeElement,
    removeElements,
    removeElementClass,
    getElementByAttr,
    getScrollParent,
    isOutsideElement,
    formatTime,
    dispatchCustomEvent,
    setElementIconAndTitle,
    shuffleArray,
    getIcon
};

const scriptLoader = (function() {
    const loaded = [];

    function loadScript(attrs, cb) {
        if (loaded.includes(attrs.src)) {
            return true;
        }
        const script = document.createElement("script");

        Object.keys(attrs).forEach(attr => {
            script.setAttribute(attr, attrs[attr]);
        });
        document.getElementsByTagName("body")[0].appendChild(script);
        loaded.push(attrs.src);

        if (cb) {
            script.onload = cb;
        }
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

function removeElementClass(className, classToRemove) {
    const elements = Array.from(document.querySelectorAll(`.${className}.${classToRemove}`));

    elements.forEach(element => {
        element.classList.remove(classToRemove);
    });
}

function getElementByAttr(element, attr) {
    while (element) {
        const attrValue = element.getAttribute(attr);

        if (attrValue) {
            return {
                elementRef: element,
                attrValue
            };
        }
        element = element.parentElement;
    }
}

function isOutsideElement(element, targetElementId) {
    const targetElement = document.getElementById(targetElementId);

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

    return time >= 3600 ? `${hours}:` : "";
}

function formatTime(time) {
    const seconds = getSeconds(time);
    const minutes = getMinutes(time);
    const hours = getHours(time);

    return `${hours}${minutes}:${seconds}`;
}

export {
    scriptLoader,
    capitalize,
    getElementByAttr,
    removeElement,
    removeElementClass,
    formatTime,
    isOutsideElement
};

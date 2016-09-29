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

    if (!targetElement) {
        return false;
    }
    while (element) {
        if (element === targetElement) {
            return false;
        }
        element = element.parentElement;
    }
    return true;
}

function formatTime(time) {
    let newTime = "";

    time = Math.floor(time);
    if (time >= 60) {
        const minutes = Math.floor(time / 60);

        newTime = `${minutes}:`;
    }
    else {
        newTime = "0:";
    }

    const seconds = time % 60;

    newTime += seconds < 10 ? `0${seconds}` : seconds;
    return newTime;
}

export {
    scriptLoader,
    capitalize,
    getElementByAttr,
    removeElementClass,
    formatTime,
    isOutsideElement
};

const scriptLoader = (function() {
    const loaded = [];

    function loadScript(src, cb) {
        if (loaded.includes(src)) {
            return;
        }

        const script = document.createElement("script");

        script.setAttribute("src", src);
        document.getElementsByTagName("body")[0].appendChild(script);
        loaded.push(src);

        if (cb) {
            script.onload = function() {
                cb();
            };
        }
    }

    return {
        load: loadScript
    };
})();

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
            return { element, attrValue };
        }
        element = element.parentElement;
    }
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
    getElementByAttr,
    removeElementClass,
    formatTime
};

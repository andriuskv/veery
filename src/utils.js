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

function dispatchCustomEvent(eventName, data) {
  const event = new CustomEvent(eventName, { detail: data });

  window.dispatchEvent(event);
}

function setDocumentTitle(title) {
  document.title = title ? `${title} | Veery` : "Veery";
}

function classNames(...classNames) {
  return classNames.join(" ").trimEnd();
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

function shuffleArray(array) {
  let index = array.length;

  while (index) {
    const randomIndex = Math.floor(Math.random() * index);

    index -= 1;
    [array[index], array[randomIndex]] = [array[randomIndex], array[index]];
  }
  return array;
}

function getRandomString(length = 8) {
  return Math.random().toString(32).slice(2, 2 + length);
}

async function computeHash(buffer) {
  const digest = await crypto.subtle.digest("SHA-256", buffer);

  return [...new Uint8Array(digest)]
    .map(value => value.toString(16).padStart(2, "0"))
    .join("");
}

export {
  dispatchCustomEvent,
  setDocumentTitle,
  classNames,
  formatTime,
  shuffleArray,
  getRandomString,
  scriptLoader,
  computeHash
};

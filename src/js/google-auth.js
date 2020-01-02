/* global gapi */

import { scriptLoader, dispatchCustomEvent } from "./utils.js";
import { togglePanel, removePanel } from "./panels";

const container = document.getElementById("js-google-sign-in");
let user = null;
let signedIn = false;
let initialized = false;
let initializing = false;

async function changeGoogleAuthState() {
  try {
    if (!initialized) {
      await initGoogleAPI(true);
      return;
    }
    const instance = gapi.auth2.getAuthInstance();

    if (instance.isSignedIn.get()) {
      await instance.signOut();
      onSignOut();
    }
    else {
      await instance.signIn();
      onSignIn(instance.currentUser.get());
    }
  }
  catch (e) {
    console.log(e);
  }
}

async function initGoogleAPI(signIn = false) {
  if (initialized || initializing) {
    return signedIn;
  }
  initializing = true;

  try {
    await scriptLoader.load({ src: "https://apis.google.com/js/api.js" });
    await new Promise(resolve => gapi.load("client:auth2", resolve));
    await gapi.client.init({
      apiKey: process.env.YOUTUBE_API_KEY,
      clientId: "293076144560-r5cear7rprgo094u6ibcd6nl3bbg18te.apps.googleusercontent.com",
      discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/youtube/v3/rest"],
      scope: "https://www.googleapis.com/auth/youtube.force-ssl"
    });
    const instance = gapi.auth2.getAuthInstance();

    if (instance.isSignedIn.get()) {
      onSignIn(instance.currentUser.get());
    }
    else if (signIn) {
      await instance.signIn();
      onSignIn(instance.currentUser.get());
    }
    initialized = true;
    return signedIn;
  }
  catch (e) {
    console.log(e);
  }
  finally {
    initializing = false;
  }
}

function onSignIn(currentUser) {
  const element = document.getElementById("js-google-sign-in-btn");
  signedIn = true;

  setGoogleUser(currentUser);
  element.remove();
  container.insertAdjacentHTML("afterbegin", `
    <button id="js-google-panel-toggle-btn" class="btn btn-icon google-panel-toggle-btn"
    data-disable>
      <img src="${user.image}" class="google-user-image" alt="">
    </button>
  `);
  document.getElementById("js-google-panel-toggle-btn").addEventListener("click", toggleGooglePanel);
}

function onSignOut() {
  signedIn = false;
  user = null;
  document.getElementById("js-google-panel-toggle-btn").remove();
  container.insertAdjacentHTML("beforeend", `
    <button id="js-google-sign-in-btn" class="btn btn-text"
      data-item="google-sign-in" data-disable>Sign In</button>
  `);
  removePanel();
  dispatchCustomEvent("google-sign-out");
}

function getAccessToken() {
  const instance = gapi.auth2.getAuthInstance();

  if (instance.isSignedIn.get()) {
    return instance.currentUser.get().getAuthResponse().access_token;
  }
  return null;
}

function setGoogleUser(currentUser) {
  const profile = currentUser.getBasicProfile();

  user = {
    name: profile.getName(),
    email: profile.getEmail(),
    image: profile.getImageUrl()
  };
}

function getGoogleUser() {
  return user;
}

function createGooglePanel(id, { element }) {
  element.insertAdjacentHTML("afterend", `
    <div id=${id} class="panel google-panel">
      <div class="google-user">
        <img src="${user.image}" class="google-user-image" alt="">
        <div class="google-user-details">
          <div class="google-user-name">${user.name}</div>
          <div>${user.email}</div>
        </div>
      </div>
      <button class="btn btn-text google-sign-out-btn"
      data-item="google-sign-in">Sign Out</button>
    </div>
  `);
}

function toggleGooglePanel({ currentTarget }) {
  togglePanel("js-google-panel", createGooglePanel, {
    element: currentTarget
  });
}

export {
  changeGoogleAuthState,
  initGoogleAPI,
  getAccessToken,
  getGoogleUser
};

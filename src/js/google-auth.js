/* global gapi */

import { scriptLoader, dispatchCustomEvent, removeElement } from "./utils.js";

const container = document.getElementById("js-google-sign-in");
let user = null;
let initialized = false;
let initializing = false;

function isGoogleAPIInitialized() {
    return initialized;
}

function isGoogleAPIInitializing() {
    return initializing;
}

async function changeGoogleAuthState(element) {
    if (element.disabled) {
        return;
    }
    element.disabled = true;

    try {
        if (!initialized) {
            await initGoogleAPI(true);
            return;
        }
        const instance = gapi.auth2.getAuthInstance();

        if (instance.isSignedIn.get()) {
            await instance.signOut();
            onSignOut(element);
        }
        else {
            await instance.signIn();
            onSignIn(element, instance);
        }
    }
    catch (e) {
        console.log(e);
    }
    finally {
        element.disabled = false;
    }
}

async function initGoogleAPI(signIn = false) {
    if (initialized || initializing) {
        return;
    }
    const element = document.getElementById("js-google-sign-in-btn");
    initializing = true;
    element.disabled = true;

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
            onSignIn(element, instance);
        }
        else if (signIn) {
            await instance.signIn();
            onSignIn(element, instance);
        }
        initialized = true;
        initializing = false;
        dispatchCustomEvent("google-api-initialized");
    }
    catch (e) {
        initializing = false;

        console.log(e);
    }
    finally {
        element.disabled = false;
    }
}

function onSignIn(element, instance) {
    element.textContent = "Sign Out";
    container.classList.add("signed-in");
    container.setAttribute("tabindex", "0");
    setGoogleUser(instance);
    renderGoogleUser();
}

function onSignOut(element) {
    user = null;
    element.textContent = "Sign In";
    container.classList.remove("signed-in");
    container.removeAttribute("tabindex");
    removeElement(document.getElementById("js-google-user"));
}

function setGoogleUser(instance) {
    const profile = instance.currentUser.get().getBasicProfile();

    user = {
        name: profile.getName(),
        email: profile.getEmail(),
        image: profile.getImageUrl()
    };
}

function getGoogleUser() {
    return user;
}

function renderGoogleUser() {
    container.insertAdjacentHTML("afterbegin", `
        <div id="js-google-user" class="google-user">
            <img src="${user.image}" class="google-user-image" alt="">
            <div class="google-user-details">
                <div class="google-user-name">${user.name}</div>
                <div class="google-user-email">${user.email}</div>
            </div>
        </div>
    `);
}

export {
    isGoogleAPIInitialized,
    isGoogleAPIInitializing,
    changeGoogleAuthState,
    initGoogleAPI,
    getGoogleUser
};

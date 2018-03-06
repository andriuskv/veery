/* global gapi */

import { scriptLoader, dispatchCustomEvent } from "./utils.js";

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
        const instance = gapi.auth2.getAuthInstance();

        if (instance.isSignedIn.get()) {
            await instance.signOut();
            element.textContent = "Sign In";
        }
        else {
            await instance.signIn();
            element.textContent = "Sign Out";
        }
    }
    catch (e) {
        console.log(e);
    }
    element.disabled = false;
}

async function initGoogleAPI() {
    if (initialized || initializing) {
        return;
    }
    const element = document.getElementById("js-google-sign-in-or-out-btn");
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

        if (gapi.auth2.getAuthInstance().isSignedIn.get()) {
            element.textContent = "Sign Out";
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

export {
    isGoogleAPIInitialized,
    isGoogleAPIInitializing,
    changeGoogleAuthState,
    initGoogleAPI
};

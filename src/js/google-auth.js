/* global gapi */

import {
    scriptLoader,
    enableBtn,
    disableBtn
} from "./utils.js";

let initialized = false;

function isGoogleAuthInited() {
    return initialized;
}

async function changeGoogleAuthState(element) {
    if (element.disabled) {
        return;
    }
    disableBtn(element);

    try {
        const instance = gapi.auth2.getAuthInstance();

        if (instance.isSignedIn.get()) {
            await instance.signOut();
            element.firstElementChild.textContent = "Sign In";
        }
        else {
            await instance.signIn();
            element.firstElementChild.textContent = "Sign Out";
        }
    }
    catch (e) {
        console.log(e);
    }
    enableBtn(element);
}

async function initGoogleAuth() {
    if (initialized) {
        return;
    }
    const element = document.querySelector(".google-sign-in-or-out-btn");
    initialized = true;

    disableBtn(element);

    try {
        await scriptLoader.load({ src: "https://apis.google.com/js/api.js" });
        await new Promise(resolve => gapi.load('client:auth2', resolve));
        await gapi.client.init({
            apiKey: process.env.YOUTUBE_API_KEY,
            clientId: "293076144560-r5cear7rprgo094u6ibcd6nl3bbg18te.apps.googleusercontent.com",
            discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/youtube/v3/rest"],
            scope: "https://www.googleapis.com/auth/youtube.force-ssl"
        });

        if (gapi.auth2.getAuthInstance().isSignedIn.get()) {
            element.firstElementChild.textContent = "Sign Out";
        }
    }
    catch (e) {
        console.log(e);
    }
    enableBtn(element);
}

export {
    isGoogleAuthInited,
    changeGoogleAuthState,
    initGoogleAuth
};

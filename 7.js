"use strict";(globalThis.webpackChunkveery=globalThis.webpackChunkveery||[]).push([[7],{7:(t,e,n)=>{n.d(e,{Ox:()=>c,PR:()=>I,TX:()=>b,Vh:()=>d,cN:()=>l,fetchPlaylistItems:()=>m,initGoogleAPI:()=>k});var i=n(353),s=n(585),a=n(322);let o=null,r=null,u="";async function c(){const t=await v("playlists","snippet,contentDetails,status","mine",!0);var e;return e=t.items,o=e.map((t=>({id:t.id,url:`https://youtube.com/playlist?list=${t.id}`,isPrivate:"private"===t.status.privacyStatus,itemCount:t.contentDetails.itemCount,title:t.snippet.title,thumbnail:t.snippet.thumbnails.medium.url}))),o}async function l(t,e){const{items:n}=await v("videos","snippet,contentDetails","id",t);if(n.length){const t=function(t){const e=h(t).map((t=>(t.snippet.resourceId={videoId:t.id},t.snippet.videoOwnerChannelTitle=t.snippet.channelTitle,t.durationInSeconds=g(t.contentDetails.duration)-1,t)));return y(e)}(n);return e.length?p(t,e):t}}function p(t,e){return t.reduce(((t,n)=>(e.some((t=>t.id===n.id))||t.push(n),t)),[])}async function d(t){const{items:e}=await v("playlists","snippet,status","id",t);if(e.length){const t="private"===e[0].status.privacyStatus,n={title:e[0].snippet.title,isPrivate:t};return t&&(n.user=r),n}}async function m(t,e,n=[],s=""){const{error:o,items:r,nextPageToken:u}=await v("playlistItems","snippet","playlistId",t,s);if(o)return console.log(o),n;const c=await async function(t){const e=t.map((t=>t.snippet.resourceId.videoId)).join(),n=await v("videos","contentDetails","id",e);return t.reduce(((t,e)=>{const i=n.items.find((({id:t})=>t===e.snippet.resourceId.videoId));return i&&(e.durationInSeconds=g(i.contentDetails.duration)-1,t.push(e)),t}),[])}(h(r));let l=y(c);if("new"===e)(0,i.hb)("youtube-tracks",{id:t,tracks:l,done:!u});else if("reimport"===e){l=p(l,(0,a.hT)(t).tracks)}return n=n.concat(l),u?m(t,e,n,u):n}function g(t){if(t.includes("H")||(t=`0H${t}`),!t.includes("M")){const e=t.indexOf("H")+1;t=`${t.slice(0,e)}0M${t.slice(e)}`}return t.includes("S")||(t=`${t}0`),t.match(/\d{1,}/g).reverse().reduce(((t,e,n)=>t+=e*60**n),0)}function h(t){return t.filter((t=>{const e=t.snippet.title;return"Deleted video"!==e&&"Private video"!==e}))}function f(t){for(const e of["maxres","high"])if(t[e])return t[e].url;return t.medium.url}function y(t){return t.map((t=>{const e=t.snippet.resourceId.videoId;return(0,s.Qs)(e,{original:{url:f(t.snippet.thumbnails)},small:{url:t.snippet.thumbnails.medium.url}},!0),{id:e,durationInSeconds:t.durationInSeconds,duration:(0,i.mr)(t.durationInSeconds),name:t.snippet.title,title:t.snippet.title,artist:t.snippet.videoOwnerChannelTitle,album:"",artworkId:e,player:"youtube"}}))}function v(t,e,n,i,s){let a=`part=${e}&${n}=${i}&maxResults=50&key=AIzaSyD33Rxm4dA34Mh84oSxYTUUF_jyCLLOua4`;return s&&(a+=`&pageToken=${s}`),u&&(a+=`&access_token=${u}`),fetch(`https://www.googleapis.com/youtube/v3/${t}?${a}`).then((t=>t.json()))}function w(t){const e=t.currentUser.get(),n=e.getBasicProfile();u=e.getAuthResponse().access_token,r={name:n.getName(),email:n.getEmail(),image:n.getImageUrl()}}function I(){return r}async function b(){const t=gapi.auth2.getAuthInstance();return u="",r=null,t.signOut()}async function k(t){if(r)return r;await i.Vs.load({src:"https://apis.google.com/js/platform.js"}),await new Promise((t=>gapi.load("auth2",t)));const e=await gapi.auth2.init({client_id:"293076144560-r5cear7rprgo094u6ibcd6nl3bbg18te.apps.googleusercontent.com",scope:"https://www.googleapis.com/auth/youtube.readonly"});return e.isSignedIn.get()?w(e):t&&(await e.signIn(),w(e)),r}}}]);
"use strict";(globalThis.webpackChunkveery=globalThis.webpackChunkveery||[]).push([[7],{7:(t,e,n)=>{n.r(e),n.d(e,{fetchYoutubeUserPlaylists:()=>l,fetchPlaylistTitleAndStatus:()=>m,fetchPlaylistItems:()=>g,initGoogleAPI:()=>S,getUser:()=>b,logoutUser:()=>k,addVideo:()=>p});var i=n(353),s=n(585),a=n(322);let o=!1,r=null,u=null,c="";async function l(){const t=await I("playlists","snippet,contentDetails,status","mine",!0);var e;return e=t.items,r=e.map((t=>({id:t.id,url:`https://youtube.com/playlist?list=${t.id}`,isPrivate:"private"===t.status.privacyStatus,itemCount:t.contentDetails.itemCount,title:t.snippet.title,thumbnail:t.snippet.thumbnails.medium.url}))),r}async function p(t,e){const{items:n}=await I("videos","snippet,contentDetails","id",t);if(n.length){const t=function(t){return v(f(t).map((t=>(t.snippet.resourceId={videoId:t.id},t.snippet.videoOwnerChannelTitle=t.snippet.channelTitle,t.durationInSeconds=h(t.contentDetails.duration)-1,t))))}(n);return e.length?d(t,e):t}}function d(t,e){return t.reduce(((t,n)=>(e.some((t=>t.id===n.id))||t.push(n),t)),[])}async function m(t){const{items:e}=await I("playlists","snippet,status","id",t);if(e.length){const t="private"===e[0].status.privacyStatus,n={title:e[0].snippet.title,isPrivate:t};return t&&(n.user=u),n}}async function g(t,e){const{error:n,items:s,nextPageToken:o}=await I("playlistItems","snippet","playlistId",t,e);n&&console.log(n);const r=await async function(t){const e=t.map((t=>t.snippet.resourceId.videoId)).join(),n=await I("videos","contentDetails","id",e);return t.reduce(((t,e)=>{const i=n.items.find((({id:t})=>t===e.snippet.resourceId.videoId));return i&&(e.durationInSeconds=h(i.contentDetails.duration)-1,t.push(e)),t}),[])}(f(s)),u=d(v(r),(0,a.hT)(t).tracks);if((0,i.hb)("youtube-tracks",{id:t,tracks:u}),o)return g(t,o)}function h(t){if(t.includes("H")||(t=`0H${t}`),!t.includes("M")){const e=t.indexOf("H")+1;t=`${t.slice(0,e)}0M${t.slice(e)}`}return t.includes("S")||(t=`${t}0`),t.match(/\d{1,}/g).reverse().reduce(((t,e,n)=>t+=e*60**n),0)}function f(t){return t.filter((t=>{const e=t.snippet.title;return"Deleted video"!==e&&"Private video"!==e}))}function y(t){for(const e of["maxres","high"])if(t[e])return t[e].url;return t.medium.url}function v(t){return t.map((t=>{const e=t.snippet.resourceId.videoId;return(0,s.Qs)(e,{original:{url:y(t.snippet.thumbnails)},small:{url:t.snippet.thumbnails.medium.url}},!0),{id:e,durationInSeconds:t.durationInSeconds,duration:(0,i.mr)(t.durationInSeconds),name:t.snippet.title,title:t.snippet.title,artist:t.snippet.videoOwnerChannelTitle,album:"",artworkId:e,player:"youtube"}}))}function I(t,e,n,i,s){let a=`part=${e}&${n}=${i}&maxResults=50&key=AIzaSyD33Rxm4dA34Mh84oSxYTUUF_jyCLLOua4`;return s&&(a+=`&pageToken=${s}`),c&&(a+=`&access_token=${c}`),fetch(`https://www.googleapis.com/youtube/v3/${t}?${a}`).then((t=>t.json()))}function w(t){const e=t.currentUser.get(),n=e.getBasicProfile();c=e.getAuthResponse().access_token,u={name:n.getName(),email:n.getEmail(),image:n.getImageUrl()}}function b(){return u}async function k(){const t=gapi.auth2.getAuthInstance();return c="",u=null,t.signOut()}async function S(t){if(o)return u;await i.Vs.load({src:"https://apis.google.com/js/platform.js"}),await new Promise((t=>gapi.load("auth2",t)));const e=await gapi.auth2.init({client_id:"293076144560-r5cear7rprgo094u6ibcd6nl3bbg18te.apps.googleusercontent.com",scope:"https://www.googleapis.com/auth/youtube.readonly"});return e.isSignedIn.get()?w(e):t&&(await e.signIn(),w(e)),o=!0,u}}}]);
(()=>{"use strict";var t,e,r={744:(t,e,r)=>{var a=r(73);!function(){const t=[]}();function n(t,e=!0){return e&&t<10?`0${t}`:t}function o(t,e=!1){const r=function(t){return Math.floor(t/3600)}(t),a=function(t){return Math.floor(t/60%60)}(t),o=function(t){return t%60}(t);return`${(e=e||r)?`${r}:`:""}${n(a,e)}:${n(o)}`}async function i(t){const e=await crypto.subtle.digest("SHA-256",t);return[...new Uint8Array(e)].map((t=>t.toString(16).padStart(2,"0"))).join("")}let c=0;async function s(t,e){try{delete t.needsMetadata,await async function(t){const{artist:e,title:r,album:n,duration:i,picture:c}=await(0,a.A)(t.audioTrack);t.title=r||t.name,t.artist=e||"",t.album=n||"",t.durationInSeconds=i,t.duration=o(i),postMessage({type:"track",track:t}),c&&(t.picture=c)}(t),async function(t,e){if(t.picture)try{await async function(t){const{picture:e}=t;if(delete t.picture,"OffscreenCanvas"in self){const[r,a]=await Promise.all([l(e),u(e)]);t.artworkId=r,postMessage({type:"track",track:t,artwork:{original:{blob:e},small:{blob:a},type:e.type}})}else{const r=await l(e);t.artworkId=r,postMessage({type:"image",image:{hash:r,file:e},done:c<=1,track:t})}}(t)}catch(t){console.log(t)}!e||t.album&&t.picture||await async function(t){try{const r="https://ws.audioscrobbler.com/2.0/",a=`?method=track.getInfo&api_key=${"3e8d48b3277c21bc77965345f5faf18c"}&artist=${t.artist}&track=${t.title}&format=json`,n=await fetch(r+a).then((t=>t.json()));if(n.track&&n.track.album){const{title:r,image:a}=n.track.album;let o=!1,c=null;if(!t.album&&r&&(t.album=r,o=!0),!t.artworkId&&a){const r=a[a.length-1]["#text"];if(r){const{origin:a,pathname:n}=new URL(r),[o]=n.split("/").slice(-1),s=`${a}/i/u/500x500/${o}`,u=function(t){const e=t.split(".").at(-1);if("jpg"===e)return"image/jpeg";return`image/${e}`}(o),l=await(e=s,i(new TextEncoder("utf-8").encode(e).buffer));t.artworkId=l,c={original:{url:s},small:{url:r},type:u}}}(o||c)&&postMessage({type:"track",track:t,artwork:c})}}catch(t){console.log(t)}var e}(t);c-=1,c<=0&&postMessage({type:"track",track:t,done:!0})}(t,e)}catch(e){console.log(e),c-=1,c<=0&&postMessage({type:"track",track:t,done:!0})}}async function u(t){const e=await createImageBitmap(t);let{width:r,height:a}=e;const n=Math.min(r,a,256);r<a?(a=n/e.width*a,r=n):(r=n/e.height*r,a=n);const o=new OffscreenCanvas(r,a);return o.getContext("2d").drawImage(e,0,0,r,a),o.convertToBlob({type:t.type,quality:.72})}async function l(t){if(!t)return;return i(await t.arrayBuffer())}onmessage=function(t){const{payload:e,checkLastFm:r}=t.data;Array.isArray(e)?async function(t,e){c=t.length;for(const r of t)await s(r,e)}(e,r):(c=1,s(e,r))}}},a={};function n(t){var e=a[t];if(void 0!==e)return e.exports;var o=a[t]={exports:{}};return r[t](o,o.exports,n),o.exports}n.m=r,n.x=()=>{var t=n.O(void 0,[73],(()=>n(744)));return t=n.O(t)},t=[],n.O=(e,r,a,o)=>{if(!r){var i=1/0;for(l=0;l<t.length;l++){for(var[r,a,o]=t[l],c=!0,s=0;s<r.length;s++)(!1&o||i>=o)&&Object.keys(n.O).every((t=>n.O[t](r[s])))?r.splice(s--,1):(c=!1,o<i&&(i=o));if(c){t.splice(l--,1);var u=a();void 0!==u&&(e=u)}}return e}o=o||0;for(var l=t.length;l>0&&t[l-1][2]>o;l--)t[l]=t[l-1];t[l]=[r,a,o]},n.d=(t,e)=>{for(var r in e)n.o(e,r)&&!n.o(t,r)&&Object.defineProperty(t,r,{enumerable:!0,get:e[r]})},n.f={},n.e=t=>Promise.all(Object.keys(n.f).reduce(((e,r)=>(n.f[r](t,e),e)),[])),n.u=t=>t+".js",n.miniCssF=t=>{},n.g=function(){if("object"==typeof globalThis)return globalThis;try{return this||new Function("return this")()}catch(t){if("object"==typeof window)return window}}(),n.o=(t,e)=>Object.prototype.hasOwnProperty.call(t,e),(()=>{var t;n.g.importScripts&&(t=n.g.location+"");var e=n.g.document;if(!t&&e&&(e.currentScript&&"SCRIPT"===e.currentScript.tagName.toUpperCase()&&(t=e.currentScript.src),!t)){var r=e.getElementsByTagName("script");if(r.length)for(var a=r.length-1;a>-1&&(!t||!/^http(s?):/.test(t));)t=r[a--].src}if(!t)throw new Error("Automatic publicPath is not supported in this browser");t=t.replace(/^blob:/,"").replace(/#.*$/,"").replace(/\?.*$/,"").replace(/\/[^\/]+$/,"/"),n.p=t})(),(()=>{var t={363:1,744:1};n.f.i=(e,r)=>{t[e]||importScripts(n.p+n.u(e))};var e=globalThis.webpackChunkveery=globalThis.webpackChunkveery||[],r=e.push.bind(e);e.push=e=>{var[a,o,i]=e;for(var c in o)n.o(o,c)&&(n.m[c]=o[c]);for(i&&i(n);a.length;)t[a.pop()]=1;r(e)}})(),e=n.x,n.x=()=>n.e(73).then(e);n.x()})();
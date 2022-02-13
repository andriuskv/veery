"use strict";(globalThis.webpackChunkveery=globalThis.webpackChunkveery||[]).push([[357],{357:()=>{function t(t,n,e){return new Uint8Array(t,n,e)}function n(t,n,e){return t.slice(n,n+e)}function e(t,n={}){if("little"===n.endian)return t[0]|t[1]<<8|t[2]<<16|t[3]<<24;if(7===n.shiftBase)return t[0]<<21|t[1]<<14|t[2]<<7|t[3];let e=t[1]<<16|t[2]<<8|t[3];return 4===n.byteCount&&(e=t[0]<<24|e),e}function r(t,n){return new TextDecoder(n).decode(t)}function i(t,n){return new Promise((e=>{const r=new FileReader,i=n?t.slice(0,Math.min(n,t.size)):t;r.onloadend=function({target:t}){e(t.result)},r.readAsArrayBuffer(i)}))}function a(n,r){return e(t(n,r,4),{endian:"big",shiftBase:7})}function o(n,r,i){return 3===i?e(t(n,r,4),{endian:"big"}):a(n,r)}function c(n,e,i){const a=t(n,e,i),[o]=a;if(0===o){const t=r(a,"iso-8859-1");return 0===a[a.length-1]?t.slice(1,-1):t.slice(1)}if(1===o){const t=255===a[1]&&254===a[2]?"utf-16le":"utf-16be",n=a.length%2==0?a.slice(3,-1):a.slice(3);"utf-16be"===t&&(n[0]=0);const e=r(n,t);return 0===a[a.length-1]&&0===a[a.length-2]?e.slice(0,-1):e}if(2===o){return r(a.length%2==0?a.slice(1,-1):a.slice(1),"utf-16le")}if(3===o){const t=r(a,"utf-8");return 0===a[a.length-1]?t.slice(1,-1):t.slice(1)}return r(a,"iso-8859-1")}function s(n,e){const i=r(t(n,e,4));return/\w{4}/.test(i)?i:null}function u(t,n){let e=0;for(;t[n];)n+=1,e+=1;return e}function l(n,e,i){let a=1;const o=t(n,e,i),c=u(o,a),s=r(t(n,e+a,c));a+=c+2;const l=u(o,a)+1;return a+=l,0===o[a+l+1]&&(a+=1),new Blob([o.slice(a)],{type:s})}async function f(n,e,u,w=0,m={}){const b=w,k=a(e,w+=6)+10;for(w+=4,b+k>e.byteLength&&(e=await i(n,b+k+e.byteLength));;){const i=s(e,w),a=o(e,w+=4,u);w+=4;const[d]=t(e,w+1,2),g=(d>>1)%2!=0;if(w+=2,!i){if("ID3"===r(t(e,w=b+k,3)))return f(n,e,u,w,m);break}{const t=y(i);let n=w,r=a;g&&(r=o(e,n,u),n+=4),t&&!m[t]&&(m[t]="picture"===t?l(e,n,r):c(e,n,r))}w+=a}for(;0===new DataView(e,w,1).getUint8(0);)w+=1;let A=0,M=!0;for(;w<e.byteLength;){const a=t(e,w,4);if(255!==a[0]||a[1]<112)return m.duration=h(A,m),m;if(M){m=g(a,m);const o=36,c=r(t(e,w+o,4));if("Xing"===c||"Info"===c)return p(e,w+o,m);e=await i(n),M=!1}A+=1,w+=d(a[2],m)}return m.duration=h(A,m),m}function d(t,{bitrate:n,sampleRate:e}){const r=(2&t)>0?1:0;return Math.floor(144e3*n/e)+r}function g(t,n){const e=[0,32,48,56,64,80,96,112,128,144,160,176,192,224,256,0],r=[0,8,16,24,32,40,48,56,64,80,96,112,128,144,160,0],i=[[null,r,r,e],null,[null,r,r,e],[null,[0,32,40,48,56,64,80,96,112,128,160,192,224,256,320,0],[0,32,48,56,64,80,96,112,128,160,192,224,256,320,384,0],[0,32,64,96,128,160,192,224,256,288,320,352,384,416,448,0]]],a=t[1]>>3&3,o=t[1]>>1&3,c=t[2]>>2&3,s=t[2]>>4&15;return n.sampleRate=[[11025,12e3,8e3],null,[22050,24e3,16e3],[44100,48e3,32e3]][a][c],n.samplesPerFrame=[[384,1152,576],null,[384,1152,576],[384,1152,1152]][a][o],n.bitrate=i[a][o][s],n}function h(t,{samplesPerFrame:n,sampleRate:e}){return Math.floor(t*n/e)}function p(n,r,i){const a=e(t(n,r+8,4),{endian:"big"});return i.duration=h(a,i),i}function y(t){return{TIT2:"title",TPE1:"artist",TALB:"album",APIC:"picture"}[t]}function w(t){const n=atob(t),e=new Uint8Array(n.length);for(let t=0;t<n.length;t++)e[t]=n.charCodeAt(t);return e}function m(t,r){return e(n(t,r,4),{endian:"big"})}function b(t,e){let i=4;const a=m(t,i);i+=4;const o=r(n(t,i,a));i+=a;const c=m(t,i);i+=4,i+=c,i+=16;const s=m(t,i);return i+=4,e.picture=new Blob([n(t,i,s)],{type:o}),e}function k(t,r){return e(n(t,r,4),{endian:"little"})}function A(t,e,i=0){const a=k(t,i);let o=k(t,i+=a+4);for(i+=4;o;){const a=k(t,i),c=r(n(t,i+=4,a),"utf-8"),[s,u]=c.split("=");"METADATA_BLOCK_PICTURE"===s?e=b(w(u),e):e[s.toLowerCase()]=u,i+=a,o-=1}return e}function M(t,n){const e=I(t.slice(10,13))>>4,r=I([15&t[13],...t.slice(14,18)]);return e&&(n.duration=Math.floor(r/e)),n}function I(t){return t.reduce(((t,n)=>(t<<8)+n),0)}async function v(n,r,a=4){let o={},c=!1;for(;!c;){const s=t(r,a,4),u=e(s,{endian:"big"}),l=s[0],f=127&l;if(c=128==(128&l),(a+=4)+u>r.byteLength&&(r=await i(n,r.byteLength+a+u)),0===f){o=M(t(r,a,u),o)}else if(4===f){o=A(t(r,a,u),o)}else if(6===f){o=b(t(r,a,u),o)}a+=u}return o}function L(t,n){const e=new Uint8Array(t.length+n.length);return e.set(t),e.set(n,t.length),e}function R(t,i){const a=r(n(t,0,5));if("OpusH"===a||"vorb"===a)return function(t,r){return r.sampleRate=e(n(t,12,4),{endian:"little"}),r}(t,i);if("OpusT"===a)return A(t,i,8);if("vorb"===a)return A(t,i,7);throw new Error("Unknown type")}function T(n,r){return e(t(n,r,4),{endian:"big",byteCount:4})}function C(t,n){const e=new DataView(t,n,1).getUint8(0);let r=0,i=0;return n+=4,0===e?(r=T(t,n+=8),i=T(t,n+=4)):(r=T(t,n+=16),i=T(t,(n+=4)+4)),Math.floor(i/r)}function B(n,e,i,a){const o={"©ART":"artist","©nam":"title","©alb":"album","©cmt":"comment","©day":"year","©too":"encoding",covr:"picture"};for(;i;){const s=T(n,e),u=o[r(t(n,e+4,4),"iso-8859-1")],l=24;if(u&&s>l){const i=t(n,e+l,s-l);a[u]="picture"===u?new Blob([i],{type:(c=i,255===c[0]&&216===c[1]?"image/jpg":"PNG"===r(c.slice(0,4))?"image/png":"")}):r(i,"utf-8")}e+=s,i-=s}var c;return a}async function U(n,i=4){let a=e(t(n,i+=12,4),{endian:"little"});i+=4;const{sampleRate:o,dataRate:c}=function(n,r){const i=e(t(n,r+=4,4),{endian:"little"}),a=e(t(n,r+=4,4),{endian:"little"});return{sampleRate:i,dataRate:a}}(n,i);i=function(n,i){for(;i<n.byteLength;){if("data"===r(t(n,i,4)))return i;let a=e(t(n,i+=4,4),{endian:"little"});a%2==1&&(a+=1),i+=4+a}}(n,i+=a);const s=e(t(n,i+=4,4),{endian:"little"});return{sampleRate:o,duration:Math.floor(s/c)}}async function $(n,a){const o=t(a,0,8),c=r(o);if(c.startsWith("ID3")){if(o[3]<3)throw new Error("Unsupported ID3 tag version");const e=function(n){const e=t(n,6,4);return 2097152*e[0]+16384*e[1]+128*e[2]+e[3]}(a)+10;return"fLaC"===r(t(a=await i(n,a.byteLength+e+1024),e,4))?v(n,a,e+4):f(n,a,o[3])}if(c.startsWith("fLaC"))return v(n,a);if(c.startsWith("OggS"))return function(n){let r={},i=0,a=2,o=new Uint8Array;for(;i<n.byteLength;){i+=5;const[c]=t(n,i,1);if(i+=1,4===c){const a=e(t(n,i,4),{endian:"little"});return r.duration=Math.floor(a/r.sampleRate),r}i+=20;const[s]=t(n,i,1);i+=1;const u=t(n,i,s);let l=0;i+=s;for(let t=0;t<s;t++)l+=u[t];if(a){const e=u[u.length-1];o=L(o,t(n,i,l)),l%255==0&&e||(a-=1,r=R(o,r),o=new Uint8Array)}i+=l}}(a=await i(n));if(c.endsWith("ftyp"))return function(n){const e=["moov","mvhd","udta","meta","ilst"];let i={},a=0;for(;e.length&&a<n.byteLength;){const o=T(n,a),c=r(t(n,a+4,4));e[0]===c?(a+=8,e.shift(),"mvhd"===c?(i.duration=C(n,a),a+=o-8):"ilst"===c?i=B(n,a,o-8,i):"meta"===c&&(a+=4)):a+=o}return i}(a=await i(n));if(c.startsWith("RIFF"))return U(a);throw new Error("Invalid or unsupported file")}!function(){const t=[]}();function P(t,n=!0){return n&&t<10?`0${t}`:t}function D(t,n=!1){const e=function(t){return Math.floor(t/3600)}(t),r=function(t){return Math.floor(t/60%60)}(t),i=function(t){return t%60}(t);return`${(n=n||e)?`${e}:`:""}${P(r,n)}:${P(i)}`}async function E(t){const n=await crypto.subtle.digest("SHA-256",t);return[...new Uint8Array(n)].map((t=>t.toString(16).padStart(2,"0"))).join("")}let F=0;async function j(t,n){try{delete t.needsMetadata,await async function(t){const{artist:n,title:e,album:r,duration:i,picture:a}=await(o=t.audioTrack,new Promise((t=>{const n=new FileReader,e=Math.min(24576,o.size);n.onloadend=function({target:n}){t($(o,n.result))},n.readAsArrayBuffer(o.slice(0,e))})));var o;t.title=e||t.name,t.artist=n||"",t.album=r||"",t.durationInSeconds=i,t.duration=D(i),postMessage({type:"track",track:t}),a&&(t.picture=a)}(t),async function(t,n){if(t.picture)try{await async function(t){const{picture:n}=t;if(delete t.picture,"OffscreenCanvas"in self){const[e,r]=await Promise.all([x(n),O(n)]);t.artworkId=e,postMessage({type:"track",track:t,artwork:{original:{blob:n},small:{blob:r},type:n.type}})}else{const e=await x(n);t.artworkId=e,postMessage({type:"image",image:{hash:e,file:n},done:F<=1,track:t})}}(t)}catch(t){console.log(t)}!n||t.album&&t.picture||await async function(t){try{const e="https://ws.audioscrobbler.com/2.0/",r=`?method=track.getInfo&api_key=${"3e8d48b3277c21bc77965345f5faf18c"}&artist=${t.artist}&track=${t.title}&format=json`,i=await fetch(e+r).then((t=>t.json()));if(i.track&&i.track.album){const{title:e,image:r}=i.track.album;let a=!1,o=null;if(!t.album&&e&&(t.album=e,a=!0),!t.artworkId&&r){const e=r[r.length-1]["#text"];if(e){const{origin:r,pathname:i}=new URL(e),[a]=i.split("/").slice(-1),c=`${r}/i/u/500x500/${a}`,s=function(t){const n=t.split(".")[1];if("jpg"===n)return"image/jpeg";return`image/${n}`}(a),u=await(n=c,E(new TextEncoder("utf-8").encode(n).buffer));t.artworkId=u,o={original:{url:c},small:{url:e},type:s}}}(a||o)&&postMessage({type:"track",track:t,artwork:o})}}catch(t){console.log(t)}var n}(t);F-=1,F<=0&&postMessage({type:"track",track:t,done:!0})}(t,n)}catch(n){console.log(n),F-=1,F<=0&&postMessage({type:"track",track:t,done:!0})}}async function O(t){const n=await createImageBitmap(t);let{width:e,height:r}=n;const i=Math.min(e,r,256);e<r?(r=i/n.width*r,e=i):(e=i/n.height*e,r=i);const a=new OffscreenCanvas(e,r);return a.getContext("2d").drawImage(n,0,0,e,r),a.convertToBlob({type:t.type,quality:.72})}async function x(t){if(!t)return;return E(await t.arrayBuffer())}onmessage=function(t){const{payload:n,checkLastFm:e}=t.data;Array.isArray(n)?async function(t,n){F=t.length;for(const e of t)await j(e,n)}(n,e):(F=1,j(n,e))}}}]);
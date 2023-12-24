"use strict";(globalThis.webpackChunkveery=globalThis.webpackChunkveery||[]).push([[357],{357:()=>{function t(t,n,e){return new Uint8Array(t,n,e)}function n(t,n,e){return t.slice(n,n+e)}function e(t,n){if("little"===n.endian)return t[0]|t[1]<<8|t[2]<<16|t[3]<<24;if(7===n.shiftBase)return t[0]<<21|t[1]<<14|t[2]<<7|t[3];let e=t[1]<<16|t[2]<<8|t[3];return 4===n.byteCount&&(e=t[0]<<24|e),e}function r(t,n="utf-8"){return new TextDecoder(n).decode(t)}function i(t,n){return(n?t.slice(0,Math.min(n,t.size)):t).arrayBuffer()}const a=[[11025,12e3,8e3],null,[22050,24e3,16e3],[44100,48e3,32e3]],o=[[384,1152,576],null,[384,1152,576],[384,1152,1152]],c=[0,32,48,56,64,80,96,112,128,144,160,176,192,224,256,0],u=[0,8,16,24,32,40,48,56,64,80,96,112,128,144,160,0],s=[[null,u,u,c],null,[null,u,u,c],[null,[0,32,40,48,56,64,80,96,112,128,160,192,224,256,320,0],[0,32,48,56,64,80,96,112,128,160,192,224,256,320,384,0],[0,32,64,96,128,160,192,224,256,288,320,352,384,416,448,0]]];function l(n,r){return e(t(n,r,4),{endian:"big",shiftBase:7})}function f(n,r,i){return 3===i?e(t(n,r,4),{endian:"big"}):l(n,r)}function g(n,e,i){const a=t(n,e,i),[o]=a;if(0===o){const t=r(a,"iso-8859-1");return 0===a[a.length-1]?t.slice(1,-1):t.slice(1)}if(1===o){const t=255===a[1]&&254===a[2]?"utf-16le":"utf-16be",n=a.length%2==0?a.slice(3,-1):a.slice(3);"utf-16be"===t&&(n[0]=0);const e=r(n,t);return 0===a[a.length-1]&&0===a[a.length-2]?e.slice(0,-1):e}if(2===o){return r(a.length%2==0?a.slice(1,-1):a.slice(1),"utf-16le")}if(3===o){const t=r(a,"utf-8");return 0===a[a.length-1]?t.slice(1,-1):t.slice(1)}return r(a,"iso-8859-1")}function h(n,e){const i=r(t(n,e,4));return/\w{4}/.test(i)?i:null}function d(t,n){let e=0;for(;t[n];)n+=1,e+=1;return e}function p(n,e,i){let a=1;const o=t(n,e,i),c=d(o,a),u=r(t(n,e+a,c));a+=c+2;const s=d(o,a)+1;return a+=s,0===o[a+s+1]&&(a+=1),new Blob([o.slice(a)],{type:u})}async function y(n,e,a,o=0,c={}){const u=o,s=l(e,o+=6)+10;for(o+=4,u+s>e.byteLength&&(e=await i(n,u+s+e.byteLength));;){const u=h(e,o),s=f(e,o+=4,a),l=t(e,(o+=4)+1,2),d=l[1]&1<<3;if(o+=2,!u){if("ID3"===r(t(e,o-=10,3)))return y(n,e,a,o,c);break}{const t=L(u);let r=o,l=s;d&&(l=f(e,r,a),r+=4),r+l>e.byteLength&&(e=await i(n)),t&&!c[t]&&("picture"===t?c[t]=p(e,r,l):(c[t]=g(e,r,l),"duration"===t&&(c[t]=Math.floor(Number.parseInt(c[t],10)/1e3))))}o+=s}if(c.duration)return c;for(;0===new DataView(e,o,1).getUint8(0);)o+=1;let d=0,M=!0;for(;o<e.byteLength;){const a=t(e,o,4);if(255!==a[0]||a[1]<112)return c.duration=m(d,c),c;if(M){c=b(a,c);const u=36,s=r(t(e,o+u,4));if("Xing"===s||"Info"===s)return k(e,o+u,c);e.byteLength<n.size&&(e=await i(n)),M=!1}d+=1,o+=w(a[2],c)}return c.duration=m(d,c),c}function w(t,{bitrate:n,sampleRate:e}){const r=(2&t)>0?1:0;return Math.floor(144e3*n/e)+r}function b(t,n){const e=t[1]>>3&3,r=t[1]>>1&3,i=t[2]>>2&3,c=t[2]>>4&15;return n.sampleRate=a[e][i],n.samplesPerFrame=o[e][r],n.bitrate=s[e][r][c],n}function m(t,{samplesPerFrame:n,sampleRate:e}){return Math.floor(t*n/e)}function k(n,r,i){const a=e(t(n,r+8,4),{endian:"big"});return i.duration=m(a,i),i}function L(t){return{TIT2:"title",TPE1:"artist",TALB:"album",TLEN:"duration",APIC:"picture"}[t]}function M(t){const n=atob(t),e=new Uint8Array(n.length);for(let t=0;t<n.length;t++)e[t]=n.charCodeAt(t);return e}function I(t,r){return e(n(t,r,4),{endian:"big"})}function A(t,e){let i=4;const a=I(t,i);i+=4;const o=r(n(t,i,a));i+=a;const c=I(t,i);i+=4,i+=c,i+=16;const u=I(t,i);return i+=4,e.picture=new Blob([n(t,i,u)],{type:o}),e}function T(t,r){return e(n(t,r,4),{endian:"little"})}function v(t,e,i=0){const a=T(t,i);let o=T(t,i+=a+4);for(i+=4;o;){const a=T(t,i),c=r(n(t,i+=4,a),"utf-8"),[u,s]=c.split("=");"METADATA_BLOCK_PICTURE"===u?e=A(M(s),e):e[u.toLowerCase()]=s,i+=a,o-=1}return e}function C(t){return t.reduce(((t,n)=>(t<<8)+n),0)}function R(t,n){const e=C(t.slice(10,13))>>4,r=C(new Uint8Array([15&t[13],...t.slice(14,18)]));return e&&(n.duration=Math.floor(r/e)),n}async function U(n,r,a=4){let o={},c=!1;for(;!c;){const u=t(r,a,4),s=e(u,{endian:"big"}),l=u[0],f=127&l;if(c=128==(128&l),(a+=4)+s>r.byteLength&&(r=await i(n,r.byteLength+a+s)),0===f){o=R(t(r,a,s),o)}else if(4===f){o=v(t(r,a,s),o)}else if(6===f){o=A(t(r,a,s),o)}a+=s}return o}function B(t,n){const e=new Uint8Array(t.length+n.length);return e.set(t),e.set(n,t.length),e}function $(t,i){const a=r(n(t,0,5));if("OpusH"===a||"vorb"===a)return function(t,r){return r.sampleRate=e(n(t,12,4),{endian:"little"}),r}(t,i);if("OpusT"===a)return v(t,i,8);if("vorb"===a)return v(t,i,7);throw new Error("Unknown type")}function E(n,r){return e(t(n,r,4),{endian:"big",byteCount:4})}function D(t,n){const e=new DataView(t,n,1).getUint8(0);let r=0,i=0;return n+=4,0===e?(r=E(t,n+=8),i=E(t,n+=4)):(r=E(t,n+=16),i=E(t,(n+=4)+4)),Math.floor(i/r)}function P(n,e,i,a){const o={"©ART":"artist","©nam":"title","©alb":"album","©cmt":"comment","©day":"year","©too":"encoding",covr:"picture"};for(;i;){const u=E(n,e),s=o[r(t(n,e+4,4),"iso-8859-1")],l=24;if(s&&u>l){const i=t(n,e+l,u-l);a[s]="picture"===s?new Blob([i],{type:(c=i,255===c[0]&&216===c[1]?"image/jpg":"PNG"===r(c.slice(0,4))?"image/png":"")}):r(i,"utf-8")}e+=u,i-=u}var c;return a}async function j(n,i=4){let a=e(t(n,i+=12,4),{endian:"little"});i+=4;const{sampleRate:o,dataRate:c}=function(n,r){r+=4;const i=t(n,r,4),a=e(i,{endian:"little"});r+=4;const o=t(n,r,4),c=e(o,{endian:"little"});return{sampleRate:a,dataRate:c}}(n,i);i=function(n,i){for(;i<n.byteLength;){if("data"===r(t(n,i,4)))return i;let a=e(t(n,i+=4,4),{endian:"little"});a%2==1&&(a+=1),i+=4+a}return i}(n,i+=a);const u=e(t(n,i+=4,4),{endian:"little"});return{sampleRate:o,duration:Math.floor(u/c)}}async function O(n,a){const o=t(a,0,8),c=r(o);if(c.startsWith("ID3")){if(o[3]<3)throw new Error("Unsupported ID3 tag version");const e=function(n){const e=t(n,6,4);return 2097152*e[0]+16384*e[1]+128*e[2]+e[3]}(a)+10;return"fLaC"===r(t(a=await i(n,a.byteLength+e+1024),e,4))?U(n,a,e+4):y(n,a,o[3])}if(c.startsWith("fLaC"))return U(n,a);if(c.startsWith("OggS"))return function(n){let r={},i=0,a=2,o=new Uint8Array;for(;i<n.byteLength;){i+=5;const[c]=t(n,i,1);if(i+=1,4===c){const a=e(t(n,i,4),{endian:"little"});return r.duration=Math.floor(a/r.sampleRate),r}i+=20;const[u]=t(n,i,1);i+=1;const s=t(n,i,u);let l=0;i+=u;for(let t=0;t<u;t++)l+=s[t];if(a){const e=s[s.length-1];o=B(o,t(n,i,l)),l%255==0&&e||(a-=1,r=$(o,r),o=new Uint8Array)}i+=l}}(a=await i(n));if(c.endsWith("ftyp"))return function(n){const e=["moov","mvhd","udta","meta","ilst"];let i={},a=0;for(;e.length&&a<n.byteLength;){const o=E(n,a),c=r(t(n,a+4,4));e[0]===c?(a+=8,e.shift(),"mvhd"===c?(i.duration=D(n,a),a+=o-8):"ilst"===c?i=P(n,a,o-8,i):"meta"===c&&(a+=4)):a+=o}return i}(a=await i(n));if(c.startsWith("RIFF"))return j(a);throw new Error("Invalid or unsupported file")}!function(){const t=[]}();function x(t,n=!0){return n&&t<10?`0${t}`:t}function F(t,n=!1){const e=function(t){return Math.floor(t/3600)}(t),r=function(t){return Math.floor(t/60%60)}(t),i=function(t){return t%60}(t);return`${(n=n||e)?`${e}:`:""}${x(r,n)}:${x(i)}`}async function S(t){const n=await crypto.subtle.digest("SHA-256",t);return[...new Uint8Array(n)].map((t=>t.toString(16).padStart(2,"0"))).join("")}let W=0;async function N(t,n){try{delete t.needsMetadata,await async function(t){const{artist:n,title:e,album:r,duration:a,picture:o}=await async function(t){return O(t,await i(t,24576))}(t.audioTrack);t.title=e||t.name,t.artist=n||"",t.album=r||"",t.durationInSeconds=a,t.duration=F(a),postMessage({type:"track",track:t}),o&&(t.picture=o)}(t),async function(t,n){if(t.picture)try{await async function(t){const{picture:n}=t;if(delete t.picture,"OffscreenCanvas"in self){const[e,r]=await Promise.all([z(n),_(n)]);t.artworkId=e,postMessage({type:"track",track:t,artwork:{original:{blob:n},small:{blob:r},type:n.type}})}else{const e=await z(n);t.artworkId=e,postMessage({type:"image",image:{hash:e,file:n},done:W<=1,track:t})}}(t)}catch(t){console.log(t)}!n||t.album&&t.picture||await async function(t){try{const e="https://ws.audioscrobbler.com/2.0/",r=`?method=track.getInfo&api_key=${"3e8d48b3277c21bc77965345f5faf18c"}&artist=${t.artist}&track=${t.title}&format=json`,i=await fetch(e+r).then((t=>t.json()));if(i.track&&i.track.album){const{title:e,image:r}=i.track.album;let a=!1,o=null;if(!t.album&&e&&(t.album=e,a=!0),!t.artworkId&&r){const e=r[r.length-1]["#text"];if(e){const{origin:r,pathname:i}=new URL(e),[a]=i.split("/").slice(-1),c=`${r}/i/u/500x500/${a}`,u=function(t){const n=t.split(".").at(-1);if("jpg"===n)return"image/jpeg";return`image/${n}`}(a),s=await(n=c,S(new TextEncoder("utf-8").encode(n).buffer));t.artworkId=s,o={original:{url:c},small:{url:e},type:u}}}(a||o)&&postMessage({type:"track",track:t,artwork:o})}}catch(t){console.log(t)}var n}(t);W-=1,W<=0&&postMessage({type:"track",track:t,done:!0})}(t,n)}catch(n){console.log(n),W-=1,W<=0&&postMessage({type:"track",track:t,done:!0})}}async function _(t){const n=await createImageBitmap(t);let{width:e,height:r}=n;const i=Math.min(e,r,256);e<r?(r=i/n.width*r,e=i):(e=i/n.height*e,r=i);const a=new OffscreenCanvas(e,r);return a.getContext("2d").drawImage(n,0,0,e,r),a.convertToBlob({type:t.type,quality:.72})}async function z(t){if(!t)return;return S(await t.arrayBuffer())}onmessage=function(t){const{payload:n,checkLastFm:e}=t.data;Array.isArray(n)?async function(t,n){W=t.length;for(const e of t)await N(e,n)}(n,e):(W=1,N(n,e))}}}]);
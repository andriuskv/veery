(window.webpackJsonp=window.webpackJsonp||[]).push([[0],{34:function(n,t,r){"use strict";function e(n,t){const r=new Uint8Array(n.length+t.length);return r.set(n),r.set(t,n.length),r}function o(n){const t=window.atob(n),r=new Uint8Array(t.length);for(let n=0;n<t.length;n++)r[n]=t.charCodeAt(n);return r}function i(n,t,r){return new Uint8Array(n.slice(t,t+r))}function c(n,t,r){return n.slice(t,t+r)}function u(n){return n[0]|n[1]<<8|n[2]<<16|n[3]<<24}function s(n,t){const r=c(n,t,4);return r[1]<<16|r[2]<<8|r[3]}function f(n){let t=4;const r=s(n,t),e=c(n,t+=4,r),o=String.fromCharCode(...e),i=s(n,t+=r);t+=4,t+=i;const u=s(n,t+=16);return t+=4,new Blob([c(n,t,u)],{type:o})}function a(n){return{sampleRate:u(c(n,12,4))}}function l(n,t){const r={},e=new TextDecoder("utf-8"),i=u(c(n,t,4));t+=4;let s=u(c(n,t+=i,4));for(t+=4;s;){const i=u(c(n,t,4));t+=4;const a=e.decode(c(n,t,i)).split("="),l=a[0],w=a[1];"METADATA_BLOCK_PICTURE"===l?r.picture=f(o(w)):r[l.toLowerCase()]=w,t+=i,s-=1}return r}function w(n){const t=String.fromCharCode(...n.slice(0,5));if("OpusH"===t)return a(n);if("OpusT"===t)return l(n,8);if("vorb"===t)return a(n);if("vorb"===t)return l(n,7);throw new Error("Unknown type")}r.r(t),r(7),t.default=function(n){return new Promise(t=>{const r=new FileReader;r.onloadend=function(n){const r=n.target.result,o=i(r,0,4);if("OggS"!==String.fromCharCode(...o))throw new Error("Not a valid Opus/Ogg file.");t(function(n,t){const r={};let o=2,c=new Uint8Array;for(;t<n.byteLength;){const s=i(n,t+=5,1);if(t+=1,4===s[0]){const e=u(i(n,t,8));return r.duration=Math.floor(e/r.sampleRate),r}const f=i(n,t+=20,1)[0],a=i(n,t+=1,f),l=a[a.length-1];let d=0;t+=f;for(let n=0;n<f;n++)d+=a[n];o&&(c=e(c,i(n,t,d)),d%255==0&&l||(o-=1,Object.assign(r,w(c)),c=new Uint8Array)),t+=d}}(r,0))},r.readAsArrayBuffer(n)})}}}]);
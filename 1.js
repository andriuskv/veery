(window.webpackJsonp=window.webpackJsonp||[]).push([[1],{61:function(e,n,t){"use strict";function r(e){return e[1]<<16|e[2]<<8|e[3]}function o(e,n,t){return new Uint8Array(e.slice(n,n+t))}function i(e){return e[0]|e[1]<<8|e[2]<<16|e[3]<<24}function c(e,n){let t=0;const r=new TextDecoder("utf-8"),o=i(e.slice(t,t+4));t+=4,t+=o;let c=i(e.slice(t,t+4));for(t+=4;c;){const o=i(e.slice(t,t+4));t+=4;const s=r.decode(e.slice(t,t+o)).split("="),u=s[0],l=s[1];n[u.toLowerCase()]=l,t+=o,c-=1}return n}function s(e,n){return r(e.slice(n,n+4))}function u(e){return e.reduce((e,n)=>(e<<8)+n,0)}function l(e,n){let t=4;const r=s(e,t);t+=4;const o=e.slice(t,t+r),i=String.fromCharCode(...o),c=s(e,t+=r);t+=4,t+=c;const u=s(e,t+=16);return t+=4,n.picture=new Blob([e.slice(t,t+u)],{type:i}),n}t.r(n),t(17),n.default=function(e){return new Promise(n=>{const t=Math.min(32768,e.size),i=new FileReader;i.onloadend=function(i){const s=i.target.result,f=o(s,0,4);if("fLaC"!==String.fromCharCode(...f))throw new Error("Not a valid flac file.");n(function e(n,t,i,s,f){let a=!1;for(;!a;){const d=o(t,s,4),w=r(d),p=d[0],h=127&p;if(a=128==(128&p),(s+=4)+w>i)return new Promise(t=>{i+=s+w+4;const r=n.slice(s-4,i),o=new FileReader;o.onloadend=function(n){e(r,n.target.result,i,0,f).then(t)},o.readAsArrayBuffer(r)});if(0===h){const e=o(t,s,w),n=u(e.slice(10,13))>>4,r=u([15&e[13],...e.slice(14,18)]);n&&(f.duration=Math.floor(r/n))}else if(4===h){const e=o(t,s,w);f=c(e,f)}else if(6===h){const e=o(t,s,w);f=l(e,f)}s+=w}return Promise.resolve(f)}(e,s,t,4,{}))},i.readAsArrayBuffer(e.slice(0,t))})}}}]);
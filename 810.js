"use strict";(globalThis.webpackChunkveery=globalThis.webpackChunkveery||[]).push([[810],{6810:(e,t,n)=>{n.r(t),n.d(t,{collectUniqueTracks:()=>s,readItems:()=>d,updateTrackWithMetadata:()=>u,updateTracksWithMetadata:()=>l});var a=n(353),r=n(5585);let o=null,i=null;function s(e,t){return e.reduce(((e,n)=>{if(!n.type.startsWith("audio"))return e;const r=(o=n.name.trim()).slice(0,o.lastIndexOf("."));var o;return t.some((e=>e.name===r))||e.push({needsMetadata:!0,id:(0,a.zO)(),audioTrack:n,name:r,title:r,artist:"",album:"",durationInSeconds:0,duration:"",player:"native"}),e}),[])}function c(e,t){return new Promise((s=>{let c=null;"one"===t?(o||(o=new Worker(new URL(n.p+n.u(501),n.b),{type:void 0})),c=o):"many"===t&&(i||(i=new Worker(new URL(n.p+n.u(702),n.b),{type:void 0})),c=i),c.addEventListener("message",function(e){return function t({target:n,data:o}){const{type:i,track:s,artwork:c,done:u=!1}=o;"track"===i?((0,a.hb)("track",{track:s,done:u}),c&&(0,r.Qs)(s.artworkId,c),u&&(n.removeEventListener("message",t),e(s))):"image"===i&&function(e,{hash:t,file:n},o){const i=new Image,s=document.createElement("canvas"),c=s.getContext("2d");i.crossOrigin="anonymous",i.onload=function(){let{width:u,height:l}=i;const d=Math.min(u,l,256);u<l?(l=d/i.width*l,u=d):(u=d/i.height*u,l=d),s.width=u,s.height=l,c.drawImage(i,0,0,u,l),s.toBlob((i=>{(0,r.Qs)(t,{original:{blob:n},small:{blob:i},type:n.type}),(0,a.hb)("track",{track:e,done:o})}),n.type,.72),URL.revokeObjectURL(i.src)},i.src=URL.createObjectURL(n)}(s,o.image,u)}}(s)),c.postMessage({payload:e,checkLastFm:"true"===localStorage.getItem("use-last.fm")})}))}function u(e){return c(e,"one")}function l(e){return c(e,"many")}async function d(e){const t=[],n=[];for(const a of e)if("file"===a.kind&&(""===a.type||a.type.startsWith("audio"))){const e=a.webkitGetAsEntry();e.isDirectory?n.push(h(e)):e.isFile&&t.push(f(e))}const a=await Promise.all([...n,...t]);let r=[];for(const e of a)Array.isArray(e)?r=r.concat(e):r.push(e);return r}function h(e){return new Promise((t=>{const n=e.createReader();let a=[];!function e(){n.readEntries((async n=>{if(n.length>0){for(const e of n)if(e.isFile){const t=await f(e);t.type.startsWith("audio")&&a.push(t)}else if(e.isDirectory){const t=await h(e);a=a.concat(t)}e()}else t(a)}))}()}))}function f(e){return new Promise((t=>{e.file(t)}))}}}]);
"use strict";(globalThis.webpackChunkveery=globalThis.webpackChunkveery||[]).push([[746],{746:(e,a,l)=>{l.r(a),l.d(a,{default:()=>r});var s=l(540),i=l(295),n=l(244),t=l(848);const r=function({queueVisible:e,youtubePlayerMode:a,showIndicator:l}){const{paused:r,activeTrack:o,togglePlay:c}=(0,i.F)(),u=(0,s.useRef)(null),d=(0,s.useRef)(!1),{isPlaceholder:y,small:p,original:f}=(0,n.TT)(o.artworkId);return(0,s.useLayoutEffect)((()=>{const e=u.current;if(e)return e.style.opacity=0,e.style.transition="none",y?(e.classList.remove("shadow"),e.style.opacity=1):d.current?e.style.opacity=1:e.onload=function(){e.classList.add("shadow"),e.style.transition="0.2s opacity",e.style.opacity=1},()=>{d.current=f.url===e.src,e.onload=null}}),[o,a]),"maximized"===a?null:(0,t.jsxs)("div",{className:`now-playing${e?" queue-visible":""}${y?" placeholder":""}`,children:[(0,t.jsx)("div",{className:"now-playing-background",style:y?{}:{"--background-url":`url(${p.url})`}}),(0,t.jsx)("div",{className:"now-playing-artwork-container"+("mini"===a?" hidden":""),children:(0,t.jsx)("img",{src:f.url,className:"now-playing-artwork",ref:u,onClick:function(){c(),"off"===a&&l({iconId:r?"play":"pause"})},alt:"",draggable:"false"})}),(0,t.jsxs)("div",{className:"now-playing-info",children:[(0,t.jsx)("div",{className:"track-info-item track-title multiline",children:o.title}),o.artist?(0,t.jsx)("div",{className:"track-info-item",children:o.artist}):null]})]})}}}]);
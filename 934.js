"use strict";(globalThis.webpackChunkveery=globalThis.webpackChunkveery||[]).push([[934],{934:(e,a,l)=>{l.r(a),l.d(a,{default:()=>r});var s=l(294),i=l(29),t=l(585),n=l(893);const r=function({queueVisible:e,youtubePlayerVisible:a,showIndicator:l}){const{paused:r,activeTrack:c,togglePlay:o}=(0,i.n)(),u=(0,s.useRef)(null),d=(0,s.useRef)(!1),{isPlaceholder:y,small:p,original:h}=(0,t.eA)(c.artworkId);return(0,s.useLayoutEffect)((()=>{const e=u.current;return e.style.opacity=0,e.style.transition="none",y?(e.classList.remove("shadow"),e.style.opacity=1):d.current?e.style.opacity=1:e.onload=function(){e.classList.add("shadow"),e.style.transition="0.2s opacity",e.style.opacity=1},()=>{d.current=h.url===e.src,e.onload=null}}),[c]),(0,n.jsxs)("div",{className:`now-playing${e?" queue-visible":""}${y?" placeholder":""}`,children:[(0,n.jsx)("div",{className:"now-playing-background",style:y?{}:{"--background-url":`url(${p.url})`}}),(0,n.jsx)("div",{className:"now-playing-artwork-container"+(a?" hidden":""),children:(0,n.jsx)("img",{src:h.url,className:"now-playing-artwork",ref:u,onClick:function(){o(),a||l({iconId:r?"play":"pause"})},alt:""})}),(0,n.jsxs)("div",{className:"now-playing-info",children:[(0,n.jsx)("div",{className:"track-info-item track-title multiline",children:c.title}),c.artist?(0,n.jsx)("div",{className:"track-info-item",children:c.artist}):null]})]})}}}]);
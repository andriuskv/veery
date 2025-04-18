"use strict";(globalThis.webpackChunkveery=globalThis.webpackChunkveery||[]).push([[381],{202:(e,t,s)=>{s.d(t,{A:()=>l});var n=s(400),i=s(123),a=s(848);const l=function({playlist:e,playlistRef:t,updatePlaylist:s,hideMinimal:l=!1}){function o(i){const a=i.target.value;s(e.id,{viewMode:a}),(0,n.ON)(t.current,{...e,viewMode:a})}return(0,a.jsxs)("ul",{className:"view-modes",children:[l?null:(0,a.jsx)("li",{className:"view-mode-container",children:(0,a.jsxs)("label",{children:[(0,a.jsx)("input",{type:"radio",className:"sr-only view-mode-radio-input",name:"view-mode",value:"minimal",checked:"minimal"===e.viewMode,onChange:o}),(0,a.jsx)(i.A,{id:"minimal",className:"btn icon-btn view-mode-icon",title:"Minimal"})]})}),(0,a.jsx)("li",{className:"view-mode-container",children:(0,a.jsxs)("label",{children:[(0,a.jsx)("input",{type:"radio",className:"sr-only view-mode-radio-input",name:"view-mode",value:"compact",checked:"compact"===e.viewMode,onChange:o}),(0,a.jsx)(i.A,{id:"compact",className:"btn icon-btn view-mode-icon",title:"Compact"})]})}),(0,a.jsx)("li",{className:"view-mode-container",children:(0,a.jsxs)("label",{children:[(0,a.jsx)("input",{type:"radio",className:"sr-only view-mode-radio-input",name:"view-mode",value:"grid",checked:"grid"===e.viewMode,onChange:o}),(0,a.jsx)(i.A,{id:"grid",className:"btn icon-btn view-mode-icon",title:"Grid"})]})})]})}},361:(e,t,s)=>{s.d(t,{A:()=>c});var n=s(540),i=s(568),a=s(400),l=s(123),o=s(527),r=s(848);const c=function({playlist:e,playlistRef:t,updateSortedPlaylist:s}){const[c,d]=(0,n.useState)({sortBy:e.sortBy,sortOrder:e.sortOrder});function u({target:e}){p(c.sortBy,Number(e.value))}function p(n,l=1){n===c.sortBy&&l===c.sortOrder||((0,i.HX)({...e,sortBy:n,sortOrder:l}),s({sortBy:n,sortOrder:l}),d({sortBy:n,sortOrder:l}),(0,a.ON)(t.current,e))}return(0,n.useEffect)((()=>{d({sortBy:e.sortBy,sortOrder:e.sortOrder})}),[e]),(0,r.jsxs)(o.A,{toggle:{body:(0,r.jsxs)(r.Fragment,{children:[(0,r.jsx)(l.A,{id:"sort"}),(0,r.jsx)("span",{children:"Sort"})]}),className:"icon-text-btn sort-dropdown-toggle-btn"},container:{className:"sort-dropdown-container"},children:[(0,r.jsxs)("div",{className:"sort-dropdown-group",children:[(0,r.jsx)("button",{className:"btn text-btn dropdown-btn sort-dropdown-btn"+("index"===c.sortBy?" active":""),onClick:()=>p("index"),children:"Index"}),(0,r.jsx)("button",{className:"btn text-btn dropdown-btn sort-dropdown-btn"+("title"===c.sortBy?" active":""),onClick:()=>p("title"),children:"Title"}),(0,r.jsx)("button",{className:"btn text-btn dropdown-btn sort-dropdown-btn"+("artist"===c.sortBy?" active":""),onClick:()=>p("artist"),children:"Artist"}),(0,r.jsx)("button",{className:"btn text-btn dropdown-btn sort-dropdown-btn"+("album"===c.sortBy?" active":""),onClick:()=>p("album"),children:"Album"}),(0,r.jsx)("button",{className:"btn text-btn dropdown-btn sort-dropdown-btn"+("duration"===c.sortBy?" active":""),onClick:()=>p("duration"),children:"Duration"}),"local-files"===e.id?(0,r.jsx)("button",{className:"btn text-btn dropdown-btn sort-dropdown-btn"+("date"===c.sortBy?" active":""),onClick:()=>p("date"),children:"Date"}):null]}),(0,r.jsxs)("div",{className:"sort-dropdown-group",children:[(0,r.jsxs)("label",{className:"dropdown-btn sort-dropdown-radio",children:[(0,r.jsx)("input",{type:"radio",className:"sr-only radio-input",name:"sortOrder",value:"1",onChange:u,checked:1===c.sortOrder}),(0,r.jsx)("div",{className:"radio"}),(0,r.jsx)("span",{className:"radio-label",children:"Ascending"})]}),(0,r.jsxs)("label",{className:"dropdown-btn sort-dropdown-radio",children:[(0,r.jsx)("input",{type:"radio",className:"sr-only radio-input",onChange:u,name:"sortOrder",value:"-1",checked:-1===c.sortOrder}),(0,r.jsx)("div",{className:"radio"}),(0,r.jsx)("span",{className:"radio-label",children:"Descending"})]})]})]})}},381:(e,t,s)=>{s.r(t),s.d(t,{default:()=>m});var n=s(540),i=s(400),a=s(440),l=s(584),o=s(295),r=s(123),c=s(202),d=s(361),u=s(489),p=s(848);const m=function(){const{playlists:e,createPlaylist:t,updatePlaylist:s,removePlaylist:m}=(0,l.n)(),{activePlaylistId:h,togglePlay:b,playAtIndex:x}=(0,o.F)(),[f,y]=(0,n.useState)(""),[v,w]=(0,n.useState)([]),[j,N]=(0,n.useState)(!1),k=(0,n.useRef)(null),g=(0,n.useRef)(0),A=(0,n.useMemo)((()=>window.matchMedia("(max-width: 1024px)").matches?"grid":"compact"),[]),C=e.search,O=(0,n.useRef)(null);function I(){clearTimeout(g.current),y(""),w([]),N(!1)}return(0,n.useEffect)((()=>(O.current=JSON.parse(localStorage.getItem("search"))||null,()=>{m("search"),(0,i.kT)()})),[]),(0,n.useLayoutEffect)((()=>{if(v.length){const e=C?s("search",{tracks:v}):t({id:"search",tracks:v,viewMode:A,...O.current});(0,i.ON)(k.current,e)}else k.current&&(k.current.innerHTML=null,(0,i.kT)(),m("search"))}),[v]),e?(0,p.jsxs)("div",{className:"search",children:[(0,p.jsxs)("div",{className:"search-top",children:[(0,p.jsx)("h2",{className:"search-title",children:"Search"}),(0,p.jsxs)("div",{className:"search-form",children:[(0,p.jsxs)("div",{className:"search-form-input-container",children:[(0,p.jsx)("input",{type:"text",className:"input search-form-input",onChange:function({target:t}){y(t.value),N(!0),clearTimeout(g.current),g.current=setTimeout((()=>{t.value?function(t){let s=[];for(const t of Object.values(e))"search"!==t.id&&(s=s.concat(t.tracks.map((e=>({...e,playlistId:t.id,playlistIndex:e.index})))));const n=new RegExp(`(${t})`,"i"),i=s.filter((e=>n.test(e.title)||n.test(e.artist)||n.test(e.album))).map(((e,t)=>({...e,index:t})));w(i),N(!1)}(t.value):I()}),400)},value:f,placeholder:"Enter search term"}),f&&(0,p.jsx)("button",{type:"button",className:"btn icon-btn search-form-input-clear-btn",onClick:I,title:"Clear",children:(0,p.jsx)(r.A,{id:"close",className:"search-form-input-clear-btn-icon"})})]}),(0,p.jsxs)("button",{className:"btn icon-text-btn search-from-submit-btn",children:[(0,p.jsx)(r.A,{id:"search"}),(0,p.jsx)("span",{children:"Search"})]})]})]}),(0,p.jsxs)("div",{className:"search-playlist-container",children:[C?(0,p.jsxs)("div",{className:"search-playlist-toolbar",children:[(0,p.jsx)(c.A,{playlist:C,playlistRef:k,updatePlaylist:s,hideMinimal:!0}),(0,p.jsx)(u.A,{playlist:C,playlistRef:k}),(0,p.jsx)(d.A,{playlist:C,playlistRef:k,updateSortedPlaylist:function({sortBy:e,sortOrder:t}){s("search",{sortBy:e,sortOrder:t})}})]}):null,f?v.length?null:j?(0,p.jsx)(r.A,{id:"spinner",className:"search-playlist-spinner"}):(0,p.jsx)("p",{className:"search-playlist-message",children:"No matches found"}):v.length?null:(0,p.jsx)("p",{className:"search-playlist-message",children:"Search for tracks across all playlists"}),(0,p.jsx)("div",{className:"playlist-view",ref:k,onClick:function({target:e,detail:t}){const s=e.closest(".track");if(s)if(2===t){const e=C.tracks[s.getAttribute("data-index")];x(e.playlistIndex,e.playlistId)}else{if(!e.closest(".artwork-btn"))return;const t=C.tracks[s.getAttribute("data-index")],n=(0,a.yu)();n&&h===t.playlistId&&t.playlistIndex===n.index?b():x(t.playlistIndex,t.playlistId)}}})]})]}):null}},489:(e,t,s)=>{s.d(t,{A:()=>b});var n=s(540),i=s(806),a=s(568),l=s(955),o=s(400),r=s(440),c=s(584),d=s(295),u=s(719),p=s(123),m=s(527),h=s(848);const b=function({playlist:e}){const{updatePlaylist:t,updatePlaylists:s}=(0,c.n)(),{activePlaylistId:b,activeTrack:x}=(0,d.F)(),{enqueueTracks:f}=(0,u.x)(),[y,v]=(0,n.useState)(!1);function w(t){const s=t.ctrlKey||t.shiftKey||t.altKey||t.metaKey,{target:n,key:i}=t;if(!(n instanceof HTMLInputElement&&"text"===n.type))if("Delete"!==i||s){if("a"===i&&t.ctrlKey&&(t.preventDefault(),e.tracks.length)){const e=(0,l.C_)();v(e)}}else g(),v(!1)}function j({detail:e}){v(e)}function N(){v(!1)}function k(){(0,l.gE)(),N()}function g(){if("search"===e.id)return void function(){const t=(0,l.lV)(),n=(0,l.jk)(t),i=n[0],c=[],d={};let u=!1;for(const t of e.tracks)n.includes(t.index)||c.push(t);for(const t of n){const s=e.tracks[t];d[s.playlistId]?d[s.playlistId].push(s.playlistIndex):d[s.playlistId]=[s.playlistIndex]}const p={};for(const e in d){const t=(0,a.LR)(e),s=[],n=[];e===b&&(u=!0);for(const t of d[e])n.push(t);for(const e of t.tracks)n.includes(e.index)||s.push(e);p[e]=(0,a.i5)(e,{tracks:(0,a.Ol)(s)})}if(p.search=(0,a.i5)("search",{tracks:(0,a.Ol)(c)}),s(p),(0,l.b9)(t,e),(0,l.Xk)(i),u){(0,r.Gx)(b);const e=(0,r.yu)();e&&(0,o.lK)(e.index,b)}N()}();const n=(0,l.lV)(),i=(0,l.jk)(n),c=i[0],d=[];for(const t of e.tracks)i.includes(t.index)||d.push(t);if(t(e.id,{tracks:(0,a.Ol)(d)}),(0,l.b9)(n,e),(0,l.Xk)(c),e.id===b){(0,r.Gx)(e.id);const t=(0,r.yu)();t&&(0,o.lK)(t.index,e.id)}N()}return(0,n.useEffect)((()=>(window.addEventListener("keydown",w),window.addEventListener("selection",j),()=>{window.removeEventListener("keydown",w),window.removeEventListener("selection",j)})),[e,b]),y?(0,h.jsxs)(m.A,{container:{className:"js-selection-btn"},children:[x?(0,h.jsxs)("button",{className:"btn icon-text-btn dropdown-btn",onClick:function(){const t=(0,l.lV)(),s=(0,l.jk)(t),n=[];for(const t of s)n.push({id:(0,i.$f)(),playlistId:e.id,track:e.tracks[t]});f(n),k()},children:[(0,h.jsx)(p.A,{id:"playlist-add"}),(0,h.jsx)("span",{children:"Add to queue"})]}):null,(0,h.jsxs)("button",{className:"btn icon-text-btn dropdown-btn",onClick:g,children:[(0,h.jsx)(p.A,{id:"trash"}),(0,h.jsx)("span",{children:"Remove selected"})]}),(0,h.jsxs)("button",{className:"btn icon-text-btn dropdown-btn",onClick:k,children:[(0,h.jsx)(p.A,{id:"close"}),(0,h.jsx)("span",{children:"Clear selection"})]})]}):null}},527:(e,t,s)=>{s.d(t,{A:()=>o});var n=s(540),i=s(806),a=s(123),l=s(848);const o=function({container:e,toggle:t={},body:s,children:o}){const[r,c]=(0,n.useState)({id:(0,i.$f)()}),d=(0,n.useCallback)((function({target:e}){const t=e.closest(".dropdown-container");let s=!0;t?.id===r.id&&(s=!e.closest("[data-dropdown-keep]")&&(e.closest("a")||e.closest(".dropdown-btn")));s&&(u.current&&c({id:r.id,visible:!1,reveal:!1}),window.removeEventListener("click",d))}),[r.id]),u=(0,n.useRef)(!1),p=(0,n.useRef)(null);return(0,n.useEffect)((()=>(u.current=!0,()=>{u.current=!1,window.removeEventListener("click",d)})),[d]),(0,n.useLayoutEffect)((()=>{if(r.reveal){let e=!1;if(r.data){const t=p.current.getBoundingClientRect().height+8;r.data.bottom+t>r.data.height&&r.data.top>t&&(e=!0)}c({...r,onTop:e,visible:!0})}}),[r.reveal]),(0,l.jsxs)("div",{id:r.id,className:`dropdown-container${e?` ${e.className}`:""}${r.visible?" visible":""}`,children:[(0,l.jsx)("button",{className:`btn icon-btn${t.className?` ${t.className}`:""}${r.visible?" active":""}`,onClick:function({currentTarget:e}){let t=null;if(r.visible)window.removeEventListener("click",d);else{const s=e.parentElement,n=function(e){for(;e&&!e.hasAttribute("data-dropdown-parent");)e=e.parentElement;return e}(s);n&&(n.style.position="relative",t={top:s.offsetTop,bottom:s.offsetTop+s.offsetHeight,height:n.scrollTop+n.clientHeight},n.style.position=""),window.addEventListener("click",d)}c({id:r.id,visible:!1,reveal:!r.visible,data:t,onTop:!1})},title:t.title||"More",children:t.body?t.body:(0,l.jsx)(a.A,{id:t.iconId||"vertical-dots",className:"dropdown-toggle-btn-icon"})}),(0,l.jsx)("div",{ref:p,className:`container dropdown${s?` ${s.className}`:""}${r.reveal?" reveal":""}${r.visible?" visible":""}${r.onTop?" top":""}`,children:o})]})}}}]);
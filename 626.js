"use strict";(globalThis.webpackChunkveery=globalThis.webpackChunkveery||[]).push([[626],{202:(e,t,s)=>{s.d(t,{A:()=>a});var n=s(400),i=s(123),o=s(848);const a=function({playlist:e,playlistRef:t,updatePlaylist:s,hideMinimal:a=!1}){function l(i){const o=i.target.value;s(e.id,{viewMode:o}),(0,n.ON)(t.current,{...e,viewMode:o})}return(0,o.jsxs)("ul",{className:"view-modes",children:[a?null:(0,o.jsx)("li",{className:"view-mode-container",children:(0,o.jsxs)("label",{children:[(0,o.jsx)("input",{type:"radio",className:"sr-only view-mode-radio-input",name:"view-mode",value:"minimal",checked:"minimal"===e.viewMode,onChange:l}),(0,o.jsx)(i.A,{id:"minimal",className:"btn icon-btn view-mode-icon",title:"Minimal"})]})}),(0,o.jsx)("li",{className:"view-mode-container",children:(0,o.jsxs)("label",{children:[(0,o.jsx)("input",{type:"radio",className:"sr-only view-mode-radio-input",name:"view-mode",value:"compact",checked:"compact"===e.viewMode,onChange:l}),(0,o.jsx)(i.A,{id:"compact",className:"btn icon-btn view-mode-icon",title:"Compact"})]})}),(0,o.jsx)("li",{className:"view-mode-container",children:(0,o.jsxs)("label",{children:[(0,o.jsx)("input",{type:"radio",className:"sr-only view-mode-radio-input",name:"view-mode",value:"grid",checked:"grid"===e.viewMode,onChange:l}),(0,o.jsx)(i.A,{id:"grid",className:"btn icon-btn view-mode-icon",title:"Grid"})]})})]})}},361:(e,t,s)=>{s.d(t,{A:()=>c});var n=s(540),i=s(568),o=s(400),a=s(123),l=s(527),r=s(848);const c=function({playlist:e,playlistRef:t,updateSortedPlaylist:s}){const[c,d]=(0,n.useState)({sortBy:e.sortBy,sortOrder:e.sortOrder});function u({target:e}){p(c.sortBy,Number(e.value))}function p(n,a=1){n===c.sortBy&&a===c.sortOrder||((0,i.HX)({...e,sortBy:n,sortOrder:a}),s({sortBy:n,sortOrder:a}),d({sortBy:n,sortOrder:a}),(0,o.ON)(t.current,e))}return(0,n.useEffect)((()=>{d({sortBy:e.sortBy,sortOrder:e.sortOrder})}),[e]),(0,r.jsxs)(l.A,{toggle:{body:(0,r.jsxs)(r.Fragment,{children:[(0,r.jsx)(a.A,{id:"sort"}),(0,r.jsx)("span",{children:"Sort"})]}),className:"icon-text-btn sort-dropdown-toggle-btn"},container:{className:"sort-dropdown-container"},children:[(0,r.jsxs)("div",{className:"sort-dropdown-group",children:[(0,r.jsx)("button",{className:"btn text-btn dropdown-btn sort-dropdown-btn"+("index"===c.sortBy?" active":""),onClick:()=>p("index"),children:"Index"}),(0,r.jsx)("button",{className:"btn text-btn dropdown-btn sort-dropdown-btn"+("title"===c.sortBy?" active":""),onClick:()=>p("title"),children:"Title"}),(0,r.jsx)("button",{className:"btn text-btn dropdown-btn sort-dropdown-btn"+("artist"===c.sortBy?" active":""),onClick:()=>p("artist"),children:"Artist"}),(0,r.jsx)("button",{className:"btn text-btn dropdown-btn sort-dropdown-btn"+("album"===c.sortBy?" active":""),onClick:()=>p("album"),children:"Album"}),(0,r.jsx)("button",{className:"btn text-btn dropdown-btn sort-dropdown-btn"+("duration"===c.sortBy?" active":""),onClick:()=>p("duration"),children:"Duration"}),"local-files"===e.id?(0,r.jsx)("button",{className:"btn text-btn dropdown-btn sort-dropdown-btn"+("date"===c.sortBy?" active":""),onClick:()=>p("date"),children:"Date"}):null]}),(0,r.jsxs)("div",{className:"sort-dropdown-group",children:[(0,r.jsxs)("label",{className:"dropdown-btn sort-dropdown-radio",children:[(0,r.jsx)("input",{type:"radio",className:"sr-only radio-input",name:"sortOrder",value:"1",onChange:u,checked:1===c.sortOrder}),(0,r.jsx)("div",{className:"radio"}),(0,r.jsx)("span",{className:"radio-label",children:"Ascending"})]}),(0,r.jsxs)("label",{className:"dropdown-btn sort-dropdown-radio",children:[(0,r.jsx)("input",{type:"radio",className:"sr-only radio-input",onChange:u,name:"sortOrder",value:"-1",checked:-1===c.sortOrder}),(0,r.jsx)("div",{className:"radio"}),(0,r.jsx)("span",{className:"radio-label",children:"Descending"})]})]})]})}},489:(e,t,s)=>{s.d(t,{A:()=>y});var n=s(540),i=s(806),o=s(568),a=s(955),l=s(400),r=s(440),c=s(584),d=s(295),u=s(719),p=s(123),b=s(527),m=s(848);const y=function({playlist:e}){const{updatePlaylist:t,updatePlaylists:s}=(0,c.n)(),{activePlaylistId:y,activeTrack:f}=(0,d.F)(),{enqueueTracks:x}=(0,u.x)(),[v,h]=(0,n.useState)(!1);function w(t){const s=t.ctrlKey||t.shiftKey||t.altKey||t.metaKey,{target:n,key:i}=t;if(!(n instanceof HTMLInputElement&&"text"===n.type))if("Delete"!==i||s){if("a"===i&&t.ctrlKey&&(t.preventDefault(),e.tracks.length)){const e=(0,a.C_)();h(e)}}else k(),h(!1)}function j({detail:e}){h(e)}function g(){h(!1)}function N(){(0,a.gE)(),g()}function k(){if("search"===e.id)return void function(){const t=(0,a.lV)(),n=(0,a.jk)(t),i=n[0],c=[],d={};let u=!1;for(const t of e.tracks)n.includes(t.index)||c.push(t);for(const t of n){const s=e.tracks[t];d[s.playlistId]?d[s.playlistId].push(s.playlistIndex):d[s.playlistId]=[s.playlistIndex]}const p={};for(const e in d){const t=(0,o.LR)(e),s=[],n=[];e===y&&(u=!0);for(const t of d[e])n.push(t);for(const e of t.tracks)n.includes(e.index)||s.push(e);p[e]=(0,o.i5)(e,{tracks:(0,o.Ol)(s)})}if(p.search=(0,o.i5)("search",{tracks:(0,o.Ol)(c)}),s(p),(0,a.b9)(t,e),(0,a.Xk)(i),u){(0,r.Gx)(y);const e=(0,r.yu)();e&&(0,l.lK)(e.index,y)}g()}();const n=(0,a.lV)(),i=(0,a.jk)(n),c=i[0],d=[];for(const t of e.tracks)i.includes(t.index)||d.push(t);if(t(e.id,{tracks:(0,o.Ol)(d)}),(0,a.b9)(n,e),(0,a.Xk)(c),e.id===y){(0,r.Gx)(e.id);const t=(0,r.yu)();t&&(0,l.lK)(t.index,e.id)}g()}return(0,n.useEffect)((()=>(window.addEventListener("keydown",w),window.addEventListener("selection",j),()=>{window.removeEventListener("keydown",w),window.removeEventListener("selection",j)})),[e,y]),v?(0,m.jsxs)(b.A,{container:{className:"js-selection-btn"},children:[f?(0,m.jsxs)("button",{className:"btn icon-text-btn dropdown-btn",onClick:function(){const t=(0,a.lV)(),s=(0,a.jk)(t),n=[];for(const t of s)n.push({id:(0,i.$f)(),playlistId:e.id,track:e.tracks[t]});x(n),N()},children:[(0,m.jsx)(p.A,{id:"playlist-add"}),(0,m.jsx)("span",{children:"Add to queue"})]}):null,(0,m.jsxs)("button",{className:"btn icon-text-btn dropdown-btn",onClick:k,children:[(0,m.jsx)(p.A,{id:"trash"}),(0,m.jsx)("span",{children:"Remove selected"})]}),(0,m.jsxs)("button",{className:"btn icon-text-btn dropdown-btn",onClick:N,children:[(0,m.jsx)(p.A,{id:"close"}),(0,m.jsx)("span",{children:"Clear selection"})]})]}):null}},527:(e,t,s)=>{s.d(t,{A:()=>l});var n=s(540),i=s(806),o=s(123),a=s(848);const l=function({container:e,toggle:t={},body:s,children:l}){const[r,c]=(0,n.useState)({id:(0,i.$f)()}),d=(0,n.useCallback)((function({target:e}){const t=e.closest(".dropdown-container");let s=!0;t?.id===r.id&&(s=!e.closest("[data-dropdown-keep]")&&(e.closest("a")||e.closest(".dropdown-btn")));s&&(u.current&&c({id:r.id,visible:!1,reveal:!1}),window.removeEventListener("click",d))}),[r.id]),u=(0,n.useRef)(!1),p=(0,n.useRef)(null);return(0,n.useEffect)((()=>(u.current=!0,()=>{u.current=!1,window.removeEventListener("click",d)})),[d]),(0,n.useLayoutEffect)((()=>{if(r.reveal){let e=!1;if(r.data){const t=p.current.getBoundingClientRect().height+8;r.data.bottom+t>r.data.height&&r.data.top>t&&(e=!0)}c({...r,onTop:e,visible:!0})}}),[r.reveal]),(0,a.jsxs)("div",{id:r.id,className:`dropdown-container${e?` ${e.className}`:""}${r.visible?" visible":""}`,children:[(0,a.jsx)("button",{className:`btn icon-btn${t.className?` ${t.className}`:""}${r.visible?" active":""}`,onClick:function({currentTarget:e}){let t=null;if(r.visible)window.removeEventListener("click",d);else{const s=e.parentElement,n=function(e){for(;e&&!e.hasAttribute("data-dropdown-parent");)e=e.parentElement;return e}(s);n&&(n.style.position="relative",t={top:s.offsetTop,bottom:s.offsetTop+s.offsetHeight,height:n.scrollTop+n.clientHeight},n.style.position=""),window.addEventListener("click",d)}c({id:r.id,visible:!1,reveal:!r.visible,data:t,onTop:!1})},title:t.title||"More",children:t.body?t.body:(0,a.jsx)(o.A,{id:t.iconId||"vertical-dots",className:"dropdown-toggle-btn-icon"})}),(0,a.jsx)("div",{ref:p,className:`container dropdown${s?` ${s.className}`:""}${r.reveal?" reveal":""}${r.visible?" visible":""}${r.onTop?" top":""}`,children:l})]})}},626:(e,t,s)=>{s.r(t),s.d(t,{default:()=>x});var n=s(540),i=s(580),o=s(400),a=s(955),l=s(440),r=s(584),c=s(295),d=s(202),u=s(361),p=s(489),b=s(123),m=s(848);const y=function({playlistId:e,setMessage:t}){const[s,i]=(0,n.useState)(!1),[a,l]=(0,n.useState)(""),r=(0,n.useRef)(0);function c(){i(!0)}function d(e){e.ctrlKey&&"f"===e.key&&(e.preventDefault(),s?u():c()),"Escape"===e.key&&s&&u()}function u(){l(""),t(""),i(!1),(0,o.gB)(""),(0,o.be)(e)}return(0,n.useEffect)((()=>()=>{l(""),i(!1),(0,o.gB)("")}),[e]),(0,n.useEffect)((()=>(window.addEventListener("keydown",d),()=>{window.removeEventListener("keydown",d)})),[s]),s?(0,m.jsx)("div",{className:"playlist-toolbar-search",children:(0,m.jsxs)("div",{className:"playlist-toolbar-search-input-container",children:[(0,m.jsx)(b.A,{id:"search",className:"playlist-toolbar-search-input-icon"}),(0,m.jsx)("input",{type:"text",className:"input playlist-toolbar-search-input",placeholder:"Search",value:a,onChange:function({target:s}){l(s.value),(0,o.gB)(s.value),clearTimeout(r.current),r.current=setTimeout((()=>{const n=(0,o.Bx)(s.value,e);t(n?"":"No tracks found")}),400)},onKeyDown:function({target:e,key:t}){"Enter"===t&&e.blur()},autoFocus:!0}),(0,m.jsx)("button",{className:"btn icon-btn playlist-toolbar-search-reset-btn",onClick:u,title:"Clear",children:(0,m.jsx)(b.A,{id:"close"})})]})}):(0,m.jsxs)("button",{className:"btn icon-text-btn playlist-toolbar-search-btn",onClick:c,children:[(0,m.jsx)(b.A,{id:"search"}),(0,m.jsx)("span",{children:"Search"})]})};const f=function({playlist:e,playlistRef:t,setMessage:s}){const{updatePlaylist:n}=(0,r.n)();return(0,m.jsxs)("div",{className:"playlist-toolbar",children:[(0,m.jsx)(d.A,{playlist:e,playlistRef:t,updatePlaylist:n}),(0,m.jsx)(y,{playlistId:e.id,setMessage:s}),(0,m.jsx)(p.A,{playlist:e}),(0,m.jsx)(u.A,{playlist:e,playlistRef:t,updateSortedPlaylist:function({sortBy:t,sortOrder:s}){(0,l.Gx)(e.id),n(e.id,{sortBy:t,sortOrder:s})}})]})};const x=function(){const{id:e}=(0,i.g)(),{playlists:t,updatePlaylist:s}=(0,r.n)(),{activePlaylistId:d,togglePlay:u,playAtIndex:p}=(0,c.F)(),[b,y]=(0,n.useState)(null),[x,v]=(0,n.useState)(!0),[h,w]=(0,n.useState)(""),j=(0,n.useRef)(!1),g=(0,n.useRef)(null);return(0,n.useEffect)((()=>()=>{j.current=!1,w(""),(0,o.kT)()}),[e]),(0,n.useEffect)((()=>{t&&(v(!1),y(t[e]))}),[t,e]),(0,n.useLayoutEffect)((()=>{if(b&&!j.current){if(window.matchMedia("(max-width: 700px)").matches&&"grid"!==b.viewMode)return void s(b.id,{viewMode:"grid"});(0,o.ON)(g.current,b),(0,o.Kr)(e),j.current=!0}}),[b]),!t||x?null:b?(0,m.jsxs)("div",{className:"playlist"+(b.tracks.length&&!h?"":" empty"),children:[(0,m.jsx)(f,{playlist:b,playlistRef:g,setMessage:w}),(0,m.jsx)("div",{className:"playlist-view",ref:g,onClick:function({target:t,detail:s}){const n=t.closest(".track");if(n)if(2===s){if((0,a.mc)())return;const t=Number(n.getAttribute("data-index"));p(t,e)}else{if(!t.closest(".artwork-btn"))return;const s=Number(n.getAttribute("data-index")),i=(0,l.yu)();i&&d===e&&s===i.index?u():p(s,e)}}}),b.tracks.length?h?(0,m.jsx)("p",{className:"playlist-message",children:h}):null:(0,m.jsx)("p",{className:"playlist-message",children:"Playlist is empty"})]}):(0,m.jsx)("div",{className:"playlist empty",children:(0,m.jsx)("p",{className:"playlist-message",children:"Playlist not found"})})}}}]);
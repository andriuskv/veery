"use strict";(globalThis.webpackChunkveery=globalThis.webpackChunkveery||[]).push([[455],{513:(e,t,s)=>{s.d(t,{Z:()=>r});var n=s(294),i=s(353),a=s(461),o=s(893);const r=function({container:e,toggle:t={},body:s,children:r}){const[l,c]=(0,n.useState)({id:(0,i.zO)()}),d=(0,n.useCallback)((function({target:e}){const t=e.closest(".dropdown-container");let s=!0;t?.id===l.id&&(s=!e.closest("[data-dropdown-keep]")&&(e.closest("a")||e.closest(".dropdown-btn")));s&&(u.current&&c({id:l.id,visible:!1,reveal:!1}),window.removeEventListener("click",d))}),[l.id]),u=(0,n.useRef)(!1),p=(0,n.useRef)(null);return(0,n.useEffect)((()=>(u.current=!0,()=>{u.current=!1,window.removeEventListener("click",d)})),[d]),(0,n.useLayoutEffect)((()=>{if(l.reveal){let e=!1;if(l.data){const t=p.current.getBoundingClientRect().height+8;l.data.bottom+t>l.data.height&&l.data.top>t&&(e=!0)}c({...l,onTop:e,visible:!0})}}),[l.reveal]),(0,o.jsxs)("div",{id:l.id,className:`dropdown-container${e?` ${e.className}`:""}${l.visible?" visible":""}`,children:[(0,o.jsx)("button",{className:`btn icon-btn${t.className?` ${t.className}`:""}${l.visible?" active":""}`,onClick:function({currentTarget:e}){let t=null;if(l.visible)window.removeEventListener("click",d);else{const s=e.parentElement,n=function(e){for(;e&&!e.hasAttribute("data-dropdown-parent");)e=e.parentElement;return e}(s);n&&(n.style.position="relative",t={top:s.offsetTop,bottom:s.offsetTop+s.offsetHeight,height:n.scrollTop+n.clientHeight},n.style.position=""),window.addEventListener("click",d)}c({id:l.id,visible:!1,reveal:!l.visible,data:t,onTop:!1})},title:t.title||"More",children:t.body?t.body:(0,o.jsx)(a.Z,{id:t.iconId||"vertical-dots",className:"dropdown-toggle-btn-icon"})}),(0,o.jsx)("div",{ref:p,className:`container dropdown${s?` ${s.className}`:""}${l.reveal?" reveal":""}${l.visible?" visible":""}${l.onTop?" top":""}`,children:r})]})}},455:(e,t,s)=>{s.r(t),s.d(t,{default:()=>h});var n=s(294),i=s(974),a=s(676),o=s(768),r=s(615),l=s(500),c=s(106),d=s(322),u=s(722),p=s(253),m=s(461),v=s(893);const b=function({playlistId:e,setMessage:t}){const[s,i]=(0,n.useState)(!1),[o,r]=(0,n.useState)(""),l=(0,n.useRef)(0);return(0,n.useEffect)((()=>()=>{r(""),i(!1),(0,a.gI)("")}),[e]),s?(0,v.jsx)("div",{className:"playlist-toolbar-search",children:(0,v.jsxs)("div",{className:"playlist-toolbar-search-input-container",children:[(0,v.jsx)(m.Z,{id:"search",className:"playlist-toolbar-search-input-icon"}),(0,v.jsx)("input",{type:"text",className:"input playlist-toolbar-search-input",placeholder:"Search",value:o,onChange:function({target:s}){r(s.value),(0,a.gI)(s.value),clearTimeout(l.current),l.current=setTimeout((()=>{const n=(0,a.BM)(s.value,e);t(n?"":"No tracks found")}),400)},onKeyDown:function({target:e,key:t}){"Enter"===t&&e.blur()},autoFocus:!0}),(0,v.jsx)("button",{className:"btn icon-btn playlist-toolbar-search-reset-btn",onClick:function(){r(""),t(""),i(!1),(0,a.gI)(""),(0,a.xU)(e)},title:"Clear",children:(0,v.jsx)(m.Z,{id:"close"})})]})}):(0,v.jsxs)("button",{className:"btn icon-text-btn",onClick:function(){i(!0)},children:[(0,v.jsx)(m.Z,{id:"search"}),(0,v.jsx)("span",{children:"Search"})]})},y=(0,n.lazy)((()=>s.e(911).then(s.bind(s,911))));const f=function({playlist:e,playlistRef:t,setMessage:s}){const{updatePlaylist:i}=(0,r.K)(),{activePlaylistId:m}=(0,l.n)(),[f,h]=(0,n.useState)(!1);function w(t){const s=t.ctrlKey||t.shiftKey||t.altKey||t.metaKey,{target:n,key:i}=t;if(!(n instanceof HTMLInputElement&&"text"===n.type))if("Delete"!==i||s){if("a"===i&&t.ctrlKey&&(t.preventDefault(),e.tracks.length)){const e=(0,c.GM)();h(e)}}else j(),h(!1)}function x({detail:e}){h(e)}function g(){h(!1)}function j(){const t=(0,c.eD)(),s=(0,c.YP)(t),n=[];for(const t of e.tracks)s.includes(t.index)||n.push(t);if(i(e.id,{tracks:(0,d.jg)(n)}),(0,c.wR)(t,e),e.id===m){(0,o.X5)(e.id);const t=(0,o.t7)();t&&(0,a.ul)(t.index,e.id)}g()}return(0,n.useEffect)((()=>(window.addEventListener("keydown",w),window.addEventListener("selection",x),()=>{window.removeEventListener("keydown",w),window.removeEventListener("selection",x)})),[e,m]),(0,v.jsxs)("div",{className:"playlist-toolbar",children:[(0,v.jsx)(u.Z,{startViewMode:e.viewMode,changeViewMode:function(s){e.viewMode=s,i(e.id,{viewMode:s}),(0,a.U)(t.current,e)}}),f&&(0,v.jsx)(n.Suspense,{fallback:null,children:(0,v.jsx)(y,{playlist:e,removeSelectedTracks:j,hide:g})}),(0,v.jsx)(b,{playlistId:e.id,setMessage:s}),(0,v.jsx)(p.Z,{playlist:e,playlistRef:t,updateSortedPlaylist:function({sortBy:t,sortOrder:s}){(0,o.ZO)(e.tracks,e.id),i(e.id,{sortBy:t,sortOrder:s})}})]})};const h=function(){const{id:e}=(0,i.UO)(),{playlists:t,updatePlaylist:s}=(0,r.K)(),{activePlaylistId:c,togglePlay:d,playAtIndex:u}=(0,l.n)(),[p,m]=(0,n.useState)(null),[b,y]=(0,n.useState)(!0),[h,w]=(0,n.useState)(""),x=(0,n.useRef)(!1),g=(0,n.useRef)(null);function j({detail:{track:t}}){(0,a.z4)(t,e)}function N({detail:{id:t,tracks:s}}){t===e&&(0,a.tI)(s,g.current,p)}return(0,n.useEffect)((()=>()=>{x.current=!1,w(""),(0,a.yW)()}),[e]),(0,n.useEffect)((()=>{t&&(y(!1),m(t[e]))}),[t,e]),(0,n.useLayoutEffect)((()=>{if(p)if(x.current)p.tracks.length||(0,a.yW)();else{if(window.matchMedia("(max-width: 700px)").matches&&"grid"!==p.viewMode)return void s(p.id,{viewMode:"grid"});(0,a.U)(g.current,p),(0,a.O9)(e),x.current=!0}}),[p]),(0,n.useEffect)((()=>("local-files"===e?window.addEventListener("track",j):window.addEventListener("youtube-tracks",N),()=>{window.removeEventListener("track",j),window.removeEventListener("youtube-tracks",N)})),[p]),!t||b?null:p?(0,v.jsxs)("div",{className:"playlist"+(p.tracks.length&&!h?"":" empty"),children:[(0,v.jsx)(f,{playlist:p,playlistRef:g,setMessage:w}),(0,v.jsx)("div",{className:"playlist-view",ref:g,onClick:function({target:t,detail:s}){const n=t.closest(".track");if(n)if(2===s){const t=Number(n.getAttribute("data-index"));u(t,e)}else{if(!t.closest(".artwork-btn"))return;const s=Number(n.getAttribute("data-index")),i=(0,o.t7)();i&&c===e&&s===i.index?d():u(s,e)}}}),p.tracks.length?h?(0,v.jsx)("p",{className:"playlist-message",children:h}):null:(0,v.jsx)("p",{className:"playlist-message",children:"Playlist is empty"})]}):(0,v.jsx)("div",{className:"playlist empty",children:(0,v.jsx)("p",{className:"playlist-message",children:"Playlist not found"})})}},253:(e,t,s)=>{s.d(t,{Z:()=>c});var n=s(294),i=s(322),a=s(676),o=s(461),r=s(513),l=s(893);const c=function({playlist:e,playlistRef:t,updateSortedPlaylist:s}){const[c,d]=(0,n.useState)({sortBy:e.sortBy,sortOrder:e.sortOrder});function u({target:e}){p(c.sortBy,Number(e.value))}function p(n,o=1){n===c.sortBy&&o===c.sortOrder||(s({sortBy:n,sortOrder:o}),(0,i.Yr)({...e,sortBy:n,sortOrder:o}),d({sortBy:n,sortOrder:o}),(0,a.U)(t.current,e))}return(0,n.useEffect)((()=>{d({sortBy:e.sortBy,sortOrder:e.sortOrder})}),[e]),(0,l.jsxs)(r.Z,{toggle:{body:(0,l.jsxs)(l.Fragment,{children:[(0,l.jsx)(o.Z,{id:"sort"}),(0,l.jsx)("span",{children:"Sort"})]}),className:"icon-text-btn sort-dropdown-toggle-btn"},container:{className:"sort-dropdown-container"},children:[(0,l.jsxs)("div",{className:"sort-dropdown-group",children:[(0,l.jsx)("button",{className:"btn text-btn dropdown-btn sort-dropdown-btn"+("index"===c.sortBy?" active":""),onClick:()=>p("index"),children:"Index"}),(0,l.jsx)("button",{className:"btn text-btn dropdown-btn sort-dropdown-btn"+("title"===c.sortBy?" active":""),onClick:()=>p("title"),children:"Title"}),(0,l.jsx)("button",{className:"btn text-btn dropdown-btn sort-dropdown-btn"+("artist"===c.sortBy?" active":""),onClick:()=>p("artist"),children:"Artist"}),(0,l.jsx)("button",{className:"btn text-btn dropdown-btn sort-dropdown-btn"+("album"===c.sortBy?" active":""),onClick:()=>p("album"),children:"Album"}),(0,l.jsx)("button",{className:"btn text-btn dropdown-btn sort-dropdown-btn"+("duration"===c.sortBy?" active":""),onClick:()=>p("duration"),children:"Duration"})]}),(0,l.jsxs)("div",{className:"sort-dropdown-group",children:[(0,l.jsxs)("label",{className:"dropdown-btn sort-dropdown-radio",children:[(0,l.jsx)("input",{type:"radio",className:"sr-only radio-input",name:"sortOrder",value:"1",onChange:u,checked:1===c.sortOrder}),(0,l.jsx)("div",{className:"radio"}),(0,l.jsx)("span",{className:"radio-label",children:"Ascending"})]}),(0,l.jsxs)("label",{className:"dropdown-btn sort-dropdown-radio",children:[(0,l.jsx)("input",{type:"radio",className:"sr-only radio-input",onChange:u,name:"sortOrder",value:"-1",checked:-1===c.sortOrder}),(0,l.jsx)("div",{className:"radio"}),(0,l.jsx)("span",{className:"radio-label",children:"Descending"})]})]})]})}},722:(e,t,s)=>{s.d(t,{Z:()=>o});var n=s(294),i=s(461),a=s(893);const o=function({startViewMode:e,changeViewMode:t,hideMinimal:s=!1}){const[o,r]=(0,n.useState)(e);function l(e){r(e.target.value),t(e.target.value)}return(0,n.useEffect)((()=>{r(e)}),[e]),(0,a.jsxs)("ul",{className:"view-modes",children:[s?null:(0,a.jsx)("li",{className:"view-mode-container",children:(0,a.jsxs)("label",{children:[(0,a.jsx)("input",{type:"radio",className:"sr-only view-mode-radio-input",name:"view-mode",value:"minimal",checked:"minimal"===o,onChange:l}),(0,a.jsx)(i.Z,{id:"minimal",className:"btn icon-btn view-mode-icon",title:"Minimal"})]})}),(0,a.jsx)("li",{className:"view-mode-container",children:(0,a.jsxs)("label",{children:[(0,a.jsx)("input",{type:"radio",className:"sr-only view-mode-radio-input",name:"view-mode",value:"compact",checked:"compact"===o,onChange:l}),(0,a.jsx)(i.Z,{id:"compact",className:"btn icon-btn view-mode-icon",title:"Compact"})]})}),(0,a.jsx)("li",{className:"view-mode-container",children:(0,a.jsxs)("label",{children:[(0,a.jsx)("input",{type:"radio",className:"sr-only view-mode-radio-input",name:"view-mode",value:"grid",checked:"grid"===o,onChange:l}),(0,a.jsx)(i.Z,{id:"grid",className:"btn icon-btn view-mode-icon",title:"Grid"})]})})]})}}}]);
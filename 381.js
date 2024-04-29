"use strict";(globalThis.webpackChunkveery=globalThis.webpackChunkveery||[]).push([[381],{527:(e,t,s)=>{s.d(t,{A:()=>o});var n=s(540),a=s(806),i=s(123),r=s(848);const o=function({container:e,toggle:t={},body:s,children:o}){const[l,c]=(0,n.useState)({id:(0,a.$f)()}),d=(0,n.useCallback)((function({target:e}){const t=e.closest(".dropdown-container");let s=!0;t?.id===l.id&&(s=!e.closest("[data-dropdown-keep]")&&(e.closest("a")||e.closest(".dropdown-btn")));s&&(u.current&&c({id:l.id,visible:!1,reveal:!1}),window.removeEventListener("click",d))}),[l.id]),u=(0,n.useRef)(!1),m=(0,n.useRef)(null);return(0,n.useEffect)((()=>(u.current=!0,()=>{u.current=!1,window.removeEventListener("click",d)})),[d]),(0,n.useLayoutEffect)((()=>{if(l.reveal){let e=!1;if(l.data){const t=m.current.getBoundingClientRect().height+8;l.data.bottom+t>l.data.height&&l.data.top>t&&(e=!0)}c({...l,onTop:e,visible:!0})}}),[l.reveal]),(0,r.jsxs)("div",{id:l.id,className:`dropdown-container${e?` ${e.className}`:""}${l.visible?" visible":""}`,children:[(0,r.jsx)("button",{className:`btn icon-btn${t.className?` ${t.className}`:""}${l.visible?" active":""}`,onClick:function({currentTarget:e}){let t=null;if(l.visible)window.removeEventListener("click",d);else{const s=e.parentElement,n=function(e){for(;e&&!e.hasAttribute("data-dropdown-parent");)e=e.parentElement;return e}(s);n&&(n.style.position="relative",t={top:s.offsetTop,bottom:s.offsetTop+s.offsetHeight,height:n.scrollTop+n.clientHeight},n.style.position=""),window.addEventListener("click",d)}c({id:l.id,visible:!1,reveal:!l.visible,data:t,onTop:!1})},title:t.title||"More",children:t.body?t.body:(0,r.jsx)(i.A,{id:t.iconId||"vertical-dots",className:"dropdown-toggle-btn-icon"})}),(0,r.jsx)("div",{ref:m,className:`container dropdown${s?` ${s.className}`:""}${l.reveal?" reveal":""}${l.visible?" visible":""}${l.onTop?" top":""}`,children:o})]})}},381:(e,t,s)=>{s.r(t),s.d(t,{default:()=>p});var n=s(540),a=s(568),i=s(400),r=s(440),o=s(584),l=s(295),c=s(123),d=s(202),u=s(361),m=s(848);const p=function(){const{playlists:e}=(0,o.n)(),{activePlaylistId:t,togglePlay:s,playAtIndex:p}=(0,l.F)(),[h,b]=(0,n.useState)(""),[v,x]=(0,n.useState)([]),[y,f]=(0,n.useState)(null),[w,j]=(0,n.useState)(!1),N=(0,n.useRef)(null),g=(0,n.useRef)(0),k=(0,n.useMemo)((()=>window.matchMedia("(max-width: 1024px)").matches?"grid":"compact"),[]);function A(){clearTimeout(g.current),b(""),f(null),x([]),j(!1)}return(0,n.useEffect)((()=>()=>{(0,a.tH)("search"),(0,i.kT)()}),[]),(0,n.useLayoutEffect)((()=>{if(v.length){const e=y?(0,a.i5)("search",{tracks:v}):(0,a.Nt)({id:"search",tracks:v,viewMode:k});f({...e}),(0,i.ON)(N.current,e)}else N.current&&(N.current.innerHTML=null,(0,i.kT)())}),[v]),e?(0,m.jsxs)("div",{className:"search",children:[(0,m.jsxs)("div",{className:"search-top",children:[(0,m.jsx)("h2",{className:"search-title",children:"Search"}),(0,m.jsxs)("div",{className:"search-form",children:[(0,m.jsxs)("div",{className:"search-form-input-container",children:[(0,m.jsx)("input",{type:"text",className:"input search-form-input",onChange:function({target:t}){b(t.value),j(!0),clearTimeout(g.current),g.current=setTimeout((()=>{t.value?function(t){let s=[];for(const t of Object.values(e))s=s.concat(t.tracks.map((e=>({...e,playlistId:t.id,playlistIndex:e.index}))));const n=new RegExp(`(${t})`,"i"),a=s.filter((e=>n.test(e.title)||n.test(e.artist)||n.test(e.album))).map(((e,t)=>({...e,index:t})));x(a),j(!1)}(t.value):A()}),400)},value:h,placeholder:"Enter search term"}),h&&(0,m.jsx)("button",{type:"button",className:"btn icon-btn search-form-input-clear-btn",onClick:A,title:"Clear",children:(0,m.jsx)(c.A,{id:"close",className:"search-form-input-clear-btn-icon"})})]}),(0,m.jsxs)("button",{className:"btn icon-text-btn search-from-submit-btn",children:[(0,m.jsx)(c.A,{id:"search"}),(0,m.jsx)("span",{children:"Search"})]})]})]}),(0,m.jsxs)("div",{className:"search-playlist-container",children:[y?(0,m.jsxs)("div",{className:"search-playlist-toolbar",children:[(0,m.jsx)(d.A,{startViewMode:k,changeViewMode:function(e){y.viewMode=e,(0,a.i5)("search",{viewMode:e}),(0,i.ON)(N.current,y)},hideMinimal:!0}),(0,m.jsx)(u.A,{playlist:y,playlistRef:N,updateSortedPlaylist:function({sortBy:e,sortOrder:t}){(0,a.i5)("search",{sortBy:e,sortOrder:t})}})]}):null,h?v.length?null:w?(0,m.jsx)(c.A,{id:"spinner",className:"search-playlist-spinner"}):(0,m.jsx)("p",{className:"search-playlist-message",children:"No matches found"}):v.length?null:(0,m.jsx)("p",{className:"search-playlist-message",children:"Search for tracks across all playlists."}),(0,m.jsx)("div",{className:"playlist-view",ref:N,onClick:function({target:e,detail:n}){const a=e.closest(".track");if(a)if(2===n){const e=y.tracks[a.getAttribute("data-index")];p(e.playlistIndex,e.playlistId)}else{if(!e.closest(".artwork-btn"))return;const n=y.tracks[a.getAttribute("data-index")],i=(0,r.yu)();i&&t===n.playlistId&&n.playlistIndex===i.index?s():p(n.playlistIndex,n.playlistId)}}})]})]}):null}},361:(e,t,s)=>{s.d(t,{A:()=>c});var n=s(540),a=s(568),i=s(400),r=s(123),o=s(527),l=s(848);const c=function({playlist:e,playlistRef:t,updateSortedPlaylist:s}){const[c,d]=(0,n.useState)({sortBy:e.sortBy,sortOrder:e.sortOrder});function u({target:e}){m(c.sortBy,Number(e.value))}function m(n,r=1){n===c.sortBy&&r===c.sortOrder||(s({sortBy:n,sortOrder:r}),(0,a.HX)({...e,sortBy:n,sortOrder:r}),d({sortBy:n,sortOrder:r}),(0,i.ON)(t.current,e))}return(0,n.useEffect)((()=>{d({sortBy:e.sortBy,sortOrder:e.sortOrder})}),[e]),(0,l.jsxs)(o.A,{toggle:{body:(0,l.jsxs)(l.Fragment,{children:[(0,l.jsx)(r.A,{id:"sort"}),(0,l.jsx)("span",{children:"Sort"})]}),className:"icon-text-btn sort-dropdown-toggle-btn"},container:{className:"sort-dropdown-container"},children:[(0,l.jsxs)("div",{className:"sort-dropdown-group",children:[(0,l.jsx)("button",{className:"btn text-btn dropdown-btn sort-dropdown-btn"+("index"===c.sortBy?" active":""),onClick:()=>m("index"),children:"Index"}),(0,l.jsx)("button",{className:"btn text-btn dropdown-btn sort-dropdown-btn"+("title"===c.sortBy?" active":""),onClick:()=>m("title"),children:"Title"}),(0,l.jsx)("button",{className:"btn text-btn dropdown-btn sort-dropdown-btn"+("artist"===c.sortBy?" active":""),onClick:()=>m("artist"),children:"Artist"}),(0,l.jsx)("button",{className:"btn text-btn dropdown-btn sort-dropdown-btn"+("album"===c.sortBy?" active":""),onClick:()=>m("album"),children:"Album"}),(0,l.jsx)("button",{className:"btn text-btn dropdown-btn sort-dropdown-btn"+("duration"===c.sortBy?" active":""),onClick:()=>m("duration"),children:"Duration"})]}),(0,l.jsxs)("div",{className:"sort-dropdown-group",children:[(0,l.jsxs)("label",{className:"dropdown-btn sort-dropdown-radio",children:[(0,l.jsx)("input",{type:"radio",className:"sr-only radio-input",name:"sortOrder",value:"1",onChange:u,checked:1===c.sortOrder}),(0,l.jsx)("div",{className:"radio"}),(0,l.jsx)("span",{className:"radio-label",children:"Ascending"})]}),(0,l.jsxs)("label",{className:"dropdown-btn sort-dropdown-radio",children:[(0,l.jsx)("input",{type:"radio",className:"sr-only radio-input",onChange:u,name:"sortOrder",value:"-1",checked:-1===c.sortOrder}),(0,l.jsx)("div",{className:"radio"}),(0,l.jsx)("span",{className:"radio-label",children:"Descending"})]})]})]})}},202:(e,t,s)=>{s.d(t,{A:()=>r});var n=s(540),a=s(123),i=s(848);const r=function({startViewMode:e,changeViewMode:t,hideMinimal:s=!1}){const[r,o]=(0,n.useState)(e);function l(e){o(e.target.value),t(e.target.value)}return(0,n.useEffect)((()=>{o(e)}),[e]),(0,i.jsxs)("ul",{className:"view-modes",children:[s?null:(0,i.jsx)("li",{className:"view-mode-container",children:(0,i.jsxs)("label",{children:[(0,i.jsx)("input",{type:"radio",className:"sr-only view-mode-radio-input",name:"view-mode",value:"minimal",checked:"minimal"===r,onChange:l}),(0,i.jsx)(a.A,{id:"minimal",className:"btn icon-btn view-mode-icon",title:"Minimal"})]})}),(0,i.jsx)("li",{className:"view-mode-container",children:(0,i.jsxs)("label",{children:[(0,i.jsx)("input",{type:"radio",className:"sr-only view-mode-radio-input",name:"view-mode",value:"compact",checked:"compact"===r,onChange:l}),(0,i.jsx)(a.A,{id:"compact",className:"btn icon-btn view-mode-icon",title:"Compact"})]})}),(0,i.jsx)("li",{className:"view-mode-container",children:(0,i.jsxs)("label",{children:[(0,i.jsx)("input",{type:"radio",className:"sr-only view-mode-radio-input",name:"view-mode",value:"grid",checked:"grid"===r,onChange:l}),(0,i.jsx)(a.A,{id:"grid",className:"btn icon-btn view-mode-icon",title:"Grid"})]})})]})}}}]);
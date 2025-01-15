"use strict";(globalThis.webpackChunkveery=globalThis.webpackChunkveery||[]).push([[17,695],{908:(t,e,n)=>{n.d(e,{A:()=>o});var i=n(540),s=n(806),a=n(123),l=n(848);const o=function({container:t,toggle:e={},body:n,children:o}){const[c,r]=(0,i.useState)({id:(0,s.$f)()}),u=(0,i.useCallback)((function({target:t}){const e=t.closest(".dropdown-container");let n=!0;e?.id===c.id&&(n=!t.closest("[data-dropdown-keep]")&&(t.closest("a")||t.closest(".dropdown-btn")));n&&(d.current&&r({id:c.id,visible:!1,reveal:!1}),window.removeEventListener("click",u))}),[c.id]),d=(0,i.useRef)(!1),p=(0,i.useRef)(null);return(0,i.useEffect)((()=>(d.current=!0,()=>{d.current=!1,window.removeEventListener("click",u)})),[u]),(0,i.useLayoutEffect)((()=>{if(c.reveal){let t=!1;if(c.data){const e=p.current.getBoundingClientRect().height+8;c.data.bottom+e>c.data.height&&c.data.top>e&&(t=!0)}r({...c,onTop:t,visible:!0})}}),[c.reveal]),(0,l.jsxs)("div",{id:c.id,className:`dropdown-container${t?` ${t.className}`:""}${c.visible?" visible":""}`,children:[(0,l.jsx)("button",{className:`btn icon-btn${e.className?` ${e.className}`:""}${c.visible?" active":""}`,onClick:function({currentTarget:t}){let e=null;if(c.visible)window.removeEventListener("click",u);else{const n=t.parentElement,i=function(t){for(;t&&!t.hasAttribute("data-dropdown-parent");)t=t.parentElement;return t}(n);i&&(i.style.position="relative",e={top:n.offsetTop,bottom:n.offsetTop+n.offsetHeight,height:i.scrollTop+i.clientHeight},i.style.position=""),window.addEventListener("click",u)}r({id:c.id,visible:!1,reveal:!c.visible,data:e,onTop:!1})},title:e.title||"More",children:e.body?e.body:(0,l.jsx)(a.A,{id:e.iconId||"vertical-dots",className:"dropdown-toggle-btn-icon"})}),(0,l.jsx)("div",{ref:p,className:`container dropdown${n?` ${n.className}`:""}${c.reveal?" reveal":""}${c.visible?" visible":""}${c.onTop?" top":""}`,children:o})]})}},695:(t,e,n)=>{n.r(e),n.d(e,{default:()=>g});var i=n(540),s=n(17),a=n(584),l=n(123),o=n(908),c=n(848);const r=function({youtube:t,setYoutube:e}){const{uploadFiles:n}=(0,a.n)(),[r,u]=(0,i.useState)((()=>"true"===localStorage.getItem("use-last.fm")));function d({detail:n}){n&&e({...t,user:n})}function p({target:t}){n([...t.files]),t.value=""}return(0,i.useEffect)((()=>(t.user||window.addEventListener("youtube-user-update",d),()=>{window.removeEventListener("youtube-user-update",d)})),[t.user]),(0,c.jsxs)("div",{children:[(0,c.jsxs)("div",{className:"import-option import-option-local",children:[(0,c.jsxs)("div",{className:"import-local-items",children:[(0,c.jsxs)("label",{className:"btn icon-text-btn import-option-btn import-local-item",onChange:p,children:[(0,c.jsx)(l.A,{id:"file",className:"import-option-btn-icon"}),(0,c.jsx)("span",{children:"Files"}),(0,c.jsx)("input",{type:"file",className:"sr-only",accept:"audio/*",multiple:!0})]}),(0,c.jsxs)("label",{className:"btn icon-text-btn import-option-btn import-local-item",onChange:p,children:[(0,c.jsx)(l.A,{id:"folder",className:"import-option-btn-icon"}),(0,c.jsx)("span",{children:"Folder"}),(0,c.jsx)("input",{type:"file",className:"sr-only",webkitdirectory:"true",directory:"true",allowdirs:"true"})]})]}),(0,c.jsx)("div",{className:"import-local-settings",children:(0,c.jsxs)("label",{className:"checkbox-container",children:[(0,c.jsx)("input",{type:"checkbox",className:"sr-only checkbox-input",onChange:function({target:t}){u(t.checked),localStorage.setItem("use-last.fm",t.checked)},checked:r}),(0,c.jsx)("div",{className:"checkbox",children:(0,c.jsx)("div",{className:"checkbox-tick"})}),(0,c.jsx)("span",{className:"checkbox-label",children:"Look for missing metadata"})]})})]}),(0,c.jsxs)("div",{className:"import-option import-option-youtube",children:[t.fetching&&(0,c.jsx)(l.A,{id:"spinner",className:"import-youtube-spinner"}),(0,c.jsxs)("button",{className:"btn icon-text-btn import-option-btn import-youtube-modal-show-btn",onClick:async function(){if(t.playlists)e({...t,modalVisible:!0});else{e({...t,fetching:!0});const n=await(0,s.initGoogleAPI)();if(n){const t=await(0,s.kc)();e({user:n,playlists:t,modalVisible:!0})}else e({modalVisible:!0})}},disabled:t.fetching,children:[(0,c.jsx)(l.A,{id:"youtube",className:"import-option-btn-icon"}),(0,c.jsx)("span",{children:"YouTube"})]}),t.user?(0,c.jsxs)(o.A,{toggle:{body:(0,c.jsx)("img",{src:t.user.image,className:"import-youtube-user-btn-image",alt:""}),className:"import-youtube-user-toggle-btn"},children:[(0,c.jsxs)("div",{className:"import-youtube-user",children:[(0,c.jsx)("img",{src:t.user.image,className:"import-youtube-user-image",alt:""}),(0,c.jsxs)("div",{children:[(0,c.jsx)("div",{className:"import-youtube-user-name",children:t.user.name}),(0,c.jsx)("div",{className:"import-youtube-user-email",children:t.user.email})]})]}),(0,c.jsx)("div",{className:"import-youtube-user-bottom",children:(0,c.jsx)("button",{className:"btn text-btn import-youtube-logout-btn",onClick:async function(){await(0,s.y4)(),e({})},children:"Sign Out"})})]}):(0,c.jsx)("button",{className:"btn text-btn import-youtube-login-btn",onClick:async function(){e({fetching:!0});try{const t=await(0,s.initGoogleAPI)(!0);e({user:t})}catch(t){console.log(t),e({})}},disabled:t.fetching,children:"Sign In"})]})]})};var u=n(527),d=n(806),p=n(568),m=n(400),b=n(440),h=n(295);const y=function({youtube:t,setYoutube:e}){const s=(0,u.zy)(),{playlists:r,removePlaylist:y,updatePlaylist:x}=(0,a.n)(),{activePlaylistId:g,activeTrack:f,paused:v,trackLoading:j,togglePlay:w,playPlaylist:N}=(0,h.F)(),[k,I]=(0,i.useState)(null);function A(t){"Enter"===t.key&&t.target.blur()}function $(t){const{thumbnail:e}=(0,p.qX)(t);return(0,c.jsxs)("div",{className:"playlist-entry-thumbnail-container",children:[(0,c.jsx)(u.N_,{to:`/playlist/${t}`,className:`playlist-entry-thumbnail t-${e.length}`,draggable:"false",children:e.map((t=>(0,c.jsx)("div",{className:"playlist-entry-thumbnail-image-container",children:(0,c.jsx)("img",{src:t,className:"artwork",alt:""})},t)))}),P(t)]})}function P(t){let e={iconId:"play-circle",title:"Play"};return g!==t||v||(e={iconId:"pause-circle",title:"Pause"}),(0,c.jsxs)("button",{className:"btn icon-btn playlist-entry-play-btn",title:e.title,onClick:()=>function(t){g===t?w():N(t)}(t),children:[(0,c.jsx)(l.A,{id:e.iconId,className:"playlist-entry-play-btn-icon"}),g===t&&j&&(0,c.jsx)(l.A,{id:"spinner",className:"play-pause-btn-spinner"})]})}return r?Object.values(r).map((i=>(0,c.jsxs)("div",{className:"playlist-entry",children:[$(i.id),(0,c.jsxs)("div",{className:"playlist-entry-content",children:[k?.id===i.id?(0,c.jsx)("input",{type:"text",className:"input playlist-entry-title-input",defaultValue:i.title,onBlur:t=>function(t,e){const{title:n}=(0,p.LR)(e),i=t.target.value;i&&i!==n&&x(e,{title:i}),I(null)}(t,i.id),onKeyPress:A,autoFocus:!0}):(0,c.jsx)("h3",{className:"playlist-entry-title",children:i.title}),(0,c.jsxs)("div",{className:"playlist-entry-bottom",children:[i.isPrivate?(0,c.jsx)("span",{className:"playlist-entry-bottom-item",children:(0,c.jsx)(l.A,{id:"lock",className:"playlist-entry-bottom-icon",title:`Private to ${i.user.name}`})}):null,(0,c.jsxs)("span",{className:"playlist-entry-bottom-item",children:[i.tracks.length," track",1===i.tracks.length?"":"s"]}),(0,c.jsx)("span",{className:"playlist-entry-bottom-item",children:(0,p.qX)(i.id).duration}),(0,c.jsxs)(o.A,{container:{className:"playlist-entry-dropdown-container"},children:[(0,c.jsxs)("button",{className:"btn icon-text-btn dropdown-btn",onClick:()=>{return t=i.id,e=i.title,void I({id:t,title:e});var t,e},children:[(0,c.jsx)(l.A,{id:"edit",className:"dropdown-btn-icon"}),(0,c.jsx)("span",{children:"Change Title"})]}),i.url?(0,c.jsxs)(c.Fragment,{children:[(0,c.jsxs)("button",{className:"btn icon-text-btn dropdown-btn",onClick:()=>async function(i){const{initGoogleAPI:a,fetchPlaylistItems:l}=await Promise.resolve().then(n.bind(n,17));let o=t.user;(0,d.w3)("update-indicator-status",{id:i,visible:!0}),e({...t,playlistId:i,fetching:!0}),o||(o=await a(),"/"===s.pathname&&e({...t,user:o,playlistId:i,fetching:!0}));const c=await l(i,"sync");x(i,{tracks:(0,p.Ol)(c)}),(0,d.w3)("tracks",{id:i,type:"replace"}),i===g&&((0,b.Gx)(i),f&&((0,m.cb)(),(0,m.lK)(f.index,i))),"/"===s.pathname&&e({...t,user:o}),(0,d.w3)("update-indicator-status",{id:i,visible:!1})}(i.id),disabled:t.playlistId===i.id,children:[(0,c.jsx)(l.A,{id:"sync",className:"dropdown-btn-icon"}),(0,c.jsx)("span",{children:"Sync to YouTube"})]}),(0,c.jsxs)("a",{href:i.url,className:"btn icon-text-btn dropdown-btn",target:"_blank",rel:"noreferrer",children:[(0,c.jsx)(l.A,{id:"link",className:"dropdown-btn-icon"}),(0,c.jsx)("span",{children:"Open on YouTube"})]}),(0,c.jsxs)("label",{className:"checkbox-container playlist-entry-dropdown-setting",children:[(0,c.jsx)("input",{type:"checkbox",className:"sr-only checkbox-input",checked:i.sync,onChange:t=>function({target:t},e){x(e,{sync:t.checked})}(t,i.id)}),(0,c.jsx)("div",{className:"checkbox",children:(0,c.jsx)("div",{className:"checkbox-tick"})}),(0,c.jsx)("span",{className:"checkbox-label",children:"Sync on load"})]})]}):null,(0,c.jsxs)("button",{className:"btn icon-text-btn dropdown-btn",onClick:()=>y(i.id),children:[(0,c.jsx)(l.A,{id:"trash",className:"dropdown-btn-icon"}),(0,c.jsx)("span",{children:"Remove"})]})]})]})]})]},i.id))):null},x=(0,i.lazy)((()=>n.e(429).then(n.bind(n,429))));const g=function(){const[t,e]=(0,i.useState)((()=>({user:(0,s.wz)()})));return(0,c.jsxs)("div",{className:"home","data-dropdown-parent":!0,children:[(0,c.jsx)(r,{youtube:t,setYoutube:e}),(0,c.jsx)(y,{youtube:t,setYoutube:e}),t.modalVisible&&(0,c.jsx)(i.Suspense,{fallback:null,children:(0,c.jsx)(x,{youtube:t,setYoutube:e})})]})}},17:(t,e,n)=>{n.d(e,{Ej:()=>p,Nj:()=>u,fetchPlaylistItems:()=>m,initGoogleAPI:()=>w,kc:()=>r,wz:()=>v,y4:()=>j});var i=n(806),s=n(244),a=n(568);let l=null,o=null,c=null;async function r(){const t=await g("playlists","snippet,contentDetails,status","mine",!0);var e;return e=t.items,l=e.map((t=>({id:t.id,url:`https://youtube.com/playlist?list=${t.id}`,isPrivate:"private"===t.status.privacyStatus,itemCount:t.contentDetails.itemCount,title:t.snippet.title,thumbnail:t.snippet.thumbnails.medium.url}))),l}async function u(t,e){const{items:n}=await g("videos","snippet,contentDetails","id",t);if(n.length){const t=function(t){const e=h(t).map((t=>(t.snippet.resourceId={videoId:t.id},t.snippet.videoOwnerChannelTitle=t.snippet.channelTitle,t.durationInSeconds=b(t.contentDetails.duration)-1,t)));return x(e)}(n);return e.length?d(t,e):t}}function d(t,e){return t.reduce(((t,n)=>(e.some((t=>t.id===n.id))||t.push(n),t)),[])}async function p(t){const{items:e}=await g("playlists","snippet,status","id",t);if(e.length){const t="private"===e[0].status.privacyStatus,n={title:e[0].snippet.title,isPrivate:t};return t&&(n.user=o),n}}async function m(t,e,n=[],s=""){const{error:l,items:o,nextPageToken:c}=await g("playlistItems","snippet","playlistId",t,s);if(l)return console.log(l),n;const r=await async function(t){const e=t.map((t=>t.snippet.resourceId.videoId)).join(),n=await g("videos","contentDetails","id",e);return t.reduce(((t,e)=>{const i=n.items.find((({id:t})=>t===e.snippet.resourceId.videoId));return i&&(e.durationInSeconds=b(i.contentDetails.duration)-1,t.push(e)),t}),[])}(h(o));let u=x(r);if("new"===e)(0,i.w3)("youtube-tracks",{id:t,tracks:u,done:!c});else if("reimport"===e){u=d(u,(0,a.LR)(t).tracks)}return n=n.concat(u),c?m(t,e,n,c):n}function b(t){if(t.includes("H")||(t=`0H${t}`),!t.includes("M")){const e=t.indexOf("H")+1;t=`${t.slice(0,e)}0M${t.slice(e)}`}return t.includes("S")||(t=`${t}0`),t.match(/\d{1,}/g).reverse().reduce(((t,e,n)=>t+=e*60**n),0)}function h(t){return t.filter((t=>{const e=t.snippet.title;return"Deleted video"!==e&&"Private video"!==e}))}function y(t){for(const e of["maxres","high"])if(t[e])return t[e].url;return t.medium.url}function x(t){return t.map((t=>{const e=t.snippet.resourceId.videoId;return(0,s.pq)(e,{original:{url:y(t.snippet.thumbnails)},small:{url:t.snippet.thumbnails.medium.url}},!0),{id:e,durationInSeconds:t.durationInSeconds,duration:(0,i.fU)(t.durationInSeconds),name:t.snippet.title,title:t.snippet.title,artist:t.snippet.videoOwnerChannelTitle,album:"",artworkId:e,player:"youtube"}}))}async function g(t,e,n,i,s){let a=`part=${e}&${n}=${i}&maxResults=50&key=AIzaSyD33Rxm4dA34Mh84oSxYTUUF_jyCLLOua4`;if(s&&(a+=`&pageToken=${s}`),c){if(Date.now()>c.expiresAt){const t=gapi.auth2.getAuthInstance();await t.signIn(),f(t)}a+=`&access_token=${c.token}`}return fetch(`https://www.googleapis.com/youtube/v3/${t}?${a}`).then((t=>t.json()))}function f(t){const e=t.currentUser.get(),n=e.getBasicProfile(),i=e.getAuthResponse();c={token:i.access_token,expiresAt:i.expires_at},o={name:n.getName(),email:n.getEmail(),image:n.getImageUrl()}}function v(){return o}async function j(){const t=gapi.auth2.getAuthInstance();return c=null,o=null,t.signOut()}async function w(t){if(o)return o;await i.Zc.load({src:"https://apis.google.com/js/platform.js"}),await new Promise((t=>gapi.load("auth2",t)));const e=await gapi.auth2.init({client_id:"293076144560-r5cear7rprgo094u6ibcd6nl3bbg18te.apps.googleusercontent.com",scope:"https://www.googleapis.com/auth/youtube.readonly"});return e.isSignedIn.get()?f(e):t&&(await e.signIn(),f(e)),o}}}]);
(globalThis.webpackChunkveery=globalThis.webpackChunkveery||[]).push([[97],{6097:(t,o,a)=>{"use strict";a.r(o),a.d(o,{showDropboxChooser:()=>l});var e=a(8435),s=a(6986),i=a(4503),n=a(1805),r=a(8150);async function c(t,o=[]){const a=t[o.length],i=await(n=a.audioTrack.link,fetch(n).then((t=>t.blob())));var n;const{duration:r}=await(0,e.Z)(i);return o.push({audioTrack:i,durationInSeconds:r,title:a.name,artist:"",album:"",name:a.name,duration:(0,s.mr)(r),player:"native"}),o.length===t.length?o:c(t,o)}async function l(){await s.Vs.load({src:"https://www.dropbox.com/static/api/2/dropins.js",id:"dropboxjs","data-app-key":"6ur73hspbv8o1z9"}),Dropbox.choose({success(t){const o="dropbox",a=(0,n.hT)(o)||(0,n.cg)({id:o,title:"Dropbox",type:"grid",storePlaylist:r.s.getSetting(o,"storePlaylist")});(0,i._j)(o,a,t,c)},linkType:"direct",multiselect:!0,extensions:["audio"]})}}}]);
if(!self.define){const e=e=>{"require"!==e&&(e+=".js");let r=Promise.resolve();return i[e]||(r=new Promise((async r=>{if("document"in self){const i=document.createElement("script");i.src=e,document.head.appendChild(i),i.onload=r}else importScripts(e),r()}))),r.then((()=>{if(!i[e])throw new Error(`Module ${e} didn’t register its module`);return i[e]}))},r=(r,i)=>{Promise.all(r.map(e)).then((e=>i(1===e.length?e[0]:e)))},i={require:Promise.resolve(r)};self.define=(r,s,a)=>{i[r]||(i[r]=Promise.resolve().then((()=>{let i={};const c={uri:location.origin+r.slice(1)};return Promise.all(s.map((r=>{switch(r){case"exports":return i;case"module":return c;default:return e(r)}}))).then((e=>{const r=a(...e);return i.default||(i.default=r),i}))})))}}define("./sw.js",["./workbox-7c877640"],(function(e){"use strict";self.skipWaiting(),e.clientsClaim(),e.precacheAndRoute([{url:"97.js",revision:"bb615b29140ced8a8e316197f9a9a418"},{url:"android-chrome-192x192.png",revision:"d1677e36fc6b8cdf11f715ba22e10168"},{url:"android-chrome-512x512.png",revision:"a1fc338658eb3e26291ad5c2e026346a"},{url:"apple-touch-icon.png",revision:"2de65521d3becdaefd17a71c192f866b"},{url:"assets/images/album-art-placeholder.png",revision:"9c4de475997adfd018e027d6484cb5b9"},{url:"assets/images/logo.svg",revision:"0b4c4a8d9171d2c55dea51930b7792cf"},{url:"assets/images/spinner.svg",revision:"d793de2eeebab757da7fa79766532be8"},{url:"favicon-16x16.png",revision:"30e806374c4b073f3c197ff2fa10dfb2"},{url:"favicon-32x32.png",revision:"7114c444608a1a9583c33630f060756b"},{url:"favicon.ico",revision:"efe5895affcea184f636cb7acd02a03d"},{url:"index.html",revision:"d6d10f3e4d899dcedf38aba28ddc2ac5"},{url:"libs/dexie.js",revision:"a93287f25a7977f2fa40cf77d927fc7a"},{url:"main.css",revision:"d240ba6769428ac5549abb5924394903"},{url:"main.js",revision:"ab6e2487d798eec16d3a9690a359a476"},{url:"manifest.json",revision:"257140ce14eae9b061a8cf725520d6cf"},{url:"vendor.js",revision:"079e9ab19c90295a7c839d2886c36526"},{url:"ww.js",revision:"5d466f2e59944f3f414626cf9563d07c"}],{}),self.__WB_DISABLE_DEV_LOGS=!0}));

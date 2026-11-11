/* assets.js — SINGLE manifest of /assets paths + themed SVG/CSS placeholders.
   To swap a placeholder for a real file: drop it in /assets and set present:true. No other code changes. */
import {officeDecor} from './office-decor.js';
import {sunsetScene,nightScene,labScene} from './scenes.js';
import * as ART from './props-art.js';
const RM=matchMedia('(prefers-reduced-motion: reduce)').matches;   // SMIL ignores CSS, so skip the heat-haze <animate> entirely
const BASE=new URL('../assets/',import.meta.url).href;
const f=(file,present=true,x={})=>({src:BASE+file,present,...x});
const box=(iw,ih,x,y,w,h)=>({iw,ih,x,y,w,h}); // visible crop of a cutout, in source px
export const ASSETS={
brand:{logo:f('logo-breaking-docs.png'),tiles:f('logo-brba-tiles.svg'),favicon:f('favicon.png'),og:f('og-image.jpg')},
tex:{grain:f('texture-grain.png'),hazard:f('texture-hazard-stripes.png')},
bg:{sunset:f('bg-desert-sunset.jpg',false),night:f('bg-desert-night.jpg',false),lab:f('bg-lab-interior.jpg',false),
 rv:f('bg-rv-desert.jpg',false),office:f('bg-office-albuquerque.jpg',false),superlab:f('bg-superlab.jpg',true),
 pilot:f('bg-pilot-desert.jpg',true,{iw:1080}),   // Image to PDF. Only 1080px wide: graded soft + grainy in grade.css, never scaled past cover
 cast:f('bg-cast-clouds.jpg',true)},                     // registered only, reserved for the future About page
char:{heisenberg:f('char-heisenberg.png',true,box(612,408,147,11,331,397)),walter:f('char-walter-hazmat.png',true,box(546,342,0,0,546,342)),
 jesse:f('char-jesse.png',true,box(311,643,0,0,311,643)),saul:f('char-saul.png',true,box(426,586,0,0,426,586)),
 saulAlt:f('char-saul-alt.png',true,box(595,420,0,0,595,420)),gus:f('char-gus.png',true,box(500,500,35,35,434,465)),
 mike:f('char-mike.png',true,box(360,480,0,0,360,480)),hank:f('char-hank.png',true,box(360,480,0,23,360,457)),
 skyler:f('char-skyler.png',true,box(405,540,0,0,405,540)),walterJr:f('char-walter-jr.png',true,box(387,516,0,0,387,516)),
 greenShirt:f('char-green-shirt-fullbody.png',true,box(182,353,0,0,182,353)),   // 404 only, natural small size (<=1.5x)
 greenShirtGun:f('char-green-shirt-gun.png',true,box(378,355,0,0,378,355)),    // Konami easter egg ONLY, never on a main page
 trio:f('char-trio.png',true,box(666,375,0,0,666,375))},                       // registered only, reserved for the future About page
props:{hat:f('prop-pork-pie-hat.png'),pollos:f('prop-los-pollos.png'),bear:f('prop-pink-bear.png'),
 glasses:f('prop-glasses.png',false),rv:f('prop-rv.png',true),hazmatSuit:f('prop-hazmat-suit.png',false),gasMask:f('prop-gas-mask.png',false),
 barrel:f('prop-barrel.png',false),blueCrystals:f('prop-blue-crystals.png',false),flask:f('prop-flask.png',false),cashPile:f('prop-cash-pile.png',false),
 pizzaRoof:f('prop-pizza-roof.png',true),cactus:f('prop-cactus.png',false),tumbleweed:f('prop-tumbleweed.png',false)},
video:{desert:f('bg-loop-desert.mp4',false)}};
/** Silent fallback for any asset <img> that fails to load (file missing): the navbar logo becomes a plain text wordmark,
 *  every other image is removed so no broken-image icon or alt text shows. Blob/data images (user files, previews) are left alone. */
function installImgFallback(){
 const fix=img=>{if(!(img instanceof HTMLImageElement)||img.dataset.failed||/^(blob|data):/.test(img.currentSrc||img.src))return;
  img.dataset.failed='1';
  if(img.closest('.logo')&&!img.classList.contains('logo-hat')){const n=document.createElement('span');n.className='logo-fallback';n.textContent=img.alt||'Breaking Docs';img.replaceWith(n);}
  else img.remove();};
 document.addEventListener('error',e=>fix(e.target),true);
 const sweep=()=>document.querySelectorAll('img').forEach(i=>{if(i.complete&&i.naturalWidth===0&&i.getAttribute('src'))fix(i);});
 addEventListener('load',sweep);setTimeout(sweep,1500);}
if(typeof document!=='undefined')installImgFallback();
/** Publishes texture URLs as CSS variables so stylesheets never hard-code asset paths. */
export function installCssVars(){const s=document.documentElement.style;
 for(const k in ASSETS.tex)s.setProperty('--tex-'+k,`url("${ASSETS.tex[k].src}")`);}
const esc=s=>String(s).replace(/"/g,'&quot;');
/** Character cutout, cropped so every crop looks intentional. */
export function char(key,alt='',cls='',eager=false){const a=ASSETS.char[key];
 return `<div class="char ${cls}" style="--iw:${a.iw};--ih:${a.ih};--x:${a.x};--y:${a.y};--w:${a.w};--h:${a.h};--src:url(&quot;${a.src}&quot;)"><img src="${a.src}" alt="${esc(alt)}" decoding="async"${eager?' fetchpriority="high"':' loading="lazy"'}${alt?'':' aria-hidden="true"'}></div>`;}
export function prop(key,cls='',alt='',eager=false){const a=ASSETS.props[key];
 return a.present?`<img class="${cls}" src="${a.src}" alt="${esc(alt)}" ${eager?'':'loading="lazy" '}decoding="async">`:`<span class="${cls}" ${alt?`role="img" aria-label="${esc(alt)}"`:'aria-hidden="true"'}>${typeof PROPS[key]==='function'?PROPS[key]('pa'+(pid++)):PROPS[key]}</span>`;}
let pid=0;   // unique id prefix per drawn prop, so gradients/clips never collide
/* ---------- prop placeholders (inline SVG, 100x100) ---------- */
const S=(b)=>`<svg viewBox="0 0 100 100" width="100%" fill="none">${b}</svg>`;
const PROPS={
glasses:ART.glasses,
rv:S('<rect x="6" y="28" width="82" height="44" rx="9" fill="#e9e4d2" stroke="#0A0C0A" stroke-width="3"/><path d="M6 56h82" stroke="#1E7A3C" stroke-width="6"/><rect x="62" y="34" width="20" height="14" fill="#55d0ff"/><rect x="16" y="34" width="28" height="12" fill="#55d0ff"/><circle cx="28" cy="76" r="9" fill="#111" stroke="#888" stroke-width="3"/><circle cx="68" cy="76" r="9" fill="#111" stroke="#888" stroke-width="3"/>'),
hazmatSuit:ART.hazmatSuit,
gasMask:ART.gasMask,
barrel:ART.barrel,
blueCrystals:ART.blueCrystals,
flask:ART.flask,
cashPile:ART.cashPile,
pizzaRoof:S('<path d="M8 30q42-30 84 0L50 92z" fill="#F5C400" stroke="#A63220" stroke-width="4"/><circle cx="42" cy="42" r="6" fill="#A63220"/><circle cx="60" cy="50" r="6" fill="#A63220"/><circle cx="50" cy="68" r="5" fill="#A63220"/>'),
cactus:ART.cactus,
tumbleweed:ART.tumbleweed};
/* ---------- background scenes (CSS/SVG), same keys as ASSETS.bg ---------- */
let uid=0;
const SAG='<g id="@sg"><rect x="-13" y="-230" width="26" height="230" rx="13"/><path d="M-13-100h-34v-70a12 12 0 0 1 24 0v46h10zM13-130h34v-60a12 12 0 0 0-24 0v36h-10z"/></g>';
const MESA='M0 820V650l140-18 28-86h250l30 90 190 26 120-52 26-124h210l28 118 220 50 150-80 32-60h270l30 110 160 30V820z';
const MESA2='M0 820V720l200-30 60-50 160 6 80 60 260-20 90-70h200l70 64 240 14 120-50 120 20 120 40V820z';
const DESERT={sunset:['#1a0f2e','#a63220','#e07b2a','#f5c400'],night:['#01030a','#08132b','#142748','#2a3d63'],rv:['#1d6fb8','#6fb9e4','#f0d49a','#f5c400']};
function desert(k,id){const p=DESERT[k];const sil=k=='night'?['#04070d','#02040a','#010204']:k=='rv'?['#a8623a','#6e3a22','#3a1c10']:['#9a3a28','#4a1a12','#140807'];
 let ex='';
 if(k=='sunset')ex=`<circle cx="1380" cy="640" r="620" fill="url(#${id}g)"/><circle cx="1380" cy="660" r="130" fill="#fff1b8"/>`;
 if(k=='night'){for(let i=0;i<90;i++)ex+=`<circle cx="${(i*379)%1920}" cy="${(i*173)%560}" r="${i%7?1.2:2}" fill="#fff" opacity="${.35+(i%5)/8}"/>`;ex+='<circle cx="1480" cy="190" r="64" fill="#e8ecff"/><circle cx="1456" cy="176" r="64" fill="#08132b" opacity=".18"/>';}
 if(k=='rv')ex=`<circle cx="1500" cy="170" r="90" fill="#fff6cf"/><g transform="translate(1000 760)"><rect width="320" height="130" rx="22" fill="#e9e4d2" stroke="#222" stroke-width="5"/><rect y="86" width="320" height="16" fill="#1E7A3C"/><rect x="40" y="26" width="90" height="42" fill="#55d0ff"/><rect x="250" y="26" width="52" height="42" fill="#55d0ff"/><circle cx="70" cy="136" r="26" fill="#111"/><circle cx="250" cy="136" r="26" fill="#111"/></g>`;
 return `<svg viewBox="0 0 1920 1080" preserveAspectRatio="xMidYMax slice" aria-hidden="true"><defs>
<linearGradient id="${id}s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${p[0]}"/><stop offset=".5" stop-color="${p[1]}"/><stop offset=".8" stop-color="${p[2]}"/><stop offset="1" stop-color="${p[3]}"/></linearGradient>
<radialGradient id="${id}g"><stop offset="0" stop-color="#ffd36a" stop-opacity=".85"/><stop offset=".4" stop-color="#e07b2a" stop-opacity=".35"/><stop offset="1" stop-color="#e07b2a" stop-opacity="0"/></radialGradient>
<linearGradient id="${id}h" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${p[3]}" stop-opacity="0"/><stop offset="1" stop-color="${p[3]}" stop-opacity=".55"/></linearGradient>
<filter id="${id}f" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".004 .07" numOctaves="1" seed="4" result="n">${RM?'':'<animate attributeName="baseFrequency" dur="9s" values=".004 .07;.007 .11;.004 .07" repeatCount="indefinite"/>'}</feTurbulence><feDisplacementMap in="SourceGraphic" in2="n" scale="10"/></filter></defs>
<rect width="1920" height="1080" fill="url(#${id}s)"/>${ex}
<g filter="url(#${id}f)"><path d="${MESA}" fill="${sil[0]}" transform="translate(0 40)"/><path d="${MESA2}" fill="${sil[1]}" transform="translate(0 60)"/></g>
<rect y="640" width="1920" height="210" fill="url(#${id}h)"/>
<rect y="860" width="1920" height="220" fill="${sil[2]}"/><g fill="${sil[2]}">${SAG.replace('@',id)}<use href="#${id}sg" x="1660" y="1030"/><g transform="translate(1420 905) scale(.55)"><use href="#${id}sg"/></g><g transform="translate(240 930) scale(.7)"><use href="#${id}sg"/></g><use href="#${id}sg" x="90" y="1060"/></g></svg>`;}
const ROOM={lab:['#020a05','#0f3a22','#55D0FF'],office:['#1a0e06','#6a3e1c','#F5C400'],superlab:['#01080c','#0a4a5a','#55D0FF']};
function room(k,id){const [a,b,g]=ROOM[k];let ex='';
 if(k=='lab')for(let i=0;i<7;i++)ex+=`<path d="M${120+i*250} 560h60l-4-90 24-60h-100l24 60z" fill="#000" opacity=".55"/>`;
 if(k=='office'){for(let i=0;i<14;i++)ex+=`<rect x="1100" y="${120+i*34}" width="560" height="18" fill="#ffd9a0" opacity=".55"/>`;ex+='<rect y="800" width="1920" height="280" fill="#120803"/><rect x="200" y="740" width="900" height="70" fill="#2a1408"/>';}
 if(k=='superlab')for(let i=0;i<5;i++)ex+=`<rect x="${100+i*370}" y="200" width="190" height="640" rx="95" fill="#000" opacity=".5"/><rect x="${130+i*370}" y="240" width="20" height="560" fill="#9fe9ff" opacity=".18"/>`;
 return `<svg viewBox="0 0 1920 1080" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs><linearGradient id="${id}s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient><radialGradient id="${id}g" cx=".5" cy=".4"><stop offset="0" stop-color="${g}" stop-opacity=".45"/><stop offset="1" stop-color="${g}" stop-opacity="0"/></radialGradient></defs><rect width="1920" height="1080" fill="url(#${id}s)"/><rect width="1920" height="1080" fill="url(#${id}g)"/>${ex}</svg>`;}
/** Custom CSS/SVG placeholders per ASSETS.bg key (richer than the generic room()). Used only while the real file is absent. */
const PLACEHOLDERS={office:officeDecor};
/** Layered, parallax-ready scenes (js/scenes.js). Same keys as ASSETS.bg; used only while the real JPG is absent. */
const LAYERED={sunset:sunsetScene,night:nightScene,lab:labScene};
/** Placeholder markup for a bg key. */
function placeholder(key,id){if(key==='pilot')key='rv';   // pilot photo falls back to the drawn RV desert
 return LAYERED[key]?LAYERED[key]():PLACEHOLDERS[key]?`<div class="office-decor" aria-hidden="true">${PLACEHOLDERS[key]()}</div>`:(DESERT[key]?desert(key,id):(ROOM[key]?room(key,id):''));}
/** Scene for an ASSETS.bg key. Placeholder is always painted first; when the manifest says the real file is present it is laid on top
 *  (and silently removed if it fails to load), so dropping bg-*.jpg into /assets and setting present:true is the only step. Includes grain + vignette. */
export function scene(key){const a=ASSETS.bg[key],id='sc'+(uid++);
 const img=a.present?`<img class="scene-img" src="${a.src}" alt="" decoding="async" onerror="this.remove()">`:'';
 return `<div class="scene" data-bg="${key}">${placeholder(key,id)}${img}<div class="grain"></div><div class="vignette"></div></div>`;}

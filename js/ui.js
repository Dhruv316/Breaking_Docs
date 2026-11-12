/* ui.js — navbar, footer, tiles, copy binding, theme, title music, easter eggs, reduced motion */
import {ASSETS,installCssVars,scene,char,prop} from './assets.js';
import {initScenes} from './scenes.js';
import {COPY,TOOLS,t} from './copy.js';
import {reducedMotion,toast} from './ui-kit.js';
import {initIntro as initTheme} from './sound.js';
import {initEggs} from './eggs.js';
import {initFx} from './fx.js';
import {initMotion} from './motion.js';
import {initIntro} from './intro.js';
import {initNavbar} from './navbar.js';
import {installGrade} from './grade.js';
export {reducedMotion,toast};
const $=(s,r=document)=>r.querySelector(s);
/** Wraps the first matching occurrence of each symbol in the text as an element tile ("Co"ok, do"Cu"ments). */
export function elementize(el,text,syms){const sy=[...syms];
 el.innerHTML=text.split(' ').map(w=>{let h='',i=0;const lw=w.toLowerCase();
  while(sy.length){const j=lw.indexOf(sy[0].toLowerCase(),i);if(j<0)break;h+=w.slice(i,j)+`<span class="el" aria-hidden="true">${sy.shift()}</span>`;i=j+2;}
  return `<span class="w">${h+w.slice(i)}</span>`;}).join(' ');el.setAttribute('aria-label',text);}
/** Renders tool tiles. opts.live / opts.soon select groups; opts.exclude hides the current tool (tool pages). */
const ico=(id,h)=>window.Art?window.Art.svg(id,h):'';
export function renderTiles(el,{live=true,soon=false,exclude='',icons=false}={}){
 el.innerHTML=TOOLS.filter(x=>(x.live?live:soon)&&x.sym!==exclude).map((x,i)=>x.live
  ?`<a class="tile${icons?' tile--tool':''}" style="--i:${i}" href="${x.href}"><span class="num mono">${x.n}</span><span class="mass mono">${x.mass}</span>${icons?`<span class="ico" aria-hidden="true">${ico(x.icon,44)}</span>`:''}<span class="sym">${x.sym}</span><span class="name">${COPY.tools[x.sym].name}</span></a>`
  :`<div class="tile tile--soon" style="--i:${i}" aria-disabled="true"><img class="face" src="${ASSETS.char.hank.src}" alt="" loading="lazy" decoding="async"><span class="num mono">${x.n}</span><span class="mass mono">??</span><span class="sym">${x.sym}</span><span class="tag">${COPY.home.soonNote}</span><span class="name">${x.name}</span></div>`).join('');}
/** Creator credit in the Breaking Bad title treatment (periodic-table tiles). Not interactive. `where` = 'nav' | 'foot' (CSS shows one of them). */
function credit(where){const c=COPY.credit;
 return `<div class="credit credit--${where}" role="img" aria-label="${c.aria}" title="${c.aria}"><span class="credit-by mono" aria-hidden="true">${c.by}</span><span class="credit-name" aria-hidden="true">${c.name.map(p=>typeof p==='string'?(p===' '?'<span class="cg"></span>':`<span class="cl">${p}</span>`):`<span class="ct"><i class="cn">${p[1]}</i><b>${p[0]}</b></span>`).join('')}</span></div>`;}
function navbar(){const home=!!$('#hero');const base=home?'':'index.html';
 const m=$('main');if(m){m.id='main';m.tabIndex=-1;}
 $('#topbar').outerHTML=`<a class="skip" href="#main">${COPY.nav.skip}</a><header class="topbar"><div class="wrap"><a class="logo" href="index.html" aria-label="${COPY.brand.name}"><img src="${ASSETS.brand.logo.src}" alt="${COPY.brand.name}" width="125" height="54"></a>
 ${credit('nav')}
 <nav class="nav" aria-label="${COPY.nav.aria}"><a href="${base}#tools">${COPY.nav.tools}</a><a href="${base}#about">${COPY.nav.about}</a></nav></div><div class="prog" aria-hidden="true"><i></i></div></header>`;initNavbar();}
function footer(){const f=$('#footer');f.className='footer';
 const st=[[6,8],[14,30],[22,14],[31,42],[40,10],[52,26],[58,6],[66,36],[74,12],[83,28],[90,8],[95,40]].map(([x,y])=>`<i style="left:${x}%;top:${y}%"></i>`).join('');
 const u=(id,w,h)=>`<svg viewBox="0 0 ${w} ${h}" focusable="false"><use href="#art-${id}" width="${w}" height="${h}"/></svg>`;
 f.innerHTML=`<div class="tape"></div><div class="fart" role="img" aria-label="${COPY.footer.art}"><div class="fart-sky" aria-hidden="true">${st}<div class="fart-moon"></div>${u('mesa-set',300,110).replace('<svg','<svg class="fart-mesa m1"')}${u('mesa-set',300,110).replace('<svg','<svg class="fart-mesa m2"')}${u('saguaro',80,140).replace('<svg','<svg class="fart-sag s1"')}${u('saguaro',80,140).replace('<svg','<svg class="fart-sag s2"')}<div class="fart-ground"></div></div><div class="fart-fig" aria-hidden="true">${u('hazmat-figure',100,200)}</div></div>
 <div class="wrap"><p class="tag-line">${COPY.brand.tagline}</p><p>${COPY.brand.footer}</p>
 <div class="links"><a href="index.html#tools">${COPY.footer.tools}</a><a href="index.html#about">${COPY.footer.about}</a>
 <a href="https://breakingbad.fandom.com/wiki/Los_Pollos_Hermanos" target="_blank" rel="noopener">${COPY.footer.pollos}</a></div>${credit('foot')}</div>`;}
function bind(){document.querySelectorAll('[data-copy]').forEach(e=>{const v=t(e.dataset.copy);
  e.hasAttribute('data-el')?elementize(e,v,t(e.dataset.el)):e.textContent=v;});
 document.querySelectorAll('[data-copy-aria]').forEach(e=>e.setAttribute('aria-label',t(e.dataset.copyAria)));
 document.querySelectorAll('[data-scene]').forEach(e=>e.insertAdjacentHTML('afterbegin',scene(e.dataset.scene)));
 document.querySelectorAll('[data-char]').forEach(e=>{e.innerHTML=char(e.dataset.char,t('alt.'+e.dataset.char),'',e.matches('.hero-char,.tool-char,.nf-char'));
  const c=e.firstElementChild;e.classList.add('char','cutout');if(e.matches('.hero-char'))e.classList.add('char--lowres');e.style.cssText+=c.getAttribute('style');c.className='';e.replaceChildren(...c.childNodes);});
 document.querySelectorAll('[data-prop]').forEach(e=>e.innerHTML=prop(e.dataset.prop));
 document.querySelectorAll('[data-sep=tiles]').forEach(e=>e.innerHTML=TOOLS.map(x=>`<i class="mini">${x.sym}</i>`).join(''));
 document.querySelectorAll('[data-tiles]').forEach(e=>renderTiles(e,JSON.parse(e.dataset.tiles)));
 document.querySelectorAll('[data-promise]').forEach(e=>{e.innerHTML=COPY.home.promises.map((p,i)=>{const [a,b]=p.split(' — ');
  return `<div class="tile pt" style="--i:${i}"><span class="num mono">${i+1}</span><span class="pt-l"><span class="ico ico--s" aria-hidden="true">${ico(['gas-mask','money-stack','flask'][i],34)}</span><span class="sym">${COPY.home.promiseSyms[i]}</span></span><span class="name"><b>${a}</b>${b}</span></div>`}).join('');});
 document.querySelectorAll('[data-how]').forEach(e=>{const H=COPY.home,file='<path d="M8 6H42L56 20V68Q56 72 52 72H12Q8 72 8 68Z" fill="#F2EBD8" stroke="#0A0C0A" stroke-width="3" stroke-linejoin="round"/><path d="M42 6V20H56" fill="#D6C08F" stroke="#0A0C0A" stroke-width="3" stroke-linejoin="round"/><path d="M18 36H46M18 46H46M18 56H36" stroke="#1E7A3C" stroke-width="4" stroke-linecap="round"/>';
  const art=[`<svg viewBox="0 0 150 100" aria-hidden="true" focusable="false"><use href="#art-barrel" width="80" height="100"/><g transform="translate(84 10) scale(.85)">${file}</g></svg>`,
   `<svg viewBox="0 0 100 130" aria-hidden="true" focusable="false"><use href="#art-flask" width="100" height="130"/><g class="bub"><circle cx="46" cy="30" r="5"/><circle cx="58" cy="18" r="3.5"/><circle cx="50" cy="6" r="2.5"/></g></svg>`,
   `<svg viewBox="0 0 120 90" aria-hidden="true" focusable="false"><use href="#art-money-stack" width="120" height="90"/></svg>`];
  e.innerHTML=H.how.map((s,i)=>`<li class="tile step" style="--i:${i}"><span class="stepn" aria-hidden="true">${i+1}</span><span class="sr-only">${H.howStep.replace('{n}',i+1)}: </span><div class="ico ico--l" aria-hidden="true">${art[i]}</div><h3>${s.t}</h3><p>${s.d}</p></li>`).join('');});
 document.querySelectorAll('[data-faq]').forEach(e=>{e.innerHTML=COPY.home.faq.map((f,i)=>`<div class="faq-i"><h3><button type="button" class="faq-q" id="fq${i}" aria-expanded="false" aria-controls="fa${i}"><span>${f.q}</span><i class="faq-x" aria-hidden="true"></i></button></h3><div class="faq-a" id="fa${i}" role="region" aria-labelledby="fq${i}" hidden><p>${f.a}</p></div></div>`).join('');
  const bs=[...e.querySelectorAll('.faq-q')];
  bs.forEach((b,i)=>{b.addEventListener('click',()=>{const o=b.getAttribute('aria-expanded')==='true';b.setAttribute('aria-expanded',String(!o));document.getElementById(b.getAttribute('aria-controls')).hidden=o;});
   b.addEventListener('keydown',ev=>{const k={ArrowDown:(i+1)%bs.length,ArrowUp:(i+bs.length-1)%bs.length,Home:0,End:bs.length-1}[ev.key];if(k===undefined)return;ev.preventDefault();bs[k].focus();});});});
 if($('#hero'))document.title=COPY.home.title;}
/** Boots every page: css vars, chrome, copy, motion, title music, eggs, intro. */
export function init(){installCssVars();installGrade();navbar();if($('#footer'))footer();bind();initScenes();initFx();initMotion();initEggs();
 if(reducedMotion)document.querySelectorAll('svg').forEach(s=>s.pauseAnimations?.());
 initTheme(ASSETS.audio.intro.src);
 if($('#hero'))initIntro();}
init();

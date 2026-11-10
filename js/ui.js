/* ui.js — navbar, footer, tiles, copy binding, theme, sound toggle, easter eggs, reduced motion */
import {ASSETS,installCssVars,hasAudio,scene,char,prop} from './assets.js';
import {COPY,TOOLS,t} from './copy.js';
import {reducedMotion,toast} from './ui-kit.js';
import {available,isOn,setOn,play} from './sound.js';
import {initEggs} from './eggs.js';
import {initFx} from './fx.js';
import {initIntro} from './intro.js';
import {installGrade} from './grade.js';
export {reducedMotion,toast};
const $=(s,r=document)=>r.querySelector(s);
/** Wraps the first matching occurrence of each symbol in the text as an element tile ("Co"ok, do"Cu"ments). */
export function elementize(el,text,syms){const sy=[...syms];
 el.innerHTML=text.split(' ').map(w=>{let h='',i=0;const lw=w.toLowerCase();
  while(sy.length){const j=lw.indexOf(sy[0].toLowerCase(),i);if(j<0)break;h+=w.slice(i,j)+`<span class="el" aria-hidden="true">${sy.shift()}</span>`;i=j+2;}
  return `<span class="w">${h+w.slice(i)}</span>`;}).join(' ');el.setAttribute('aria-label',text);}
/** Renders tool tiles. opts.live / opts.soon select groups; opts.exclude hides the current tool (tool pages). */
export function renderTiles(el,{live=true,soon=false,exclude=''}={}){
 el.innerHTML=TOOLS.filter(x=>(x.live?live:soon)&&x.sym!==exclude).map((x,i)=>x.live
  ?`<a class="tile" style="--i:${i}" href="${x.href}"><span class="num mono">${x.n}</span><span class="mass mono">${x.mass}</span><span class="sym">${x.sym}</span><span class="name">${COPY.tools[x.sym].name}</span></a>`
  :`<div class="tile tile--soon" style="--i:${i}" aria-disabled="true"><img class="face" src="${ASSETS.char.hank.src}" alt="" loading="lazy" decoding="async"><span class="num mono">${x.n}</span><span class="mass mono">??</span><span class="sym">${x.sym}</span><span class="tag">${COPY.home.soonNote}</span><span class="name">${x.name}</span></div>`).join('');}
/** Creator credit in the Breaking Bad title treatment (periodic-table tiles). Not interactive. `where` = 'nav' | 'foot' (CSS shows one of them). */
function credit(where){const c=COPY.credit;
 return `<div class="credit credit--${where}" role="img" aria-label="${c.aria}" title="${c.aria}"><span class="credit-by mono" aria-hidden="true">${c.by}</span><span class="credit-name" aria-hidden="true">${c.name.map(p=>typeof p==='string'?(p===' '?'<span class="cg"></span>':`<span class="cl">${p}</span>`):`<span class="ct"><i class="cn">${p[1]}</i><b>${p[0]}</b></span>`).join('')}</span></div>`;}
function navbar(){const home=!!$('#hero');const base=home?'':'index.html';
 const m=$('main');if(m){m.id='main';m.tabIndex=-1;}
 $('#topbar').outerHTML=`<a class="skip" href="#main">${COPY.nav.skip}</a><header class="topbar"><div class="wrap"><a class="logo" href="index.html" aria-label="${COPY.brand.name}"><img src="${ASSETS.brand.logo.src}" alt="${COPY.brand.name}" width="125" height="54"></a>
 ${credit('nav')}
 <nav class="nav" aria-label="${COPY.nav.aria}"><a href="${base}#tools">${COPY.nav.tools}</a><a href="${base}#about">${COPY.nav.about}</a></nav>
 ${hasAudio()?`<button class="sound" id="snd" aria-pressed="false">${COPY.nav.soundOff}</button>`:''}</div></header>`;}
function footer(){const f=$('#footer');f.className='footer';
 f.innerHTML=`<div class="tape"></div>${scene('night')}<div class="gus">${char('gus',COPY.alt.gus)}</div>
 <div class="wrap"><p class="tag-line">${COPY.brand.tagline}</p><p>${COPY.brand.footer}</p>
 <div class="links"><a href="index.html#tools">${COPY.footer.tools}</a><a href="index.html#about">${COPY.footer.about}</a>
 <a href="https://breakingbad.fandom.com/wiki/Los_Pollos_Hermanos" target="_blank" rel="noopener"><img src="${ASSETS.props.pollos.src}" alt="${COPY.alt.pollos}" loading="lazy" decoding="async">${COPY.footer.pollos}</a></div>${credit('foot')}</div>`;}
function bind(){document.querySelectorAll('[data-copy]').forEach(e=>{const v=t(e.dataset.copy);
  e.hasAttribute('data-el')?elementize(e,v,t(e.dataset.el)):e.textContent=v;});
 document.querySelectorAll('[data-copy-aria]').forEach(e=>e.setAttribute('aria-label',t(e.dataset.copyAria)));
 document.querySelectorAll('[data-scene]').forEach(e=>e.insertAdjacentHTML('afterbegin',scene(e.dataset.scene)));
 document.querySelectorAll('[data-char]').forEach(e=>{e.innerHTML=char(e.dataset.char,t('alt.'+e.dataset.char),'',e.matches('.hero-char,.tool-char,.nf-char'));
  const c=e.firstElementChild;e.classList.add('char');if(e.matches('.hero-char'))e.classList.add('char--lowres');e.style.cssText+=c.getAttribute('style');c.className='';e.replaceChildren(...c.childNodes);});
 document.querySelectorAll('[data-prop]').forEach(e=>e.innerHTML=prop(e.dataset.prop));
 document.querySelectorAll('[data-tiles]').forEach(e=>renderTiles(e,JSON.parse(e.dataset.tiles)));
 document.querySelectorAll('[data-promise]').forEach(e=>{e.innerHTML=COPY.home.promises.map((p,i)=>{const [a,b]=p.split(' — ');
  return `<div class="tile pt" style="--i:${i}"><span class="num mono">${i+1}</span><span class="sym">${COPY.home.promiseSyms[i]}</span><span class="name"><b>${a}</b>${b}</span></div>`}).join('');});
 if($('#hero'))document.title=COPY.home.title;}
/** Boots every page: css vars, chrome, copy, motion, sound toggle, eggs, intro. */
export function init(){installCssVars();installGrade();navbar();if($('#footer'))footer();bind();initFx();initEggs();
 if(reducedMotion)document.querySelectorAll('svg').forEach(s=>s.pauseAnimations?.());
 const s=$('#snd');if(s&&available())s.onclick=()=>{const on=setOn(!isOn());s.setAttribute('aria-pressed',on);s.textContent=on?COPY.nav.soundOn:COPY.nav.soundOff;if(on)play('click');};
 if($('#hero'))initIntro();}
init();

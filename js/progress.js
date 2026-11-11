/* progress.js — themed progress components. RV driving across a road with a percentage. Never a bare spinner. */
import {prop} from './assets.js';
import {COPY,t} from './copy.js';
import {fill,pick,clamp} from './format.js';

/** @returns {string} a random themed loading line (COPY.md "Progress / loading lines") */
export const loadingLine=()=>pick(COPY.progress.lines);

/**
 * Mounts the RV progress into `host` (replaces its content).
 * @param {HTMLElement} host
 * @param {{onCancel?:()=>void}} [o]
 * @returns {{set(fraction:number, detail?:string):void, start():void, stop():void, destroy():void}}
 */
export function createRvProgress(host,{onCancel}={}){
 host.innerHTML=`<div class="rvp" role="group" aria-label="${t('progress.label')}">
  <div class="rvp-top"><span class="rvp-verb">${t('tools.Im.verb')}</span><span class="rvp-pct mono" aria-hidden="true">0%</span></div>
  <div class="rvp-road" aria-hidden="true">
   <div class="rvp-sky"></div><div class="rvp-cacti"><span>${prop('cactus')}</span><span>${prop('cactus')}</span><span>${prop('cactus')}</span></div>
   <div class="rvp-lane"><i class="rvp-dash"></i></div>
   <div class="rvp-rv" style="--p:0"><span class="rvp-dust"><i class="rvp-puff"></i><i class="rvp-puff"></i></span><span class="rvp-body">${prop('rv','','',true)}<i class="rvp-hl"></i></span></div>
   <div class="rvp-flag">${prop('blueCrystals')}</div>
  </div>
  <div class="rvp-bot"><span class="rvp-line mono"></span><span class="rvp-detail mono"></span></div>
  <p class="sr-only" role="status" aria-live="polite"></p>
  <span class="sr-only sr-bar" role="progressbar" aria-label="${t('progress.label')}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"></span>
  <button type="button" class="btn btn-2 rvp-cancel">${t('progress.cancel')}</button>
 </div>`;
 const $=s=>host.querySelector(s);
 const bar=$('.rvp'),pct=$('.rvp-pct'),rv=$('.rvp-rv'),line=$('.rvp-line'),detail=$('.rvp-detail'),live=$('p.sr-only'),meter=$('.sr-bar');
 let timer=null,lastSaid=-10;
 $('.rvp-cancel').addEventListener('click',()=>onCancel&&onCancel());
 const cycle=()=>{line.textContent=loadingLine();};
 return {
  set(fraction,d=''){
   const p=Math.round(clamp(fraction,0,1)*100);
   meter.setAttribute('aria-valuenow',p);pct.textContent=p+'%';
   rv.style.setProperty('--p',p/100);     // css/motion.css turns --p into a translateX on a track one RV-width shorter than the road: stays inside the road at 100%
   detail.textContent=d;
   if(p-lastSaid>=10||p===100){lastSaid=p;live.textContent=`${p}%${d?' — '+d:''}`;}
  },
  start(){lastSaid=-10;bar.classList.add('is-running');pct.textContent='0%';rv.style.setProperty('--p',0);detail.textContent='';cycle();clearInterval(timer);timer=setInterval(cycle,2600);},
  stop(){bar.classList.remove('is-running');clearInterval(timer);timer=null;},
  destroy(){clearInterval(timer);host.replaceChildren();}
 };
}

/** Formats the "Image n of total" detail line. */
export const countText=(n,total)=>fill(t('progress.count'),{n,total});

/* ───────────── Phase 3: flask progress (Compress PDF) ───────────── */
let flaskUid=0;
const FLASK='M82 10H118V104L186 218Q198 248 166 248H34Q2 248 14 218L82 104Z';
/**
 * Flask fills with blue-sky liquid and rises bubbles while the percentage ticks ("Cooking… {percent}%").
 * Same interface as createRvProgress. @param {HTMLElement} host @param {{onCancel?:()=>void}} [o]
 * @returns {{set(fraction:number, detail?:string):void, start():void, stop():void, destroy():void}}
 */
export function createFlaskProgress(host,{onCancel}={}){
 const id='fl'+(flaskUid++),verbOf=p=>fill(t('tools.Cp.verb'),{percent:p});
 const bubbles=[[60,0,16,0],[90,.7,10,.3],[118,.2,13,.9],[75,1.1,8,1.4],[135,.5,11,.6],[100,1.5,7,1.9],[48,.9,9,1.2]]
  .map(([x,d,r,o])=>`<circle class="fl-b" cx="${x}" cy="236" r="${r*.5+3}" style="animation-delay:${d+o*.2}s"/>`).join('');
 host.innerHTML=`<div class="flp" role="group" aria-label="${t('progress.label')}">
  <div class="flp-flask" aria-hidden="true">
   <svg viewBox="0 0 200 262" width="100%"><defs><clipPath id="${id}c"><path d="${FLASK}"/></clipPath>
    <linearGradient id="${id}l" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9fe9ff"/><stop offset=".35" stop-color="#55D0FF"/><stop offset="1" stop-color="#1b86b8"/></linearGradient></defs>
    <path d="${FLASK}" fill="#ffffff14"/>
    <g clip-path="url(#${id}c)"><g class="fl-liq" style="transform:translateY(248px)"><rect y="6" width="200" height="300" fill="url(#${id}l)"/>
     <path class="fl-wave" d="M-40 6q25-12 50 0t50 0t50 0t50 0t50 0V20H-40z" fill="#bff0ff"/></g>
     <g class="fl-bubbles">${bubbles}</g></g>
    <path d="${FLASK}" fill="none" stroke="#e9fbff" stroke-width="5" stroke-linejoin="round"/>
    <path d="M76 8H124" stroke="#e9fbff" stroke-width="8" stroke-linecap="round"/>
    <path d="M96 26v70M104 30v60" stroke="#fff" stroke-opacity=".28" stroke-width="3" stroke-linecap="round"/></svg>
  </div>
  <div class="flp-info">
   <span class="flp-verb">${verbOf(0)}</span>
   <span class="flp-line mono"></span><span class="flp-detail mono"></span>
   <p class="sr-only" role="status" aria-live="polite"></p>
  <span class="sr-only sr-bar" role="progressbar" aria-label="${t('progress.label')}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"></span>
   <button type="button" class="btn btn-2 flp-cancel">${t('progress.cancel')}</button>
  </div></div>`;
 const $=s=>host.querySelector(s),bar=$('.flp'),liq=$('.fl-liq'),verb=$('.flp-verb'),line=$('.flp-line'),detail=$('.flp-detail'),live=$('p.sr-only'),meter=$('.sr-bar');
 let timer=null,lastSaid=-10;
 $('.flp-cancel').addEventListener('click',()=>onCancel&&onCancel());
 const cycle=()=>{line.textContent=loadingLine();};
 return {
  set(fraction,d=''){
   const p=Math.round(clamp(fraction,0,1)*100);
   meter.setAttribute('aria-valuenow',p);verb.textContent=verbOf(p);detail.textContent=d;
   liq.style.transform=`translateY(${248-p*1.42}px)`;                         // empty at the base, full at the neck
   if(p-lastSaid>=10||p===100){lastSaid=p;live.textContent=`${p}%${d?' — '+d:''}`;}
  },
  start(){lastSaid=-10;bar.classList.add('is-running');verb.textContent=verbOf(0);liq.style.transform='translateY(248px)';detail.textContent='';cycle();clearInterval(timer);timer=setInterval(cycle,2600);},
  stop(){bar.classList.remove('is-running');clearInterval(timer);timer=null;},
  destroy(){clearInterval(timer);host.replaceChildren();}
 };
}

/* ───────────── Phase 4: slide-pile progress (PPT to PDF) ───────────── */
const miniSlide=()=>`<span class="pl-card"><i class="pl-bar"></i><i class="pl-ln"></i><i class="pl-ln pl-ln--s"></i><i class="pl-tile"></i></span>`;
/**
 * A stack of slides flips, one by one, onto a pile while "Slide {n} of {total}…" ticks.
 * Same interface as the other progress components, with one extra: set(fraction, detail, slide) takes
 * slide={n,total} to write the verb; without it the verb is `phase` (e.g. "Opening the deck…").
 * @param {HTMLElement} host @param {{onCancel?:()=>void}} [o]
 * @returns {{set(fraction:number, detail?:string, slide?:{n:number,total:number}|null, phase?:string):void, start():void, stop():void, destroy():void}}
 */
export function createPileProgress(host,{onCancel}={}){
 host.innerHTML=`<div class="plp" role="group" aria-label="${t('progress.label')}">
  <div class="plp-top"><span class="plp-verb">${t('progress.opening')}</span><span class="plp-pct mono" aria-hidden="true">0%</span></div>
  <div class="plp-stage" aria-hidden="true">
   <div class="plp-desk"></div>
   <div class="plp-stack">${[0,1,2,3,4].map(i=>`<span class="pl-s" style="--k:${i}">${miniSlide()}</span>`).join('')}</div>
   <div class="plp-fly"><span class="pl-flip">${miniSlide()}</span></div>
   <div class="plp-pile">${[0,1,2,3,4,5].map(i=>`<span class="pl-p" style="--k:${i}">${miniSlide()}</span>`).join('')}</div>
  </div>
  <div class="plp-bot"><span class="plp-line mono"></span><span class="plp-detail mono"></span></div>
  <p class="sr-only" role="status" aria-live="polite"></p>
  <span class="sr-only sr-bar" role="progressbar" aria-label="${t('progress.label')}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"></span>
  <button type="button" class="btn btn-2 plp-cancel">${t('progress.cancel')}</button>
 </div>`;
 const $=s=>host.querySelector(s);
 const bar=$('.plp'),pct=$('.plp-pct'),verb=$('.plp-verb'),line=$('.plp-line'),detail=$('.plp-detail'),live=$('p.sr-only'),meter=$('.sr-bar');
 const stack=[...host.querySelectorAll('.pl-s')],pile=[...host.querySelectorAll('.pl-p')];
 let timer=null,lastSaid=-10,order=[...COPY.progress.saulLines],li=0;
 $('.plp-cancel').addEventListener('click',()=>onCancel&&onCancel());
 const cycle=()=>{line.textContent=order[li++%order.length];};
 return {
  set(fraction,d='',slide=null,phase=''){
   const p=Math.round(clamp(fraction,0,1)*100);
   meter.setAttribute('aria-valuenow',p);pct.textContent=p+'%';detail.textContent=d;
   verb.textContent=slide?fill(t('tools.Pp.verb'),{n:slide.n,total:slide.total}):(phase||t('progress.opening'));
   stack.forEach((e,i)=>e.classList.toggle('is-gone',p>=(i+1)/stack.length*100-8));   // the inbox thins out…
   pile.forEach((e,i)=>e.classList.toggle('is-on',p>=i/pile.length*100+4));           // …while the pile grows
   if(p-lastSaid>=10||p===100){lastSaid=p;live.textContent=`${verb.textContent} ${p}%`;}
  },
  start(){lastSaid=-10;li=Math.floor(Math.random()*order.length);bar.classList.add('is-running');pct.textContent='0%';detail.textContent='';
   stack.forEach(e=>e.classList.remove('is-gone'));pile.forEach(e=>e.classList.remove('is-on'));cycle();clearInterval(timer);timer=setInterval(cycle,2800);},
  stop(){bar.classList.remove('is-running');clearInterval(timer);timer=null;},
  destroy(){clearInterval(timer);host.replaceChildren();}
 };
}

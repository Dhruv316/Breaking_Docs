/* eggs.js — Konami code + logo-x5 easter eggs. Silent unless sound is on (knock for Konami, two thumps for the pizza). */
import {ASSETS,char,prop} from './assets.js';
import {COPY} from './copy.js';
import {play,setOn,playIntro} from './sound.js';
import {reducedMotion,toast} from './ui-kit.js';
const $=(s,r=document)=>r.querySelector(s);
/** Warms the browser cache so an egg's image is ready the moment it fires. */
const warm=src=>{try{new Image().src=src;}catch{}};
const KONAMI='ArrowUp,ArrowUp,ArrowDown,ArrowDown,ArrowLeft,ArrowRight,ArrowLeft,ArrowRight,b,a'.split(',');
/** Heisenberg slides in from the edge with a speech bubble; knocks the screen edges. */
export function konami(){if($('.knock'))return;play('knock');
 const k=document.createElement('div');k.className='knock';k.setAttribute('role','status');
 k.innerHTML=`<div class="knock-char" aria-hidden="true">${char('greenShirtGun','','',true)}</div><p class="knock-line">${COPY.eggs.konami}</p>`;
 document.body.append(k);document.body.classList.add('knocking');
 setTimeout(()=>document.body.classList.remove('knocking'),900);
 setTimeout(()=>k.classList.add('out'),reducedMotion?2800:3000);setTimeout(()=>k.remove(),reducedMotion?3000:3500);}
/** Pizza lands on the roof (the navbar), bounces once, stays a moment. */
export function pizza(){play('thump');toast(COPY.eggs.logo);const d=document.createElement('div');d.className='pizza';d.setAttribute('aria-hidden','true');d.innerHTML=prop('pizzaRoof');document.body.append(d);
 setTimeout(()=>d.classList.add('out'),2200);setTimeout(()=>d.remove(),2800);}
/** Wires both eggs. Logo egg is home-only (on other pages a logo click navigates). */
export function initEggs(){let n=0,tm,k=0;
 const cta=$('#hero a.btn[href="#tools"]');   // "Start cooking": the click is the gesture; default anchor scroll is untouched
 if(cta){cta.addEventListener('click',()=>{try{setOn(true);playIntro(ASSETS.audio.intro.src);}catch{}});
  cta.addEventListener('keydown',e=>{if(e.key===' '){e.preventDefault();cta.click();}});}
 document.addEventListener('click',e=>{if(!e.target.closest('.logo')||!$('#hero'))return;e.preventDefault();scrollTo({top:0,behavior:reducedMotion?'auto':'smooth'});
  clearTimeout(tm);tm=setTimeout(()=>n=0,1500);if(n===0)warm(ASSETS.props.pizzaRoof.src);if(++n<5)return;n=0;pizza();});
 addEventListener('keydown',e=>{if(typeof e.key!=='string'||e.target.closest?.('input,textarea,select,[contenteditable]'))return;   // autofill fires keydown events with no key
  k=e.key===KONAMI[k]||e.key.toLowerCase()===KONAMI[k]&&k>7?k+1:e.key===KONAMI[0]?1:0;if(k===3)warm(ASSETS.char.greenShirtGun.src);if(k<KONAMI.length)return;k=0;konami();});}

/* motion.js — Round 2B glue for the CSS in css/motion.css. No tool logic.
   1) File cards: a freshly added thumbnail gets .is-new once (so reordering, which re-inserts nodes, never replays the slide-in).
   2) Page-transition fallback: browsers without cross-document View Transitions (no `pagereveal`) get html.pg-fb from a tiny head script;
      CSS fades the new page in, and a plain click on an internal link adds html.pg-leave for a 120 ms fade-out. Navigation is never delayed or cancelled. */
import {reducedMotion} from './ui-kit.js';
const root=document.documentElement;
function cards(){const list=document.querySelector('.thumbs');if(!list||reducedMotion||!('MutationObserver'in window))return;
 const seen=new WeakSet();list.querySelectorAll('.imgtile').forEach(e=>seen.add(e));
 new MutationObserver(recs=>{let n=0;for(const r of recs)for(const el of r.addedNodes){
   if(el.nodeType!==1||!el.matches('.imgtile:not(.addtile)')||seen.has(el))continue;seen.add(el);
   if(document.hidden)continue;
   el.style.setProperty('--n',Math.min(n++,8));el.classList.add('is-new');
   const off=()=>{el.classList.remove('is-new');el.style.removeProperty('--n');};
   el.addEventListener('animationend',off,{once:true});setTimeout(off,1200);}}).observe(list,{childList:true});}
function fallbackFade(){if(reducedMotion||!root.classList.contains('pg-fb'))return;
 document.addEventListener('click',e=>{
  if(e.defaultPrevented||e.button!==0||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;
  const a=e.target.closest&&e.target.closest('a[href]');if(!a||a.hasAttribute('download')||(a.target&&a.target!=='_self'))return;
  let u;try{u=new URL(a.href,location.href);}catch{return;}
  if(u.origin!==location.origin||(u.pathname===location.pathname&&u.search===location.search))return;   // other site, or same page (#hash)
  root.classList.add('pg-leave');setTimeout(()=>root.classList.remove('pg-leave'),1500);   // never stays faded if the navigation does not happen
 });
 addEventListener('pageshow',()=>root.classList.remove('pg-leave'));}
/** Wires file-card entrances and the page-transition fallback. Safe to call on every page. */
/** Compress PDF scene parallax: pointer position -> --px/--py (-1..1) on the section; CSS applies `translate` only. Off on touch / reduced motion. */
function parallax(){const t=document.querySelector('.tool--lab,.tool:has(.scene[data-bg=pilot])');
 if(!t||reducedMotion||matchMedia('(hover:none)').matches)return;let r=0;
 addEventListener('pointermove',e=>{if(r)return;r=requestAnimationFrame(()=>{r=0;
  t.style.setProperty('--px',((e.clientX/innerWidth)*2-1).toFixed(3));t.style.setProperty('--py',((e.clientY/innerHeight)*2-1).toFixed(3));});},{passive:true});}
export function initMotion(){cards();fallbackFade();parallax();}

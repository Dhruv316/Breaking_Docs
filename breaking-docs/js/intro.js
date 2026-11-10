/* intro.js — first-visit intro on Home: Br + Dc tiles flip in, overlay lifts, hero + tool grid reveal. Skippable (button, Esc, Enter, Space, click).
   The overlay markup lives in index.html (hidden by default); an inline head script adds html.intro-on before first paint so nothing flashes. */
import {store,reducedMotion} from './ui-kit.js';
const KEY='bd.intro.v1',DURATION=3300;
const root=document.documentElement;
/** @returns {boolean} true if the intro should play now */
export const shouldPlay=()=>!reducedMotion&&!location.hash&&(new URLSearchParams(location.search).has('intro')||!store.get(KEY));
/** Finishes the page state even if the intro never ran (called on every Home load). */
function release(){root.classList.remove('intro-on');root.classList.add('intro-done');}
/** Runs the intro. Safe to call when no overlay exists. */
export function initIntro(){const el=document.getElementById('intro');
 if(!el||!root.classList.contains('intro-on')){release();el&&el.remove();return;}
 if(!shouldPlay()){release();el.remove();return;}
 el.hidden=false;store.set(KEY,'1');const skip=el.querySelector('.intro-skip');let done=false,tm;
 const prevFocus=document.activeElement;
 function end(){if(done)return;done=true;clearTimeout(tm);removeEventListener('keydown',key,true);
  el.classList.add('out');release();(prevFocus&&prevFocus.focus?prevFocus:document.body).focus?.({preventScroll:true});
  setTimeout(()=>el.remove(),650);}
 function key(e){if(e.key==='Tab'){e.preventDefault();skip.focus({preventScroll:true});return;}   // keep focus inside the overlay while it is up
  if(e.key==='Escape'||e.key==='Enter'||e.key===' '){e.preventDefault();end();}}
 addEventListener('keydown',key,true);el.addEventListener('click',end);skip.focus({preventScroll:true});
 tm=setTimeout(end,DURATION);}

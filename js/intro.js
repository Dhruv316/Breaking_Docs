/* intro.js — first-visit title card on Home: dark stage, Br then Dc tiles flip in with a soft glow, tagline fades in, the curtain lifts onto the hero (~3 s in all).
   Skippable (button, Esc, Enter, Space, click). The overlay markup lives in index.html (hidden by default); an inline head script adds html.intro-on before first paint
   so nothing flashes, and removes it after 8 s as a failsafe. Sound cues (tile, tile, curtain) go through sound.js and stay silent unless sound is on. */
import {store,reducedMotion} from './ui-kit.js';
import {play} from './sound.js';
const KEY='bd.intro.v1',DURATION=2400;   // the curtain starts to lift here and takes .62 s (css/motion.css)
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
 const cues=[setTimeout(()=>play('tile'),450),setTimeout(()=>play('tile'),800)];   // match the two flips
 function end(fast){if(done)return;done=true;clearTimeout(tm);cues.forEach(clearTimeout);removeEventListener('keydown',key,true);
  el.classList.add('out');if(fast)el.classList.add('fast');play('curtain');release();(prevFocus&&prevFocus.focus?prevFocus:document.body).focus?.({preventScroll:true});
  setTimeout(()=>el.remove(),750);}
 function key(e){if(e.key==='Tab'){e.preventDefault();skip.focus({preventScroll:true});return;}   // keep focus inside the overlay while it is up
  if(e.key==='Escape'||e.key==='Enter'||e.key===' '){e.preventDefault();end(true);}}
 addEventListener('keydown',key,true);el.addEventListener('click',()=>end(true));skip.focus({preventScroll:true});
 tm=setTimeout(()=>end(false),DURATION);}

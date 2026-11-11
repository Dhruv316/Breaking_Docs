/* sound-ui.js — navbar sound control: on/off toggle (always visible) + a small options popover (3 volume steps).
   Markup comes from COPY.nav; behaviour from sound.js. Keyboard: Tab to both buttons, Enter/Space toggles, Esc closes the popover. */
import {COPY} from './copy.js';
import {isOn,setOn,getVolume,setVolume,onChange,play} from './sound.js';
const N=COPY.nav;
const ICON='<svg class="snd-i" viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false"><path d="M3 9h4l5-4v14l-5-4H3z" fill="currentColor"/><g class="snd-w" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M15.5 9a4.5 4.5 0 0 1 0 6"/><path d="M18.4 6.4a8.5 8.5 0 0 1 0 11.2"/></g><g class="snd-x" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M15.5 9.5l5 5M20.5 9.5l-5 5"/></g></svg>';
const CHEV='<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false"><path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
/** Navbar markup. */
export function soundControl(){
 return `<div class="snd" id="snd-wrap"><button type="button" class="sound snd-main" id="snd" aria-pressed="false" aria-label="${N.soundAria}">${ICON}<span class="snd-t" aria-hidden="true">${N.soundOff}</span></button><button type="button" class="sound snd-more" id="snd-more" aria-expanded="false" aria-controls="snd-pop" aria-label="${N.soundOpts}">${CHEV}</button>
 <div class="snd-pop" id="snd-pop" role="group" aria-label="${N.soundOpts}" hidden><p class="snd-h mono" id="snd-vh">${N.vol}</p>
  <div class="snd-vol" role="group" aria-labelledby="snd-vh">${N.volSteps.map((l,i)=>`<button type="button" class="snd-v mono" data-v="${i}" aria-pressed="false">${l}</button>`).join('')}</div></div></div>`;}
/** Wires the control rendered by soundControl(). Safe to call once per page. */
export function mountSound(){const $=s=>document.querySelector(s);const w=$('#snd-wrap');if(!w)return;
 const main=$('#snd'),more=$('#snd-more'),pop=$('#snd-pop');
 const paint=()=>{const on=isOn();main.setAttribute('aria-pressed',on);main.querySelector('.snd-t').textContent=on?N.soundOn:N.soundOff;
  pop.querySelectorAll('.snd-v').forEach(b=>b.setAttribute('aria-pressed',+b.dataset.v===getVolume()));};
 const close=(focus)=>{pop.hidden=true;more.setAttribute('aria-expanded','false');if(focus)more.focus();};
 main.addEventListener('click',()=>{const on=setOn(!isOn());if(on)play('click');});
 more.addEventListener('click',()=>{const open=pop.hidden;pop.hidden=!open;more.setAttribute('aria-expanded',open);});
 pop.querySelectorAll('.snd-v').forEach(b=>b.addEventListener('click',()=>{setVolume(+b.dataset.v);play('click');}));
 w.addEventListener('keydown',e=>{if(e.key==='Escape'&&!pop.hidden){e.stopPropagation();close(true);}});
 w.addEventListener('focusout',e=>{if(!pop.hidden&&!w.contains(e.relatedTarget))close(false);});
 document.addEventListener('pointerdown',e=>{if(!pop.hidden&&!w.contains(e.target))close(false);});
 onChange(paint);paint();}

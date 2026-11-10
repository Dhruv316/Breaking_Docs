/* sound.js — audio manager. OFF by default, never autoplays, and does nothing unless real files are present in ASSETS.audio.
   Public API: available(), isOn(), setOn(bool), play(name), loopStart(name), loopStop(name). Failures are swallowed on purpose. */
import {ASSETS,hasAudio} from './assets.js';
let on=false;const cache=new Map(),loops=new Map();
const THEME_VOL=.25,SFX_VOL=.7;
/** @returns {boolean} true when at least one audio file exists (the navbar toggle is only rendered then) */
export const available=()=>hasAudio();
/** @returns {boolean} current toggle state (in memory only) */
export const isOn=()=>on;
function get(name){const a=ASSETS.audio[name];if(!a||!a.present)return null;
 if(!cache.has(name)){const el=new Audio();el.preload='none';el.src=a.src;el.addEventListener('error',()=>{a.present=false;cache.delete(name);},{once:true});cache.set(name,el);}
 return cache.get(name);}
/** Plays a one-shot effect. No-op when sound is off or the file is missing. */
export function play(name){if(!on)return;const el=get(name);if(!el)return;
 try{el.volume=SFX_VOL;el.currentTime=0;el.play()?.catch(()=>{});}catch{}}
/** Starts a looping sound (bubbling while processing). */
export function loopStart(name){if(!on)return;const el=get(name);if(!el||loops.has(name))return;
 try{el.loop=true;el.volume=name==='theme'?THEME_VOL:SFX_VOL*.6;el.play()?.catch(()=>{});loops.set(name,el);}catch{}}
/** Stops a looping sound. */
export function loopStop(name){const el=loops.get(name);if(!el)return;try{el.pause();el.currentTime=0;}catch{}loops.delete(name);}
/** Turns all sound on/off. Turning on may start the optional theme loop (only from a user gesture). */
export function setOn(v){on=!!v;if(on)loopStart('theme');else[...loops.keys()].forEach(loopStop);return on;}
document.addEventListener('visibilitychange',()=>{if(document.hidden)loops.forEach(e=>e.pause());else if(on)loops.forEach(e=>e.play()?.catch(()=>{}));});

/* fx.js — motion + feel: custom cursors, hat on logo, hero parallax, scroll reveal, state-driven sounds. Everything respects reduced motion. */
import {ASSETS,prop} from './assets.js';
import {play,loopStart,loopStop} from './sound.js';
import {reducedMotion} from './ui-kit.js';
const $=(s,r=document)=>r.querySelector(s);
const shard=(fill,hi)=>`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='28' height='28'%3E%3Cpath d='M3 2l9 4 10 14-8 6L5 14z' fill='%23${fill}' stroke='%23fff' stroke-width='1.5'/%3E%3Cpath d='M3 2l9 4-3 10z' fill='%23${hi}'/%3E%3C/svg%3E") 3 2`;
/** Publishes cursor values as CSS variables: blue shard (default), yellow shard (clickable), pork-pie hat (logo). */
function cursors(){const s=document.documentElement.style;
 s.setProperty('--cur-shard',`${shard('55D0FF','bff0ff')},auto`);
 s.setProperty('--cur-shard-hot',`${shard('F5C400','fff2a8')},pointer`);
 const hat=ASSETS.props.hat;if(!hat.present)return;
 const im=new Image();im.onload=()=>{try{const c=document.createElement('canvas');c.width=c.height=56;c.getContext('2d').drawImage(im,0,0,56,56);
  s.setProperty('--cur-hat',`url("${c.toDataURL('image/png')}") 28 34,pointer`);}catch{}};im.src=hat.src;}
/** Hat that drops onto the navbar logo on hover/focus. */
function logoHat(){const l=$('.logo');if(!l)return;l.insertAdjacentHTML('beforeend',prop('hat','logo-hat'));}
/** Subtle hero-character parallax from the pointer (fine pointers only). */
function parallax(){const h=$('#hero');if(!h||reducedMotion||!matchMedia('(hover:hover) and (pointer:fine)').matches)return;let raf=0;
 h.addEventListener('pointermove',e=>{if(raf)return;raf=requestAnimationFrame(()=>{raf=0;const r=h.getBoundingClientRect();
  h.style.setProperty('--px',((e.clientX-r.left)/r.width-.5).toFixed(3));h.style.setProperty('--py',((e.clientY-r.top)/r.height-.5).toFixed(3));});});}
/** Adds .in to .reveal groups when scrolled into view (or immediately without IntersectionObserver / with reduced motion). */
function reveal(){const els=[...document.querySelectorAll('.reveal')];if(!els.length)return;
 if(reducedMotion||!('IntersectionObserver'in window)){els.forEach(e=>e.classList.add('in'));return;}
 const io=new IntersectionObserver(es=>es.forEach(x=>{if(x.isIntersecting){x.target.classList.add('in');io.unobserve(x.target);}}),{threshold:.2});els.forEach(e=>io.observe(e));}
/** Sound cues driven by DOM state, so tool modules need no changes: clicks, drops, processing loop, success, error. */
function cues(){document.addEventListener('click',e=>{const b=e.target.closest('button,.btn,.tile,.nav a');if(b&&!b.disabled&&b.getAttribute('aria-disabled')!=='true')play('click');},true);
 document.addEventListener('drop',()=>play('drop'),true);
 const t=$('#tool');if(!t)return;let last=t.dataset.state;
 const m=$('#msgs');if(m)new MutationObserver(r=>{if(r.some(x=>x.addedNodes.length))play('error');}).observe(m,{childList:true});   // themed warnings

 new MutationObserver(()=>{const s=t.dataset.state;if(s===last)return;last=s;
  s==='processing'?loopStart('bubbling'):loopStop('bubbling');if(s==='done')play('success');if(s==='error')play('error');}).observe(t,{attributes:true,attributeFilter:['data-state']});}
/** Per-page flags for CSS tuning (grain, vignette). */
function pageFlag(){document.body.dataset.page=$('#hero')?'home':$('.nf')?'notfound':$('#tool')?'tool':'page';}
export function initFx(){pageFlag();cursors();logoHat();parallax();reveal();cues();}

/* titlecards.js — TV-episode title cards (Home) + episode chip (tool pages). Decorative. */
import {COPY} from './copy.js';
const C=COPY.titlecards;
const TOOLS=['image-to-pdf','ppt-to-pdf','compress-pdf','merge-pdf','split-pdf','remove-pages'];
const pad=n=>String(n).padStart(2,'0');
function card(n,title){
 const d=document.createElement('div');d.className='tcard';d.setAttribute('aria-hidden','true');
 d.innerHTML='<i class="tc-grain"></i><i class="tc-bar tc-bar--t"></i><i class="tc-bar tc-bar--b"></i><i class="tc-burn"></i>'
  +'<div class="tc-mid"><span class="tc-tag mono"></span><span class="tc-title"></span><i class="tc-line"></i></div><span class="tc-s mono"></span>';
 d.querySelector('.tc-tag').textContent=C.episode.replace('{n}',n);
 d.querySelector('.tc-title').textContent=title;
 d.querySelector('.tc-s').textContent=C.season;
 return d;
}
function home(){
 const map=[['#tools',C.tools],['#how',C.how],['#about',C.cast],['#faq',C.faq]];
 const cards=[];let n=0;
 map.forEach(([sel,title])=>{
  const sec=document.querySelector('section'+sel);const w=sec&&(sec.querySelector(':scope > .wrap')||sec);
  if(!w||w.querySelector(':scope > .tcard'))return;
  const c=card(++n,title);w.insertBefore(c,w.firstChild);cards.push(c);
 });
 const still=()=>cards.forEach(c=>c.classList.add('is-in','is-done'));
 if(matchMedia('(prefers-reduced-motion: reduce)').matches||!('IntersectionObserver'in window))return still();
 if(matchMedia('(pointer: coarse)').matches||innerWidth<=600)cards.forEach(c=>c.classList.add('tc-lite'));
 const io=new IntersectionObserver(es=>es.forEach(e=>{if(!e.isIntersecting)return;io.unobserve(e.target);
  e.target.classList.add('is-in');setTimeout(()=>e.target.classList.add('is-done'),900);}),{threshold:.4});
 cards.forEach(c=>io.observe(c));
}
function tool(){
 const page=location.pathname.split('/').pop().replace(/\.html$/,'');
 const i=TOOLS.indexOf(page);const h=document.querySelector('.tool-body > .tool-title');
 if(i<0||!h||document.querySelector('.tc-chip-row'))return;
 const r=document.createElement('div');r.className='tc-chip-row';
 r.innerHTML='<span class="tc-chip mono"><i></i><b></b></span>';
 r.querySelector('b').textContent=C.chip.replace('{n}',pad(i+1));
 h.parentNode.insertBefore(r,h);
}
function run(){home();tool();}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',run):run();

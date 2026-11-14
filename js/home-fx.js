/* home-fx.js — Home only: hazard ticker, tile tilt + flip-in, scene parallax, h2 element-symbol decode.
   Additive; transform/opacity only; off under prefers-reduced-motion; lighter on touch / <=600px. */
import {COPY} from './copy.js';
const RM=matchMedia('(prefers-reduced-motion: reduce)').matches,FINE=matchMedia('(pointer: fine)').matches;
const lite=()=>matchMedia('(pointer: coarse)').matches||innerWidth<=600;
const doc=document.documentElement;
document.addEventListener('visibilitychange',()=>doc.classList.toggle('fx-hidden',document.hidden));

function ticker(){const t=COPY.ticker.text+' ';const one=(t.repeat(8));
 document.querySelectorAll('[data-ticker]').forEach(e=>{if(e.firstChild)return;
  e.innerHTML='<div class="tk-track"><span>'+one+'</span><span>'+one+'</span></div>';});}

function tiles(){
 document.querySelectorAll('[data-tiles]').forEach(g=>{
  if(!RM){g.classList.add('tf');
   const io=new IntersectionObserver(es=>{if(es[0].isIntersecting){g.classList.add('tf-in');io.disconnect();}},{threshold:.15});io.observe(g);}});
 if(!FINE||RM)return;
 document.querySelectorAll('[data-tiles] a.tile').forEach(a=>{a.classList.add('tilt');
  a.addEventListener('pointermove',e=>{const r=a.getBoundingClientRect(),px=(e.clientX-r.left)/r.width*2-1,py=(e.clientY-r.top)/r.height*2-1;
   const m=Math.hypot(px,py);a.style.rotate=m<.01?'none':`${(-py).toFixed(3)} ${px.toFixed(3)} 0 ${Math.min(6,6*m).toFixed(2)}deg`;});
  a.addEventListener('pointerleave',()=>{a.style.rotate='none';});});}

function parallax(){if(RM)return;
 const secs=[...document.querySelectorAll('main>section[data-scene]')].map((s,i)=>({s,sc:s.querySelector(':scope>.scene'),rate:[.035,.055,.045,.065,.05][i%5],vis:false})).filter(x=>x.sc);
 if(!secs.length)return;secs.forEach(x=>x.s.classList.add('fx-px'));
 const io=new IntersectionObserver(es=>es.forEach(e=>{const x=secs.find(o=>o.s===e.target);x.vis=e.isIntersecting;}),{rootMargin:'100px'});
 secs.forEach(x=>io.observe(x.s));let q=0;
 const run=()=>{q=0;if(document.hidden)return;const vh=innerHeight,k=lite()?.5:1;
  const rc=secs.map(x=>x.vis?x.s.getBoundingClientRect():null);
  secs.forEach((x,i)=>{const r=rc[i];if(!r)return;const lim=r.height*.05;
   let y=(vh/2-(r.top+r.height/2))*x.rate*k;y=Math.max(-lim,Math.min(lim,y));x.sc.style.translate='0 '+y.toFixed(1)+'px';});};
 const queue=()=>{if(!q)q=requestAnimationFrame(run);};
 addEventListener('scroll',queue,{passive:true});addEventListener('resize',queue,{passive:true});queue();}

const SYM='H He Li Be B C N O F Ne Na Mg Al Si P S Cl Ar K Ca Ti V Cr Mn Fe Co Ni Cu Zn Ga Ge As Se Br Kr Rb Sr Y Zr Nb Mo Ag Cd In Sn Sb Te I Xe Cs Ba W Pt Au Hg Pb Bi U'.split(' ');
const ONE=SYM.filter(s=>s.length===1);
function decode(){if(RM||!('IntersectionObserver'in window))return;
 document.querySelectorAll('main h2').forEach(h=>{
  const txt=h.textContent;if(!txt.trim()||h.children.length)return;
  const fs=parseFloat(getComputedStyle(h).fontSize)||28;
  h.setAttribute('aria-label',txt.trim());
  h.textContent='';const words=txt.split(/(\s+)/),chars=[];
  words.forEach(w=>{if(/^\s+$/.test(w)){h.appendChild(document.createTextNode(w));return;}
   const ws=document.createElement('span');ws.setAttribute('aria-hidden','true');ws.style.cssText='display:inline-block;white-space:nowrap';
   [...w].forEach(ch=>{const c=document.createElement('span');c.className='dc-c';c.textContent=ch;c.dataset.ch=ch;ws.appendChild(c);chars.push(c);});h.appendChild(ws);});
  const wd=chars.map(c=>c.getBoundingClientRect().width);
  chars.forEach((c,i)=>{c.style.width=wd[i].toFixed(2)+'px';});
  const io=new IntersectionObserver(es=>{if(!es[0].isIntersecting)return;io.disconnect();
   const t0=performance.now(),n=chars.length,fin=chars.map((c,i)=>(i/n)*380+Math.random()*220);
   (function step(now){const t=now-t0;let done=true;
    chars.forEach((c,i)=>{if(t>=fin[i]){if(c.textContent!==c.dataset.ch)c.textContent=c.dataset.ch;}
     else{done=false;const wide=wd[i]>fs*.62,pool=wide?SYM:ONE;c.textContent=pool[Math.random()*pool.length|0];}});
    if(!done)requestAnimationFrame(step);else chars.forEach(c=>c.textContent=c.dataset.ch);})(t0);},{threshold:.6});
  io.observe(h);});}

function go(){try{ticker();tiles();parallax();(document.fonts&&document.fonts.ready?document.fonts.ready:Promise.resolve()).then(()=>setTimeout(()=>{try{decode()}catch(e){}},200));}catch(e){}}
if(document.readyState==='complete')setTimeout(go,150);else addEventListener('load',()=>setTimeout(go,150));

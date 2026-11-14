/* ambience.js — per-page particle ambience from [data-ambience]. Behind content (z-index 1, under shade/characters/body),
   transform + opacity only, not mounted under prefers-reduced-motion, paused when hidden or off-screen, 12-20 particles on desktop (6 on touch / <=600px). */
(function(){
 if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
 function boot(){
  var host=document.querySelector('[data-ambience]');if(!host||host.querySelector('.amb'))return;
  var type=host.getAttribute('data-ambience'),lite=matchMedia('(pointer: coarse)').matches||innerWidth<=600;
  var n=lite?5:10,r=Math.random,h='';
  function rnd(a,b){return a+r()*(b-a)}
  function P(style){return '<i class="ap" style="'+style+'"></i>'}
  var i,x;
  if(type==='bubbles'){h='<i class="amb-light"></i>';for(i=0;i<n;i++)h+=P('--x:'+rnd(2,98).toFixed(1)+'%;--s:'+rnd(8,22).toFixed(0)+'px;--t:'+rnd(9,16).toFixed(1)+'s;--d:-'+rnd(0,14).toFixed(1)+'s;--dx:'+rnd(-30,30).toFixed(0)+'px')}
  else if(type==='dust'){h='<i class="amb-shim"></i>';for(i=0;i<n;i++)h+=P('--x:'+rnd(2,98).toFixed(1)+'%;--y:'+rnd(10,90).toFixed(1)+'%;--s:'+rnd(2,4.5).toFixed(1)+'px;--t:'+rnd(12,22).toFixed(1)+'s;--d:-'+rnd(0,18).toFixed(1)+'s;--dx:'+rnd(40,140).toFixed(0)+'px;--dy:'+rnd(-50,30).toFixed(0)+'px')}
  else if(type==='lamp'){h='<i class="amb-light"></i><i class="amb-beam" style="--x:58%"></i><i class="amb-beam" style="--x:78%"></i>';for(i=0;i<n;i++){x=r()<.5?rnd(58,70):rnd(78,90);h+=P('--x:'+x.toFixed(1)+'%;--y:'+rnd(5,85).toFixed(1)+'%;--s:'+rnd(2,4).toFixed(1)+'px;--t:'+rnd(14,24).toFixed(1)+'s;--d:-'+rnd(0,20).toFixed(1)+'s;--dx:'+rnd(-30,30).toFixed(0)+'px;--dy:'+rnd(-60,40).toFixed(0)+'px')}}
  else if(type==='steam'){for(i=0;i<(lite?3:5);i++)h+=P('--x:'+rnd(5,95).toFixed(1)+'%;--s:'+rnd(50,110).toFixed(0)+'px;--t:'+rnd(14,24).toFixed(1)+'s;--d:-'+rnd(0,22).toFixed(1)+'s;--dx:'+rnd(-50,50).toFixed(0)+'px')}
  else if(type==='sparks'){for(i=0;i<n;i++){var left=i%2===0;h+=P('--x:'+(left?rnd(0,6):rnd(94,100)).toFixed(1)+'%;--s:'+rnd(3,5).toFixed(1)+'px;--t:'+rnd(7,13).toFixed(1)+'s;--d:-'+rnd(0,13).toFixed(1)+'s;--dx:'+((left?1:-1)*rnd(60,200)).toFixed(0)+'px;--dy:'+rnd(90,240).toFixed(0)+'px')}}
  else if(type==='embers'){h='<i class="amb-glow"></i>';for(i=0;i<n;i++)h+=P('--x:'+rnd(2,98).toFixed(1)+'%;--s:'+rnd(3,7).toFixed(1)+'px;--t:'+rnd(12,22).toFixed(1)+'s;--d:-'+rnd(0,20).toFixed(1)+'s;--dx:'+rnd(-40,40).toFixed(0)+'px')}
  else return;
  var a=document.createElement('div');a.className='amb amb--'+type;a.setAttribute('aria-hidden','true');a.innerHTML=h;
  function size(){a.style.setProperty('--ah',host.clientHeight+'px')}
  size();addEventListener('resize',size,{passive:true});
  host.appendChild(a);
  function hid(){document.documentElement.classList.toggle('fx-hidden',document.hidden)}
  document.addEventListener('visibilitychange',hid);hid();
  if('IntersectionObserver'in window)new IntersectionObserver(function(es){a.style.display=es[0].isIntersecting?'':'none'}).observe(host);
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();

/* site-life.js — navbar shrink + scroll progress (all pages); Home: how-it-works icons + FAQ accordion. */
(function(){
 var bar,tb,ticking=false;
 function upd(){ticking=false;tb=tb||document.querySelector('.topbar');if(!tb)return;
  if(!bar){bar=document.createElement('div');bar.className='tb-prog';bar.setAttribute('aria-hidden','true');tb.appendChild(bar);}
  var y=window.scrollY||0,max=document.documentElement.scrollHeight-innerHeight;
  tb.classList.toggle('is-small',y>80);
  bar.style.transform='scaleX('+(max>0?Math.min(1,y/max):0)+')';}
 function q(){if(!ticking){ticking=true;requestAnimationFrame(upd);}}
 addEventListener('scroll',q,{passive:true});addEventListener('resize',q,{passive:true});
 function boot(){
  upd();
  document.querySelectorAll('[data-art]').forEach(function(e){if(window.Art)e.innerHTML=Art.svg(e.dataset.art,58);});
  var items=[].slice.call(document.querySelectorAll('.faq-item'));
  items.forEach(function(it){var b=it.querySelector('.faq-q'),p=it.querySelector('.faq-a');
   b.addEventListener('click',function(){var open=b.getAttribute('aria-expanded')==='true';
    items.forEach(function(o){o.querySelector('.faq-q').setAttribute('aria-expanded','false');o.querySelector('.faq-a').classList.remove('open');});
    if(!open){b.setAttribute('aria-expanded','true');p.classList.add('open');}});});
 }
 function go(){
  if(!document.querySelector('[data-art]')||window.Art){boot();return;}
  var s=document.createElement('script');s.src='js/art/sprites.js';s.onload=boot;s.onerror=boot;document.head.appendChild(s);}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){setTimeout(go,0);});else setTimeout(go,0);
 setTimeout(q,300);
})();

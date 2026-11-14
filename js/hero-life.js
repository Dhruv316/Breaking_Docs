/* hero-life.js — additive Home-hero life: foreground saguaros, dust, character parallax. */
(function(){
 var hero=document.getElementById('hero');if(!hero)return;
 var rm=matchMedia('(prefers-reduced-motion: reduce)').matches;
 function add(){
  var ref=hero.querySelector('.shade')||hero.firstChild,h='';
  if(window.Art){
   [['l','hl-sag--l'],['r','hl-sag--r'],['r2','hl-sag--r2']].forEach(function(s){h+='<div class="hl hl-sag '+s[1]+'" aria-hidden="true">'+Art.svg('saguaro',200)+'</div>';});
  }
  h+='<div class="hl hl-sweep" aria-hidden="true"></div><div class="hl hl-fog" aria-hidden="true"></div>';
  ref.insertAdjacentHTML('beforebegin',h);
  if(!rm)dust();
 }
 function dust(){
  var small=matchMedia('(pointer: coarse)').matches||innerWidth<=600,n=small?3:11,d='<div class="hl hl-dust" aria-hidden="true">';
  for(var i=0;i<n;i++){var r=Math.random;
   d+='<i style="--x:'+(r()*100).toFixed(1)+'%;--y:'+(20+r()*75).toFixed(1)+'%;--s:'+(2+r()*3.5).toFixed(1)+'px;--o:'+(.25+r()*.5).toFixed(2)+';--t:'+(16+r()*18).toFixed(1)+'s;--d:-'+(r()*30).toFixed(1)+'s;--dx:'+(80+r()*160).toFixed(0)+'px;--dy:-'+(30+r()*90).toFixed(0)+'px"></i>';}
  hero.insertAdjacentHTML('afterbegin',d+'</div>');
 }
 function parallax(){
  if(rm||!matchMedia('(pointer: fine)').matches)return;
  hero.addEventListener('pointermove',function(e){var r=hero.getBoundingClientRect();
   hero.style.setProperty('--hx',(((e.clientX-r.left)/r.width)*2-1).toFixed(3));hero.style.setProperty('--hy',(((e.clientY-r.top)/r.height)*2-1).toFixed(3));},{passive:true});
 }
 function go(){add();parallax();}
 if(window.Art)go();else{var s=document.createElement('script');s.src='js/art/sprites.js';s.onload=go;s.onerror=go;document.head.appendChild(s);}
 /* pause dust when tab hidden (scenes.js toggles html.sc-hidden too; this is a belt-and-braces fallback) */
 document.addEventListener('visibilitychange',function(){document.documentElement.classList.toggle('hl-hidden',document.hidden);});
})();

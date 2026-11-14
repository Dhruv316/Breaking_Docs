/* scenes.js — top-level SVG/CSS art for the placeholder scenes (sunset, night, lab) + the shared parallax engine.
   Pure SVG/CSS, no asset files, no network. Styles live in css/scenes.css.
   Parallax rules: transform only (translate3d), pauses when the tab is hidden or the scene is off-screen,
   fully off under prefers-reduced-motion, and < 768px shows a simplified version (layers marked data-full are hidden by CSS). */

let uid=0;
/** Small seeded PRNG so every scene is identical on every load. */
const rng=seed=>{let s=seed>>>0||1;return()=>((s=Math.imul(s^s>>>15,s|1),s^=s+Math.imul(s^s>>>7,s|61),((s^s>>>14)>>>0)/4294967296));};
const f1=n=>Math.round(n*10)/10;

/** Mesa ridge path in a 1920x500 box. Flat tops, stepped ledges, sloped flanks, valleys near y0. */
function ridge(seed,y0,hMin,hMax,wMin,wMax,ledge=.34){
 const r=rng(seed),R=(a,b)=>a+(b-a)*r();let x=-80,d=`M-80 520L-80 ${y0}`;
 while(x<2000){const w=R(wMin,wMax),h=R(hMin,hMax),top=y0-h,s1=R(18,46),s2=R(18,46),ly=y0-h*ledge,lw=R(22,70),rw=R(22,70),has=r()<.7;
  const gap=R(30,120);
  d+=`L${f1(x)} ${y0}`;
  if(has)d+=`L${f1(x+s1)} ${f1(ly)}L${f1(x+s1+lw)} ${f1(ly)}`;
  d+=`L${f1(x+s1+(has?lw:0)+s2)} ${f1(top)}L${f1(x+w-s2-(has?rw:0))} ${f1(top+R(0,5))}`;
  if(has)d+=`L${f1(x+w-rw)} ${f1(ly+R(0,10))}L${f1(x+w)} ${f1(ly+R(0,10))}`;
  d+=`L${f1(x+w+s2*.7)} ${f1(y0+R(-4,6))}`;x+=w+gap;}
 return d+`L2000 ${y0}L2000 520z`;}
/** Saguaro, origin at its base. */
const sag=(x,y,s,c,arms=3)=>`<g transform="translate(${x} ${y}) scale(${s})" fill="${c}" stroke="${c}"><rect x="-15" y="-210" width="30" height="210" rx="15" stroke="none"/>
 ${arms&1?'<path d="M-12-70H-38Q-50-70-50-82V-132" stroke-width="22" stroke-linecap="round" fill="none"/>':''}
 ${arms&2?'<path d="M12-104H36Q48-104 48-116V-156" stroke-width="22" stroke-linecap="round" fill="none"/>':''}</g>`;
/** Boulder with an optional rim-light stroke on the sun side. */
const rock=(x,w,h,c,rim)=>{const d=`M${x} 520L${x} 500C${x+w*.04} ${500-h*.7} ${x+w*.3} ${500-h} ${x+w*.52} ${500-h*.94}S${x+w*.96} ${500-h*.5} ${x+w} 500V520z`;
 return `<path d="${d}" fill="${c}"/>${rim?`<path d="M${x+w*.04} ${500-h*.62}C${x+w*.12} ${500-h*.92} ${x+w*.3} ${500-h*.99} ${x+w*.5} ${500-h*.93}" fill="none" stroke="${rim}" stroke-width="3" stroke-linecap="round" opacity=".7"/>`:''}`;};
const layer=(cls,kx,ky,inner,full)=>`<div class="sc-l ${cls}" data-kx="${kx}" data-ky="${ky}"${full?' data-full':''}>${inner}</div>`;
const ground=(vb,inner,defs='')=>`<svg viewBox="0 0 1920 ${vb}" preserveAspectRatio="xMidYMax slice" focusable="false" aria-hidden="true"><defs>${defs}</defs>${inner}</svg>`;
const LOW=matchMedia('(pointer: coarse)').matches||innerWidth<=600;
const dust=n=>Array.from({length:n},(_,i)=>{const r=rng(900+i*7);
 return `<i class="sc-dust" ${i>=4?'data-full ':''}style="left:${f1(r()*100)}%;bottom:${f1(8+r()*52)}%;--s:${f1(2+r()*3)}px;--dx:${f1(60+r()*160)}px;--dy:${f1(-30-r()*90)}px;--t:${f1(11+r()*12)}s;--d:${f1(-r()*20)}s"></i>`}).join('');

/** Desert sunset, Home hero. 5 depth layers + sun/rays + dust + heat shimmer + lens flare. */
export function sunsetScene(){
 const id='ss'+(uid++);
 const farD=ridge(11,380,110,210,150,300,.4),midD=ridge(29,446,120,250,170,340,.36);
 const far=ground(500,`<path d="${farD}" fill="url(#${id}f)"/><rect y="290" width="1920" height="170" fill="url(#${id}h)"/>`,
  `<linearGradient id="${id}f" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c0583a"/><stop offset=".6" stop-color="#8a3b32"/><stop offset="1" stop-color="#6a2a2e"/></linearGradient>
   <linearGradient id="${id}h" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffb35a" stop-opacity="0"/><stop offset="1" stop-color="#ffb35a" stop-opacity=".5"/></linearGradient>`);
 const mid=ground(500,`<path d="${midD}" fill="url(#${id}m)"/><path d="${midD}" fill="none" stroke="#ff9a4a" stroke-width="2" opacity=".28"/>`,
  `<linearGradient id="${id}m" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7a2c22"/><stop offset=".55" stop-color="#4a1a16"/><stop offset="1" stop-color="#2a0e0c"/></linearGradient>`);
 const fg=ground(500,`<rect y="486" width="1920" height="40" fill="#120706"/>
  ${rock(-40,340,130,'#1c0b08','#ff9a4a')}${rock(260,200,76,'#150808','#ff9a4a')}${rock(1480,280,100,'#1c0b08','#ff9a4a')}${rock(1690,360,150,'#150808','#ff9a4a')}${rock(760,150,34,'#150808')}${rock(1130,200,40,'#1c0b08')}
  ${sag(1800,500,1.6,'#0e0605',3)}${sag(1560,500,.85,'#140807',1)}${sag(110,500,1.3,'#0e0605',3)}${sag(330,500,.6,'#140807',2)}${sag(1340,500,.5,'#1a0b08',3)}`);
 return `<div class="sc sc--sunset" data-par="xy" aria-hidden="true">
 ${layer('sc-sky',3,.05,'',false)}
 ${layer('sc-sunwrap',8,.08,'<div class="sc-rays" data-full></div><div class="sc-halo"></div><div class="sc-sun"></div>',false)}
 ${layer('sc-far',14,.06,far,true)}
 ${layer('sc-mid',26,.03,mid,false)}
 <div class="sc-shimmer" data-full></div>
 ${layer('sc-fg',46,0,fg,false)}
 ${layer('sc-dustwrap',20,.02,dust(LOW?2:6),false)}
 ${layer('sc-flare',34,.02,'<i style="--k:.34;--r:70px"></i><i style="--k:.8;--r:110px"></i>',true)}
</div>`;}

/** Desert night, footer / 404 / dark sections: starfield, moon + glow, mesas, cacti, mist. */
export function nightScene(){
 const r=rng(77),id='sn'+(uid++);let still='',tw=['','',''];
 for(let i=0;i<120;i++){const x=f1(r()*1920),y=f1(Math.pow(r(),1.6)*620),big=r()<.12,rad=big?f1(1.6+r()):f1(.6+r()*.8),o=f1(.55+r()*.45);
  const c=`<circle cx="${x}" cy="${y}" r="${rad}" fill="${big?'#e9f0ff':'#fff'}" opacity="${o}"/>`;
  if(i%(LOW?40:24)===0)tw[(i/(LOW?40:24))%3|0]+=c;else still+=c;}
 const sky=`<svg viewBox="0 0 1920 1080" preserveAspectRatio="xMidYMin slice" focusable="false" aria-hidden="true">${still}<g class="sc-tw sc-tw1">${tw[0]}</g><g class="sc-tw sc-tw2">${tw[1]}</g><g class="sc-tw sc-tw3">${tw[2]}</g></svg>`;
 const farD=ridge(31,430,50,110,160,320,.4),midD=ridge(47,478,60,120,180,360,.34);
 const far=ground(500,`<path d="${farD}" fill="#14294f"/><path d="${farD}" fill="none" stroke="#9ab0f0" stroke-width="2.5" opacity=".55"/>`);
 const mid=ground(500,`<path d="${midD}" fill="#0a1632"/><path d="${midD}" fill="none" stroke="#8aa0e0" stroke-width="2.5" opacity=".4"/>`);
 const fg=ground(500,`<rect y="492" width="1920" height="40" fill="#02040a"/>${rock(-30,260,50,'#02040a')}${rock(1560,300,56,'#02040a')}
  ${sag(120,500,.95,'#010205',3)}${sag(300,500,.5,'#010205',1)}${sag(1740,500,1.05,'#010205',3)}${sag(1580,500,.55,'#010205',2)}${sag(980,500,.42,'#010205',3)}`);
 return `<div class="sc sc--night" data-par="xy" aria-hidden="true">
 ${layer('sc-nsky',2,.04,'',false)}
 ${layer('sc-stars',5,.05,sky,false)}
 ${layer('sc-moonwrap',9,.06,'<div class="sc-moon"></div>',false)}
 ${layer('sc-far',14,.04,far,true)}
 ${layer('sc-mid',24,.02,mid,false)}
 ${layer('sc-mist',0,0,'<i></i>',true)}
 ${layer('sc-fg',40,0,fg,false)}
</div>`;}

/** Lab interior: glassware shelves, steam, blue-green light. */
export function labScene(){
 const id='sl'+(uid++),r=rng(5);
 const flask=(x,y,s,c)=>`<g transform="translate(${x} ${y}) scale(${s})"><path d="M-9-70h18v26l26 56q4 10-6 10h-58q-10 0-6-10l26-56z" fill="${c}" fill-opacity=".16" stroke="${c}" stroke-opacity=".7" stroke-width="3"/><path d="M-26 0h52l12 20h-76z" fill="${c}" fill-opacity=".5"/><path d="M-6-62v24" stroke="#fff" stroke-opacity=".6" stroke-width="3" stroke-linecap="round"/></g>`;
 const beaker=(x,y,s,c)=>`<g transform="translate(${x} ${y}) scale(${s})"><path d="M-24-56h48v100q0 8-8 8h-32q-8 0-8-8z" fill="${c}" fill-opacity=".14" stroke="${c}" stroke-opacity=".7" stroke-width="3"/><path d="M-21 6h42v38q0 5-5 5h-32q-5 0-5-5z" fill="${c}" fill-opacity=".5"/><path d="M-14-30h10M-14-12h10M-14 6h10" stroke="#fff" stroke-opacity=".5" stroke-width="3"/></g>`;
 const tubes=(x,y,c)=>`<g transform="translate(${x} ${y})"><path d="M0 0h96" stroke="#06241a" stroke-width="6"/>${[0,1,2,3].map(i=>`<g transform="translate(${10+i*24} 0)"><path d="M-7-60v52q0 12 7 12t7-12v-52z" fill="${c}" fill-opacity=".14" stroke="${c}" stroke-opacity=".7" stroke-width="2.5"/><path d="M-6-22v14q0 10 6 10t6-10v-14z" fill="${i%2?'#55D0FF':'#3fe0a0'}" fill-opacity=".7"/></g>`).join('')}</g>`;
 const rows=[[300,'#55D0FF'],[540,'#3fe0a0'],[780,'#55D0FF']];
 let back='',glass='';
 rows.forEach(([y,c],ri)=>{back+=`<rect x="0" y="${y}" width="1920" height="14" fill="url(#${id}sh)"/><rect x="0" y="${y+14}" width="1920" height="26" fill="#000" opacity=".35"/>
   ${Array.from({length:7},(_,i)=>`<rect x="${130+i*290}" y="${y-230}" width="10" height="230" fill="#041510"/>`).join('')}`;
  for(let i=0;i<9;i++){const x=90+i*215+r()*50,k=r(),s=.8+r()*.5;
   glass+=k<.34?flask(x,y,s,c):k<.67?beaker(x,y,s,c):tubes(x,y,c);}});
 const steam=Array.from({length:LOW?2:3},(_,i)=>`<i class="sc-steam" ${i>=2?'data-full ':''}style="left:${12+i*15+r()*6}%;--w:${f1(90+r()*90)}px;--t:${f1(9+r()*6)}s;--d:${f1(-r()*12)}s"></i>`).join('');
 const wall=`<svg viewBox="0 0 1920 1080" preserveAspectRatio="xMidYMid slice" focusable="false" aria-hidden="true"><defs>
  <linearGradient id="${id}sh" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7fe8d0"/><stop offset="1" stop-color="#0f3a2e"/></linearGradient></defs>${back}</svg>`;
 const gl=`<svg viewBox="0 0 1920 1080" preserveAspectRatio="xMidYMid slice" focusable="false" aria-hidden="true">${glass}</svg>`;
 return `<div class="sc sc--lab" data-par="xy" aria-hidden="true">
 ${layer('sc-lwall',3,.04,wall,false)}
 ${layer('sc-lbeams',10,.06,'<i></i><i></i>',true)}
 ${layer('sc-lglass',18,.03,gl,false)}
 ${layer('sc-steamwrap',26,.02,steam,false)}
 <div class="sc-lglow"></div>
</div>`;}

/* ───────────────────────── parallax engine ───────────────────────── */
const RMQ=matchMedia('(prefers-reduced-motion: reduce)');
const LITE=matchMedia('(max-width: 767.98px)');
const FINE=matchMedia('(hover: hover) and (pointer: fine)');
let items=[],ticking=false,booted=false;
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));

function collect(){
 items=[...document.querySelectorAll('.sc[data-par]')].map(el=>{
  const host=el.parentElement,ls=[...el.querySelectorAll('.sc-l')].map(l=>({el:l,kx:+l.dataset.kx||0,ky:+l.dataset.ky||0,full:l.hasAttribute('data-full')}));
  return {el,host,ls,vis:false,px:0,py:0};});}
function frame(){
 ticking=false;
 if(RMQ.matches||document.hidden)return;
 const lite=LITE.matches,vh=innerHeight,rects=items.map(it=>it.vis?it.host.getBoundingClientRect():null);   // all reads first...
 items.forEach((it,i)=>{const rc=rects[i];if(!rc)return;                                                      // ...then all writes (transform only)
  const sy=clamp(-rc.top,0,rc.height),sx=it.px;
  for(const l of it.ls){if(lite&&l.full)continue;
   l.el.style.transform=`translate3d(${f1(sx*l.kx)}px,${f1(sy*l.ky)}px,0)`;}});
}
const queue=()=>{if(!ticking){ticking=true;requestAnimationFrame(frame);}};
function reset(){items.forEach(it=>it.ls.forEach(l=>l.el.style.transform=''));}
function syncPause(){document.documentElement.classList.toggle('sc-hidden',document.hidden||RMQ.matches);}

/** Boots parallax + pause rules for every `.sc[data-par]`. Safe to call once per page after scenes are in the DOM. */
export function initScenes(){
 if(booted)return;booted=true;collect();syncPause();
 if(!items.length)return;
 const io='IntersectionObserver'in window?new IntersectionObserver(es=>{es.forEach(e=>{const it=items.find(x=>x.host===e.target);if(!it)return;
   it.vis=e.isIntersecting;it.el.classList.toggle('sc-on',e.isIntersecting);it.el.classList.toggle('sc-off',!e.isIntersecting);});queue();},{rootMargin:'80px'}):null;
 items.forEach(it=>{if(io)io.observe(it.host);else{it.vis=true;it.el.classList.add('sc-on');}});
 addEventListener('scroll',queue,{passive:true});addEventListener('resize',queue,{passive:true});
 document.addEventListener('visibilitychange',()=>{syncPause();if(!document.hidden)queue();});
 RMQ.addEventListener?.('change',()=>{syncPause();RMQ.matches?reset():queue();});
 LITE.addEventListener?.('change',()=>{reset();queue();});
 if(FINE.matches){items.forEach(it=>{let raf=0;
  it.host.addEventListener('pointermove',e=>{if(raf||RMQ.matches||LITE.matches)return;raf=requestAnimationFrame(()=>{raf=0;
   const rc=it.host.getBoundingClientRect();it.px=(e.clientX-rc.left)/rc.width-.5;queue();});});
  it.host.addEventListener('pointerleave',()=>{it.px=0;queue();});});}
 queue();
}

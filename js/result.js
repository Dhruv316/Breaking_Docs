/* result.js — result screen: purity stamp, download, "Cook another batch", "Back to the lab". Owns the blob URL. */
import {scene,char,prop} from './assets.js';
import {COPY,t,TOOLS} from './copy.js';
import {fill,esc,formatBytes} from './format.js';
import {reducedMotion} from './ui-kit.js';
import {addShare} from './cook-report.js';

/** One burst of ~30 crystal shards from behind the stamp, timed to the slam's impact (.43 s after the panel appears). Pure decoration: aria-hidden,
 *  pointer-events none, transform/opacity animation, removed after 1.5 s. Skipped under reduced motion. Runs once per result screen. */
function burst(host){
 if(reducedMotion||!('ResizeObserver'in window))return;
 const stamp=host.querySelector('.stamp');if(!stamp)return;
 const ro=new ResizeObserver(()=>{const r=stamp.getBoundingClientRect();if(!r.width||!r.height)return;   // fires when the (hidden) panel is first shown
  ro.disconnect();const hr=host.getBoundingClientRect(),cx=r.left-hr.left+r.width/2,cy=r.top-hr.top+r.height/2;
  const wrap=document.createElement('div');wrap.className='res-burst';wrap.setAttribute('aria-hidden','true');
  const reach=Math.min(240,Math.max(110,hr.width*.34));let h='';
  for(let i=0;i<30;i++){const a=(i/30)*Math.PI*2+Math.random()*.35,d=reach*(.45+Math.random()*.55);
   h+=`<i style="--x:${cx.toFixed(1)}px;--y:${cy.toFixed(1)}px;--s:${(7+Math.random()*9).toFixed(1)}px;--dx:${(Math.cos(a)*d*1.25).toFixed(1)}px;--dy:${(Math.sin(a)*d*.8+28+Math.random()*34).toFixed(1)}px;--r:${Math.round(-220+Math.random()*440)}deg;--d:${(.43+Math.random()*.04).toFixed(3)}s"></i>`;}
  wrap.innerHTML=h;host.append(wrap);setTimeout(()=>wrap.remove(),1500);});
 ro.observe(stamp);setTimeout(()=>ro.disconnect(),30000);}

const ICONS={Im:'image-frames',Pp:'stack-of-slides',Cp:'squeeze-press',Mg:'merge-arrows',Sp:'scissors',Rm:'eraser'};
/** "Cook something else": first three live tools (fixed Tools order) that are not the current page. Icons come from the art sprite once it has loaded. */
function moreTools(){const cur=location.pathname.split('/').pop()||'index.html';
 const list=TOOLS.filter(x=>x.live&&x.href!==cur).slice(0,3);
 return `<nav class="res-more" aria-label="${esc(t('result.moreAria'))}"><h3>${esc(t('result.more'))}</h3><ul class="cook-row">${list.map((x,i)=>`<li><a class="tile" style="--i:${i}" href="${x.href}"><span class="spot" aria-hidden="true"></span><span class="ico" aria-hidden="true"></span><span class="num mono">${x.n}</span><span class="sym">${x.sym}</span><span class="name">${esc(COPY.tools[x.sym].name)}</span></a></li>`).join('')}</ul></nav>`;}
function moreIcons(host){let n=0;const go=()=>{if(window.Art){host.querySelectorAll('.res-more .tile').forEach(a=>{const s=a.querySelector('.sym')?.textContent,i=a.querySelector('.ico');if(i&&ICONS[s]&&!i.firstChild)i.innerHTML=window.Art.svg(ICONS[s],36);});return;}
  if(++n<40)setTimeout(go,150);};go();}

/**
 * Renders the result into `host`.
 * @param {HTMLElement} host
 * @param {{blob:Blob, filename:string, pages:number, stamp?:string, notes?:string[], onAgain:()=>void, heading?:string, downloadLabel?:string, stats?:string[]|null}} o
 *   heading / downloadLabel / stats override the defaults (stats = the mono line's items; default is pages · size)
 * @returns {{destroy():void}} destroy() revokes the Blob URL and empties the host
 */
export function showResult(host,{blob,filename,pages,stamp=COPY.result.stamp,notes=[],onAgain,heading=t('result.heading'),downloadLabel=t('result.download'),stats=null,parts=[]}){
 const url=URL.createObjectURL(blob),partUrls=parts.map(p=>URL.createObjectURL(p.blob));
 const pageText=pages===1?t('result.pagesOne'):fill(t('result.pages'),{n:pages});
 host.innerHTML=`<svg width="0" height="0" style="position:absolute" aria-hidden="true"><filter id="stamp-rough" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="7" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="3.2"/></filter></svg>${scene('superlab')}
  <div class="res-char" aria-hidden="true">${char('heisenberg','')}</div>
  <div class="res-sparks" aria-hidden="true">${[0,1,2,3,4].map(i=>`<span style="--i:${i}">${prop('blueCrystals')}</span>`).join('')}</div>
  <div class="res-body">
   <div class="stamp" role="img" aria-label="${esc(stamp)}"><span>${esc(stamp)}</span></div>
   <h2 class="res-head" tabindex="-1">${esc(heading)}</h2>
   <a class="btn res-dl" href="${url}" download="${esc(filename)}">${esc(downloadLabel)}</a>
   <p class="res-stats mono">${(stats||[pageText,formatBytes(blob.size)]).map(x=>`<b>${esc(x)}</b>`).join('<span aria-hidden="true"> · </span>')}</p>
   ${parts.length?`<ul class="res-parts" style="list-style:none;margin:0;padding:0;display:grid;gap:8px;width:min(100%,560px)">${parts.map((p,i)=>`<li class="res-note" style="display:flex;gap:12px;align-items:center;justify-content:space-between;flex-wrap:wrap"><span>${esc(p.label)} · ${formatBytes(p.blob.size)}</span><a class="btn btn-2 btn-sm" href="${partUrls[i]}" download="${esc(p.filename)}">${esc(t('split.partDownload'))}</a></li>`).join('')}</ul>`:''}
   ${notes.map(n=>`<p class="res-note mono">${esc(n)}</p>`).join('')}
   <div class="res-actions">
    <button type="button" class="btn btn-danger btn-sm res-again">${t('result.again')}</button>
    <a class="btn btn-2 btn-sm" href="index.html">${t('result.back')}</a>
   </div>
   ${moreTools()}
  </div>`;
 document.getElementById('tool')?.setAttribute('data-stage','done');
 host.querySelector('.res-again').addEventListener('click',()=>onAgain&&onAgain());
 host.querySelector('.res-head').focus({preventScroll:true});
 burst(host);moreIcons(host);
 addShare(host,{stamp,stats:stats||[pageText,formatBytes(blob.size)],pages,blobSize:blob.size});
 return {destroy(){URL.revokeObjectURL(url);partUrls.forEach(u=>URL.revokeObjectURL(u));host.replaceChildren();}};
}

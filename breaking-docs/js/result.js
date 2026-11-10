/* result.js — result screen: purity stamp, download, "Cook another batch", "Back to the lab". Owns the blob URL. */
import {scene,char,prop} from './assets.js';
import {COPY,t} from './copy.js';
import {fill,esc,formatBytes} from './format.js';

/**
 * Renders the result into `host`.
 * @param {HTMLElement} host
 * @param {{blob:Blob, filename:string, pages:number, stamp?:string, notes?:string[], onAgain:()=>void, heading?:string, downloadLabel?:string, stats?:string[]|null}} o
 *   heading / downloadLabel / stats override the defaults (stats = the mono line's items; default is pages · size)
 * @returns {{destroy():void}} destroy() revokes the Blob URL and empties the host
 */
export function showResult(host,{blob,filename,pages,stamp=COPY.result.stamp,notes=[],onAgain,heading=t('result.heading'),downloadLabel=t('result.download'),stats=null}){
 const url=URL.createObjectURL(blob);
 const pageText=pages===1?t('result.pagesOne'):fill(t('result.pages'),{n:pages});
 host.innerHTML=`<svg width="0" height="0" style="position:absolute" aria-hidden="true"><filter id="stamp-rough" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="7" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="3.2"/></filter></svg>${scene('superlab')}
  <div class="res-char" aria-hidden="true">${char('heisenberg','')}</div>
  <div class="res-sparks" aria-hidden="true">${[0,1,2,3,4].map(i=>`<span style="--i:${i}">${prop('blueCrystals')}</span>`).join('')}</div>
  <div class="res-body">
   <div class="stamp" role="img" aria-label="${esc(stamp)}"><span>${esc(stamp)}</span></div>
   <h2 class="res-head" tabindex="-1">${esc(heading)}</h2>
   <a class="btn res-dl" href="${url}" download="${esc(filename)}">${esc(downloadLabel)}</a>
   <p class="res-stats mono">${(stats||[pageText,formatBytes(blob.size)]).map(x=>`<b>${esc(x)}</b>`).join('<span aria-hidden="true"> · </span>')}</p>
   ${notes.map(n=>`<p class="res-note mono">${esc(n)}</p>`).join('')}
   <div class="res-actions">
    <button type="button" class="btn btn-danger btn-sm res-again">${t('result.again')}</button>
    <a class="btn btn-2 btn-sm" href="index.html">${t('result.back')}</a>
   </div>
  </div>`;
 host.querySelector('.res-again').addEventListener('click',()=>onAgain&&onAgain());
 host.querySelector('.res-head').focus({preventScroll:true});
 return {destroy(){URL.revokeObjectURL(url);host.replaceChildren();}};
}

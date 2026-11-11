/* tools/merge-pdf.js — Merge PDF. Exports init(). 100% client-side.
   pdf.js reads page counts + lazy first-page thumbnails; pdf-lib copyPages joins the files (no rasterizing, text stays selectable).
   State machine: idle → filesChosen → processing → done | error. */
import {COPY,TOOLS,t} from '../copy.js';
import {prop,char} from '../assets.js';
import {createDropzone} from '../dropzone.js';
import {createRvProgress,countText,loadingLine} from '../progress.js';
import {showResult} from '../result.js';
import {formatBytes,fill,esc,nextFrame,checkAbort,isAbort,isMemoryError,loadScriptOnce} from '../format.js';
import {loadPdfjs,openPdf,classify} from './compress-pdf.js';

export const LIMITS={maxFiles:30,maxBytes:100*1024*1024,thumbW:240};
const PDFLIB_URL='https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.min.js';
const OUT_NAME='merged.pdf';
const $=(s,r=document)=>r.querySelector(s);
const toBlob=(c,q)=>new Promise(r=>c.toBlob(r,'image/jpeg',q));
const isLockedErr=e=>!!e&&(e.name==='EncryptedPDFError'||/encrypt/i.test(String(e.message)));
const ICON={
 left:'<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="square" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>',
 right:'<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="square" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>',
 del:'<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="square" aria-hidden="true"><path d="M5 5l14 14M19 5L5 19"/></svg>'};

/** Boots the Merge PDF page. */
export function init(){
 const root=$('#tool'),tray=$('#tray'),list=$('#thumbs'),msgs=$('#msgs'),go=$('#go'),live=$('#sr-live'),totals=$('#totals');
 const spec=TOOLS.find(x=>x.sym==='Mg'),reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
 document.title=`${t('tools.Mg.name')} — ${COPY.brand.name}`;
 $('#title-tile').innerHTML=`<span class="num mono">${spec.n}</span><span class="mass mono">${spec.mass}</span><span class="sym">${spec.sym}</span>`;
 $('#dz-types').textContent=fill(t('dropzone.types'),{types:t('dropzone.pdfTypes'),size:formatBytes(LIMITS.maxBytes)});
 $('#dz-max').textContent=fill(t('dropzone.maxFiles'),{n:LIMITS.maxFiles});
 $('#dz-hit').setAttribute('aria-label',`${t('dropzone.pdfsLabel')}. ${t('dropzone.idle')}`);
 $('#dz-barrel').innerHTML=prop('barrel');$('#dz-flask').innerHTML=prop('flask');
 go.querySelector('span').textContent=t('tools.Mg.button');
 $('#err-char').innerHTML=char('mike',COPY.alt.mike);$('#err-prop').innerHTML=prop('gasMask');

 /** @type {{id:number,file:File,name:string,size:number,pages:number,thumb:string,status:'loading'|'ready'|'locked',el:HTMLElement,removed:boolean,thumbDone:boolean}[]} */
 let items=[],uid=0,state='idle',ac=null,result=null,queue=Promise.resolve(),thumbQueue=Promise.resolve();
 const progress=createRvProgress($('#progress'),{onCancel:()=>ac&&ac.abort()});
 const say=m=>{live.textContent='';setTimeout(()=>live.textContent=m,30);};
 const pagesText=n=>n===1?t('result.pagesOne'):fill(t('result.pages'),{n});

 /* --- state machine --- */
 function setState(s){
  const was=state;state=s;root.dataset.state=s;
  root.querySelectorAll('[data-show]').forEach(e=>{e.hidden=!e.dataset.show.split(' ').includes(s);});
  dz.setDisabled(s==='processing'||s==='done'||s==='error');
  refresh();
  if(s==='processing')$('#progress .btn-2')?.focus({preventScroll:true});
  else if(was==='processing'&&(s==='idle'||s==='filesChosen'))(go.disabled?$('#dz-hit'):go).focus({preventScroll:true});
  if(s==='done')$('#result .res-head')?.focus({preventScroll:true});
  const panel={processing:'#progress',done:'#result',error:'.errpanel'}[s];
  if(panel)requestAnimationFrame(()=>$(panel).scrollIntoView({block:'start',behavior:reduce?'auto':'smooth'}));}
 const toFiles=()=>setState(items.length?'filesChosen':'idle');
 function sync(){if(state==='idle'||state==='filesChosen')toFiles();else refresh();}
 function refresh(){
  const good=items.filter(i=>i.status==='ready'),loading=items.filter(i=>i.status==='loading').length;
  go.disabled=!(good.length>0&&loading===0&&(state==='idle'||state==='filesChosen'));
  tray.classList.toggle('has-files',items.length>0);
  $('#busy').hidden=loading===0;
  const add=list.querySelector('.addtile .mass');if(add)add.textContent=`${items.length}/${LIMITS.maxFiles}`;
  list.querySelectorAll('.imgtile:not(.addtile)').forEach((el,i)=>{el.querySelector('.num').textContent=i+1;});
  const pg=good.reduce((a,i)=>a+i.pages,0),sz=good.reduce((a,i)=>a+i.size,0);
  totals.hidden=!good.length;
  totals.textContent=good.length?fill(t('merge.totals'),{files:good.length===1?t('merge.fileOne'):fill(t('merge.filesWord'),{n:good.length}),pages:pagesText(pg),size:formatBytes(sz)}):'';}

 /* --- warnings (themed, aria-live) --- */
 const warnings=[];
 function warn(text,names=[],actions=null){warnings.push({text,names,actions});drawWarnings();}
 function clearWarnings(){warnings.length=0;drawWarnings();}
 function drawWarnings(){
  msgs.innerHTML=warnings.map((w,i)=>`<div class="warn"><span class="warn-ico" aria-hidden="true">${prop('gasMask')}</span><div><p>${esc(w.text)}</p>${w.names.length?`<p class="mono warn-names">${esc(w.names.join(', '))}</p>`:''}${w.actions?`<div class="res-actions" data-w="${i}">${w.actions.map((a,j)=>`<button type="button" class="btn btn-sm${j?' btn-2':''}" data-a="${j}">${esc(a.label)}</button>`).join('')}</div>`:''}</div></div>`).join('');
  msgs.querySelectorAll('[data-w]').forEach(box=>box.querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>warnings[+box.dataset.w].actions[+b.dataset.a].run())));}
 const skippedText=names=>fill(t('errors.skipped'),{n:names.length,names:names.join(', ')});

 /* --- tiles --- */
 const addTile=document.createElement('li');
 addTile.className='tile imgtile addtile';
 addTile.innerHTML=`<button type="button" class="addbtn"><span class="mass mono"></span><span class="sym" aria-hidden="true">+</span><span class="name">${t('grid.addMore')}</span></button>`;
 list.append(addTile);
 const io='IntersectionObserver'in window?new IntersectionObserver(es=>{for(const e of es)if(e.isIntersecting){io.unobserve(e.target);const it=items.find(i=>i.el===e.target);if(it)queueThumb(it);}},{rootMargin:'200px'}):null;

 function makeTile(it){
  const li=document.createElement('li');
  li.className='tile imgtile is-loading';li.tabIndex=0;li.dataset.id=it.id;
  li.setAttribute('aria-label',`${it.name}. ${t('grid.moveHint')}`);
  const btn=(c,icon,label)=>`<button type="button" class="act ${c}" aria-label="${esc(label)}" title="${esc(label)}">${icon}</button>`;
  li.innerHTML=`<span class="num mono"></span><span class="mass mono">${formatBytes(it.size)}</span>
   <div class="thumb"><img alt="" draggable="false" decoding="async"></div>
   <span class="name" title="${esc(it.name)}">${esc(it.name)}</span><span class="name facts">&nbsp;</span>
   <div class="acts" style="grid-template-columns:repeat(3,1fr)">${btn('mvl',ICON.left,fill(t('merge.moveLeft'),{name:it.name}))}${btn('mvr',ICON.right,fill(t('merge.moveRight'),{name:it.name}))}${btn('del',ICON.del,fill(t('grid.removeAria'),{name:it.name}))}</div>`;
  li.querySelector('.mvl').addEventListener('click',e=>move(it,-1,e.currentTarget));
  li.querySelector('.mvr').addEventListener('click',e=>move(it,1,e.currentTarget));
  li.querySelector('.del').addEventListener('click',()=>removeItem(it));
  it.el=li;list.insertBefore(li,addTile);}
 function freeItem(it){it.removed=true;if(it.thumb){URL.revokeObjectURL(it.thumb);it.thumb='';}io&&it.el&&io.unobserve(it.el);}
 function removeItem(it){
  const next=it.el.nextElementSibling;
  freeItem(it);items=items.filter(x=>x!==it);it.el.remove();
  clearWarnings();sync();
  (next&&next.querySelector('button,[tabindex]')||list.querySelector('.addbtn')||$('#dz-hit')).focus?.();}
 function orderFromDom(){
  const by=new Map(items.map(i=>[String(i.id),i]));
  items=[...list.querySelectorAll('.imgtile:not(.addtile)')].map(el=>by.get(el.dataset.id)).filter(Boolean);refresh();}
 const announce=it=>say(fill(t('grid.moved'),{name:it.name,n:items.indexOf(it)+1,total:items.length}));

 /* --- reorder: buttons, drag (pointer events; touch via long-press), Alt/Shift+Arrow --- */
 function flip(fn){
  const els=[...list.querySelectorAll('.imgtile:not(.is-dragging)')],before=new Map(els.map(e=>[e,e.getBoundingClientRect()]));
  fn();
  if(reduce)return;
  for(const e of els){const a=before.get(e),b=e.getBoundingClientRect(),dx=a.left-b.left,dy=a.top-b.top;
   if(dx||dy)e.animate([{transform:`translate(${dx}px,${dy}px)`},{transform:'none'}],{duration:160,easing:'cubic-bezier(.2,.8,.2,1)'});}}
 function move(it,dir,focusEl){
  const tile=it.el,sib=dir<0?tile.previousElementSibling:tile.nextElementSibling;
  if(!sib||sib.classList.contains('addtile'))return;
  flip(()=>dir<0?sib.before(tile):sib.after(tile));orderFromDom();announce(it);focusEl&&focusEl.focus();}
 let drag=null;
 function dragStart(){
  const {tile}=drag,r=tile.getBoundingClientRect(),g=tile.cloneNode(true);
  g.classList.add('ghost');g.removeAttribute('tabindex');g.style.cssText=`width:${r.width}px;height:${r.height}px;left:${r.left}px;top:${r.top}px`;
  document.body.append(g);drag.ghost=g;drag.ox=drag.x-r.left;drag.oy=drag.y-r.top;drag.active=true;
  tile.classList.add('is-dragging');document.body.classList.add('is-reordering');
  const loop=()=>{if(!drag||!drag.active)return;
   if(drag.y<70)scrollBy(0,-16);else if(drag.y>innerHeight-70)scrollBy(0,16);
   requestAnimationFrame(loop);};requestAnimationFrame(loop);}
 function dragMove(e){
  if(!drag||e.pointerId!==drag.id)return;
  drag.x=e.clientX;drag.y=e.clientY;
  if(!drag.active){
   if(Math.hypot(e.clientX-drag.sx,e.clientY-drag.sy)<6)return;
   if(drag.touch){clearTimeout(drag.timer);drag=null;removeEventListener('pointermove',dragMove);return;}
   dragStart();}
  e.preventDefault();
  drag.ghost.style.left=`${e.clientX-drag.ox}px`;drag.ghost.style.top=`${e.clientY-drag.oy}px`;
  const hit=document.elementFromPoint(e.clientX,e.clientY)?.closest('.imgtile'),tile=drag.tile;
  if(!hit||hit===tile)return;
  flip(()=>{
   if(hit.classList.contains('addtile'))list.insertBefore(tile,addTile);
   else if(tile.compareDocumentPosition(hit)&Node.DOCUMENT_POSITION_FOLLOWING)hit.after(tile);
   else hit.before(tile);});}
 function dragEnd(e){
  if(!drag||(e&&e.pointerId!==drag.id))return;
  clearTimeout(drag.timer);
  removeEventListener('pointermove',dragMove);removeEventListener('pointerup',dragEnd);removeEventListener('pointercancel',dragEnd);
  const was=drag.active,tile=drag.tile;
  drag.ghost?.remove();tile.classList.remove('is-dragging');document.body.classList.remove('is-reordering');drag=null;
  if(was){orderFromDom();const it=items.find(i=>i.el===tile);if(it)announce(it);}}
 list.addEventListener('pointerdown',e=>{
  const tile=e.target.closest('.imgtile:not(.addtile)');
  if(!tile||e.target.closest('button')||(e.pointerType==='mouse'&&e.button!==0)||state==='processing')return;
  drag={tile,id:e.pointerId,sx:e.clientX,sy:e.clientY,x:e.clientX,y:e.clientY,active:false,touch:e.pointerType==='touch',ghost:null,timer:null};
  if(drag.touch)drag.timer=setTimeout(()=>{if(drag&&!drag.active)dragStart();},260);
  addEventListener('pointermove',dragMove,{passive:false});addEventListener('pointerup',dragEnd);addEventListener('pointercancel',dragEnd);});
 list.addEventListener('touchmove',e=>{if(drag&&drag.active)e.preventDefault();},{passive:false});
 list.addEventListener('dragstart',e=>e.preventDefault());
 list.addEventListener('keydown',e=>{
  const tile=e.target.closest('.imgtile:not(.addtile)');
  if(!tile||e.target!==tile||!(e.altKey||e.shiftKey))return;
  const back=e.key==='ArrowLeft'||e.key==='ArrowUp',fwd=e.key==='ArrowRight'||e.key==='ArrowDown';
  if(!back&&!fwd)return;
  e.preventDefault();const it=items.find(i=>i.el===tile);if(it)move(it,back?-1:1,tile);});
 addTile.querySelector('.addbtn').addEventListener('click',()=>dz.open());

 /* --- reading files: page count (pdf.js), then a lazy first-page thumbnail --- */
 function setFacts(it){
  const f=it.el.querySelector('.facts');
  f.textContent=it.status==='locked'?t('merge.locked'):it.status==='ready'?pagesText(it.pages):'';
  it.el.style.outline=it.status==='locked'?'3px dashed var(--sunset-red)':'';}
 async function inspect(it){
  let pdf=null;
  try{
   const lib=await loadPdfjs();pdf=await openPdf(lib,it.file);
   if(it.removed)return 'gone';
   if(!pdf.numPages)throw Object.assign(new Error('no pages'),{name:'InvalidPDFException'});
   it.pages=pdf.numPages;it.status='ready';return 'ok';
  }catch(e){
   const kind=classify(e);if(kind==='locked'){it.status='locked';return 'locked';}
   if(kind==='library'||kind==='memory')throw e;
   if(kind==='generic')console.error(e);
   return 'corrupt';
  }finally{try{pdf&&await pdf.destroy();}catch{}}}
 function queueThumb(it){
  if(it.thumbDone||it.removed||it.status!=='ready')return;it.thumbDone=true;
  thumbQueue=thumbQueue.then(()=>drawThumb(it)).catch(()=>{});}
 async function drawThumb(it){
  if(it.removed)return;
  let pdf=null,c=null;
  try{
   const lib=await loadPdfjs();pdf=await openPdf(lib,it.file);
   const pg=await pdf.getPage(1),b=pg.getViewport({scale:1}),vp=pg.getViewport({scale:Math.min(2,LIMITS.thumbW/b.width)});
   c=document.createElement('canvas');c.width=Math.max(1,Math.floor(vp.width));c.height=Math.max(1,Math.floor(vp.height));
   let blob=null;
   try{
    const x=c.getContext('2d',{alpha:false});x.fillStyle='#fff';x.fillRect(0,0,c.width,c.height);
    await pg.render({canvasContext:x,viewport:vp}).promise;blob=await toBlob(c,.8);
   }finally{c.width=0;c.height=0;pg.cleanup();}              // free the canvas right after drawing
   if(it.removed||!blob)return;
   it.thumb=URL.createObjectURL(blob);it.el.querySelector('img').src=it.thumb;
  }catch(e){/* a missing thumbnail is cosmetic */}
  finally{try{pdf&&await pdf.destroy();}catch{}if(!it.removed)it.el.classList.remove('is-loading');}}

 /* --- adding files --- */
 const group=(rej,why)=>rej.filter(r=>r.reason===why).map(r=>r.file.name);
 function onFiles({ok,rejected}){
  clearWarnings();
  const badType=group(rejected,'type'),tooBig=group(rejected,'size');
  if(badType.length)warn(fill(t('errors.type'),{types:t('dropzone.pdfTypes')}),badType);
  if(tooBig.length)warn(fill(t('errors.size'),{size:formatBytes(LIMITS.maxBytes)}),tooBig);
  const room=Math.max(0,LIMITS.maxFiles-items.length),take=ok.slice(0,room),extra=ok.length-take.length;
  if(extra>0)warn(fill(t('errors.tooMany'),{n:LIMITS.maxFiles,extra}));
  if(!take.length)return;
  const fresh=take.map(file=>({id:++uid,file,name:file.name,size:file.size,pages:0,thumb:'',status:'loading',el:null,removed:false,thumbDone:false}));
  for(const it of fresh){items.push(it);makeTile(it);}
  $('#busy').textContent=loadingLine();sync();say($('#busy').textContent);
  queue=queue.then(()=>inspectAll(fresh)).catch(()=>{});}
 async function inspectAll(batch){
  const skipped=[],locked=[];
  for(const it of batch){
   if(it.removed)continue;
   let r;
   try{r=await inspect(it);}
   catch(e){
    // library / memory trouble: drop the rest of the batch with a themed message
    for(const x of batch){if(x.status==='loading'&&!x.removed){freeItem(x);items=items.filter(y=>y!==x);x.el.remove();}}
    warn(classify(e)==='memory'?t('errors.memory'):t('errors.libraryPdfjs'));sync();return;}
   if(r==='gone')continue;
   if(r==='corrupt'){skipped.push(it.name);freeItem(it);items=items.filter(x=>x!==it);it.el.remove();}
   else if(r==='locked'){locked.push(it.name);setFacts(it);it.el.classList.remove('is-loading');}
   else{setFacts(it);if(io)io.observe(it.el);else queueThumb(it);}
   refresh();await nextFrame();
  }
  if(skipped.length)warn(skippedText(skipped));
  for(const n of locked)warn(fill(t('merge.lockedNamed'),{name:n}));
  sync();}

 /* --- dropzone --- */
 const dz=createDropzone({root:tray,trigger:$('#dz-hit'),label:$('#dz-label'),idleText:t('dropzone.idle'),overText:t('dropzone.over'),
  exts:['pdf'],mimes:['application/pdf'],maxBytes:LIMITS.maxBytes,onFiles});

 /* --- build --- */
 function showError(message,{retry=false,extra=[]}={}){
  $('#err-msg').textContent=message;
  $('#err-extra').innerHTML=extra.map(x=>`<p class="mono">${esc(x)}</p>`).join('');
  $('#err-retry').onclick=retry?()=>build(true):()=>{clearWarnings();toFiles();};
  setState('error');$('#err-msg').focus();}
 /** Locked files: ask once, in the themed message, whether to skip them or stop. */
 function build(skipLocked=false){
  const lockedNames=items.filter(i=>i.status==='locked').map(i=>i.name);
  clearWarnings();
  if(lockedNames.length&&!skipLocked){
   warn(fill(t('merge.lockedAsk'),{names:lockedNames.join(', ')}),[],[
    {label:t('merge.skip'),run:()=>{clearWarnings();cook();}},
    {label:t('merge.stop'),run:()=>{clearWarnings();$('#dz-hit').focus({preventScroll:true});}}]);
   msgs.scrollIntoView({block:'center',behavior:reduce?'auto':'smooth'});return;}
  cook();}

 async function cook(){
  const batch=items.filter(i=>i.status==='ready'),lockedAtStart=items.filter(i=>i.status==='locked').map(i=>i.name),total=batch.length;
  if(!total)return;
  ac=new AbortController();const sig=ac.signal,skipped=[],lockedNow=[...lockedAtStart];
  setState('processing');progress.set(0,countText(1,total));progress.start();
  try{
   const {PDFDocument}=await loadScriptOnce(PDFLIB_URL,'PDFLib');checkAbort(sig);
   const out=await PDFDocument.create();out.setCreator(COPY.brand.name);out.setProducer(COPY.brand.name);
   for(let i=0;i<total;i++){
    const it=batch[i];checkAbort(sig);
    progress.set(i/total*.95,countText(i+1,total));await nextFrame();
    let src=null,bytes=null;
    try{
     bytes=new Uint8Array(await it.file.arrayBuffer());
     src=await PDFDocument.load(bytes,{updateMetadata:false});
     const pages=await out.copyPages(src,src.getPageIndices());
     if(!pages.length)throw new Error('no pages');
     pages.forEach(p=>out.addPage(p));
    }catch(e){
     if(isAbort(e)||isMemoryError(e))throw e;
     if(isLockedErr(e))lockedNow.push(it.name);else skipped.push(it.name);
    }finally{src=null;bytes=null;}                         // release this file's memory before reading the next
    checkAbort(sig);await nextFrame();
   }
   if(out.getPageCount()===0){const e=new Error('none');e.code='none';throw e;}
   progress.set(.97,'');await nextFrame();
   const data=await out.save();checkAbort(sig);
   const blob=new Blob([data],{type:'application/pdf'}),pages=out.getPageCount();
   progress.set(1,'');await nextFrame();progress.stop();
   const notes=[];
   if(skipped.length)notes.push(skippedText(skipped));
   if(lockedNow.length)notes.push(fill(t('merge.lockedSkipped'),{names:lockedNow.join(', ')}));
   result=showResult($('#result'),{blob,filename:OUT_NAME,pages,stats:[pagesText(pages),formatBytes(blob.size)],notes,onAgain:reset});
   setState('done');
  }catch(e){
   progress.stop();
   if(isAbort(e)){toFiles();warn(t('errors.cancelled'));return;}
   if(e.code==='library')return showError(t('errors.library'),{retry:true});
   if(e.code==='none')return showError(t(lockedNow.length&&!skipped.length?'merge.noValid':'errors.corrupt'),{extra:[...skipped,...lockedNow]});
   if(isMemoryError(e))return showError(t('errors.memory'));
   console.error(e);showError(t('errors.generic'));
  }finally{ac=null;}}
 go.addEventListener('click',()=>build());

 /* --- reset ("Cook another batch"): revoke every Blob URL --- */
 function reset(){
  result&&result.destroy();result=null;
  for(const it of items){freeItem(it);it.el?.remove();}
  items=[];clearWarnings();$('#err-msg').textContent='';
  setState('idle');scrollTo({top:0,behavior:reduce?'auto':'smooth'});$('#dz-hit').focus({preventScroll:true});}
 $('#err-again').addEventListener('click',reset);

 setState('idle');
}

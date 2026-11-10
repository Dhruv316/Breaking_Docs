/* tools/image-to-pdf.js — Image to PDF (TOOLS.md §1). Exports init(). 100% client-side.
   State machine: idle → filesChosen → processing → done | error. */
import {COPY,TOOLS,t} from '../copy.js';
import {prop,char} from '../assets.js';
import {createDropzone} from '../dropzone.js';
import {createRvProgress,countText,loadingLine} from '../progress.js';
import {showResult} from '../result.js';
import {formatBytes,fill,esc,extOf,nextFrame,checkAbort,isAbort,isMemoryError,loadScriptOnce} from '../format.js';

export const LIMITS={maxFiles:100,maxBytes:25*1024*1024,maxSide:4000,thumb:240,svgSide:2000};
export const EXTS=['jpg','jpeg','png','webp','gif','bmp','svg','avif','heic','heif','tif','tiff'];
const MIMES=['image/jpeg','image/png','image/webp','image/gif','image/bmp','image/svg+xml','image/avif','image/heic','image/heif','image/tiff'];
const HARD=['heic','heif','tif','tiff'];                       // formats that depend on the browser
const PDFLIB_URL='https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.min.js';
const OUT_NAME='breaking-docs-images.pdf';
const PT_PER_PX=0.75;                                          // 96 dpi → points
const PAGE={a4:[595.28,841.89],letter:[612,792]};
const MARGIN={none:0,small:18,big:54};                         // points

/* ───────────── pure helpers (exported for testing) ───────────── */

/** @param {Uint8Array} u8 @returns {'jpeg'|'png'|'other'} sniffed from magic bytes */
export function sniff(u8){
 if(u8[0]===0xFF&&u8[1]===0xD8&&u8[2]===0xFF)return 'jpeg';
 if(u8[0]===0x89&&u8[1]===0x50&&u8[2]===0x4E&&u8[3]===0x47)return 'png';
 return 'other';}

/** Reads EXIF orientation (1–8, 0 = none) and component count (0 = unknown) from JPEG bytes.
 *  @param {Uint8Array} b @returns {{orientation:number, components:number}} */
export function inspectJpeg(b){
 let orientation=0,components=0,p=2;
 const u16=(o,le)=>le?b[o]|b[o+1]<<8:b[o]<<8|b[o+1];
 while(p+4<=b.length&&b[p]===0xFF){
  const m=b[p+1];
  if(m===0xFF){p++;continue;}
  if(m===0xDA||m===0xD9)break;
  const len=u16(p+2,false);
  if(m===0xE1&&b[p+4]===0x45&&b[p+5]===0x78&&b[p+6]===0x69&&b[p+7]===0x66){          // "Exif"
   const t0=p+10,le=b[t0]===0x49,ifd=t0+(le?b[t0+4]|b[t0+5]<<8|b[t0+6]<<16|b[t0+7]<<24:b[t0+4]<<24|b[t0+5]<<16|b[t0+6]<<8|b[t0+7]);
   if(ifd>0&&ifd+2<b.length){const n=u16(ifd,le);
    for(let i=0;i<n;i++){const e=ifd+2+i*12;if(e+10>b.length)break;if(u16(e,le)===0x0112){orientation=u16(e+8,le);break;}}}
  }
  if(m>=0xC0&&m<=0xCF&&m!==0xC4&&m!==0xC8&&m!==0xCC){components=b[p+9];}
  p+=2+len;
 }
 return {orientation,components};}

/** Page geometry in PDF points.
 *  @param {{size:'fit'|'a4'|'letter', orient:'auto'|'portrait'|'landscape', margin:'none'|'small'|'big'}} o
 *  @param {number} iw @param {number} ih effective image size in px (after rotation / downscale)
 *  @returns {{pw:number, ph:number, box:{x:number,y:number,w:number,h:number}}} */
export function layout(o,iw,ih){
 const m=MARGIN[o.margin]??0;
 if(o.size==='fit'){const w=iw*PT_PER_PX,h=ih*PT_PER_PX;return {pw:w+2*m,ph:h+2*m,box:{x:m,y:m,w,h}};}
 const [a,b]=PAGE[o.size]||PAGE.a4;
 const land=o.orient==='landscape'||(o.orient==='auto'&&iw>ih);
 const pw=land?b:a,ph=land?a:b;
 return {pw,ph,box:{x:m,y:m,w:pw-2*m,h:ph-2*m}};}

/* ───────────── library loading ───────────── */
/** Loads pdf-lib 1.17.1 from cdnjs once (shared loader in format.js). Rejects with {code:'library'} and can be retried. @returns {Promise<any>} */
const loadPdfLib=()=>loadScriptOnce(PDFLIB_URL,'PDFLib');

/* ───────────── image decoding ───────────── */
function normalizeSvg(text){
 const doc=new DOMParser().parseFromString(text,'image/svg+xml'),r=doc.documentElement;
 if(!r||r.nodeName.toLowerCase()!=='svg'||doc.querySelector('parsererror'))throw new Error('bad svg');
 const num=a=>/%/.test(a||'')?NaN:parseFloat(a);
 let w=num(r.getAttribute('width')),h=num(r.getAttribute('height'));
 const vb=(r.getAttribute('viewBox')||'').trim().split(/[\s,]+/).map(Number);
 if(!(w>0&&h>0)){if(vb.length===4&&vb[2]>0&&vb[3]>0){w=vb[2];h=vb[3];}else{w=1024;h=768;}}
 const k=LIMITS.svgSide/Math.max(w,h),W=Math.round(w*k),H=Math.round(h*k);
 if(!r.getAttribute('viewBox'))r.setAttribute('viewBox',`0 0 ${w} ${h}`);
 r.setAttribute('width',W);r.setAttribute('height',H);
 return {blob:new Blob([new XMLSerializer().serializeToString(doc)],{type:'image/svg+xml'}),w:W,h:H};}

/** Decodes a file through <img> (honours EXIF orientation in current browsers).
 *  @param {File} file @returns {Promise<{img:HTMLImageElement,w:number,h:number,free():void}>} */
async function loadImage(file){
 let blob=file;
 if(extOf(file.name)==='svg'||file.type==='image/svg+xml')blob=normalizeSvg(await file.text()).blob;
 const url=URL.createObjectURL(blob),img=new Image();
 img.decoding='async';
 const free=()=>{img.src='';URL.revokeObjectURL(url);};
 try{
  img.src=url;await img.decode();
  const w=img.naturalWidth,h=img.naturalHeight;
  if(!(w>0&&h>0))throw new Error('empty image');
  return {img,w,h,free};
 }catch(e){free();throw e;}}

/** Reads type info + dimensions and builds a small thumbnail. Throws if the file can't be decoded (corrupt). */
async function analyze(file){
 const head=new Uint8Array(await file.slice(0,16).arrayBuffer()),kind=sniff(head);
 const jpeg=kind==='jpeg'?inspectJpeg(new Uint8Array(await file.slice(0,2*1024*1024).arrayBuffer())):null;
 const dec=await loadImage(file);
 try{
  const s=Math.min(1,LIMITS.thumb/Math.max(dec.w,dec.h)),c=document.createElement('canvas');
  c.width=Math.max(1,Math.round(dec.w*s));c.height=Math.max(1,Math.round(dec.h*s));
  const x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,c.width,c.height);x.imageSmoothingQuality='high';
  x.drawImage(dec.img,0,0,c.width,c.height);
  const blob=await new Promise(r=>c.toBlob(r,'image/jpeg',.82));
  c.width=0;
  if(!blob)throw new Error('thumb');
  return {w:dec.w,h:dec.h,kind,jpeg,thumb:URL.createObjectURL(blob)};
 }finally{dec.free();}}

/** Draws the image rotated/cropped/downscaled and encodes it. @returns {Promise<Uint8Array>} */
async function rasterize(it,{rot,s,cw,ch,asJpeg}){
 const dec=await loadImage(it.file);
 const c=document.createElement('canvas');
 try{
  c.width=Math.max(1,Math.round(cw*s));c.height=Math.max(1,Math.round(ch*s));
  const x=c.getContext('2d');if(!x)throw new Error('canvas unavailable');
  if(asJpeg){x.fillStyle='#fff';x.fillRect(0,0,c.width,c.height);}     // transparency → white page
  x.imageSmoothingQuality='high';
  x.translate(c.width/2,c.height/2);x.rotate(rot*Math.PI/180);
  x.drawImage(dec.img,-dec.w*s/2,-dec.h*s/2,dec.w*s,dec.h*s);
  const blob=await new Promise(r=>asJpeg?c.toBlob(r,'image/jpeg',.92):c.toBlob(r,'image/png'));
  if(!blob)throw new Error('encode failed (memory?)');
  return new Uint8Array(await blob.arrayBuffer());
 }finally{c.width=0;dec.free();}}

/** Adds one page for the item. @returns {Promise<{downscaled:boolean}>} */
async function addPage(doc,it,o){
 const rot=it.rot,swap=rot%180!==0,rw=swap?it.h:it.w,rh=swap?it.w:it.h;
 const s=Math.min(1,LIMITS.maxSide/Math.max(rw,rh));
 const g=layout(o,rw*s,rh*s),{box}=g;
 const crop=o.size!=='fit'&&o.fit==='cover'&&Math.abs(rw/rh-box.w/box.h)>0.002;
 let cw=rw,ch=rh;
 if(crop){if(rw/rh>box.w/box.h)cw=rh*box.w/box.h;else ch=rw*box.h/box.w;}
 const jpegOk=it.kind==='jpeg'&&it.jpeg&&(it.jpeg.orientation||1)===1&&(it.jpeg.components===1||it.jpeg.components===3);
 const raw=rot===0&&s===1&&!crop&&(it.kind==='png'||jpegOk);
 const graphic=it.kind==='png'||['svg','gif'].includes(extOf(it.name));
 let embedded=null;
 if(raw){
  try{const bytes=new Uint8Array(await it.file.arrayBuffer());embedded=it.kind==='jpeg'?await doc.embedJpg(bytes):await doc.embedPng(bytes);}
  catch(e){if(isMemoryError(e))throw e;embedded=null;}               // odd PNG/JPEG → re-encode through canvas
 }
 if(!embedded){
  const bytes=await rasterize(it,{rot,s,cw,ch,asJpeg:!graphic});
  embedded=graphic?await doc.embedPng(bytes):await doc.embedJpg(bytes);
 }
 let dx=box.x,dy=box.y,dw=box.w,dh=box.h;
 if(o.size!=='fit'&&!crop&&o.fit==='contain'){const k=Math.min(box.w/rw,box.h/rh);dw=rw*k;dh=rh*k;dx=box.x+(box.w-dw)/2;dy=box.y+(box.h-dh)/2;}
 doc.addPage([g.pw,g.ph]).drawImage(embedded,{x:dx,y:g.ph-dy-dh,width:dw,height:dh});
 return {downscaled:s<1};}

/* ───────────── UI ───────────── */
const $=(s,r=document)=>r.querySelector(s);
const ICON={
 rot:'<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="square" aria-hidden="true"><path d="M20 12a8 8 0 1 1-2.6-5.9"/><path d="M20 3v6h-6"/></svg>',
 del:'<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="square" aria-hidden="true"><path d="M5 5l14 14M19 5L5 19"/></svg>'};

/** Boots the Image to PDF page. */
export function init(){
 const root=$('#tool'),tray=$('#tray'),list=$('#thumbs'),msgs=$('#msgs'),go=$('#go'),live=$('#sr-live');
 const spec=TOOLS.find(x=>x.sym==='Im');
 document.title=`${t('tools.Im.name')} — ${COPY.brand.name}`;
 $('#title-tile').innerHTML=`<span class="num mono">${spec.n}</span><span class="mass mono">${spec.mass}</span><span class="sym">${spec.sym}</span>`;
 $('#dz-types').textContent=fill(t('dropzone.types'),{types:COPY.imTypes,size:formatBytes(LIMITS.maxBytes)});
 $('#dz-max').textContent=fill(t('dropzone.maxFiles'),{n:LIMITS.maxFiles});
 $('#dz-hit').setAttribute('aria-label',`${t('dropzone.label')}. ${t('dropzone.idle')}`);
 $('#dz-barrel').innerHTML=prop('barrel');$('#dz-flask').innerHTML=prop('flask');
 go.querySelector('span').textContent=t('tools.Im.button');
 $('#err-char').innerHTML=char('mike',COPY.alt.mike);$('#err-prop').innerHTML=prop('gasMask');

 /** @type {{id:number,file:File,name:string,size:number,w:number,h:number,kind:string,jpeg:any,rot:number,thumb:string,status:'loading'|'ready',el:HTMLElement,removed:boolean}[]} */
 let items=[],uid=0,state='idle',ac=null,result=null,queue=Promise.resolve();
 const progress=createRvProgress($('#progress'),{onCancel:()=>ac&&ac.abort()});
 const say=m=>{live.textContent='';setTimeout(()=>live.textContent=m,30);};

 /* --- state machine --- */
 function setState(s){
  const was=state;state=s;root.dataset.state=s;
  root.querySelectorAll('[data-show]').forEach(e=>{e.hidden=!e.dataset.show.split(' ').includes(s);});
  dz.setDisabled(s==='processing'||s==='done'||s==='error');
  refresh();
  if(s==='processing')$('#progress .btn-2')?.focus({preventScroll:true});
  else if(was==='processing'&&(s==='idle'||s==='filesChosen'))(go.disabled?$('#dz-hit'):go).focus({preventScroll:true});   // keep keyboard focus alive when the panel it was in disappears
  if(s==='done')$('#result .res-head')?.focus({preventScroll:true});
  const panel={processing:'#progress',done:'#result',error:'.errpanel'}[s];       // the tray collapses: bring the new panel into view
  if(panel)requestAnimationFrame(()=>$(panel).scrollIntoView({block:'start',behavior:reduce?'auto':'smooth'}));}
 function sync(){if(state==='idle'||state==='filesChosen')setState(items.length?'filesChosen':'idle');else refresh();}
 function refresh(){
  const ready=items.filter(i=>i.status==='ready').length,loading=items.length-ready;
  go.disabled=!(ready>0&&loading===0&&(state==='idle'||state==='filesChosen'));
  tray.classList.toggle('has-files',items.length>0);
  $('#busy').hidden=loading===0;
  const add=list.querySelector('.addtile .mass');if(add)add.textContent=`${items.length}/${LIMITS.maxFiles}`;
  list.querySelectorAll('.imgtile:not(.addtile)').forEach((el,i)=>{el.querySelector('.num').textContent=i+1;});}

 /* --- warnings (themed, aria-live) --- */
 const warnings=[];
 function warn(text,names=[]){warnings.push({text,names});drawWarnings();}
 function clearWarnings(){warnings.length=0;drawWarnings();}
 function drawWarnings(){
  msgs.innerHTML=warnings.map(w=>`<div class="warn"><span class="warn-ico" aria-hidden="true">${prop('gasMask')}</span><div><p>${esc(w.text)}</p>${w.names.length?`<p class="mono warn-names">${esc(w.names.join(', '))}</p>`:''}</div></div>`).join('');}
 const skippedText=names=>fill(t('errors.skipped'),{n:names.length,names:names.join(', ')});

 /* --- thumbnails grid --- */
 const addTile=document.createElement('li');
 addTile.className='tile imgtile addtile';
 addTile.innerHTML=`<button type="button" class="addbtn"><span class="mass mono"></span><span class="sym" aria-hidden="true">+</span><span class="name">${t('grid.addMore')}</span></button>`;
 list.append(addTile);

 function makeTile(it){
  const li=document.createElement('li');
  li.className='tile imgtile is-loading';li.tabIndex=0;li.dataset.id=it.id;
  li.setAttribute('aria-label',`${it.name}. ${t('grid.moveHint')}`);
  li.innerHTML=`<span class="num mono"></span><span class="mass mono">${formatBytes(it.size)}</span>
   <div class="thumb"><img alt="" draggable="false" decoding="async"></div>
   <span class="name" title="${esc(it.name)}">${esc(it.name)}</span>
   <div class="acts"><button type="button" class="act rot" aria-label="${esc(fill(t('grid.rotateAria'),{name:it.name}))}">${ICON.rot}<span>${t('grid.rotate')}</span></button>
   <button type="button" class="act del" aria-label="${esc(fill(t('grid.removeAria'),{name:it.name}))}">${ICON.del}<span>${t('grid.remove')}</span></button></div>`;
  li.querySelector('.rot').addEventListener('click',()=>{it.rot=(it.rot+90)%360;li.querySelector('img').style.transform=`rotate(${it.rot}deg)`;});
  li.querySelector('.del').addEventListener('click',()=>removeItem(it));
  it.el=li;list.insertBefore(li,addTile);}

 function removeItem(it){
  const next=it.el.nextElementSibling;
  it.removed=true;if(it.thumb)URL.revokeObjectURL(it.thumb);
  items=items.filter(x=>x!==it);it.el.remove();
  clearWarnings();sync();
  (next&&next.querySelector('button,[tabindex]')||list.querySelector('.addbtn')||$('#dz-hit')).focus?.();}

 function orderFromDom(){
  const by=new Map(items.map(i=>[String(i.id),i]));
  items=[...list.querySelectorAll('.imgtile:not(.addtile)')].map(el=>by.get(el.dataset.id)).filter(Boolean);refresh();}

 /* --- drag to reorder (pointer events: mouse, pen, touch via long-press) + Alt/Shift+Arrow for keyboards --- */
 const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
 function flip(fn){
  const els=[...list.querySelectorAll('.imgtile:not(.is-dragging)')],before=new Map(els.map(e=>[e,e.getBoundingClientRect()]));
  fn();
  if(reduce)return;
  for(const e of els){const a=before.get(e),b=e.getBoundingClientRect(),dx=a.left-b.left,dy=a.top-b.top;
   if(dx||dy)e.animate([{transform:`translate(${dx}px,${dy}px)`},{transform:'none'}],{duration:160,easing:'cubic-bezier(.2,.8,.2,1)'});}}
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
   if(drag.touch){clearTimeout(drag.timer);drag=null;removeEventListener('pointermove',dragMove);return;}   // finger moved first → let the page scroll
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
  if(was){orderFromDom();const it=items.find(i=>i.el===tile);if(it)say(fill(t('grid.moved'),{name:it.name,n:items.indexOf(it)+1,total:items.length}));}}
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
  e.preventDefault();
  const sib=back?tile.previousElementSibling:tile.nextElementSibling;
  if(!sib||sib.classList.contains('addtile')||(back&&!sib))return;
  flip(()=>back?sib.before(tile):sib.after(tile));tile.focus();orderFromDom();
  const it=items.find(i=>i.el===tile);if(it)say(fill(t('grid.moved'),{name:it.name,n:items.indexOf(it)+1,total:items.length}));});
 addTile.querySelector('.addbtn').addEventListener('click',()=>dz.open());

 /* --- adding files --- */
 const group=(rej,why)=>rej.filter(r=>r.reason===why).map(r=>r.file.name);
 function onFiles({ok,rejected}){
  clearWarnings();
  const badType=group(rejected,'type'),tooBig=group(rejected,'size');
  if(badType.length)warn(fill(t('errors.type'),{types:COPY.imTypes}),badType);
  if(tooBig.length)warn(fill(t('errors.size'),{size:formatBytes(LIMITS.maxBytes)}),tooBig);
  const room=Math.max(0,LIMITS.maxFiles-items.length),take=ok.slice(0,room),extra=ok.length-take.length;
  if(extra>0)warn(fill(t('errors.tooMany'),{n:LIMITS.maxFiles,extra}));
  if(!take.length)return;
  const fresh=take.map(file=>({id:++uid,file,name:file.name,size:file.size,w:0,h:0,kind:'other',jpeg:null,rot:0,thumb:'',status:'loading',el:null,removed:false}));
  for(const it of fresh){items.push(it);makeTile(it);}
  $('#busy').textContent=loadingLine();sync();say($('#busy').textContent);
  queue=queue.then(()=>decodeAll(fresh)).catch(()=>{});}
 async function decodeAll(batch){
  const skipped=[];let hard=false;
  for(const it of batch){
   if(it.removed)continue;
   try{
    const m=await analyze(it.file);
    if(it.removed){URL.revokeObjectURL(m.thumb);continue;}
    Object.assign(it,m,{status:'ready'});
    const img=it.el.querySelector('img');img.src=m.thumb;it.el.classList.remove('is-loading');
   }catch(e){
    if(it.removed)continue;
    skipped.push(it.name);hard=hard||HARD.includes(extOf(it.name));
    it.removed=true;items=items.filter(x=>x!==it);it.el.remove();
   }
   refresh();await nextFrame();
  }
  if(skipped.length){warn(skippedText(skipped));if(hard)warn(t('errors.formatHint'));}
  sync();}

 /* --- dropzone --- */
 const dz=createDropzone({root:tray,trigger:$('#dz-hit'),label:$('#dz-label'),idleText:t('dropzone.idle'),overText:t('dropzone.over'),
  exts:EXTS,mimes:MIMES,maxBytes:LIMITS.maxBytes,onFiles});

 /* --- options --- */
 const val=n=>root.querySelector(`input[name=${n}]:checked`).value;
 const opts=()=>({size:val('size'),orient:val('orient'),margin:val('margin'),fit:val('fit')});
 const fixedOnly=()=>{const fixed=val('size')!=='fit';
  root.querySelectorAll('[data-fixed-only]').forEach(g=>{g.classList.toggle('is-off',!fixed);g.querySelectorAll('input').forEach(i=>i.disabled=!fixed);});};
 root.querySelectorAll('input[name=size]').forEach(i=>i.addEventListener('change',fixedOnly));fixedOnly();

 /* --- build --- */
 function showError(message,{retry=false,extra=[]}={}){
  $('#err-msg').textContent=message;
  $('#err-extra').innerHTML=extra.map(x=>`<p class="mono">${esc(x)}</p>`).join('');
  $('#err-retry').onclick=retry?build:()=>{clearWarnings();sync_to_files();};
  setState('error');$('#err-msg').focus();}
 function sync_to_files(){setState(items.length?'filesChosen':'idle');}

 async function build(){
  const list_=items.filter(i=>i.status==='ready'),total=list_.length;
  if(!total)return;
  clearWarnings();
  ac=new AbortController();const sig=ac.signal,o=opts(),skipped=[];let downscaled=0;
  setState('processing');progress.set(0,countText(1,total));progress.start();
  try{
   const {PDFDocument}=await loadPdfLib();checkAbort(sig);
   const doc=await PDFDocument.create();doc.setCreator(COPY.brand.name);doc.setProducer(COPY.brand.name);
   for(let i=0;i<total;i++){
    checkAbort(sig);
    progress.set(i/total*.96,countText(i+1,total));
    await nextFrame();
    try{const r=await addPage(doc,list_[i],o);if(r.downscaled)downscaled++;}
    catch(e){if(isAbort(e)||isMemoryError(e))throw e;skipped.push(list_[i].name);}
   }
   checkAbort(sig);
   if(doc.getPageCount()===0){const e=new Error('none');e.code='none';throw e;}
   progress.set(.97,'');await nextFrame();
   const bytes=await doc.save();checkAbort(sig);
   const blob=new Blob([bytes],{type:'application/pdf'});
   progress.set(1,'');await nextFrame();progress.stop();
   const notes=[];
   if(skipped.length){notes.push(skippedText(skipped));if(skipped.some(n=>HARD.includes(extOf(n))))notes.push(t('errors.formatHint'));}
   if(downscaled)notes.push(t('notes.downscaled'));
   result=showResult($('#result'),{blob,filename:OUT_NAME,pages:doc.getPageCount(),notes,onAgain:reset});
   setState('done');
  }catch(e){
   progress.stop();
   if(isAbort(e)){sync_to_files();warn(t('errors.cancelled'));return;}
   if(e.code==='library')return showError(t('errors.library'),{retry:true});
   if(e.code==='none')return showError(t('errors.corrupt'),{extra:skipped});
   if(isMemoryError(e))return showError(t('errors.memory'));
   console.error(e);showError(t('errors.generic'));
  }finally{ac=null;}}
 go.addEventListener('click',build);

 /* --- reset ("Cook another batch") --- */
 function reset(){
  result&&result.destroy();result=null;
  for(const it of items){it.removed=true;if(it.thumb)URL.revokeObjectURL(it.thumb);it.el?.remove();}
  items=[];clearWarnings();$('#err-msg').textContent='';
  setState('idle');scrollTo({top:0,behavior:reduce?'auto':'smooth'});$('#dz-hit').focus({preventScroll:true});}
 $('#err-again').addEventListener('click',reset);

 setState('idle');
}

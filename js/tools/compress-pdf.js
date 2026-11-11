/* tools/compress-pdf.js — Compress PDF (TOOLS.md §3). Exports init(). 100% client-side.
   Pipeline: pdf.js renders each page → canvas → JPEG → pdf-lib rebuilds one image per page at the original page size.
   State machine: idle → filesChosen → processing → done | error. */
import {COPY,TOOLS,t} from '../copy.js';
import {prop,char} from '../assets.js';
import {createDropzone} from '../dropzone.js';
import {createFlaskProgress} from '../progress.js';
import {showResult} from '../result.js';
import {formatBytes,fill,esc,nextFrame,checkAbort,isAbort,isMemoryError,loadScriptOnce} from '../format.js';

export const LIMITS={maxBytes:100*1024*1024,manyPages:300,chunk:20,maxPixels:16e6,maxSide:8192,previewW:340};
/** Presets from TOOLS.md §3 (default: lab). */
export const PRESETS=[{key:'street',dpi:150,q:.85},{key:'lab',dpi:110,q:.70},{key:'sky',dpi:72,q:.50}];
const MIN_SAVING=0.01;                                          // under 1% smaller is not worth a rasterised file → "Already pure"
const PDFJS_URL='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
const WORKER_URL='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
const PDFLIB_URL='https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.min.js';

/* ───────────── pure helpers (exported for testing) ───────────── */

/** Render scale for a page: dpi/72, reduced when the canvas would exceed the pixel / side limits.
 *  @param {number} w page width in points @param {number} h page height in points @param {number} dpi
 *  @returns {{scale:number, capped:boolean}} */
export function renderScale(w,h,dpi){
 let s=dpi/72,capped=false;
 const px=w*s*h*s,side=Math.max(w,h)*s;
 if(px>LIMITS.maxPixels){s*=Math.sqrt(LIMITS.maxPixels/px);capped=true;}
 if(Math.max(w,h)*s>LIMITS.maxSide){s=LIMITS.maxSide/Math.max(w,h);capped=true;}
 return {scale:s,capped};}

/** Percent saved, whole number. @param {number} before @param {number} after */
export const savedPercent=(before,after)=>before>0?Math.round((1-after/before)*100):0;

/** Maps a pdf.js / library error to a COPY key. @param {any} e @returns {'locked'|'corrupt'|'library'|'memory'|'generic'} */
export function classify(e){
 if(!e)return 'generic';
 if(e.name==='PasswordException')return 'locked';
 if(e.code==='library')return 'library';
 if(['InvalidPDFException','MissingPDFException','FormatError','XRefParseException','UnexpectedResponseException'].includes(e.name)||/invalid pdf|bad xref|end of file|corrupt/i.test(String(e.message)))return 'corrupt';
 if(isMemoryError(e))return 'memory';
 return 'generic';}

/* ───────────── pdf.js loading (+ Blob-URL worker fallback) ───────────── */
let workerReady=null,blobWorker=false;
function libError(){const e=new Error('library');e.code='library';return e;}
async function useBlobWorker(lib){
 let text;
 try{const r=await fetch(WORKER_URL);if(!r.ok)throw new Error('worker '+r.status);text=await r.text();}catch{throw libError();}
 lib.GlobalWorkerOptions.workerSrc=URL.createObjectURL(new Blob([text],{type:'text/javascript'}));blobWorker=true;}
async function setupWorker(lib){
 try{const w=new Worker(WORKER_URL);w.terminate();lib.GlobalWorkerOptions.workerSrc=WORKER_URL;}   // cross-origin workers throw here
 catch{await useBlobWorker(lib);}}
/** Loads pdf.js 3.11.174 from cdnjs and points it at a working worker. @returns {Promise<any>} pdfjsLib */
export async function loadPdfjs(){
 try{
  const lib=await loadScriptOnce(PDFJS_URL,['pdfjsLib','pdfjs-dist/build/pdf']);
  if(!workerReady)workerReady=setupWorker(lib).catch(e=>{workerReady=null;throw e;});
  await workerReady;return lib;
 }catch(e){e.lib='pdfjs';throw e;}}
/** Opens a PDF. If the worker itself is the problem, retries once through a Blob-URL worker. */
export async function openPdf(lib,file){
 const attempt=async()=>lib.getDocument({data:new Uint8Array(await file.arrayBuffer()),isEvalSupported:false,verbosity:0}).promise;
 try{return await attempt();}
 catch(e){
  if(classify(e)!=='generic'||blobWorker)throw e;
  await useBlobWorker(lib);return await attempt();}}

const toBlob=(c,q)=>new Promise(r=>c.toBlob(r,'image/jpeg',q));

/** Renders one page to a JPEG. @returns {Promise<{bytes:Uint8Array,w:number,h:number,capped:boolean}>} w/h = original page size in points */
async function pageToJpeg(pdf,i,preset,sig){
 const page=await pdf.getPage(i),base=page.getViewport({scale:1}),{scale,capped}=renderScale(base.width,base.height,preset.dpi);
 const vp=page.getViewport({scale}),c=document.createElement('canvas');
 c.width=Math.max(1,Math.floor(vp.width));c.height=Math.max(1,Math.floor(vp.height));
 try{
  const x=c.getContext('2d',{alpha:false});if(!x)throw new Error('canvas unavailable (memory?)');
  x.fillStyle='#fff';x.fillRect(0,0,c.width,c.height);
  const task=page.render({canvasContext:x,viewport:vp}),stop=()=>task.cancel();
  sig.addEventListener('abort',stop);
  if(sig.aborted)stop();                                              // cancelled while the page was still loading: the event already fired
  try{await task.promise;}
  catch(e){if(e&&e.name==='RenderingCancelledException')throw new DOMException('Aborted','AbortError');throw e;}
  finally{sig.removeEventListener('abort',stop);}
  const blob=await toBlob(c,preset.q);if(!blob)throw new Error('encode failed (memory?)');
  return {bytes:new Uint8Array(await blob.arrayBuffer()),w:base.width,h:base.height,capped};
 }finally{c.width=0;c.height=0;page.cleanup();}}                          // free the canvas after every page

/** Rebuilds the whole PDF as one JPEG per page. @returns {Promise<{blob:Blob,pages:number,capped:boolean}>} */
async function compress(file,preset,sig,onProgress){
 const lib=await loadPdfjs(),{PDFDocument}=await loadScriptOnce(PDFLIB_URL,'PDFLib').catch(e=>{e.lib='pdflib';throw e;});
 checkAbort(sig);
 const pdf=await openPdf(lib,file);
 try{
  const n=pdf.numPages;if(!n)throw Object.assign(new Error('no pages'),{name:'InvalidPDFException'});
  const doc=await PDFDocument.create();doc.setCreator(COPY.brand.name);doc.setProducer(COPY.brand.name);
  let capped=false;const chunked=n>=LIMITS.manyPages;
  for(let i=1;i<=n;i++){
   checkAbort(sig);onProgress((i-1)/n*.96,i,n);await nextFrame();
   const r=await pageToJpeg(pdf,i,preset,sig);capped=capped||r.capped;
   const img=await doc.embedJpg(r.bytes);
   doc.addPage([r.w,r.h]).drawImage(img,{x:0,y:0,width:r.w,height:r.h});
   if(chunked&&i%LIMITS.chunk===0)await new Promise(res=>setTimeout(res,40));   // 300+ pages: breathe between chunks of 20
  }
  checkAbort(sig);onProgress(.97,n,n);await nextFrame();
  const bytes=await doc.save();checkAbort(sig);
  return {blob:new Blob([bytes],{type:'application/pdf'}),pages:n,capped};
 }finally{try{await pdf.destroy();}catch{}}}

/* ───────────── UI ───────────── */
const $=(s,r=document)=>r.querySelector(s);

/** Boots the Compress PDF page. */
export function init(){
 const root=$('#tool'),tray=$('#tray'),msgs=$('#msgs'),go=$('#go'),card=$('#pdfcard'),prev=$('#pdf-prev');
 const spec=TOOLS.find(x=>x.sym==='Cp'),reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
 document.title=`${t('tools.Cp.name')} — ${COPY.brand.name}`;
 $('#title-tile').innerHTML=`<span class="num mono">${spec.n}</span><span class="mass mono">${spec.mass}</span><span class="sym">${spec.sym}</span>`;
 $('#dz-types').textContent=fill(t('dropzone.types'),{types:t('dropzone.pdfTypes'),size:formatBytes(LIMITS.maxBytes)});
 $('#dz-hit').setAttribute('aria-label',`${t('dropzone.pdfLabel')}. ${t('dropzone.idle')}`);
 $('#dz-barrel').innerHTML=prop('barrel');$('#dz-flask').innerHTML=prop('flask');
 go.querySelector('span').textContent=t('tools.Cp.button');
 prev.querySelector('img').alt=t('file.previewAlt');
 $('#err-char').innerHTML=char('mike',COPY.alt.mike);$('#err-prop').innerHTML=prop('gasMask');
 $('#presets').innerHTML=PRESETS.map(p=>{
  const label=t('opts.'+p.key),m=label.match(/^(.*?)\s*\((.*)\)$/)||[0,label,''];
  return `<label><input type="radio" name="preset" value="${p.key}"${p.key==='lab'?' checked':''}><span class="pc"><b>${esc(m[1])}</b><span>${esc(m[2])}</span>
   <span class="mono">${fill(t('opts.presetSpec'),{dpi:p.dpi,q:Math.round(p.q*100)})}</span></span></label>`;}).join('');

 /** @type {{file:File,pages:number,preview:string,ready:boolean}|null} */
 let cur=null,state='idle',ac=null,result=null,token=0;
 const progress=createFlaskProgress($('#progress'),{onCancel:()=>ac&&ac.abort()});

 /* --- state machine --- */
 function setState(s){
  const was=state;state=s;root.dataset.state=s;
  root.querySelectorAll('[data-show]').forEach(e=>{e.hidden=!e.dataset.show.split(' ').includes(s);});
  dz.setDisabled(s==='processing'||s==='done'||s==='error');
  refresh();
  if(s==='processing')$('#progress .btn-2')?.focus({preventScroll:true});
  else if(was==='processing'&&(s==='idle'||s==='filesChosen'))(go.disabled?$('#dz-hit'):go).focus({preventScroll:true});   // keep keyboard focus alive when the panel it was in disappears
  if(s==='done')$('#result .res-head')?.focus({preventScroll:true});
  const panel={processing:'#progress',done:'#result',error:'.errpanel'}[s];
  if(panel)requestAnimationFrame(()=>$(panel).scrollIntoView({block:'start',behavior:reduce?'auto':'smooth'}));}
 function refresh(){
  go.disabled=!(cur&&cur.ready&&(state==='idle'||state==='filesChosen'));
  tray.classList.toggle('has-files',!!cur);card.hidden=!cur;}
 const toFiles=()=>setState(cur?'filesChosen':'idle');

 /* --- warnings --- */
 const warnings=[];
 function warn(text,names=[]){warnings.push({text,names});drawWarnings();}
 function clearWarnings(){warnings.length=0;drawWarnings();}
 function drawWarnings(){
  msgs.innerHTML=warnings.map(w=>`<div class="warn"><span class="warn-ico" aria-hidden="true">${prop('gasMask')}</span><div><p>${esc(w.text)}</p>${w.names.length?`<p class="mono warn-names">${esc(w.names.join(', '))}</p>`:''}</div></div>`).join('');}
 const msgFor=(kind,name)=>({locked:fill(t('errors.locked')),corrupt:t('errors.corrupt'),library:t('errors.libraryPdfjs'),memory:t('errors.memory')})[kind]||t('errors.generic');

 /* --- choosing a file: page count + first-page preview --- */
 const pagesText=n=>n===1?t('result.pagesOne'):fill(t('result.pages'),{n});
 function drawCard(){
  if(!cur){return;}
  $('#pdf-name').textContent=cur.file.name;$('#pdf-name').title=cur.file.name;
  $('#pdf-facts').innerHTML=cur.ready?`<span>${esc(pagesText(cur.pages))}</span><span>${formatBytes(cur.file.size)}</span>`:`<span>${formatBytes(cur.file.size)}</span>`;
  prev.classList.toggle('is-loading',!cur.ready);
  const img=prev.querySelector('img');if(cur.preview)img.src=cur.preview;else img.removeAttribute('src');
  $('#pdf-rm').setAttribute('aria-label',fill(t('grid.removeAria'),{name:cur.file.name}));}
 function dropCurrent(){if(cur&&cur.preview)URL.revokeObjectURL(cur.preview);cur=null;token++;}
 async function choose(file){
  dropCurrent();const my=token;
  cur={file,pages:0,preview:'',ready:false};drawCard();toFiles();
  let pdf=null;
  try{
   const lib=await loadPdfjs();pdf=await openPdf(lib,file);
   if(my!==token)return;
   const pages=pdf.numPages;if(!pages)throw Object.assign(new Error('no pages'),{name:'InvalidPDFException'});
   const pg=await pdf.getPage(1),b=pg.getViewport({scale:1}),vp=pg.getViewport({scale:Math.min(2,LIMITS.previewW/b.width)});
   const c=document.createElement('canvas');c.width=Math.max(1,Math.floor(vp.width));c.height=Math.max(1,Math.floor(vp.height));
   let blob=null;
   try{
    const x=c.getContext('2d',{alpha:false});x.fillStyle='#fff';x.fillRect(0,0,c.width,c.height);
    await pg.render({canvasContext:x,viewport:vp}).promise;
    blob=await toBlob(c,.8);
   }finally{c.width=0;c.height=0;pg.cleanup();}
   if(my!==token)return;
   Object.assign(cur,{pages,preview:blob?URL.createObjectURL(blob):'',ready:true});
   if(pages>=LIMITS.manyPages)warn(fill(t('errors.manyPages'),{n:pages}));
   drawCard();refresh();
  }catch(e){
   if(my!==token)return;
   const kind=classify(e);if(kind==='generic')console.error(e);
   dropCurrent();
   if(kind==='library')return showError(msgFor(kind),{retry:()=>{clearWarnings();toFiles();choose(file);}});   // library didn't load: themed error + Retry
   warn(msgFor(kind,file.name),[file.name]);toFiles();
  }finally{try{pdf&&await pdf.destroy();}catch{}}}
 function onFiles({ok,rejected}){
  clearWarnings();
  const names=why=>rejected.filter(r=>r.reason===why).map(r=>r.file.name);
  if(names('type').length)warn(fill(t('errors.type'),{types:t('dropzone.pdfTypes')}),names('type'));
  if(names('size').length)warn(fill(t('errors.size'),{size:formatBytes(LIMITS.maxBytes)}),names('size'));
  if(!ok.length)return;
  if(ok.length>1)warn(fill(t('errors.onePdf'),{name:ok[0].name}));
  choose(ok[0]);}
 const dz=createDropzone({root:tray,trigger:$('#dz-hit'),label:$('#dz-label'),idleText:t('dropzone.idle'),overText:t('dropzone.over'),
  exts:['pdf'],mimes:['application/pdf'],maxBytes:LIMITS.maxBytes,multiple:false,onFiles});
 $('#pdf-rm').addEventListener('click',()=>{dropCurrent();clearWarnings();toFiles();$('#dz-hit').focus();});

 /* --- build --- */
 const preset=()=>PRESETS.find(p=>p.key===root.querySelector('input[name=preset]:checked').value);
 function showError(message,{retry=false}={}){
  $('#err-msg').textContent=message;
  $('#err-retry').onclick=typeof retry==='function'?retry:retry?build:()=>{clearWarnings();toFiles();};
  setState('error');$('#err-msg').focus();}

 async function build(){
  if(!cur||!cur.ready)return;
  const {file}=cur,p=preset();
  clearWarnings();ac=new AbortController();const sig=ac.signal;
  setState('processing');progress.set(0,'');progress.start();
  try{
   const r=await compress(file,p,sig,(f,i,n)=>progress.set(f,fill(t('progress.page'),{n:i,total:n})));
   progress.set(1,'');await nextFrame();progress.stop();
   const notes=r.capped?[t('notes.capped')]:[];
   const saved=file.size>0?1-r.blob.size/file.size:0;
   if(saved<MIN_SAVING){                                               // never hand over a bigger (or pointless) file
    result=showResult($('#result'),{blob:file,filename:file.name,pages:r.pages,stamp:t('result.stampPure'),heading:t('result.alreadyPure'),
     downloadLabel:t('result.downloadOriginal'),stats:[pagesText(r.pages),formatBytes(file.size)],notes,onAgain:reset});
   }else{
    const base=file.name.replace(/\.pdf$/i,'')||'document';
    result=showResult($('#result'),{blob:r.blob,filename:`${base}-compressed.pdf`,pages:r.pages,stamp:fill(t('result.stampSmaller'),{percent:savedPercent(file.size,r.blob.size)}),
     stats:[fill(t('result.beforeAfter'),{a:formatBytes(file.size),b:formatBytes(r.blob.size)}),pagesText(r.pages)],notes,onAgain:reset});
   }
   setState('done');$('#result .res-head')?.focus({preventScroll:true});   // the panel was hidden while showResult ran, so focus now
  }catch(e){
   progress.stop();
   if(isAbort(e)){toFiles();warn(t('errors.cancelled'));return;}
   const kind=classify(e);
   if(kind==='library')return showError(t(e.lib==='pdflib'?'errors.library':'errors.libraryPdfjs'),{retry:true});
   if(kind!=='generic')return showError(msgFor(kind,file.name));
   console.error(e);showError(t('errors.generic'));
  }finally{ac=null;}}
 go.addEventListener('click',build);

 /* --- reset ("Cook another batch") --- */
 function reset(){
  result&&result.destroy();result=null;dropCurrent();clearWarnings();$('#err-msg').textContent='';
  setState('idle');scrollTo({top:0,behavior:reduce?'auto':'smooth'});$('#dz-hit').focus({preventScroll:true});}
 $('#err-again').addEventListener('click',reset);

 setState('idle');
}

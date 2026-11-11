/* tools/remove-pages.js — Remove pages. Exports init(). 100% client-side.
   Page thumbnails + selection come from js/pdf-pages.js; pdf-lib copyPages keeps only the surviving pages (no rasterizing).
   State machine: idle → filesChosen → processing → done | error. */
import {COPY,TOOLS,t} from '../copy.js';
import {prop,char} from '../assets.js';
import {createDropzone} from '../dropzone.js';
import {createRvProgress} from '../progress.js';
import {showResult} from '../result.js';
import {loadPdf,renderPage,freeCanvas,createPageGrid,parseRanges,formatRanges,pagesOf,classify} from '../pdf-pages.js';
import {formatBytes,fill,esc,nextFrame,checkAbort,isAbort,isMemoryError,loadScriptOnce} from '../format.js';

export const LIMITS={maxBytes:100*1024*1024,previewW:340,gridW:120};
const PDFLIB_URL='https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.min.js';
const $=(s,r=document)=>r.querySelector(s);
const isLockedErr=e=>!!e&&(e.name==='EncryptedPDFError'||e.name==='PasswordException'||/encrypt/i.test(String(e.message)));

/** Pages to remove from typed ranges. @returns {{pages:number[]}|{error:string}} error = themed text */
export function planRemoval(text,pageCount){
 const r=parseRanges(text,pageCount);
 if(r.error){const k={empty:'errEmpty',invalid:'errInvalid',order:'errOrder',beyond:'errBeyond'}[r.error.code];return {error:fill(t('split.'+k),{d:r.error.detail,n:pageCount})};}
 return {pages:pagesOf(r.ranges)};}

/** Boots the Remove pages page. */
export function init(){
 const root=$('#tool'),tray=$('#tray'),msgs=$('#msgs'),go=$('#go'),card=$('#pdfcard'),prev=$('#pdf-prev'),inp=$('#ranges'),count=$('#sel-count');
 const spec=TOOLS.find(x=>x.sym==='Rm'),reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
 document.title=`${t('tools.Rm.name')} — ${COPY.brand.name}`;
 $('#title-tile').innerHTML=`<span class="num mono">${spec.n}</span><span class="mass mono">${spec.mass}</span><span class="sym">${spec.sym}</span>`;
 $('#dz-types').textContent=fill(t('dropzone.types'),{types:t('dropzone.pdfTypes'),size:formatBytes(LIMITS.maxBytes)});
 $('#dz-hit').setAttribute('aria-label',`${t('dropzone.pdfLabel')}. ${t('dropzone.idle')}`);
 $('#dz-barrel').innerHTML=prop('barrel');$('#dz-flask').innerHTML=prop('flask');
 go.querySelector('span').textContent=t('tools.Rm.button');
 prev.querySelector('img').alt=t('file.previewAlt');$('#pages').setAttribute('aria-label',t('remove.gridLabel'));
 $('#err-char').innerHTML=char('mike',COPY.alt.mike);$('#err-prop').innerHTML=prop('gasMask');

 /** @type {{file:File,pdf:any,pages:number,preview:string,grid:any}|null} */
 let cur=null,state='idle',ac=null,result=null,token=0;
 const progress=createRvProgress($('#progress'),{onCancel:()=>ac&&ac.abort()});
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
 const toFiles=()=>setState(cur?'filesChosen':'idle');
 const marked=()=>cur&&cur.grid?cur.grid.getSelection():[];
 function refresh(){
  go.disabled=!(cur&&cur.grid&&marked().length>0&&(state==='idle'||state==='filesChosen'));   // nothing selected → disabled
  tray.classList.toggle('has-files',!!cur);card.hidden=!cur;
  if(cur){const n=marked().length;count.textContent=fill(t(n?'remove.live':'remove.liveNone'),{n,total:cur.pages});}else count.textContent='';}

 /* --- warnings --- */
 const warnings=[];
 function warn(text,names=[]){warnings.push({text,names});drawWarnings();}
 function clearWarnings(){warnings.length=0;drawWarnings();}
 function drawWarnings(){
  msgs.innerHTML=warnings.map(w=>`<div class="warn"><span class="warn-ico" aria-hidden="true">${prop('gasMask')}</span><div><p>${esc(w.text)}</p>${w.names.length?`<p class="mono warn-names">${esc(w.names.join(', '))}</p>`:''}</div></div>`).join('');}

 /* --- file card + selection sync (ranges text ⇄ thumbnails) --- */
 function dropCurrent(){
  token++;
  if(cur){cur.grid&&cur.grid.destroy();if(cur.preview)URL.revokeObjectURL(cur.preview);try{cur.pdf&&cur.pdf.destroy();}catch{}}
  cur=null;inp.value='';inp.removeAttribute('aria-invalid');}
 function drawCard(){
  $('#pdf-name').textContent=cur.file.name;$('#pdf-name').title=cur.file.name;
  $('#pdf-facts').innerHTML=`<span>${esc(pagesText(cur.pages))}</span><span>${formatBytes(cur.file.size)}</span>`;
  const img=prev.querySelector('img');if(cur.preview)img.src=cur.preview;else img.removeAttribute('src');
  prev.classList.toggle('is-loading',!cur.preview);
  $('#pdf-rm').setAttribute('aria-label',fill(t('grid.removeAria'),{name:cur.file.name}));}
 async function choose(file){
  dropCurrent();clearWarnings();const my=token;
  let pdf=null;
  try{
   pdf=await loadPdf(file);
   if(my!==token){pdf.destroy();return;}
   const pages=pdf.numPages;if(!pages)throw Object.assign(new Error('no pages'),{name:'InvalidPDFException'});
   cur={file,pdf,pages,preview:'',grid:null};drawCard();toFiles();
   cur.grid=createPageGrid($('#pages'),{pdf,pageCount:pages,width:LIMITS.gridW,pageLabel:n=>fill(t('split.pageAria'),{n}),
    onChange:sel=>{inp.value=formatRanges(sel);inp.removeAttribute('aria-invalid');clearWarnings();refresh();}});
   refresh();
   try{
    const c=await renderPage(pdf,1,LIMITS.previewW);
    const blob=await new Promise(r=>c.toBlob(r,'image/jpeg',.8));freeCanvas(c);
    if(my!==token)return;cur.preview=blob?URL.createObjectURL(blob):'';drawCard();
   }catch{}
  }catch(e){
   if(my!==token)return;
   const kind=classify(e);if(kind==='generic')console.error(e);
   try{pdf&&pdf.destroy();}catch{}cur=null;
   if(kind==='library')return showError(t('errors.libraryPdfjs'),{retry:()=>{clearWarnings();toFiles();choose(file);}});
   warn(kind==='locked'?fill(t('merge.lockedNamed'),{name:file.name}):kind==='memory'?t('errors.memory'):t('errors.corrupt'),[file.name]);toFiles();}}
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

 inp.addEventListener('input',()=>{                            // typed ranges → thumbnails (only when they parse)
  if(!cur)return;const r=parseRanges(inp.value,cur.pages);
  if(r.error){r.error.code==='empty'?(inp.removeAttribute('aria-invalid'),cur.grid.setSelection([])):inp.setAttribute('aria-invalid','true');refresh();return;}
  inp.removeAttribute('aria-invalid');cur.grid.setSelection(pagesOf(r.ranges));clearWarnings();refresh();});
 const setSel=pages=>{if(!cur)return;cur.grid.setSelection(pages);inp.value=formatRanges(pages);inp.removeAttribute('aria-invalid');clearWarnings();refresh();};
 const every=k=>cur?Array.from({length:cur.pages},(_,i)=>i+1).filter(n=>n%2===k):[];
 $('#b-odd').addEventListener('click',()=>setSel(every(1)));
 $('#b-even').addEventListener('click',()=>setSel(every(0)));
 $('#b-clear').addEventListener('click',()=>setSel([]));

 /* --- build --- */
 function showError(message,{retry=false}={}){
  $('#err-msg').textContent=message;
  $('#err-retry').onclick=typeof retry==='function'?retry:retry?cook:()=>{clearWarnings();toFiles();};
  setState('error');$('#err-msg').focus();}
 function build(){
  if(!cur)return;clearWarnings();
  const plan=planRemoval(inp.value,cur.pages);
  if(plan.error){warn(plan.error);inp.setAttribute('aria-invalid','true');inp.focus();return;}
  if(plan.pages.length>=cur.pages){warn(t('remove.errAll'));return;}       // never wipe every page
  cook(plan.pages);}
 let lastRemove=null;
 async function cook(remove=lastRemove){
  if(!cur||!remove)return;lastRemove=remove;
  const {file}=cur,gone=new Set(remove);
  ac=new AbortController();const sig=ac.signal;
  setState('processing');progress.set(0,fill(t('tools.Rm.verb'),{n:1,total:cur.pages}));progress.start();
  let src=null,out=null;
  try{
   const {PDFDocument}=await loadScriptOnce(PDFLIB_URL,'PDFLib');checkAbort(sig);
   try{src=await PDFDocument.load(new Uint8Array(await file.arrayBuffer()),{updateMetadata:false});}
   catch(e){if(isLockedErr(e)){const x=new Error('locked');x.code='locked';throw x;}if(isMemoryError(e))throw e;const x=new Error('corrupt');x.code='corrupt';throw x;}
   const before=src.getPageCount(),keep=[];for(let i=0;i<before;i++)if(!gone.has(i+1))keep.push(i);
   if(!keep.length){const x=new Error('all');x.code='all';throw x;}
   out=await PDFDocument.create();out.setCreator(COPY.brand.name);out.setProducer(COPY.brand.name);
   const CH=50;                                                   // copy in chunks so cancel stays responsive on big files
   for(let i=0;i<keep.length;i+=CH){
    checkAbort(sig);progress.set(i/keep.length*.9,fill(t('tools.Rm.verb'),{n:Math.min(i+CH,keep.length),total:keep.length}));await nextFrame();
    (await out.copyPages(src,keep.slice(i,i+CH))).forEach(p=>out.addPage(p));}
   src=null;checkAbort(sig);progress.set(.95,'');await nextFrame();
   const bytes=await out.save();checkAbort(sig);out=null;         // free the working documents
   const blob=new Blob([bytes],{type:'application/pdf'});
   progress.set(1,'');await nextFrame();progress.stop();
   const base=file.name.replace(/\.pdf$/i,'')||'document';
   result=showResult($('#result'),{blob,filename:`${base}${t('remove.suffix')}.pdf`,pages:keep.length,
    stats:[fill(t('remove.beforeAfter'),{a:before,b:keep.length}),fill(t('result.beforeAfter'),{a:formatBytes(file.size),b:formatBytes(blob.size)})],onAgain:reset});
   setState('done');$('#result .res-head')?.focus({preventScroll:true});
  }catch(e){
   progress.stop();src=null;out=null;
   if(isAbort(e)){toFiles();warn(t('errors.cancelled'));return;}
   if(e.code==='library')return showError(t('errors.library'),{retry:true});
   if(e.code==='locked')return showError(fill(t('merge.lockedNamed'),{name:file.name}));
   if(e.code==='corrupt')return showError(t('errors.corrupt'));
   if(e.code==='all')return showError(t('remove.errAll'));
   if(isMemoryError(e))return showError(t('errors.memory'));
   console.error(e);showError(t('errors.generic'));
  }finally{ac=null;}}
 go.addEventListener('click',build);

 /* --- reset ("Cook another batch"): revoke every Blob URL, destroy the pdf.js document --- */
 function reset(){
  result&&result.destroy();result=null;lastRemove=null;dropCurrent();clearWarnings();$('#err-msg').textContent='';
  setState('idle');scrollTo({top:0,behavior:reduce?'auto':'smooth'});$('#dz-hit').focus({preventScroll:true});}
 $('#err-again').addEventListener('click',reset);

 setState('idle');
}

/* tools/split-pdf.js — Split PDF. Exports init(). 100% client-side.
   pdf.js (via js/pdf-pages.js) shows page thumbnails; pdf-lib copyPages builds each part (no rasterizing); JSZip packs several parts.
   State machine: idle → filesChosen → processing → done | error. */
import {COPY,TOOLS,t} from '../copy.js';
import {prop,char} from '../assets.js';
import {createDropzone} from '../dropzone.js';
import {createRvProgress} from '../progress.js';
import {showResult} from '../result.js';
import {loadPdf,renderPage,freeCanvas,createPageGrid,parseRanges,formatRanges,pagesOf,classify} from '../pdf-pages.js';
import {formatBytes,fill,esc,nextFrame,checkAbort,isAbort,isMemoryError,loadScriptOnce} from '../format.js';

export const LIMITS={maxBytes:100*1024*1024,manyPages:300,previewW:340,gridW:120};
const PDFLIB_URL='https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.min.js';
const JSZIP_URL='https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
const $=(s,r=document)=>r.querySelector(s);
const isLockedErr=e=>!!e&&(e.name==='EncryptedPDFError'||e.name==='PasswordException'||/encrypt/i.test(String(e.message)));
const zipErr=()=>Object.assign(new Error('library'),{code:'library',lib:'zip'});

/** Builds the part list for a mode. @returns {{parts:{pages:number[],range:string}[]}|{error:string}} error = a COPY key (+ vars) */
export function planParts(mode,{text,mergeAll,every,picked,pageCount}){
 if(mode==='ranges'){
  const r=parseRanges(text,pageCount);
  if(r.error){const k={empty:'errEmpty',invalid:'errInvalid',order:'errOrder',beyond:'errBeyond'}[r.error.code];return {error:fill(t('split.'+k),{d:r.error.detail,n:pageCount})};}
  if(mergeAll){const pages=r.ranges.flatMap(([a,b])=>Array.from({length:b-a+1},(_,i)=>a+i));return {parts:[{pages,range:formatRanges(pages)}]};}
  return {parts:r.ranges.map(([a,b])=>({pages:Array.from({length:b-a+1},(_,i)=>a+i),range:a===b?`${a}`:`${a}-${b}`}))};}
 if(mode==='every'){
  if(!Number.isInteger(every)||every<1)return {error:t('split.errEvery')};
  const parts=[];for(let a=1;a<=pageCount;a+=every){const b=Math.min(pageCount,a+every-1);parts.push({pages:Array.from({length:b-a+1},(_,i)=>a+i),range:a===b?`${a}`:`${a}-${b}`});}
  return {parts};}
 if(!picked.length)return {error:t('split.errNoPick')};
 return {parts:[{pages:picked,range:formatRanges(picked)}]};}

/** Boots the Split PDF page. */
export function init(){
 const root=$('#tool'),tray=$('#tray'),msgs=$('#msgs'),go=$('#go'),card=$('#pdfcard'),prev=$('#pdf-prev'),inp=$('#ranges'),every=$('#every'),mergeAll=$('#merge-all'),count=$('#sel-count');
 const spec=TOOLS.find(x=>x.sym==='Sp'),reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
 document.title=`${t('tools.Sp.name')} — ${COPY.brand.name}`;
 $('#title-tile').innerHTML=`<span class="num mono">${spec.n}</span><span class="mass mono">${spec.mass}</span><span class="sym">${spec.sym}</span>`;
 $('#dz-types').textContent=fill(t('dropzone.types'),{types:t('dropzone.pdfTypes'),size:formatBytes(LIMITS.maxBytes)});
 $('#dz-hit').setAttribute('aria-label',`${t('dropzone.pdfLabel')}. ${t('dropzone.idle')}`);
 $('#dz-barrel').innerHTML=prop('barrel');$('#dz-flask').innerHTML=prop('flask');
 go.querySelector('span').textContent=t('tools.Sp.button');
 prev.querySelector('img').alt=t('file.previewAlt');inp.placeholder=t('split.rangesPh');$('#pages').setAttribute('aria-label',t('split.gridLabel'));
 $('#err-char').innerHTML=char('mike',COPY.alt.mike);$('#err-prop').innerHTML=prop('gasMask');

 /** @type {{file:File,pdf:any,pages:number,preview:string,grid:any}|null} */
 let cur=null,state='idle',ac=null,result=null,token=0;
 const progress=createRvProgress($('#progress'),{onCancel:()=>ac&&ac.abort()});
 const pagesText=n=>n===1?t('result.pagesOne'):fill(t('result.pages'),{n});
 const mode=()=>root.querySelector('input[name=mode]:checked').value;

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
 function refresh(){go.disabled=!(cur&&(state==='idle'||state==='filesChosen'));tray.classList.toggle('has-files',!!cur);card.hidden=!cur;}

 /* --- warnings --- */
 const warnings=[];
 function warn(text,names=[]){warnings.push({text,names});drawWarnings();}
 function clearWarnings(){warnings.length=0;drawWarnings();}
 function drawWarnings(){
  msgs.innerHTML=warnings.map(w=>`<div class="warn"><span class="warn-ico" aria-hidden="true">${prop('gasMask')}</span><div><p>${esc(w.text)}</p>${w.names.length?`<p class="mono warn-names">${esc(w.names.join(', '))}</p>`:''}</div></div>`).join('');}

 /* --- file + selection sync (ranges text ⇄ thumbnails) --- */
 function updateCount(pages){count.textContent=pages.length?fill(t('split.selected'),{n:pages.length}):t('split.noneSelected');}
 function dropCurrent(){
  token++;
  if(cur){cur.grid&&cur.grid.destroy();if(cur.preview)URL.revokeObjectURL(cur.preview);try{cur.pdf&&cur.pdf.destroy();}catch{}}
  cur=null;inp.value='';inp.removeAttribute('aria-invalid');count.textContent='';}
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
    onChange:sel=>{inp.value=formatRanges(sel);inp.removeAttribute('aria-invalid');updateCount(sel);}});
   updateCount([]);
   try{                                                        // first-page preview for the file card
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
  if(r.error){r.error.code==='empty'?inp.removeAttribute('aria-invalid'):inp.setAttribute('aria-invalid','true');if(r.error.code==='empty'){cur.grid.setSelection([]);updateCount([]);}return;}
  inp.removeAttribute('aria-invalid');const p=pagesOf(r.ranges);cur.grid.setSelection(p);updateCount(p);});
 root.querySelectorAll('input[name=mode]').forEach(r=>r.addEventListener('change',()=>{
  const m=mode();$('#p-ranges').hidden=m!=='ranges';$('#p-every').hidden=m!=='every';$('#p-pick').hidden=m!=='pick';}));

 /* --- build --- */
 function showError(message,{retry=false,extra=[]}={}){
  $('#err-msg').textContent=message;$('#err-extra').innerHTML=extra.map(x=>`<p class="mono">${esc(x)}</p>`).join('');
  $('#err-retry').onclick=typeof retry==='function'?retry:retry?cook:()=>{clearWarnings();toFiles();};
  setState('error');$('#err-msg').focus();}
 const baseName=()=>cur.file.name.replace(/\.pdf$/i,'')||'document';
 function partName(base,range,used){
  let n=`${base}_p${range.length>30?'selected':range.replace(/, /g,'_')}.pdf`;
  for(let i=2;used.has(n);i++)n=n.replace(/(_\d+)?\.pdf$/,`_${i}.pdf`);used.add(n);return n;}

 function build(){
  if(!cur)return;clearWarnings();
  const plan=planParts(mode(),{text:inp.value,mergeAll:mergeAll.checked,every:Number(every.value),picked:cur.grid.getSelection(),pageCount:cur.pages});
  if(plan.error){warn(plan.error);if(mode()==='ranges'){inp.setAttribute('aria-invalid','true');inp.focus();}else if(mode()==='every')every.focus();return;}
  cook(plan.parts);}
 let lastParts=null;
 async function cook(parts=lastParts){
  if(!cur||!parts||!parts.length)return;lastParts=parts;
  const {file}=cur,base=baseName(),used=new Set(),total=parts.length;
  ac=new AbortController();const sig=ac.signal;
  setState('processing');progress.set(0,fill(t('tools.Sp.verb'),{n:1,total}));progress.start();
  const made=[];let src=null;
  try{
   const {PDFDocument}=await loadScriptOnce(PDFLIB_URL,'PDFLib');checkAbort(sig);
   try{src=await PDFDocument.load(new Uint8Array(await file.arrayBuffer()),{updateMetadata:false});}
   catch(e){if(isLockedErr(e)){const x=new Error('locked');x.code='locked';throw x;}if(isMemoryError(e))throw e;const x=new Error('corrupt');x.code='corrupt';throw x;}
   for(let i=0;i<total;i++){
    checkAbort(sig);progress.set(i/total*.9,fill(t('tools.Sp.verb'),{n:i+1,total}));await nextFrame();
    let out=await PDFDocument.create();out.setCreator(COPY.brand.name);out.setProducer(COPY.brand.name);
    const copied=await out.copyPages(src,parts[i].pages.map(p=>p-1));copied.forEach(p=>out.addPage(p));
    const bytes=await out.save();out=null;                        // free this part's document before building the next
    const pc=parts[i].pages.length;
    made.push({blob:new Blob([bytes],{type:'application/pdf'}),filename:partName(base,parts[i].range,used),pages:pc,
     label:fill(t(parts[i].range.includes('-')||parts[i].range.includes(',')?'split.partRange':'split.partOne'),{r:parts[i].range})});
    await nextFrame();}
   src=null;checkAbort(sig);
   const totalPages=made.reduce((a,p)=>a+p.pages,0);
   if(made.length===1){
    progress.set(1,'');await nextFrame();progress.stop();
    result=showResult($('#result'),{blob:made[0].blob,filename:made[0].filename,pages:totalPages,stats:[pagesText(totalPages),formatBytes(made[0].blob.size)],onAgain:reset});
   }else{
    progress.set(.93,t('split.zipping'));await nextFrame();
    const JSZip=await loadScriptOnce(JSZIP_URL,'JSZip').catch(()=>{throw zipErr();});checkAbort(sig);
    const zip=new JSZip();for(const p of made)zip.file(p.filename,p.blob);
    const zb=await zip.generateAsync({type:'blob',compression:'STORE'});checkAbort(sig);
    progress.set(1,'');await nextFrame();progress.stop();
    result=showResult($('#result'),{blob:zb,filename:'split.zip',pages:totalPages,downloadLabel:t('split.downloadZip'),
     stats:[fill(t('split.files'),{n:made.length}),pagesText(totalPages),formatBytes(zb.size)],parts:made.map(p=>({blob:p.blob,filename:p.filename,label:p.label})),onAgain:reset});}
   setState('done');$('#result .res-head')?.focus({preventScroll:true});
  }catch(e){
   progress.stop();src=null;
   if(isAbort(e)){toFiles();warn(t('errors.cancelled'));return;}
   if(e.code==='library')return showError(t(e.lib==='zip'?'split.errLibraryZip':'errors.library'),{retry:true});
   if(e.code==='locked')return showError(fill(t('merge.lockedNamed'),{name:file.name}));
   if(e.code==='corrupt')return showError(t('errors.corrupt'));
   if(isMemoryError(e))return showError(t('errors.memory'));
   console.error(e);showError(t('errors.generic'));
  }finally{ac=null;}}
 go.addEventListener('click',build);

 /* --- reset ("Cook another batch"): revoke every Blob URL, destroy the pdf.js document --- */
 function reset(){
  result&&result.destroy();result=null;lastParts=null;dropCurrent();clearWarnings();$('#err-msg').textContent='';
  setState('idle');scrollTo({top:0,behavior:reduce?'auto':'smooth'});$('#dz-hit').focus({preventScroll:true});}
 $('#err-again').addEventListener('click',reset);

 setState('idle');
}

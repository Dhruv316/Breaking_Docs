/* tools/ppt-to-pdf.js — PPT to PDF (TOOLS.md §2). Exports init(). 100% client-side.
   Pipeline: JSZip checks the deck (zip? locked? slides? slide size) → pptx-preview 1.0.7 draws each slide as HTML inside a hidden,
   style-isolated <iframe> → html2canvas rasterizes it → pdf-lib puts it on its own PDF page at the slide's aspect ratio.
   State machine: idle → filesChosen → processing → done | error. */
import {COPY,TOOLS,t} from '../copy.js';
import {prop,char} from '../assets.js';
import {createDropzone} from '../dropzone.js';
import {createPileProgress} from '../progress.js';
import {showResult} from '../result.js';
import {formatBytes,fill,esc,extOf,clamp,nextFrame,checkAbort,isAbort,isMemoryError,loadScriptOnce} from '../format.js';

export const LIMITS={maxBytes:50*1024*1024,manySlides:100,maxPixels:16e6,maxSide:8192,previewW:340,jpeg:.92,slideTimeout:45000,chunk:10};
/** Quality options from TOOLS.md §2 (default: high). */
export const QUALITY=[{key:'standard',scale:1.5,label:'opts.qStandard',spec:'opts.qStandardSpec'},{key:'high',scale:2,label:'opts.qHigh',spec:'opts.qHighSpec'}];
const URLS={
 pptx:'https://cdn.jsdelivr.net/npm/pptx-preview@1.0.7/dist/pptx-preview.umd.js',
 h2c:'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js',
 pdflib:'https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.min.js',
 jszip:'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js'};
const GLOBALS={pptx:['pptxPreview','PptxPreview'],h2c:'html2canvas',pdflib:'PDFLib',jszip:'JSZip'};
const FONTS_CSS='https://fonts.googleapis.com/css2?family=Barlow:wght@400;600&display=swap';
const EMU_PER_PX=9525,PT_PER_PX=0.75;      // 96 dpi px → 72 dpi points: a 1280×720 slide becomes a 960×540 pt page, PowerPoint's own size

/* ───────────── pure helpers (exported for testing) ───────────── */

/** Render scale for a slide: the requested scale, reduced when the canvas would exceed pixel / side limits.
 *  @param {number} w slide width px @param {number} h slide height px @param {number} scale
 *  @returns {{scale:number, capped:boolean}} */
export function renderScale(w,h,scale){
 let s=scale,capped=false;
 const px=w*s*h*s;
 if(px>LIMITS.maxPixels){s*=Math.sqrt(LIMITS.maxPixels/px);capped=true;}
 if(Math.max(w,h)*s>LIMITS.maxSide){s=LIMITS.maxSide/Math.max(w,h);capped=true;}
 return {scale:s,capped};}

/** Looks at the first bytes (and, for OLE files, the directory) to say what a file really is.
 *  @param {Uint8Array} u8 @returns {'zip'|'locked'|'legacy'|'unknown'} */
export function sniff(u8){
 if(u8.length>=4&&u8[0]===0x50&&u8[1]===0x4B&&((u8[2]===3&&u8[3]===4)||(u8[2]===5&&u8[3]===6)))return 'zip';
 if(u8.length>=8&&u8[0]===0xD0&&u8[1]===0xCF&&u8[2]===0x11&&u8[3]===0xE0)
  return hasUtf16(u8,'EncryptedPackage')?'locked':'legacy';        // password-protected .pptx = OLE container holding an "EncryptedPackage" stream
 return 'unknown';}
function hasUtf16(u8,word){
 const w=[...word].map(c=>c.charCodeAt(0));
 for(let i=u8.indexOf(w[0]);i!==-1&&i<u8.length-w.length*2;i=u8.indexOf(w[0],i+1)){
  let ok=true;for(let k=1;k<w.length;k++)if(u8[i+k*2]!==w[k]||u8[i+k*2+1]!==0){ok=false;break;}
  if(ok&&u8[i+1]===0)return true;}
 return false;}

const SANS='"Segoe UI",Roboto,"Helvetica Neue",Arial,"Liberation Sans",Barlow,sans-serif',SERIF='"Times New Roman","Liberation Serif",Georgia,serif',MONO='Consolas,"Courier New","Liberation Mono",monospace';
/** A similar, installed-or-web font stack for a font name the browser may not have. @param {string} family @returns {string} */
export function fallbackStack(family){
 const f=String(family).toLowerCase();
 if(/sans/.test(f))return SANS;
 if(/mono|consolas|courier|lucida console|menlo|typewriter/.test(f))return MONO;
 if(/times|georgia|cambria|garamond|palatino|book antiqua|bookman|century|minion|baskerville|serif/.test(f))return SERIF;
 return SANS;}

/** Maps an error to a copy kind. @param {any} e @returns {'legacy'|'locked'|'corrupt'|'empty'|'library'|'memory'|'generic'} */
export function classify(e){
 if(!e)return 'generic';
 if(e.kind)return e.kind;
 if(e.code==='library')return 'library';
 if(isMemoryError(e))return 'memory';
 return 'generic';}
const deckError=kind=>Object.assign(new Error(kind),{kind});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
/** Rejects after `ms`; the timer is cleared as soon as `p` settles (no pile of idle timers on 100+ slide decks). */
const withTimeout=(p,ms)=>new Promise((res,rej)=>{const t=setTimeout(()=>rej(new Error('slide timed out')),ms);p.then(v=>{clearTimeout(t);res(v);},e=>{clearTimeout(t);rej(e);});});
/** Rejects with an AbortError the moment `sig` fires, so Cancel is instant even while a slide is being captured. */
const abortable=(p,sig)=>new Promise((res,rej)=>{
 const stop=()=>rej(new DOMException('Aborted','AbortError'));
 if(sig.aborted)return stop();
 sig.addEventListener('abort',stop,{once:true});
 p.then(v=>{sig.removeEventListener('abort',stop);res(v);},e=>{sig.removeEventListener('abort',stop);rej(e);});});
/** Resolves when `p` settles or after `ms`, whichever is first. */
const waitFor=(p,ms)=>new Promise(r=>{const t=setTimeout(r,ms);p.then(()=>{clearTimeout(t);r();});});
const load=key=>loadScriptOnce(URLS[key],GLOBALS[key]).catch(e=>{e.lib=key;throw e;});
const toBlob=(c,q)=>new Promise(r=>c.toBlob(r,'image/jpeg',q));

/* ───────────── reading the deck ───────────── */

/** Cheap checks before any rendering: real zip? locked? legacy? has slides? what size?
 *  @param {File} file @returns {Promise<{ab:ArrayBuffer,w:number,h:number,n:number}>} w/h in CSS px (96 dpi) */
async function inspect(file){
 const ab=await file.arrayBuffer(),kind=sniff(new Uint8Array(ab));
 if(kind==='locked'||kind==='legacy')throw deckError(kind);
 if(kind!=='zip')throw deckError('corrupt');
 const JSZip=await load('jszip');
 let zip=null,xml='';
 try{
  zip=await JSZip.loadAsync(ab);
  const f=zip.file('ppt/presentation.xml');if(!f)throw deckError('corrupt');
  xml=await f.async('string');
 }catch(e){throw e&&e.kind?e:deckError('corrupt');}
 finally{zip=null;}
 const n=(xml.match(/<(?:\w+:)?sldId\s/g)||[]).length;
 if(!n)throw deckError('empty');
 const sz=(xml.match(/<(?:\w+:)?sldSz\b[^>]*>/)||[''])[0];
 const cx=+(sz.match(/\bcx="(\d+)"/)||[])[1],cy=+(sz.match(/\bcy="(\d+)"/)||[])[1];
 const ok=cx>0&&cy>0;
 return {ab,w:ok?Math.max(1,Math.round(cx/EMU_PER_PX)):1280,h:ok?Math.max(1,Math.round(cy/EMU_PER_PX)):720,n};}

/** The hidden stage: an iframe with its own blank document, so site CSS (resets, img rules) can't bend the slides. */
function makeStage(w,h){
 const frame=document.createElement('iframe');
 frame.className='ppt-frame';frame.setAttribute('aria-hidden','true');frame.tabIndex=-1;
 Object.assign(frame.style,{position:'fixed',left:'-200vw',top:'0',width:w+'px',height:h+'px',border:'0',pointerEvents:'none',opacity:'0'});
 const ready=new Promise(res=>{frame.addEventListener('load',res,{once:true});setTimeout(res,4000);});
 frame.srcdoc=`<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;padding:0;background:#fff}#stage{width:${w}px;height:${h}px;position:relative}</style></head><body><div id="stage"></div></body></html>`;
 document.body.append(frame);
 return ready.then(()=>{
  const doc=frame.contentDocument,lk=doc.createElement('link');lk.rel='stylesheet';lk.href=FONTS_CSS;doc.head.append(lk);   // fallback web font; never blocks rendering
  return {frame,doc,stage:doc.getElementById('stage')};});}

/** @typedef {{frame:HTMLIFrameElement,doc:Document,previewer:any,h2c:Function,w:number,h:number,n:number,busy:Promise<void>|null}} Engine */

/** Parses the deck with pptx-preview inside the hidden stage. @param {File} file @returns {Promise<Engine>} */
async function openDeck(file){
 const info=await inspect(file);
 const [pp,h2c]=await Promise.all([load('pptx'),load('h2c')]);
 const {frame,doc,stage}=await makeStage(info.w,info.h);
 let previewer=null;
 try{
  previewer=pp.init(stage,{width:info.w,height:info.h,mode:'slide'});
  await previewer.preview(info.ab);
  const n=previewer.slideCount||0;
  if(!n)throw deckError('empty');
  info.ab=null;
  return {frame,doc,previewer,h2c,w:info.w,h:info.h,n,busy:null};
 }catch(e){
  try{previewer&&previewer.destroy();}catch{}
  frame.remove();
  throw e&&(e.kind||e.code)?e:(isMemoryError(e)?e:deckError('corrupt'));}}

/** Frees the parsed deck, its blob URLs and the hidden stage. @param {Engine|null} eng */
function closeDeck(eng){
 if(!eng)return;
 try{eng.previewer.destroy();}catch{}
 try{eng.doc.body.replaceChildren();}catch{}
 eng.frame.remove();}

/** Gives every text run a similar fallback font so a missing font never turns into a default serif. */
function addFallbackFonts(el){
 el.style.fontFamily=SANS;
 for(const n of el.querySelectorAll('*')){
  const ff=n.style&&n.style.fontFamily;
  if(ff)n.style.fontFamily=`${ff}, ${fallbackStack(ff)}`;}}

/** Waits for images, fonts and two frames so the slide is fully drawn before capture. */
async function settle(doc,el){
 const imgs=[...el.querySelectorAll('img')].map(i=>i.decode?i.decode().catch(()=>{}):0);
 await Promise.race([Promise.all(imgs),sleep(2500)]);
 try{await Promise.race([doc.fonts.ready,sleep(2500)]);}catch{}
 await nextFrame();await nextFrame();}

/** Draws slide `i` and returns it as a JPEG. The canvas and the slide's DOM are released straight away.
 *  @param {Engine} eng @param {number} i zero-based @param {number} scale @param {number} quality @returns {Promise<Blob>} */
async function rasterize(eng,i,scale,quality){
 if(eng.busy)await waitFor(eng.busy,5000);                           // a cancelled or timed-out slide may still be finishing: let it clean up first
 const run=(async()=>{
  eng.previewer.renderSingleSlide(i);
  const el=eng.doc.querySelector('.pptx-preview-slide-wrapper-'+i)||eng.doc.querySelector('.pptx-preview-slide-wrapper');
  let canvas=null;
  try{
   if(!el)throw new Error('slide not drawn');
   addFallbackFonts(el);await settle(eng.doc,el);
   canvas=await eng.h2c(el,{scale,backgroundColor:'#ffffff',useCORS:true,logging:false,width:eng.w,height:eng.h,windowWidth:eng.w,windowHeight:eng.h,x:0,y:0,scrollX:0,scrollY:0});
   const blob=await toBlob(canvas,quality);
   if(!blob)throw new Error('encode failed (memory?)');
   return blob;
  }finally{
   if(canvas){canvas.width=0;canvas.height=0;}                      // zero the canvas…
   try{eng.previewer.removeCurrentSlide();}catch{}                   // …and drop the slide's DOM
  }})();
 eng.busy=run.then(()=>{},()=>{});
 return run;}

/** Builds the PDF: one page per slide at the slide's aspect ratio. A slide that can't be drawn becomes a blank page and is reported.
 *  @param {Engine} eng @param {{scale:number,numbers:boolean,name:string}} o @param {AbortSignal} sig
 *  @param {(fraction:number,n:number,total:number,phase?:string)=>void} onProgress
 *  @returns {Promise<{blob:Blob,pages:number,failed:number[],capped:boolean}>} */
async function convert(eng,{scale,numbers,name},sig,onProgress){
 const {PDFDocument,StandardFonts,rgb}=await load('pdflib');
 checkAbort(sig);
 const {scale:s,capped}=renderScale(eng.w,eng.h,scale),n=eng.n,pw=eng.w*PT_PER_PX,ph=eng.h*PT_PER_PX,failed=[];
 const doc=await PDFDocument.create();doc.setCreator(COPY.brand.name);doc.setProducer(COPY.brand.name);if(name)doc.setTitle(name);
 const font=numbers?await doc.embedFont(StandardFonts.HelveticaBold):null;
 for(let i=0;i<n;i++){
  checkAbort(sig);onProgress(i/n*.95,i+1,n);await nextFrame();
  const page=doc.addPage([pw,ph]);
  try{
   const blob=await abortable(withTimeout(rasterize(eng,i,s,LIMITS.jpeg),LIMITS.slideTimeout),sig);
   const img=await doc.embedJpg(new Uint8Array(await blob.arrayBuffer()));
   page.drawImage(img,{x:0,y:0,width:pw,height:ph});
  }catch(e){
   if(isAbort(e)||isMemoryError(e))throw e;
   failed.push(i+1);                     // blank page, keep going
  }
  if(numbers)drawNumber(page,font,rgb,i+1,pw,ph);
  checkAbort(sig);
  if(n>LIMITS.manySlides&&(i+1)%LIMITS.chunk===0)await sleep(40);   // huge decks: breathe between chunks of 10
 }
 checkAbort(sig);onProgress(.97,0,n,t('progress.binding'));await nextFrame();
 const bytes=await doc.save();checkAbort(sig);
 return {blob:new Blob([bytes],{type:'application/pdf'}),pages:n,failed,capped};}

/** Slide number in a small dark tab, bottom right (vector text, stays crisp). */
function drawNumber(page,font,rgb,num,pw,ph){
 const fs=clamp(ph*.032,9,28),txt=String(num),tw=font.widthOfTextAtSize(txt,fs),px=fs*.7,py=fs*.4,m=ph*.03;
 const bw=tw+px*2,bh=fs+py*2;
 page.drawRectangle({x:pw-m-bw,y:m,width:bw,height:bh,color:rgb(.04,.05,.04),opacity:.62});
 page.drawText(txt,{x:pw-m-bw+px,y:m+py+fs*.12,size:fs,font,color:rgb(1,1,1)});}

/* ───────────── UI ───────────── */
const $=(s,r=document)=>r.querySelector(s);

/** Boots the PPT to PDF page. */
export function init(){
 const root=$('#tool'),tray=$('#tray'),msgs=$('#msgs'),go=$('#go'),card=$('#deckcard'),prev=$('#deck-prev');
 const spec=TOOLS.find(x=>x.sym==='Pp'),reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
 document.title=`${t('tools.Pp.name')} — ${COPY.brand.name}`;
 $('#title-tile').innerHTML=`<span class="num mono">${spec.n}</span><span class="mass mono">${spec.mass}</span><span class="sym">${spec.sym}</span>`;
 $('#dz-types').textContent=fill(t('dropzone.types'),{types:t('dropzone.pptTypes'),size:formatBytes(LIMITS.maxBytes)});
 $('#dz-hit').setAttribute('aria-label',`${t('dropzone.pptLabel')}. ${t('dropzone.idle')}`);
 $('#dz-barrel').innerHTML=prop('barrel');$('#dz-flask').innerHTML=prop('flask');
 go.querySelector('span').textContent=t('tools.Pp.button');
 prev.querySelector('img').alt=t('file.slidePreviewAlt');
 $('#err-char').innerHTML=char('mike',COPY.alt.mike);$('#err-prop').innerHTML=prop('gasMask');
 $('#quality').innerHTML=QUALITY.map(q=>`<label><input type="radio" name="quality" value="${q.key}"${q.key==='high'?' checked':''}><span class="pc"><b>${esc(t(q.label))}</b><span class="mono">${esc(t(q.spec))}</span></span></label>`).join('');

 /** @type {{file:File,n:number,w:number,h:number,preview:string,ready:boolean}|null} */
 let cur=null,state='idle',ac=null,result=null,token=0;
 /** @type {Engine|null} */
 let engine=null;
 const progress=createPileProgress($('#progress'),{onCancel:()=>ac&&ac.abort()});

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
  go.disabled=!(cur&&cur.ready&&engine&&(state==='idle'||state==='filesChosen'));
  tray.classList.toggle('has-files',!!cur);card.hidden=!cur;}
 const toFiles=()=>setState(cur?'filesChosen':'idle');

 /* --- warnings --- */
 const warnings=[];
 function warn(text,names=[]){warnings.push({text,names});drawWarnings();}
 function clearWarnings(){warnings.length=0;drawWarnings();}
 function drawWarnings(){
  msgs.innerHTML=warnings.map(w=>`<div class="warn"><span class="warn-ico" aria-hidden="true">${prop('gasMask')}</span><div><p>${esc(w.text)}</p>${w.names.length?`<p class="mono warn-names">${esc(w.names.join(', '))}</p>`:''}</div></div>`).join('');}
 const msgFor=kind=>({legacy:t('errors.legacyPpt'),locked:t('errors.locked'),corrupt:t('errors.corrupt'),empty:t('errors.noSlides'),library:t('errors.libraryPpt'),memory:t('errors.memory')})[kind]||t('errors.generic');

 /* --- choosing a file: slide count + first-slide preview --- */
 const slidesText=n=>n===1?t('deck.slidesOne'):fill(t('deck.slides'),{n});
 function drawCard(){
  if(!cur)return;
  $('#deck-name').textContent=cur.file.name;$('#deck-name').title=cur.file.name;
  $('#deck-facts').innerHTML=cur.ready?`<span>${esc(slidesText(cur.n))}</span><span>${formatBytes(cur.file.size)}</span>`:`<span>${formatBytes(cur.file.size)}</span>`;
  prev.classList.toggle('is-loading',!cur.ready);
  prev.style.setProperty('--ar',cur.w&&cur.h?`${cur.w}/${cur.h}`:'16/9');
  const img=prev.querySelector('img');if(cur.preview)img.src=cur.preview;else img.removeAttribute('src');
  $('#deck-rm').setAttribute('aria-label',fill(t('grid.removeAria'),{name:cur.file.name}));}
 function dropCurrent(){
  if(cur&&cur.preview)URL.revokeObjectURL(cur.preview);
  closeDeck(engine);engine=null;cur=null;token++;}
 async function choose(file){
  dropCurrent();const my=token;
  cur={file,n:0,w:0,h:0,preview:'',ready:false};drawCard();toFiles();
  let eng=null;
  try{
   eng=await openDeck(file);
   if(my!==token){closeDeck(eng);return;}
   let url='';
   try{                                                                  // a failed preview must not block the conversion itself
    const blob=await withTimeout(rasterize(eng,0,clamp(LIMITS.previewW*2/eng.w,.1,2),.82),LIMITS.slideTimeout);
    if(my!==token){closeDeck(eng);return;}
    url=URL.createObjectURL(blob);
   }catch{}
   engine=eng;Object.assign(cur,{n:eng.n,w:eng.w,h:eng.h,preview:url,ready:true});
   if(eng.n>LIMITS.manySlides)warn(fill(t('errors.manySlides'),{n:eng.n}));
   drawCard();refresh();
  }catch(e){
   closeDeck(eng);
   if(my!==token)return;
   const kind=classify(e);if(kind==='generic')console.error(e);
   dropCurrent();
   if(kind==='library')return showError(msgFor(kind),{retry:()=>{clearWarnings();toFiles();choose(file);}});
   warn(msgFor(kind),[file.name]);toFiles();}}
 function onFiles({ok,rejected}){
  clearWarnings();
  const names=why=>rejected.filter(r=>r.reason===why).map(r=>r.file.name);
  if(names('type').length)warn(fill(t('errors.type'),{types:t('dropzone.pptTypes')}),names('type'));
  if(names('size').length)warn(fill(t('errors.size'),{size:formatBytes(LIMITS.maxBytes)}),names('size'));
  if(!ok.length)return;
  if(ok.length>1)warn(fill(t('errors.onePpt'),{name:ok[0].name}));
  const file=ok[0];
  if(extOf(file.name)==='ppt'){dropCurrent();warn(t('errors.legacyPpt'),[file.name]);toFiles();return;}   // legacy binary format: friendly "save as .pptx"
  choose(file);}
 const dz=createDropzone({root:tray,trigger:$('#dz-hit'),label:$('#dz-label'),idleText:t('dropzone.idle'),overText:t('dropzone.over'),
  exts:['pptx','potx','ppt'],mimes:['application/vnd.openxmlformats-officedocument.presentationml.presentation','application/vnd.openxmlformats-officedocument.presentationml.template','application/vnd.ms-powerpoint'],
  maxBytes:LIMITS.maxBytes,multiple:false,onFiles});
 $('#deck-rm').addEventListener('click',()=>{dropCurrent();clearWarnings();toFiles();$('#dz-hit').focus();});

 /* --- build --- */
 const quality=()=>QUALITY.find(q=>q.key===root.querySelector('input[name=quality]:checked').value);
 const wantNumbers=()=>root.querySelector('input[name=numbers]:checked').value==='on';
 function showError(message,{retry=null}={}){
  $('#err-msg').textContent=message;
  $('#err-retry').hidden=!retry;
  $('#err-retry').onclick=retry||null;
  setState('error');$('#err-msg').focus();}

 async function build(){
  if(!cur||!cur.ready||!engine)return;
  const {file}=cur,q=quality(),base=file.name.replace(/\.(pptx|potx)$/i,'')||'presentation';
  clearWarnings();ac=new AbortController();const sig=ac.signal;
  setState('processing');progress.set(0,'',null,t('progress.opening'));progress.start();
  try{
   const r=await convert(engine,{scale:q.scale,numbers:wantNumbers(),name:base},sig,(f,n,total,phase)=>progress.set(f,'',n?{n,total}:null,phase));
   progress.set(1,'',null,t('progress.binding'));await nextFrame();progress.stop();
   const notes=[];
   if(r.capped)notes.push(t('notes.cappedSlides'));
   if(r.failed.length)notes.push(fill(t('notes.failedSlides'),{n:r.failed.length,list:r.failed.slice(0,12).join(', ')+(r.failed.length>12?'…':'')}));
   result=showResult($('#result'),{blob:r.blob,filename:`${base}.pdf`,pages:r.pages,notes,onAgain:reset});
   setState('done');$('#result .res-head')?.focus({preventScroll:true});   // the panel was hidden while showResult ran, so focus now
  }catch(e){
   progress.stop();
   if(isAbort(e)){toFiles();warn(t('errors.cancelled'));return;}
   const kind=classify(e);
   if(kind==='library')return showError(msgFor('library'),{retry:build});
   if(kind!=='generic')return showError(msgFor(kind));
   console.error(e);showError(t('errors.generic'));
  }finally{ac=null;}}
 go.addEventListener('click',build);

 /* --- reset ("Cook another batch") --- */
 function reset(){
  result&&result.destroy();result=null;dropCurrent();clearWarnings();$('#err-msg').textContent='';
  setState('idle');scrollTo({top:0,behavior:reduce?'auto':'smooth'});$('#dz-hit').focus({preventScroll:true});}
 $('#err-again').addEventListener('click',reset);
 addEventListener('pagehide',()=>{closeDeck(engine);engine=null;});

 setState('idle');
}

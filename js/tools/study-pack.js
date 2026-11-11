/* tools/study-pack.js — Study Pack page shell. Exports init() and the shared studyState the tabs read.
   Flow: drop file → extract sections (progress) → options → analyze → results with three tabs (content wired later). */
import {COPY,TOOLS,t} from '../copy.js';
import {prop,char} from '../assets.js';
import {createDropzone} from '../dropzone.js';
import {createFlaskProgress} from '../progress.js';
import {formatBytes,fill,esc,nextFrame,isAbort,isMemoryError} from '../format.js';
import {extractText} from '../study/extract.js';
import {analyze} from '../study/analyze.js';
import {toAnkiTSV,downloadText} from '../study/export.js';
import {play} from '../sound.js';

export const LIMITS={maxBytes:50*1024*1024,minCards:10,maxCards:100,defaultCards:30};
/** Shared state the Flashcards / Quiz / Cheat sheet tabs read. analysis = {terms,definitions,cards,quiz,cheat}. */
export const studyState={file:null,sections:[],selected:[],truncated:false,maxCards:LIMITS.defaultCards,analysis:null};
export function resetStudyState(){Object.assign(studyState,{file:null,sections:[],selected:[],truncated:false,maxCards:LIMITS.defaultCards,analysis:null});}

const $=(s,r=document)=>r.querySelector(s);
const TABS=[['cards','study.tabCards'],['quiz','study.tabQuiz'],['cheat','study.tabCheat']];

/** Themed message for an extract/analyze error. @returns {string} */
export function messageFor(e,file){
 const code=e&&e.code;
 if(code&&COPY.extractErrors[code])return t('extractErrors.'+code);
 if(code==='library'||e?.lib)return t(/\.pptx$/i.test(file?.name||'')?'errors.libraryPpt':'errors.libraryPdfjs');
 if(isMemoryError(e))return t('errors.memory');
 return t('errors.generic');}

export function init(){
 const root=$('#tool'),tray=$('#tray'),msgs=$('#msgs'),go=$('#go'),card=$('#pdfcard'),spec=TOOLS.find(x=>x.sym==='St');
 const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
 document.title=`${t('tools.St.name')} — ${COPY.brand.name}`;
 $('#title-tile').innerHTML=`<span class="num mono">${spec.n}</span><span class="mass mono">${spec.mass}</span><span class="sym">${spec.sym}</span>`;
 $('#dz-types').textContent=fill(t('dropzone.types'),{types:t('dropzone.studyTypes'),size:formatBytes(LIMITS.maxBytes)});
 $('#dz-hit').setAttribute('aria-label',`${t('dropzone.studyLabel')}. ${t('dropzone.idle')}`);
 $('#dz-barrel').innerHTML=prop('barrel');$('#dz-flask').innerHTML=prop('flask');
 go.querySelector('span').textContent=t('tools.St.button');
 $('#err-char').innerHTML=char('mike',COPY.alt.mike);$('#err-prop').innerHTML=prop('gasMask');
 $('#st-cards-l').textContent=t('study.cardsLabel');$('#st-ch-l').textContent=t('study.chaptersLabel');
 $('#st-fine').innerHTML=t('study.fine').map(x=>`<li>${esc(x)}</li>`).join('');
 const slider=$('#st-cards'),val=$('#st-val'),list=$('#st-list'),count=$('#st-count');
 const drawVal=()=>{val.textContent=fill(t('study.cardsValue'),{n:slider.value});slider.setAttribute('aria-valuetext',val.textContent);};
 slider.addEventListener('input',drawVal);drawVal();

 let cur=null,state='idle',ac=null,token=0,tabsCleanup=null;
 const progress=createFlaskProgress($('#progress'),{onCancel:()=>ac&&ac.abort()});

 function setState(s){
  const was=state;state=s;root.dataset.state=s;
  root.querySelectorAll('[data-show]').forEach(e=>{e.hidden=!e.dataset.show.split(' ').includes(s);});
  dz.setDisabled(s==='processing'||s==='done'||s==='error');refresh();
  if(s==='processing')$('#progress .btn-2')?.focus({preventScroll:true});
  else if(was==='processing'&&(s==='idle'||s==='filesChosen'))(go.disabled?$('#dz-hit'):go).focus({preventScroll:true});
  const panel={processing:'#progress',done:'#result',error:'.errpanel'}[s];
  if(panel)requestAnimationFrame(()=>$(panel).scrollIntoView({block:'start',behavior:reduce?'auto':'smooth'}));}
 const picked=()=>[...list.querySelectorAll('input:checked')].map(i=>+i.value);
 function refresh(){
  const n=cur&&cur.ready?picked().length:0;
  go.disabled=!(cur&&cur.ready&&n>0&&(state==='idle'||state==='filesChosen'));
  tray.classList.toggle('has-files',!!cur);card.hidden=!cur;
  $('.sheet',root).hidden=!(cur&&cur.ready&&(state==='filesChosen'));
  if(cur&&cur.ready)count.textContent=n?fill(t(cur.sections.length===1?'study.sectionsOne':'study.sectionsFound'),{n:cur.sections.length}):t('study.chaptersNone');}
 const toFiles=()=>setState(cur&&cur.ready?'filesChosen':'idle');

 const warnings=[];
 function warn(text,names=[]){warnings.push({text,names});drawWarnings();}
 function clearWarnings(){warnings.length=0;drawWarnings();}
 function drawWarnings(){msgs.innerHTML=warnings.map(w=>`<div class="warn"><span class="warn-ico" aria-hidden="true">${prop('gasMask')}</span><div><p>${esc(w.text)}</p>${w.names.length?`<p class="mono warn-names">${esc(w.names.join(', '))}</p>`:''}</div></div>`).join('');}
 function showError(message,{retry=false}={}){
  $('#err-msg').textContent=message;
  $('#err-retry').onclick=typeof retry==='function'?retry:()=>{clearWarnings();toFiles();};
  setState('error');$('#err-msg').focus();}

 function drawCard(){
  if(!cur)return;
  $('#pdf-name').textContent=cur.file.name;$('#pdf-name').title=cur.file.name;
  $('#pdf-facts').innerHTML=`<span>${formatBytes(cur.file.size)}</span>`+(cur.ready?`<span>${esc(fill(t(cur.sections.length===1?'study.sectionsOne':'study.sectionsFound'),{n:cur.sections.length}))}</span>`:'');
  $('#pdf-rm').setAttribute('aria-label',fill(t('grid.removeAria'),{name:cur.file.name}));}
 function drawSections(){
  list.innerHTML=cur.sections.map((s,i)=>`<label class="st-ch"><input type="checkbox" value="${i}" checked><span><b>${esc(s.title||('#'+(i+1)))}</b><span class="mono">${esc(fill(t('study.factsChars'),{n:s.text.length.toLocaleString('en-US')}))}</span></span></label>`).join('');}
 list.addEventListener('change',refresh);

 function dropCurrent(){cur=null;token++;if(ac)ac.abort();list.replaceChildren();resetStudyState();}
 function freeResult(){
  if(tabsCleanup){tabsCleanup();tabsCleanup=null;}
  $('#result').replaceChildren();resetStudyState();}

 /* extract right after upload */
 async function choose(file){
  dropCurrent();const my=token;
  cur={file,sections:[],ready:false};drawCard();
  ac=new AbortController();const sig=ac.signal;
  setState('processing');progress.set(0,'');progress.start();
  const label=fill(t('study.stepOf'),{n:1,label:t('study.stepExtract')});
  progress.set(0,label);
  try{
   const r=await extractText(file,(p,l)=>{if(my===token)progress.set(Math.min(1,Math.max(0,+p||0)),l?`${t('study.stepExtract')} · ${l}`:label);},sig);
   if(my!==token)return;
   progress.set(1,label);await nextFrame();progress.stop();
   Object.assign(cur,{sections:r.sections,truncated:r.truncated,ready:true});
   Object.assign(studyState,{file,sections:r.sections,selected:r.sections.map((_,i)=>i),truncated:r.truncated});
   drawCard();drawSections();
   if(r.truncated)warn(t('study.truncated'));
   setState('filesChosen');
  }catch(e){
   progress.stop();if(my!==token&&!isAbort(e))return;
   if(isAbort(e)){cur=null;list.replaceChildren();resetStudyState();setState('idle');warn(t('errors.cancelled'));return;}
   if(e&&!e.code)console.error(e);
   const f=file;cur=null;resetStudyState();
   showError(messageFor(e,f),{retry:()=>{clearWarnings();setState('idle');if(e.code==='library')choose(f);}});
  }finally{ac=null;}}

 function onFiles({ok,rejected}){
  clearWarnings();
  const names=why=>rejected.filter(r=>r.reason===why).map(r=>r.file.name);
  if(names('type').length)warn(t('extractErrors.BAD_TYPE'),names('type'));
  if(names('size').length)warn(fill(t('errors.size'),{size:formatBytes(LIMITS.maxBytes)}),names('size'));
  if(!ok.length)return;
  if(ok.length>1)warn(fill(t('errors.onePdf'),{name:ok[0].name}));
  choose(ok[0]);}
 const dz=createDropzone({root:tray,trigger:$('#dz-hit'),label:$('#dz-label'),idleText:t('dropzone.idle'),overText:t('dropzone.over'),
  exts:['pdf','pptx','txt','md','markdown'],mimes:['application/pdf','application/vnd.openxmlformats-officedocument.presentationml.presentation','text/plain','text/markdown'],maxBytes:LIMITS.maxBytes,multiple:false,onFiles});
 $('#pdf-rm').addEventListener('click',()=>{dropCurrent();clearWarnings();setState('idle');$('#dz-hit').focus();});

 /* analyze + build */
 async function build(){
  if(!cur||!cur.ready)return;
  const idx=picked();if(!idx.length)return;
  const file=cur.file,chosen=idx.map(i=>cur.sections[i]),maxCards=+slider.value;
  ac=new AbortController();const sig=ac.signal;
  Object.assign(studyState,{selected:idx,maxCards,analysis:null});
  setState('processing');progress.start();
  const step=(n,key,f)=>progress.set(f,fill(t('study.stepOf'),{n,label:t(key)}));
  try{
   step(1,'study.stepExtract',.2);await nextFrame();
   if(sig.aborted)throw new DOMException('Aborted','AbortError');
   step(2,'study.stepAnalyze',.4);
   const a=await analyze(chosen,{maxCards});
   if(sig.aborted)throw new DOMException('Aborted','AbortError');
   step(3,'study.stepBuild',.9);await nextFrame();
   if(!a.cards.length){progress.stop();return showError(t('study.noCards'),{retry:()=>{toFiles();}});}
   studyState.analysis=a;
   progress.set(1,'');await nextFrame();progress.stop();
   showDone(a,chosen.length);
   setState('done');$('#result .res-head')?.focus({preventScroll:true});
  }catch(e){
   progress.stop();
   if(isAbort(e)){toFiles();warn(t('errors.cancelled'));return;}
   console.error(e);showError(messageFor(e,file),{retry:build});
  }finally{ac=null;}}
 go.addEventListener('click',build);

 /* results: header stamp + accessible tabs (panels filled in later parts) */
 function showDone(a,sections){
  const n=a.cards.length,key=n===1?(sections===1?'study.stampCardOne':'study.stampCard'):(sections===1?'study.stampOne':'study.stamp');
  const stamp=fill(t(key),{n,sections});
  const host=$('#result');
  host.innerHTML=`<div class="res-body st-res">
   <div class="stamp" role="img" aria-label="${esc(stamp)}"><span>${esc(stamp)}</span></div>
   <h2 class="res-head" tabindex="-1">${esc(t('study.heading'))}</h2>
   ${studyState.truncated?`<p class="res-note mono">${esc(t('study.truncated'))}</p>`:''}
   <div class="st-tabs" role="tablist" aria-label="${esc(t('study.tabsLabel'))}">${TABS.map(([k,c],i)=>`<button type="button" role="tab" class="st-tab" id="st-tab-${k}" aria-controls="st-panel-${k}" aria-selected="${i===0}" tabindex="${i===0?0:-1}">${esc(t(c))}</button>`).join('')}</div>
   ${TABS.map(([k],i)=>`<div role="tabpanel" class="st-panel" id="st-panel-${k}" aria-labelledby="st-tab-${k}" tabindex="0"${i?' hidden':''}><p class="mono" data-slot="${k}">${esc(t('study.coming'))}</p></div>`).join('')}
   <div class="res-actions"><button type="button" class="btn btn-danger btn-sm res-again">${t('result.again')}</button><a class="btn btn-2 btn-sm" href="index.html">${t('result.back')}</a></div>
  </div>`;
  const tabs=[...host.querySelectorAll('[role=tab]')];
  const pick=(i,focus)=>{tabs.forEach((b,j)=>{const on=i===j;b.setAttribute('aria-selected',on);b.tabIndex=on?0:-1;host.querySelector('#'+b.getAttribute('aria-controls')).hidden=!on;});if(focus)tabs[i].focus();};
  const onKey=e=>{
   const i=tabs.indexOf(document.activeElement);if(i<0)return;
   const to={ArrowRight:(i+1)%tabs.length,ArrowLeft:(i-1+tabs.length)%tabs.length,Home:0,End:tabs.length-1}[e.key];
   if(to===undefined)return;e.preventDefault();pick(to,true);};
  const strip=host.querySelector('.st-tabs');
  strip.addEventListener('keydown',onKey);tabs.forEach((b,i)=>b.addEventListener('click',()=>pick(i,false)));
  host.querySelector('.res-again').addEventListener('click',reset);
  const fcOff=mountFlashcards(host.querySelector('#st-panel-cards'));
  tabsCleanup=()=>{strip.removeEventListener('keydown',onKey);fcOff();};}

 /* reset: free memory (sections, analysis, results DOM) */
 function reset(){
  freeResult();dropCurrent();clearWarnings();$('#err-msg').textContent='';
  setState('idle');scrollTo({top:0,behavior:reduce?'auto':'smooth'});$('#dz-hit').focus({preventScroll:true});}
 $('#err-again').addEventListener('click',reset);
 addEventListener('pagehide',()=>{freeResult();});
 setState('idle');
}

/* ---------- Flashcards tab ---------- */
const fc=k=>t('study.fc.'+k);
/** Fills the Flashcards panel from studyState.analysis.cards (edited in place, so list view, study view and export share one array). @returns {()=>void} cleanup */
function mountFlashcards(panel){
 const deck=studyState.analysis.cards,reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
 panel.classList.add('st-panel--fc');
 let queue=[],mastered=new Set(),flipped=false,listMode=false,editing=null;
 const byId=id=>deck.find(c=>c.id===id);
 const shuffled=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
 panel.innerHTML=`<div class="fc">
  <div class="fc-bar">
   <button type="button" class="btn btn-2 btn-sm" data-a="shuffle">${esc(fc('shuffle'))}</button>
   <button type="button" class="btn btn-2 btn-sm" data-a="restart">${esc(fc('restart'))}</button>
   <button type="button" class="btn btn-2 btn-sm" data-a="list" aria-pressed="false">${esc(fc('listView'))}</button>
   <button type="button" class="btn btn-2 btn-sm" data-a="anki">${esc(fc('anki'))}</button>
  </div>
  <div class="fc-study">
   <div class="fc-meta mono"><span class="fc-count" aria-live="polite"></span><span class="fc-src"></span></div>
   <div class="fc-prog" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><i></i></div>
   <p class="fc-prog-l mono"></p>
   <div class="fc-card" tabindex="0" role="button" aria-label="${esc(fc('card'))}">
    <div class="fc-in">
     <div class="fc-face fc-front"><span class="fc-side mono">${esc(fc('front'))}</span><p class="fc-text"></p></div>
     <div class="fc-face fc-back" aria-hidden="true"><span class="fc-side mono">${esc(fc('back'))}</span><p class="fc-text"></p></div>
    </div>
   </div>
   <div class="fc-actions">
    <button type="button" class="btn btn-danger btn-sm" data-a="again">${esc(fc('again'))}</button>
    <button type="button" class="btn btn-sm" data-a="got">${esc(fc('gotIt'))}</button>
   </div>
   <div class="fc-tools"><button type="button" class="act" data-a="edit">${esc(fc('edit'))}</button><button type="button" class="act del" data-a="del">${esc(fc('del'))}</button></div>
   <p class="fc-hint mono">${esc(fc('hint'))}</p>
  </div>
  <div class="fc-done" hidden><h3 class="fc-done-h" tabindex="-1">${esc(fc('complete'))}</h3><p class="fc-done-p"></p>
   <button type="button" class="btn btn-sm" data-a="restart">${esc(fc('restart'))}</button></div>
  <div class="fc-list" hidden><table class="fc-table" aria-label="${esc(fc('listLabel'))}"><thead><tr><th scope="col">${esc(fc('term'))}</th><th scope="col">${esc(fc('definition'))}</th><th scope="col">${esc(fc('source'))}</th><th scope="col"><span class="sr-only">${esc(fc('actions'))}</span></th></tr></thead><tbody></tbody></table></div>
 </div>`;
 const $$=s=>panel.querySelector(s);
 const study=$$('.fc-study'),done=$$('.fc-done'),list=$$('.fc-list'),cardEl=$$('.fc-card'),back=$$('.fc-back'),front=$$('.fc-front'),tbody=$$('tbody');
 const editHtml=(c,cls)=>`<form class="fc-edit ${cls||''}" data-id="${esc(c.id)}"><label>${esc(fc('editFront'))}<textarea name="f" rows="2" required>${esc(c.front)}</textarea></label><label>${esc(fc('editBack'))}<textarea name="b" rows="3" required>${esc(c.back)}</textarea></label><div class="fc-edit-row"><button type="submit" class="btn btn-sm">${esc(fc('save'))}</button><button type="button" class="btn btn-2 btn-sm" data-a="cancel">${esc(fc('cancel'))}</button></div></form>`;

 function restart(){queue=deck.map(c=>c.id);mastered=new Set();flipped=false;editing=null;draw();}
 function setFlip(on){flipped=on;cardEl.classList.toggle('is-flipped',on);back.setAttribute('aria-hidden',!on);front.setAttribute('aria-hidden',on);}
 function drawStudy(){
  const total=deck.length,m=mastered.size,c=byId(queue[0]);
  const finished=!c;
  study.hidden=finished||listMode;done.hidden=!finished||listMode||!total;list.hidden=!listMode;
  $$('[data-a=list]').setAttribute('aria-pressed',listMode);$$('[data-a=list]').textContent=listMode?fc('studyView'):fc('listView');
  const pct=total?Math.round(m/total*100):0,bar=$$('.fc-prog');
  bar.setAttribute('aria-valuenow',pct);bar.setAttribute('aria-label',fill(fc('mastered'),{m,total}));bar.firstElementChild.style.transform=`scaleX(${total?m/total:0})`;
  $$('.fc-prog-l').textContent=fill(fc('mastered'),{m,total});
  if(finished){done.querySelector('.fc-done-p').textContent=total?fill(fc('completeSub'),{total}):fc('empty');return;}
  $$('.fc-count').textContent=fill(fc('counter'),{n:Math.min(m+1,total),total});
  $$('.fc-src').textContent=c.source||'';$$('.fc-src').hidden=!c.source;
  front.querySelector('.fc-text').textContent=c.front;back.querySelector('.fc-text').textContent=c.back;
  const ed=study.querySelector('.fc-edit');if(ed)ed.remove();
  if(editing===c.id){cardEl.hidden=true;study.querySelector('.fc-actions').hidden=true;study.querySelector('.fc-tools').hidden=true;study.querySelector('.fc-hint').hidden=true;
   study.querySelector('.fc-tools').insertAdjacentHTML('afterend',editHtml(c,'fc-edit--study'));study.querySelector('textarea').focus({preventScroll:true});}
  else{cardEl.hidden=false;study.querySelector('.fc-actions').hidden=false;study.querySelector('.fc-tools').hidden=false;study.querySelector('.fc-hint').hidden=false;}}
 function drawList(){
  tbody.innerHTML=deck.map(c=>editing===c.id?`<tr class="is-editing"><td colspan="4">${editHtml(c)}</td></tr>`:
   `<tr><td data-l="${esc(fc('term'))}">${esc(c.front)}</td><td data-l="${esc(fc('definition'))}">${esc(c.back)}</td><td data-l="${esc(fc('source'))}" class="mono">${esc(c.source||'')}</td><td class="fc-row-act"><button type="button" class="act" data-a="edit" data-id="${esc(c.id)}">${esc(fc('edit'))}</button><button type="button" class="act del" data-a="del" data-id="${esc(c.id)}">${esc(fc('del'))}</button></td></tr>`).join('');
  if(editing)tbody.querySelector('textarea')?.focus({preventScroll:true});}
 function draw(){setFlip(false);drawStudy();if(listMode)drawList();}

 function mark(ok){
  if(listMode||editing||!queue.length)return;
  const id=queue.shift();
  if(ok){mastered.add(id);play('success');}
  else{queue.splice(Math.min(3,queue.length),0,id);play('error');}
  draw();if(!queue.length)done.querySelector('.btn')?.focus({preventScroll:true});}
 function flip(){if(listMode||editing||!queue.length)return;setFlip(!flipped);play('tile');}
 function remove(id){
  const i=deck.findIndex(c=>c.id===id);if(i<0)return;deck.splice(i,1);queue=queue.filter(x=>x!==id);mastered.delete(id);
  if(editing===id)editing=null;draw();}

 panel.addEventListener('click',e=>{
  if(e.target.closest('.fc-card')){flip();return;}
  const b=e.target.closest('[data-a]');if(!b)return;
  const a=b.dataset.a,id=b.dataset.id||queue[0];
  if(a==='got')mark(true);else if(a==='again')mark(false);
  else if(a==='shuffle'){queue=shuffled(queue);draw();}
  else if(a==='restart')restart();
  else if(a==='list'){listMode=!listMode;editing=null;draw();}
  else if(a==='anki')downloadText('study-cards.txt',toAnkiTSV(deck));
  else if(a==='edit'){editing=id;draw();}
  else if(a==='cancel'){editing=null;draw();}
  else if(a==='del')remove(id);});
 panel.addEventListener('submit',e=>{
  e.preventDefault();const f=e.target.closest('form'),c=byId(f.dataset.id);if(!c)return;
  const v=f.f.value.trim(),w=f.b.value.trim();if(!v||!w)return;
  c.front=v;c.back=w;editing=null;draw();});

 const onKey=e=>{
  if(panel.hidden||!panel.isConnected||e.ctrlKey||e.metaKey||e.altKey)return;
  const el=e.target,field=el.closest&&el.closest('input,textarea,select');if(field)return;
  if(el.closest&&el.closest('[role=tab]'))return;
  const btn=el.closest&&el.closest('button,a,summary');
  if(e.key===' '||e.key==='Enter'){if(btn)return;e.preventDefault();flip();return;}
  const k=e.key.toLowerCase();
  if(e.key==='ArrowRight'||k==='k'){e.preventDefault();mark(true);}
  else if(e.key==='ArrowLeft'||k==='j'){e.preventDefault();mark(false);}};
 document.addEventListener('keydown',onKey);
 let sx=0,sy=0,tracking=false;
 cardEl.addEventListener('touchstart',e=>{const p=e.changedTouches[0];sx=p.clientX;sy=p.clientY;tracking=true;},{passive:true});
 cardEl.addEventListener('touchend',e=>{
  if(!tracking)return;tracking=false;const p=e.changedTouches[0],dx=p.clientX-sx,dy=p.clientY-sy;
  if(Math.abs(dx)>60&&Math.abs(dx)>Math.abs(dy)*1.5){e.preventDefault();mark(dx>0);}},{passive:false});
 restart();
 return()=>document.removeEventListener('keydown',onKey);}

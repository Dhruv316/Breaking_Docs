/* study/extract.js — in-browser text extraction for PDF, PPTX, TXT, MD. No UI.
   extractText(file,onProgress,signal) → {sections:[{title,text,source}],totalChars,truncated}
   Errors carry .code: NO_TEXT | LOCKED | CORRUPT | BAD_TYPE | TOO_LONG (library failures keep code 'library'). */
export const LIMITS={truncateAt:600000,tooLongAt:1500000,minChars:50,pdfPagesPerSection:8,slidesPerSection:10,headingRatio:1.25};
const JSZIP_URL='https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
let injected={};
/** Test hook: supply {pdfjs, JSZip} instead of loading from the browser loaders. */
export const __setLibs=l=>{injected=l||{};};

const err=(code,msg)=>{const e=new Error(msg||code);e.code=code;return e;};
const abortErr=()=>{try{return new DOMException('Aborted','AbortError');}catch{const e=new Error('Aborted');e.name='AbortError';return e;}};
const tick=async sig=>{if(sig?.aborted)throw abortErr();await new Promise(r=>setTimeout(r,0));if(sig?.aborted)throw abortErr();};
const median=a=>{if(!a.length)return 0;const s=[...a].sort((x,y)=>x-y),m=s.length>>1;return s.length%2?s[m]:(s[m-1]+s[m])/2;};
const range=(word,a,b)=>a===b?`${word.slice(0,-1)} ${a}`:`${word} ${a}-${b}`;

/** Finalises sections: drops empties (merging their title forward), applies the 600k cap. */
function finish(raw){
 const out=[];let carry='';
 for(const s of raw){
  const text=s.text.trim();
  if(!text){if(s.title)carry=carry?`${carry} — ${s.title}`:s.title;continue;}
  out.push({title:carry?`${carry} — ${s.title}`:s.title,text,source:s.source});carry='';}
 let total=out.reduce((n,s)=>n+s.text.length,0);
 if(total<LIMITS.minChars)throw err('NO_TEXT');
 if(total>LIMITS.tooLongAt)throw err('TOO_LONG');
 let truncated=false;
 if(total>LIMITS.truncateAt){
  truncated=true;let left=LIMITS.truncateAt;const kept=[];
  for(const s of out){if(left<=0)break;if(s.text.length>left)s.text=s.text.slice(0,left);left-=s.text.length;kept.push(s);}
  out.length=0;out.push(...kept);total=LIMITS.truncateAt;}
 return {sections:out,totalChars:out.reduce((n,s)=>n+s.text.length,0),truncated};}

/* ───────────── PDF ───────────── */
async function pdfLib(){
 if(injected.pdfjs)return injected.pdfjs;
 return (await import('../tools/compress-pdf.js')).loadPdfjs();}
async function openDoc(file){
 if(injected.pdfjs)return injected.pdfjs.getDocument({data:new Uint8Array(await file.arrayBuffer()),isEvalSupported:false,verbosity:0}).promise;
 const m=await import('../tools/compress-pdf.js');return m.openPdf(await m.loadPdfjs(),file);}
function pdfError(e){
 if(e?.code)return e;
 if(e?.name==='PasswordException')return err('LOCKED');
 return err('CORRUPT',String(e?.message||e));}

/** Rebuilds lines from positioned text items. @returns {{text,size,y}[]} top-to-bottom */
export function buildLines(items){
 const its=items.filter(i=>typeof i.str==='string'&&i.str.trim()!=='').map(i=>({s:i.str,x:i.transform[4],y:i.transform[5],w:i.width||0,
  size:Math.hypot(i.transform[2],i.transform[3])||i.height||0}));
 its.sort((a,b)=>b.y-a.y||a.x-b.x);
 const rows=[];
 for(const it of its){
  const r=rows.find(r=>Math.abs(r.y-it.y)<=Math.max(2,Math.min(r.size,it.size)*0.4));
  if(r)r.items.push(it);else rows.push({y:it.y,size:it.size,items:[it]});}
 rows.sort((a,b)=>b.y-a.y);
 return rows.map(r=>{
  r.items.sort((a,b)=>a.x-b.x);
  let text='',end=null,weight=new Map();
  for(const it of r.items){
   if(end!==null&&it.x-end>it.size*0.15&&!/\s$/.test(text)&&!/^\s/.test(it.s))text+=' ';
   text+=it.s;end=it.x+it.w;
   const k=Math.round(it.size*2)/2;weight.set(k,(weight.get(k)||0)+it.s.length);}
  let size=0,best=-1;for(const [k,v] of weight)if(v>best){best=v;size=k;}
  return {text:text.replace(/\s+/g,' ').trim(),size,y:r.y};
 }).filter(l=>l.text);}

/** One page's lines → blocks [{heading:boolean,text}], paragraphs joined, hyphen breaks healed. */
export function pageBlocks(lines){
 const sizes=[];for(const l of lines)for(let i=0;i<Math.max(1,Math.round(l.text.length/10));i++)sizes.push(l.size);
 const med=median(sizes),blocks=[];let prev=null,para=null;
 const flush=()=>{if(para){blocks.push({heading:false,text:para.text});para=null;}};
 for(const l of lines){
  const isHead=med>0&&l.size>=med*LIMITS.headingRatio&&l.text.length<=160&&/[\p{L}\p{N}]/u.test(l.text);
  if(isHead){
   flush();
   const last=blocks[blocks.length-1];
   if(last&&last.heading&&prev&&prev.head&&Math.abs(prev.size-l.size)<0.6)last.text+=' '+l.text;else blocks.push({heading:true,text:l.text});
  }else{
   const gap=prev?prev.y-l.y:0;
   if(para&&(prev.head||gap>l.size*1.9))flush();
   if(!para)para={text:l.text};
   else if(/\p{L}-$/u.test(para.text)&&/^\p{Ll}/u.test(l.text))para.text=para.text.slice(0,-1)+l.text;
   else para.text+=' '+l.text;}
  prev={y:l.y,size:l.size,head:isHead};}
 flush();return blocks;}

async function extractPdf(file,onProgress,signal){
 let pdf;
 try{pdf=await openDoc(file);}catch(e){throw pdfError(e);}
 try{
  const n=pdf.numPages,pages=[];let chars=0;
  for(let p=1;p<=n;p++){
   await tick(signal);onProgress?.((p-1)/n,`Reading page ${p} of ${n}`);
   let blocks;
   try{const page=await pdf.getPage(p);const tc=await page.getTextContent();blocks=pageBlocks(buildLines(tc.items));page.cleanup?.();}
   catch(e){if(e?.name==='AbortError')throw e;throw pdfError(e);}
   for(const b of blocks)chars+=b.text.length;
   if(chars>LIMITS.tooLongAt)throw err('TOO_LONG');
   pages.push(blocks);}
  onProgress?.(1,'Sorting sections');
  const headCount=pages.reduce((c,bl)=>c+bl.filter(b=>b.heading).length,0);
  const raw=[];
  if(headCount>=2){
   let cur=null;
   pages.forEach((bl,i)=>{
    for(const b of bl){
     if(b.heading){if(cur)raw.push(cur);cur={title:b.text,parts:[],a:i+1,b:i+1};}
     else{if(!cur)cur={title:file.name.replace(/\.pdf$/i,'')||'Start',parts:[],a:i+1,b:i+1};cur.parts.push(b.text);cur.b=i+1;}}
    if(cur&&cur.parts.length===0)cur.b=Math.max(cur.b,i+1);});
   if(cur)raw.push(cur);
   for(const s of raw){s.text=s.parts.join('\n\n');s.source=range('Pages',s.a,s.b);}
  }else{
   const per=LIMITS.pdfPagesPerSection;
   for(let a=0;a<n;a+=per){const b=Math.min(n,a+per);
    const text=pages.slice(a,b).map(bl=>bl.map(x=>x.text).join('\n\n')).filter(Boolean).join('\n\n');
    raw.push({title:range('Pages',a+1,b),text,source:range('Pages',a+1,b)});}}
  return finish(raw);
 }finally{try{pdf.destroy?.();}catch{}}}

/* ───────────── PPTX ───────────── */
const unxml=s=>s.replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&apos;/g,"'").replace(/&#x([0-9a-f]+);/gi,(_,h)=>String.fromCodePoint(parseInt(h,16))).replace(/&#(\d+);/g,(_,d)=>String.fromCodePoint(+d)).replace(/&amp;/g,'&');
const paras=xml=>{const out=[];for(const m of xml.matchAll(/<a:p[ >][\s\S]*?<\/a:p>/g)){
 const t=[...m[0].matchAll(/<a:t(?: [^>]*)?>([\s\S]*?)<\/a:t>/g)].map(x=>unxml(x[1])).join('').replace(/\s+/g,' ').trim();if(t)out.push(t);}return out;};
export function parseSlide(xml){
 const all=paras(xml);let title='';
 for(const m of xml.matchAll(/<p:sp[ >][\s\S]*?<\/p:sp>/g))if(/type="(?:title|ctrTitle)"/.test(m[0])){title=paras(m[0]).join(' ');if(title)break;}
 if(!title)title=all[0]||'';
 return {title,paras:all};}

async function extractPptx(file,onProgress,signal){
 const head=new Uint8Array(await file.slice(0,8).arrayBuffer());
 if(head[0]===0xD0&&head[1]===0xCF&&head[2]===0x11&&head[3]===0xE0){
  throw err(/\.pptx$/i.test(file.name)?'LOCKED':'BAD_TYPE');}   // encrypted OOXML is an OLE container; legacy .ppt too
 let JSZip=injected.JSZip;
 if(!JSZip){const {loadScriptOnce}=await import('../format.js');JSZip=await loadScriptOnce(JSZIP_URL,'JSZip');}
 let zip;try{zip=await JSZip.loadAsync(await file.arrayBuffer());}catch{throw err('CORRUPT');}
 const names=Object.keys(zip.files).map(k=>{const m=/^ppt\/slides\/slide(\d+)\.xml$/.exec(k);return m?{k,n:+m[1]}:null;}).filter(Boolean).sort((a,b)=>a.n-b.n);
 if(!names.length)throw err('CORRUPT');
 const slides=[];let chars=0;
 for(let i=0;i<names.length;i++){
  await tick(signal);onProgress?.(i/names.length,`Reading slide ${i+1} of ${names.length}`);
  let xml;try{xml=await zip.files[names[i].k].async('string');}catch{throw err('CORRUPT');}
  const s=parseSlide(xml);chars+=s.paras.join('').length;
  if(chars>LIMITS.tooLongAt)throw err('TOO_LONG');
  slides.push(s);}
 onProgress?.(1,'Sorting sections');
 const raw=[],per=LIMITS.slidesPerSection;
 for(let a=0;a<slides.length;a+=per){const b=Math.min(slides.length,a+per),grp=slides.slice(a,b);
  const text=grp.map((s,j)=>{const body=s.paras.filter((p,k)=>!(k===0&&p===s.title)&&p!==s.title);
   return [`Slide ${a+j+1}${s.title?': '+s.title:''}`,...body].join('\n');}).filter((t,j)=>grp[j].paras.length).join('\n\n');
  raw.push({title:grp.find(s=>s.title)?.title||range('Slides',a+1,b),text,source:range('Slides',a+1,b)});}
 return finish(raw);}

/* ───────────── TXT / MD ───────────── */
export function splitText(src,fallbackTitle='Text'){
 const lines=src.replace(/\r\n?/g,'\n').split('\n'),raw=[];let cur=null,heads=0;
 const isCaps=(l,i)=>{const t=l.trim();return t.length>=3&&t.length<=60&&/\p{L}.*\p{L}.*\p{L}/u.test(t)&&t===t.toUpperCase()&&t!==t.toLowerCase()&&!/[.!?,;:]$/.test(t)&&(i===0||!lines[i-1].trim());};
 lines.forEach((l,i)=>{
  const md=/^#{1,6}\s+(\S.*)$/.exec(l);
  if(md||isCaps(l,i)){heads++;if(cur)raw.push(cur);cur={title:(md?md[1]:l).replace(/#+\s*$/,'').trim(),lines:[]};}
  else{if(!cur)cur={title:fallbackTitle,lines:[]};cur.lines.push(l);}});
 if(cur)raw.push(cur);
 if(heads>=1)return raw.map(s=>({title:s.title,text:s.lines.join('\n').replace(/\n{3,}/g,'\n\n'),source:'Text'}));
 const blocks=src.replace(/\r\n?/g,'\n').split(/\n\s*\n/).map(b=>b.trim()).filter(Boolean),out=[];let acc=[],len=0;
 const push=()=>{if(acc.length){out.push({title:acc[0].replace(/\s+/g,' ').slice(0,60),text:acc.join('\n\n'),source:'Text'});acc=[];len=0;}};
 for(const b of blocks){if(len&&len+b.length>4000)push();acc.push(b);len+=b.length;}
 push();return out;}

async function extractTxt(file,onProgress,signal){
 onProgress?.(0,'Reading text');await tick(signal);
 let src;try{src=await file.text();}catch{throw err('CORRUPT');}
 if(src.includes('\u0000'))throw err('BAD_TYPE');
 if(src.length>LIMITS.tooLongAt)throw err('TOO_LONG');
 src=src.replace(/^\uFEFF/,'');
 const raw=splitText(src,file.name.replace(/\.[^.]+$/,'')||'Text');
 onProgress?.(1,'Sorting sections');return finish(raw);}

/** @param {File} file @param {(p:number,label:string)=>void} [onProgress] @param {AbortSignal} [signal] */
export async function extractText(file,onProgress,signal){
 if(!file||typeof file.arrayBuffer!=='function')throw err('BAD_TYPE');
 if(signal?.aborted)throw abortErr();
 const name=(file.name||'').toLowerCase(),type=file.type||'';
 if(/\.pdf$/.test(name)||type==='application/pdf')return extractPdf(file,onProgress,signal);
 if(/\.pptx$/.test(name)||type.includes('presentationml.presentation'))return extractPptx(file,onProgress,signal);
 if(/\.(txt|md|markdown)$/.test(name)||type==='text/plain'||type==='text/markdown')return extractTxt(file,onProgress,signal);
 throw err('BAD_TYPE');}

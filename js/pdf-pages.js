/* pdf-pages.js — shared page tools for PDF tools: load a PDF with pdf.js, lazy page-thumbnail grid with selection, range parsing.
   Reuses the pdf.js loader + Blob-worker fallback from tools/compress-pdf.js. No tool-specific logic. */
import {loadPdfjs,openPdf,classify} from './tools/compress-pdf.js';
export {classify};

/** Opens a PDF file with pdf.js. @param {File} file @returns {Promise<any>} pdf document (caller calls pdf.destroy()) */
export async function loadPdf(file){return openPdf(await loadPdfjs(),file);}

/** Renders one page (1-based) onto a new canvas of the given CSS width. Caller owns the canvas; free it with freeCanvas(). */
export async function renderPage(pdf,n,width,sig){
 const pg=await pdf.getPage(n),b=pg.getViewport({scale:1}),vp=pg.getViewport({scale:Math.min(2,width/b.width)});
 const c=document.createElement('canvas');c.width=Math.max(1,Math.floor(vp.width));c.height=Math.max(1,Math.floor(vp.height));
 try{
  const x=c.getContext('2d',{alpha:false});x.fillStyle='#fff';x.fillRect(0,0,c.width,c.height);
  const task=pg.render({canvasContext:x,viewport:vp}),stop=()=>task.cancel();
  sig&&sig.addEventListener('abort',stop);if(sig&&sig.aborted)stop();
  try{await task.promise;}finally{sig&&sig.removeEventListener('abort',stop);}
  return c;
 }catch(e){freeCanvas(c);throw e;}
 finally{pg.cleanup();}}
/** Releases a canvas's pixel memory. */
export function freeCanvas(c){if(c){c.width=0;c.height=0;c.remove();}}

/**
 * Parses "1-3, 5, 7-9" against a page count.
 * @param {string} text @param {number} pageCount
 * @returns {{ranges:[number,number][]}|{error:{code:'empty'|'invalid'|'order'|'beyond',detail:string}}}
 * detail = the offending token (invalid/order) or the page number (beyond). Whitespace, en dashes and ";" are tolerated.
 */
export function parseRanges(text,pageCount){
 const parts=String(text).replace(/[–—]/g,'-').split(/[,;]/).map(s=>s.trim()).filter(Boolean);
 if(!parts.length)return {error:{code:'empty',detail:''}};
 const ranges=[];
 for(const p of parts){
  const m=p.match(/^(\d+)\s*(?:-\s*(\d+))?$/);
  if(!m)return {error:{code:'invalid',detail:p}};
  const a=+m[1],b=m[2]===undefined?a:+m[2];
  if(a<1||b<1)return {error:{code:'invalid',detail:p}};
  if(a>b)return {error:{code:'order',detail:p}};
  if(b>pageCount)return {error:{code:'beyond',detail:String(b)}};
  ranges.push([a,b]);}
 return {ranges};}

/** Turns sorted page numbers into "1-3, 5, 7-9". @param {number[]} pages */
export function formatRanges(pages){
 const s=[...new Set(pages)].sort((a,b)=>a-b),out=[];
 for(let i=0;i<s.length;){let j=i;while(j+1<s.length&&s[j+1]===s[j]+1)j++;out.push(j>i?`${s[i]}-${s[j]}`:`${s[i]}`);i=j+1;}
 return out.join(', ');}

/** Expands ranges to a sorted unique page list. @param {[number,number][]} ranges */
export const pagesOf=ranges=>{const s=new Set();for(const [a,b] of ranges)for(let i=a;i<=b;i++)s.add(i);return [...s].sort((a,b)=>a-b);};

/**
 * Lazy thumbnail grid with page selection. Only visible pages are rendered (one at a time); canvases are freed when scrolled away.
 * Click toggles, Shift+click selects a range from the last clicked page, Space/Enter toggle (buttons), Shift+Space/Enter too.
 * @param {HTMLElement} host a <ul>/<div> that receives the tiles
 * @param {{pdf:any, pageCount:number, width?:number, pageLabel:(n:number)=>string, onChange?:(pages:number[])=>void}} o
 * @returns {{getSelection():number[], setSelection(pages:number[],silent?:boolean):void, clear():void, destroy():void}}
 */
export function createPageGrid(host,{pdf,pageCount,width=120,pageLabel,onChange}){
 const sel=new Set(),tiles=[];let anchor=0,dead=false,queue=[],busy=false;
 const ac=new AbortController();
 host.replaceChildren();host.classList.add('pggrid');
 const frag=document.createDocumentFragment();
 for(let n=1;n<=pageCount;n++){
  const b=document.createElement('button');b.type='button';b.className='tile imgtile pgtile';b.dataset.n=n;
  b.setAttribute('aria-pressed','false');b.setAttribute('aria-label',pageLabel(n));
  b.innerHTML=`<span class="num mono">${n}</span><span class="thumb"></span>`;
  tiles[n]=b;frag.append(b);}
 host.append(frag);
 const paint=n=>{const on=sel.has(n);tiles[n].classList.toggle('is-picked',on);tiles[n].setAttribute('aria-pressed',on);};
 const emit=()=>onChange&&onChange([...sel].sort((a,b)=>a-b));
 function click(n,shift){
  if(shift&&anchor){const [a,b]=anchor<n?[anchor,n]:[n,anchor],on=!sel.has(n);
   for(let i=a;i<=b;i++){on?sel.add(i):sel.delete(i);paint(i);}}
  else{sel.has(n)?sel.delete(n):sel.add(n);paint(n);anchor=n;}
  anchor=n;emit();}
 host.addEventListener('click',e=>{const b=e.target.closest('.pgtile');if(b)click(+b.dataset.n,e.shiftKey);});
 /* lazy rendering: visible tiles queue up; tiles that leave the viewport free their canvas */
 const vis=new Set();
 async function pump(){
  if(busy||dead)return;busy=true;
  while(queue.length&&!dead){
   const n=queue.shift();if(!vis.has(n)||tiles[n].dataset.done)continue;
   try{
    const c=await renderPage(pdf,n,width,ac.signal);
    if(dead||!vis.has(n)){freeCanvas(c);continue;}      // scrolled away while rendering
    const th=tiles[n].querySelector('.thumb');th.replaceChildren(c);tiles[n].dataset.done='1';
   }catch(e){if(dead)break;}
   await new Promise(r=>setTimeout(r,0));}              // let the browser breathe between pages
  busy=false;}
 const io=new IntersectionObserver(es=>{
  for(const e of es){const n=+e.target.dataset.n;
   if(e.isIntersecting){vis.add(n);if(!e.target.dataset.done)queue.push(n);}
   else{vis.delete(n);if(e.target.dataset.done){freeCanvas(e.target.querySelector('canvas'));delete e.target.dataset.done;}}}
  pump();},{rootMargin:'300px'});
 for(let n=1;n<=pageCount;n++)io.observe(tiles[n]);
 return {
  getSelection:()=>[...sel].sort((a,b)=>a-b),
  setSelection(pages,silent=true){for(const n of [...sel])if(!pages.includes(n)){sel.delete(n);paint(n);}
   for(const n of pages)if(tiles[n]){sel.add(n);paint(n);}silent||emit();},
  clear(){for(const n of [...sel]){sel.delete(n);paint(n);}emit();},
  destroy(){dead=true;ac.abort();io.disconnect();queue=[];for(let n=1;n<=pageCount;n++)freeCanvas(tiles[n].querySelector('canvas'));host.replaceChildren();host.classList.remove('pggrid');}};
}

/* format.js — file sizes, percents, template fill, small async helpers (no DOM, no state) */

/** Formats bytes as "812 KB" / "2.4 MB". @param {number} n bytes @returns {string} */
export function formatBytes(n){
 if(!isFinite(n)||n<0)return '0 B';
 if(n<1024)return `${n} B`;
 const u=['KB','MB','GB'];let i=-1;
 do{n/=1024;i++;}while(n>=1024&&i<u.length-1);
 if(i<u.length-1&&Math.round(n)>=1024){n/=1024;i++;}              // 1023.6 KB rounds to "1024 KB": show "1 MB" instead
 return `${n>=100||i===0&&n>=10?Math.round(n):n.toFixed(1).replace(/\.0$/,'')} ${u[i]}`;}

/** @param {number} done @param {number} total @returns {number} whole percent 0-100 */
export const percent=(done,total)=>total>0?Math.max(0,Math.min(100,Math.round(done/total*100))):0;

/** @param {number} v @param {number} lo @param {number} hi */
export const clamp=(v,lo,hi)=>Math.max(lo,Math.min(hi,v));

/** Fills {name} slots in a copy string. @param {string} s @param {Record<string,string|number>} vars */
export const fill=(s,vars={})=>String(s).replace(/\{(\w+)\}/g,(m,k)=>k in vars?vars[k]:m);

/** Escapes text for safe innerHTML (file names are user data). @param {string} s */
export const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

/** @template T @param {T[]} a @returns {T} random element */
export const pick=a=>a[Math.floor(Math.random()*a.length)];

/** Lower-case extension without the dot. @param {string} name */
export const extOf=name=>(String(name).match(/\.([^.\/\\]+)$/)||[,''])[1].toLowerCase();

/** Resolves on the next frame, or after 60 ms when the tab is hidden (rAF pauses in background tabs). */
export const nextFrame=()=>new Promise(r=>{let d=false;const go=()=>{if(!d){d=true;r();}};requestAnimationFrame(go);setTimeout(go,60);});

/** Throws an AbortError when the signal has fired. @param {AbortSignal} [signal] */
export function checkAbort(signal){if(signal&&signal.aborted)throw new DOMException('Aborted','AbortError');}

/** @param {unknown} e @returns {boolean} */
export const isAbort=e=>!!e&&e.name==='AbortError';

/** Heuristic: did this error come from running out of memory? @param {unknown} e */
export const isMemoryError=e=>!!e&&/out of memory|memory|array buffer allocation|invalid (typed )?array length|allocation failed/i.test(String(e.message||e));

const loading=new Map();
/** Loads a CDN script once and resolves with window[globalName] (a string, or a list of alternative names). Rejects with {code:'library'} on error/timeout; a failed load can be retried.
 *  @param {string} url @param {string|string[]} globalName @param {number} [ms] @returns {Promise<any>} */
export function loadScriptOnce(url,globalName,ms=20000){
 const names=[].concat(globalName),got=()=>{for(const k of names)if(window[k])return window[k];return null;};   // a library may expose more than one global name
 if(got())return Promise.resolve(got());
 if(loading.has(url))return loading.get(url);
 const p=new Promise((res,rej)=>{
  const s=document.createElement('script');s.src=url;s.async=true;
  const fail=()=>{clearTimeout(to);s.remove();const e=new Error('library');e.code='library';rej(e);};
  const to=setTimeout(fail,ms);
  s.onload=()=>{clearTimeout(to);got()?res(got()):fail();};
  s.onerror=fail;document.head.append(s);});
 loading.set(url,p);p.catch(()=>loading.delete(url));return p;}

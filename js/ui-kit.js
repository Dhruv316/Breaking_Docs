/* ui-kit.js — tiny shared helpers (no side effects), so fx modules never import ui.js and create a cycle. */
export const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
/** Short status toast. */
export function toast(msg,ms=2200){const d=document.createElement('div');d.className='toast';d.setAttribute('role','status');const m=document.createElement('span');m.className='toast-msg';m.textContent=msg;const x=document.createElement('button');x.type='button';x.className='x-close';x.setAttribute('aria-label','Dismiss');x.textContent='×';x.onclick=()=>d.remove();d.append(m,x);document.body.append(d);setTimeout(()=>d.remove(),ms);}
/** Safe storage helpers: storage may be missing or throw (private windows). Nothing depends on them. */
export const store={get(k){try{return localStorage.getItem(k)}catch{return null}},set(k,v){try{localStorage.setItem(k,v)}catch{}}};

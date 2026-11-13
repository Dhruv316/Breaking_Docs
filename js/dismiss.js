/* dismiss.js — adds a 48px close button to themed warnings (.warn). Removes the node only; no tool logic is touched. */
import {t} from './copy.js';
export function initDismiss(){
 const add=w=>{if(w.querySelector('.x-close'))return;const b=document.createElement('button');b.type='button';b.className='x-close';b.setAttribute('aria-label',t('result.closeMsg'));b.textContent='×';
  b.onclick=()=>w.remove();w.classList.add('has-x');w.append(b);};
 const scan=r=>r.querySelectorAll?.('.warn').forEach(add);
 scan(document);
 new MutationObserver(ms=>ms.forEach(m=>m.addedNodes.forEach(n=>{if(n.nodeType!==1)return;n.matches('.warn')?add(n):scan(n);}))).observe(document.body,{childList:true,subtree:true});}

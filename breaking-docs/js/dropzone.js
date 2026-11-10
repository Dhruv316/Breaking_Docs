/* dropzone.js — reusable drag-drop + file picker + paste + validation. No tool-specific logic. */
import {extOf} from './format.js';

/**
 * Splits files into accepted and rejected (wrong type / too large).
 * @param {File[]} files
 * @param {{exts:string[], mimes?:string[], maxBytes:number}} rules extensions without dots, lower-case
 * @returns {{ok:File[], rejected:{file:File, reason:'type'|'size'}[]}}
 */
export function validateFiles(files,{exts,mimes=[],maxBytes}){
 const ok=[],rejected=[];
 for(const file of files){
  const typeOk=exts.includes(extOf(file.name))||(!!file.type&&mimes.includes(file.type.toLowerCase()));
  if(!typeOk)rejected.push({file,reason:'type'});
  else if(file.size>maxBytes)rejected.push({file,reason:'size'});
  else ok.push(file);
 }
 return {ok,rejected};
}

/**
 * Wires a drop target. `root` receives drag events, `trigger` opens the picker (click / Enter / Space).
 * @param {{root:HTMLElement, trigger:HTMLElement, label?:HTMLElement, idleText?:string, overText?:string,
 *   exts:string[], mimes?:string[], maxBytes:number, multiple?:boolean, onFiles:(r:{ok:File[],rejected:{file:File,reason:string}[]})=>void}} o
 * @returns {{open():void, setDisabled(b:boolean):void, destroy():void}}
 */
export function createDropzone(o){
 const {root,trigger,label,idleText,overText,exts,mimes=[],maxBytes,multiple=true,onFiles}=o;
 const input=document.createElement('input');
 input.type='file';input.multiple=multiple;input.hidden=true;input.tabIndex=-1;
 input.accept=[...exts.map(e=>'.'+e),...mimes].join(',');
 root.append(input);
 let depth=0,disabled=false;
 const hasFiles=e=>[...(e.dataTransfer?.types||[])].includes('Files');
 const handle=list=>{const files=[...list];if(files.length&&!disabled)onFiles(validateFiles(files,{exts,mimes,maxBytes}));};
 const over=on=>{root.classList.toggle('is-over',on);if(label&&overText)label.textContent=on?overText:idleText;};
 const L={
  dragenter:e=>{if(!hasFiles(e)||disabled)return;e.preventDefault();depth++;over(true);},
  dragover:e=>{if(!hasFiles(e)||disabled)return;e.preventDefault();e.dataTransfer.dropEffect='copy';},
  dragleave:e=>{if(!hasFiles(e))return;depth=Math.max(0,depth-1);if(!depth)over(false);},
  drop:e=>{if(!hasFiles(e))return;e.preventDefault();depth=0;over(false);handle(e.dataTransfer.files);}
 };
 for(const k in L)root.addEventListener(k,L[k]);
 // stop the browser from navigating to a file dropped just outside the tray
 const stray=e=>{if(hasFiles(e))e.preventDefault();};
 window.addEventListener('dragover',stray);window.addEventListener('drop',stray);
 const onPaste=e=>{const f=[...(e.clipboardData?.files||[])];if(f.length){e.preventDefault();handle(f);}};
 document.addEventListener('paste',onPaste);
 const open=()=>{if(!disabled){input.value='';input.click();}};
 const onKey=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();open();}};
 trigger.addEventListener('click',open);trigger.addEventListener('keydown',onKey);
 input.addEventListener('change',()=>{handle(input.files);input.value='';});
 return {
  open,
  setDisabled(b){disabled=b;root.classList.toggle('is-disabled',b);trigger.toggleAttribute('aria-disabled',b);if(b)over(false);},
  destroy(){for(const k in L)root.removeEventListener(k,L[k]);window.removeEventListener('dragover',stray);window.removeEventListener('drop',stray);
   document.removeEventListener('paste',onPaste);trigger.removeEventListener('click',open);trigger.removeEventListener('keydown',onKey);input.remove();}
 };
}

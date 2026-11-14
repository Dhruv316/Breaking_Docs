/* nav-extras.js — Tools mega-menu, command palette, footer columns, privacy sections (additive; strings in copy.js) */
import {COPY,TOOLS,BLURBS,t} from './copy.js';
import {fill,esc} from './format.js';
const $=(s,r=document)=>r.querySelector(s);
const LIVE=TOOLS.filter(x=>x.live);
const ICONS={Im:'image-frames',Pp:'stack-of-slides',Cp:'squeeze-press',Mg:'merge-arrows',Sp:'scissors',Rm:'eraser'};
const desk=matchMedia('(min-width:900px)');
let uid=0;

/** Modal helper: focus trap, Esc, restores focus. Returns {el,close}. */
export function openModal(inner,{label,cls='',onClose}={}){
 const opener=document.activeElement;
 const back=document.createElement('div');back.className='pl-back';
 back.innerHTML=`<div class="pl-box ${cls}" role="dialog" aria-modal="true" aria-label="${esc(label)}"><div class="pl-tape" aria-hidden="true"></div>${inner}</div>`;
 document.body.append(back);
 const box=back.firstElementChild;
 const foc=()=>[...box.querySelectorAll('button,a[href],input,[tabindex]:not([tabindex="-1"])')].filter(e=>!e.disabled&&!e.hidden&&e.offsetParent!==null);
 function close(){document.removeEventListener('keydown',key,true);back.remove();try{opener?.focus?.({preventScroll:true})}catch{}onClose&&onClose();}
 function key(e){
  if(e.key==='Escape'){e.preventDefault();e.stopPropagation();close();return;}
  if(e.key==='Tab'){const f=foc();if(!f.length){e.preventDefault();return;}
   const a=f[0],z=f[f.length-1];
   if(!box.contains(document.activeElement)){e.preventDefault();a.focus();}
   else if(e.shiftKey&&document.activeElement===a){e.preventDefault();z.focus();}
   else if(!e.shiftKey&&document.activeElement===z){e.preventDefault();a.focus();}}}
 document.addEventListener('keydown',key,true);
 back.addEventListener('mousedown',e=>{if(e.target===back)close();});
 return {el:box,close,focusables:foc};}

/* ───── Tools mega-menu ───── */
function megaMenu(){
 const nav=$('.topbar .nav');if(!nav)return;
 const trig=nav.querySelector('a');if(!trig)return;
 const id='mm-panel';
 const panel=document.createElement('div');panel.className='mm-panel';panel.id=id;
 panel.innerHTML=`<div class="mm-tape" aria-hidden="true"></div><ul class="mm-grid" aria-label="${esc(t('menu.label'))}">${LIVE.map(x=>`<li><a class="mm-tile" href="${x.href}"><span class="mm-ico" aria-hidden="true"></span><span class="mm-name"><i aria-hidden="true">${x.sym}</i>${esc(COPY.tools[x.sym].name)}</span><span class="mm-desc">${esc(BLURBS[x.sym])}</span></a></li>`).join('')}</ul>`;
 nav.parentElement.append(panel);
 const tiles=[...panel.querySelectorAll('.mm-tile')];
 let pinned=false,timer=0;
 const isOpen=()=>panel.classList.contains('open');
 function icons(n=0){if(window.Art){tiles.forEach((a,i)=>{const s=$('.mm-ico',a);if(!s.firstChild)s.innerHTML=window.Art.svg(ICONS[LIVE[i].sym],40);});}else if(n<40)setTimeout(()=>icons(n+1),150);}
 function open(){if(!desk.matches)return;clearTimeout(timer);panel.classList.add('open');trig.setAttribute('aria-expanded','true');icons();}
 function close(refocus){clearTimeout(timer);pinned=false;panel.classList.remove('open');trig.setAttribute('aria-expanded','false');if(refocus)trig.focus();}
 function sync(){if(desk.matches){trig.setAttribute('aria-haspopup','true');trig.setAttribute('aria-controls',id);trig.setAttribute('aria-expanded',String(isOpen()));}
  else{['aria-haspopup','aria-controls','aria-expanded'].forEach(a=>trig.removeAttribute(a));panel.classList.remove('open');pinned=false;}}
 sync();desk.addEventListener?.('change',sync);
 const later=()=>{clearTimeout(timer);if(!pinned)timer=setTimeout(()=>{if(!pinned&&!panel.contains(document.activeElement))close();},220);};
 trig.addEventListener('pointerenter',e=>{if(e.pointerType!=='touch')open();});
 trig.addEventListener('pointerleave',later);panel.addEventListener('pointerenter',()=>clearTimeout(timer));panel.addEventListener('pointerleave',later);
 trig.addEventListener('focus',open);
 trig.addEventListener('click',e=>{if(!desk.matches)return;e.preventDefault();if(isOpen()&&pinned)close();else{open();pinned=true;}});
 trig.addEventListener('keydown',e=>{if(!desk.matches)return;
  if(e.key==='ArrowDown'||(e.key==='Tab'&&!e.shiftKey&&isOpen())){e.preventDefault();open();tiles[0].focus();}});
 panel.addEventListener('keydown',e=>{const i=tiles.indexOf(document.activeElement);if(i<0)return;let n=-1;
  if(e.key==='ArrowRight')n=Math.min(tiles.length-1,i+1);else if(e.key==='ArrowLeft')n=Math.max(0,i-1);
  else if(e.key==='ArrowDown')n=i+3<tiles.length?i+3:i;else if(e.key==='ArrowUp'){if(i<3){e.preventDefault();trig.focus();return;}n=i-3;}
  else if(e.key==='Home')n=0;else if(e.key==='End')n=tiles.length-1;
  else if(e.key==='Tab'){if(e.shiftKey&&i===0){e.preventDefault();trig.focus();}else if(!e.shiftKey&&i===tiles.length-1){e.preventDefault();close();(trig.nextElementSibling||trig).focus();}return;}
  if(n>=0){e.preventDefault();tiles[n].focus();}});
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&isOpen()){const inside=panel.contains(document.activeElement)||document.activeElement===trig;close(inside);}});
 document.addEventListener('pointerdown',e=>{if(isOpen()&&!panel.contains(e.target)&&!trig.contains(e.target))close();});
 panel.addEventListener('click',e=>{if(e.target.closest('a'))close();});
 addEventListener('hashchange',()=>close());addEventListener('popstate',()=>close());addEventListener('pagehide',()=>close());
 /* keyboard-hint chip (desktop only via CSS) */
 const chip=document.createElement('button');chip.type='button';chip.className='kbd-chip';chip.textContent=t('menu.hint');
 chip.setAttribute('aria-label',t('menu.hintAria'));chip.setAttribute('aria-keyshortcuts',t('menu.hintKeys'));
 chip.addEventListener('click',()=>palette());nav.append(chip);
}

/* ───── Command palette ───── */
let paletteOpen=false;
function palette(){
 if(paletteOpen)return;paletteOpen=true;
 const items=[...LIVE.map(x=>({sym:x.sym,name:COPY.tools[x.sym].name,href:x.href,kind:t('palette.kindTool')})),
  {sym:t('palette.pageSym.home'),name:t('palette.home'),href:'index.html',kind:t('palette.kindPage')},
  {sym:t('palette.pageSym.privacy'),name:t('palette.privacy'),href:'privacy.html',kind:t('palette.kindPage')}];
 const lid='pl-list-'+(++uid);
 const m=openModal(`<input class="pl-in" type="text" role="combobox" aria-expanded="true" aria-controls="${lid}" aria-autocomplete="list" aria-label="${esc(t('palette.label'))}" placeholder="${esc(t('palette.ph'))}" autocomplete="off" spellcheck="false"><ul class="pl-list" id="${lid}" role="listbox" aria-label="${esc(t('palette.list'))}"></ul><p class="pl-foot" aria-live="polite"></p>`,
  {label:t('palette.title'),onClose:()=>{paletteOpen=false;}});
 const inp=$('.pl-in',m.el),list=$('.pl-list',m.el),foot=$('.pl-foot',m.el);let shown=[],act=0;
 function render(){const q=inp.value.trim().toLowerCase();
  shown=items.filter(x=>!q||x.name.toLowerCase().includes(q)||x.sym.toLowerCase().includes(q));act=Math.min(act,Math.max(0,shown.length-1));
  list.innerHTML=shown.length?shown.map((x,i)=>`<li class="pl-opt" role="option" id="${lid}-${i}" aria-selected="${i===act}" data-i="${i}"><span class="pl-sym" aria-hidden="true">${esc(x.sym)}</span><span class="pl-nm">${esc(x.name)}</span><span class="pl-kind">${esc(x.kind)}</span></li>`).join(''):`<li class="pl-empty" role="presentation">${esc(t('palette.empty'))}</li>`;
  inp.setAttribute('aria-activedescendant',shown.length?`${lid}-${act}`:'');
  foot.textContent=shown.length?t('palette.hintNav'):t('palette.empty');}
 function setAct(i){act=i;list.querySelectorAll('.pl-opt').forEach((o,j)=>o.setAttribute('aria-selected',String(j===i)));inp.setAttribute('aria-activedescendant',`${lid}-${i}`);list.children[i]?.scrollIntoView({block:'nearest'});}
 const go=i=>{if(shown[i])location.href=shown[i].href;};
 inp.addEventListener('input',()=>{act=0;render();});
 inp.addEventListener('keydown',e=>{if(!shown.length&&e.key!=='Escape'){if(e.key==='Enter')e.preventDefault();return;}
  if(e.key==='ArrowDown'){e.preventDefault();setAct((act+1)%shown.length);}
  else if(e.key==='ArrowUp'){e.preventDefault();setAct((act-1+shown.length)%shown.length);}
  else if(e.key==='Enter'){e.preventDefault();go(act);}});
 list.addEventListener('mousemove',e=>{const o=e.target.closest('.pl-opt');if(o&&+o.dataset.i!==act)setAct(+o.dataset.i);});
 list.addEventListener('click',e=>{const o=e.target.closest('.pl-opt');if(o)go(+o.dataset.i);});
 render();inp.focus();
}
function paletteKeys(){
 document.addEventListener('keydown',e=>{
  if((e.ctrlKey||e.metaKey)&&!e.altKey&&!e.shiftKey&&(e.key==='k'||e.key==='K')){e.preventDefault();palette();return;}
  if(e.key==='/'&&!e.ctrlKey&&!e.metaKey&&!e.altKey&&!e.target.closest?.('input,textarea,select,[contenteditable],[role=dialog]')){e.preventDefault();palette();}});
}

/* ───── Footer columns ───── */
function footerCols(){
 const w=$('#footer .wrap');if(!w||$('.fcols',w))return;const c=COPY.footerCols;
 const col=(h,rows)=>`<div><h3>${esc(h)}</h3><ul>${rows}</ul></div>`;
 const html=`<nav class="fcols" aria-label="${esc(c.aria)}">${col(c.tools,LIVE.map(x=>`<li><a href="${x.href}">${esc(COPY.tools[x.sym].name)}</a></li>`).join(''))}
 ${col(c.site,`<li><a href="index.html">${esc(c.home)}</a></li><li><a href="index.html#how">${esc(c.how)}</a></li><li><a href="index.html#faq">${esc(c.faq)}</a></li><li><a href="privacy.html">${esc(c.privacy)}</a></li>`)}
 ${col(c.promise,c.promises.map(p=>`<li class="fp">${esc(p)}</li>`).join(''))}</nav>`;
 const before=$('.credit--foot',w);before?before.insertAdjacentHTML('beforebegin',html):w.insertAdjacentHTML('beforeend',html);
}
/* ───── Privacy sections ───── */
function privacy(){const h=$('#pv-sections');if(!h)return;h.innerHTML=COPY.privacy.sections.map(s=>`<section><h2>${esc(s.h)}</h2><p>${esc(s.p)}</p></section>`).join('');}

export function initExtras(){megaMenu();paletteKeys();footerCols();privacy();}

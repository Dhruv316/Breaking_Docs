/* cook-report.js — "Share your batch": 1080x1350 Breaking-Bad-style PNG drawn with canvas code only (no images, no user file names). */
import {COPY,TOOLS,t} from './copy.js';
import {fill,esc} from './format.js';
import {openModal} from './nav-extras.js';
const W=1080,H=1350,DISPLAY='Anton,Impact,"Arial Narrow","Helvetica Neue",Arial,sans-serif',SANS='Barlow,"Segoe UI",system-ui,-apple-system,Arial,sans-serif',MONO='"Share Tech Mono",ui-monospace,Menlo,Consolas,monospace';

function rng(seed){let s=seed>>>0;return()=>((s=(s*1664525+1013904223)>>>0)/4294967296);}
function tape(c,y,h){c.save();c.beginPath();c.rect(0,y,W,h);c.clip();c.fillStyle='#f5c400';c.fillRect(0,y,W,h);c.fillStyle='#0a0c0a';
 for(let x=-h*2;x<W+h*2;x+=h*1.4){c.beginPath();c.moveTo(x,y+h);c.lineTo(x+h*.7,y+h);c.lineTo(x+h*.7+h,y);c.lineTo(x+h,y);c.closePath();c.fill();}c.restore();}
function fitText(c,txt,font,max,start){let s=start;do{c.font=font(s);if(c.measureText(txt).width<=max)break;s-=4;}while(s>24);return s;}

/** Pure drawing. d={sym,name,headline,stats[]} → canvas */
export function drawCard(d){
 const cv=document.createElement('canvas');cv.width=W;cv.height=H;const c=cv.getContext('2d');const R=rng(88);
 // background: deep tile-green gradient + vignette
 let g=c.createLinearGradient(0,0,0,H);g.addColorStop(0,'#0f3a1d');g.addColorStop(.55,'#0a2614');g.addColorStop(1,'#050e08');c.fillStyle=g;c.fillRect(0,0,W,H);
 g=c.createRadialGradient(W/2,H*.4,200,W/2,H*.45,H*.8);g.addColorStop(0,'#1e7a3c33');g.addColorStop(1,'#00000099');c.fillStyle=g;c.fillRect(0,0,W,H);
 // grain
 const im=c.getImageData(0,0,W,H),p=im.data;for(let i=0;i<p.length;i+=4){const n=(R()-.5)*34;p[i]+=n;p[i+1]+=n;p[i+2]+=n;}c.putImageData(im,0,0);
 tape(c,0,34);tape(c,H-34,34);
 c.textAlign='center';c.textBaseline='alphabetic';c.fillStyle='#d6c08f';c.font=`28px ${MONO}`;
 c.fillText('COOK REPORT',W/2,116);
 // element tile
 const tx=W/2-190,ty=170,ts=380;
 c.save();c.shadowColor='#000';c.shadowBlur=40;c.shadowOffsetY=18;c.fillStyle='#1e7a3c';c.fillRect(tx,ty,ts,ts);c.restore();
 g=c.createLinearGradient(tx,ty,tx,ty+ts);g.addColorStop(0,'#2a9a50');g.addColorStop(1,'#145a2b');c.fillStyle=g;c.fillRect(tx,ty,ts,ts);
 c.lineWidth=10;c.strokeStyle='#f2ebd8';c.strokeRect(tx+5,ty+5,ts-10,ts-10);
 c.textAlign='left';c.fillStyle='#fff';c.font=`34px ${MONO}`;c.fillText(String(d.n),tx+28,ty+64);
 c.textAlign='right';c.fillText(d.mass||'',tx+ts-28,ty+64);
 c.textAlign='center';const fs=fitText(c,d.sym,s=>`${s}px ${DISPLAY}`,ts-60,250);c.font=`${fs}px ${DISPLAY}`;c.fillStyle='#fff';c.fillText(d.sym,W/2,ty+ts*.76);
 // tool name
 c.fillStyle='#f2ebd8';const ns=fitText(c,d.name.toUpperCase(),s=>`${s}px ${DISPLAY}`,W-160,84);c.font=`${ns}px ${DISPLAY}`;c.fillText(d.name.toUpperCase(),W/2,ty+ts+100);
 // stamp on its own layer, then distressed
 const sl=document.createElement('canvas');sl.width=W;sl.height=H;const s=sl.getContext('2d');
 s.translate(W/2,820);s.rotate(-.07);
 const label=d.headline.toUpperCase();s.textAlign='center';s.textBaseline='middle';
 const sf=fitText(s,label,z=>`${z}px ${DISPLAY}`,W-300,150);s.font=`${sf}px ${DISPLAY}`;
 const tw=s.measureText(label).width,bw=tw+90,bh=sf+80;
 s.strokeStyle='#f5c400';s.fillStyle='#f5c400';s.lineWidth=12;s.strokeRect(-bw/2,-bh/2,bw,bh);s.lineWidth=4;s.strokeRect(-bw/2+16,-bh/2+16,bw-32,bh-32);
 s.fillText(label,0,6);
 s.globalCompositeOperation='destination-out';
 for(let i=0;i<900;i++){const x=(R()-.5)*(bw+40),y=(R()-.5)*(bh+40),r=R()*R()*9+1;s.globalAlpha=.35+R()*.65;s.beginPath();s.arc(x,y,r,0,7);s.fill();}
 for(let i=0;i<14;i++){s.globalAlpha=.8;s.lineWidth=2+R()*3;s.beginPath();const x=(R()-.5)*bw,y=(R()-.5)*bh;s.moveTo(x,y);s.lineTo(x+(R()-.5)*160,y+(R()-.5)*40);s.stroke();}
 c.save();c.shadowColor='#000';c.shadowBlur=16;c.drawImage(sl,0,0);c.restore();
 // stats
 c.textAlign='center';c.textBaseline='alphabetic';c.fillStyle='#f2ebd8';
 const st=d.stats.slice(0,3);let y=1020;
 st.forEach(line=>{const z=fitText(c,line,q=>`${q}px ${MONO}`,W-140,48);c.font=`${z}px ${MONO}`;c.fillText(line,W/2,y);y+=66;});
 // footer
 c.fillStyle='#f5c400';c.font=`64px ${DISPLAY}`;c.fillText(d.brand.toLowerCase(),W/2,H-82);
 return cv;
}

function headlineFor(stamp,pages){
 if(/\d+\s*%\s*SMALLER/i.test(stamp))return stamp;
 return pages===1?t('share.pageWord'):fill(t('share.pagesWord'),{n:pages});}

/** Adds the "Share your batch" button to a rendered result panel. Reads only the stamp, stats and page count already on screen's data. */
export function addShare(host,{stamp,stats,pages,blobSize}){
 const row=host.querySelector('.res-actions');if(!row||row.querySelector('.res-share'))return;
 const cur=location.pathname.split('/').pop()||'index.html';const tool=TOOLS.find(x=>x.href===cur)||TOOLS[0];
 const b=document.createElement('button');b.type='button';b.className='btn btn-sm res-share';b.textContent=t('share.button');row.prepend(b);
 b.addEventListener('click',()=>{
  const data={n:tool.n,sym:tool.sym,mass:tool.mass,name:COPY.tools[tool.sym].name,headline:headlineFor(stamp,pages),stats,brand:t('share.brand')};
  const m=openModal(`<div class="sh-body"><canvas aria-label="${esc(t('share.preview'))}" role="img"></canvas><p class="sh-msg" role="status">${esc(t('share.building'))}</p><div class="sh-act"><button type="button" class="btn btn-sm sh-dl" disabled>${esc(t('share.download'))}</button><button type="button" class="btn btn-2 btn-sm sh-sh" hidden>${esc(t('share.share'))}</button><button type="button" class="btn btn-2 btn-sm sh-x">${esc(t('share.close'))}</button></div></div>`,{label:t('share.aria'),cls:'sh-box',onClose:()=>{}});
  const msg=m.el.querySelector('.sh-msg'),dl=m.el.querySelector('.sh-dl'),sh=m.el.querySelector('.sh-sh'),prev=m.el.querySelector('canvas');
  m.el.querySelector('.sh-x').addEventListener('click',m.close);
  const go=async()=>{try{await Promise.race([document.fonts.load(`100px Anton`),new Promise(r=>setTimeout(r,1200))]);await document.fonts.load('20px "Share Tech Mono"').catch(()=>{});}catch{}
   let cv;try{cv=drawCard(data);}catch{msg.textContent=t('share.fail');return;}
   prev.width=W;prev.height=H;prev.getContext('2d').drawImage(cv,0,0);
   const blob=await new Promise(r=>cv.toBlob(r,'image/png'));if(!blob){msg.textContent=t('share.fail');return;}
   msg.textContent='';dl.disabled=false;
   const file=new File([blob],t('share.file'),{type:'image/png'});
   dl.addEventListener('click',()=>{const u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download=t('share.file');document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),4000);});
   if(navigator.canShare&&navigator.share&&navigator.canShare({files:[file]})){sh.hidden=false;
    sh.addEventListener('click',()=>navigator.share({files:[file],title:t('share.shareTitle'),text:t('share.shareText')}).then(()=>{msg.textContent=t('share.shared');}).catch(()=>{}));}
   dl.focus();};
  go();});
}

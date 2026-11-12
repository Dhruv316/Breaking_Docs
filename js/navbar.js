/* navbar.js — shrink after 80px + hazard-tape scroll progress (transform scaleX only). Runs on every page. */
export function initNavbar(){const h=document.querySelector('.topbar'),b=h&&h.querySelector('.prog i');if(!b)return;let q=false;
 const upd=()=>{q=false;const y=scrollY,m=document.documentElement.scrollHeight-innerHeight;h.classList.toggle('is-small',y>80);b.style.transform='scaleX('+(m>0?Math.min(1,Math.max(0,y/m)):0)+')';};
 addEventListener('scroll',()=>{if(!q){q=true;requestAnimationFrame(upd);}},{passive:true});addEventListener('resize',upd);upd();}

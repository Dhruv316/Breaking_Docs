/* visibility-governor.js — pauses looping animations on hosts that are off-screen (class is-off), and everything while the tab is hidden during the intro. */
const doc=document.documentElement;
const HOSTS='.sc,[data-ambience],.amb,#hero,.hero,.footer,footer,[data-ticker],.tk-track,.title-card,.card-title,main>section,.tool-hero,.nf';
const seen=new WeakSet();
const io='IntersectionObserver'in window?new IntersectionObserver(es=>es.forEach(e=>e.target.classList.toggle('is-off',!e.isIntersecting)),{rootMargin:'100px'}):null;
function watch(el){if(!io||!el||seen.has(el)||el===doc||el===document.body)return;seen.add(el);io.observe(el);}
function scan(){document.querySelectorAll(HOSTS).forEach(watch);
 try{document.getAnimations().forEach(a=>{if(a.effect?.getComputedTiming().iterations!==Infinity)return;
  let t=a.effect.target;if(!t)return;const h=t.closest?.(HOSTS)||t.closest?.('section,header,footer');if(h)watch(h);});}catch(e){}}
function hidden(){doc.classList.toggle('is-off',document.hidden&&doc.classList.contains('intro-on'));}
document.addEventListener('visibilitychange',hidden);
const go=()=>{scan();setTimeout(scan,1200);setTimeout(scan,4000);};
if(document.readyState==='complete')go();else addEventListener('load',go);

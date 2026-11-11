/* sound.js — Web Audio synthesizer + the title theme. Sound is always on (no toggle, no volume control, nothing saved).
   The AudioContext is only created after a user gesture.
   Public API (all safe to call at any time, all fail silently): play(name), loopStart(name), loopStop(name),
   playIntro(url,offsetMs), stopIntro(), initIntro(url), available(); also the `sound` object.
   One-shots: click, drop, success, error, knock, thump, tile + curtain (title-card intro). Loops: bubbling (only while processing). Also playIntro(url): the Home title-theme file (fades 600 ms, routed through the same volume/limiter).
   Safety: every voice has a >=4 ms attack and an exponential release, per-voice peaks are <=0.3, the master gain is capped (MASTER) and
   everything runs through a hard limiter. */
const MASTER=.7,TRACK_MS=18000,ISKEY='bd.intro.v1';
const AC=typeof window!=='undefined'?(window.AudioContext||window.webkitAudioContext):null;
let gestured=false,dead=!AC;
let ctx=null,master,sfx,noise,brown,intro=null;
const wanted=new Set(),running=new Map(),last={};
/** @returns {boolean} true when this browser can make sound at all */
export const available=()=>!dead;

/* ---------- graph ---------- */
function buildNoise(c){const n=c.sampleRate*2,b=c.createBuffer(1,n,c.sampleRate),d=b.getChannelData(0);for(let i=0;i<n;i++)d[i]=Math.random()*2-1;noise=b;
 const m=c.sampleRate*6,bb=c.createBuffer(1,m,c.sampleRate),e=bb.getChannelData(0);let y=0;
 for(let i=0;i<m;i++){y=(y+.02*(Math.random()*2-1))/1.02;e[i]=y*3.2;}
 const f=c.sampleRate*.5|0;for(let i=0;i<f;i++){const k=i/f;e[m-f+i]=e[m-f+i]*(1-k)+e[i]*k;}   // crossfade the seam so the loop never clicks
 brown=bb;}
/** Creates the context. Only runs after a user gesture; returns false (silently) when impossible. */
function ensure(){if(dead||!gestured)return false;
 try{if(!ctx){ctx=new AC({latencyHint:'interactive'});buildNoise(ctx);
   master=ctx.createGain();master.gain.value=MASTER;
   const lim=ctx.createDynamicsCompressor();lim.threshold.value=-14;lim.knee.value=0;lim.ratio.value=20;lim.attack.value=.003;lim.release.value=.12;
   sfx=ctx.createGain();
   sfx.connect(master);const out=ctx.createGain();out.gain.value=.45;   // final trim: the compressor adds make-up gain, this keeps even High well under full scale
   master.connect(lim);lim.connect(out);out.connect(ctx.destination);}
  if(ctx.state==='suspended')ctx.resume().catch(()=>{});
  return true;}catch{dead=true;ctx=null;return false;}}
const ready=()=>{try{return !!ctx&&ctx.state!=='closed';}catch{return false;}};
const T=()=>ctx.currentTime;
/** Attack then exponential release; never starts or ends at a hard zero. */
function env(g,t,peak,a,d){g.setValueAtTime(.0001,t);g.linearRampToValueAtTime(Math.min(peak,.3),t+a);g.exponentialRampToValueAtTime(.0001,t+a+d);}
function tone({type='sine',f0,f1=f0,t=0,a=.006,d=.1,peak=.1,dest=sfx,lp=0}){const s=T()+t,o=ctx.createOscillator(),g=ctx.createGain();o.type=type;o.frequency.setValueAtTime(f0,s);
 if(f1!==f0)o.frequency.exponentialRampToValueAtTime(f1,s+a+d);env(g.gain,s,peak,Math.max(a,.004),d);
 let n=o;if(lp){const f=ctx.createBiquadFilter();f.type='lowpass';f.frequency.value=lp;o.connect(f);n=f;}n.connect(g);g.connect(dest);o.start(s);o.stop(s+a+d+.04);}
function puff({t=0,a=.004,d=.06,peak=.08,freq=600,q=.8,type='bandpass',dest=sfx}){const s=T()+t,src=ctx.createBufferSource(),f=ctx.createBiquadFilter(),g=ctx.createGain();
 src.buffer=noise;f.type=type;f.frequency.value=freq;f.Q.value=q;env(g.gain,s,peak,a,d);src.connect(f);f.connect(g);g.connect(dest);src.start(s,Math.random()*1.5);src.stop(s+a+d+.04);}

/* ---------- one-shots ---------- */
const SFX={
 click(){tone({f0:900,f1:520,d:.05,peak:.09,lp:3200});puff({freq:2400,q:1,d:.02,peak:.02});return .12;},
 drop(){tone({f0:150,f1:48,d:.2,peak:.3,lp:400,a:.005});puff({freq:380,type:'lowpass',d:.07,peak:.1});tone({f0:620,f1:380,t:.012,d:.05,peak:.03});return .35;},
 success(){[523.25,659.25,783.99,1046.5].forEach((f,i)=>{tone({f0:f,t:i*.09,a:.01,d:.55,peak:.1});tone({f0:f*2,t:i*.09,a:.01,d:.3,peak:.025});});return 1.1;},
 error(){[0,.17].forEach(t=>{tone({type:'sawtooth',f0:110,t,a:.012,d:.13,peak:.08,lp:700});tone({type:'square',f0:116.5,t,a:.012,d:.13,peak:.04,lp:700});});return .5;},
 knock(){[0,.2,.4].forEach((t,i)=>{tone({f0:190-i*8,f1:80,t,d:.12,peak:.3,lp:520,a:.004});puff({t,freq:650,q:1.2,d:.05,peak:.12});});return .8;},
 thump(){[.62,.9].forEach((t,i)=>{tone({f0:130,f1:50,t,d:.16,peak:.26-i*.1,lp:380,a:.005});puff({t,freq:320,type:'lowpass',d:.06,peak:.07-i*.03});});return 1.2;}};
SFX.tile=function(){tone({f0:230,f1:70,d:.16,peak:.2,lp:520,a:.005});puff({freq:1900,q:1.2,d:.05,peak:.035});tone({f0:1320,f1:990,t:.03,a:.01,d:.28,peak:.035});return .4;};
SFX.curtain=function(){puff({type:'bandpass',freq:520,q:.7,a:.06,d:.5,peak:.07});tone({f0:392,t:.04,a:.03,d:.55,peak:.05});tone({f0:587.33,t:.12,a:.03,d:.5,peak:.04});return .8;};
/** Plays a one-shot. No-op when not yet allowed (no user gesture) or unsupported. */
export function play(name){try{if(!SFX[name])return;if(!ensure()||!ready())return;
 const n=performance.now();if(n-(last[name]||0)<45)return;last[name]=n;   // ignore machine-gun repeats
 if(ctx.state==='suspended')return;SFX[name]();}catch{}}

/* ---------- loops ---------- */
function startBubbling(){const g=ctx.createGain();g.gain.value=0;g.connect(sfx);g.gain.setTargetAtTime(1,T(),.15);
 const bed=ctx.createBufferSource(),lp=ctx.createBiquadFilter(),bg=ctx.createGain();bed.buffer=brown;bed.loop=true;lp.type='lowpass';lp.frequency.value=420;bg.gain.value=.05;bed.connect(lp);lp.connect(bg);bg.connect(g);bed.start(0,Math.random()*4);
 let timer=0,dead2=false;const tick=()=>{if(dead2)return;try{if(ctx.state==='running'){const f=260+Math.random()*560;
   tone({f0:f,f1:f*(1.45+Math.random()*.5),a:.005,d:.05+Math.random()*.07,peak:.04+Math.random()*.05,dest:g,lp:2600});
   if(Math.random()<.25)tone({f0:110+Math.random()*80,f1:220,a:.008,d:.1,peak:.05,dest:g,lp:600});}}catch{}
  timer=setTimeout(tick,80+Math.random()*240);};tick();
 return()=>{dead2=true;clearTimeout(timer);try{g.gain.setTargetAtTime(0,T(),.1);setTimeout(()=>{try{bed.stop();g.disconnect();}catch{}},700);}catch{}};}
const LOOPS={bubbling:startBubbling};
const wantNow=n=>wanted.has(n);
/** Reconciles which loops should be running with which are. */
function sync(){try{
 if(!ready())return;
 const hidden=document.hidden;
 for(const n of Object.keys(LOOPS)){const should=wantNow(n)&&!hidden;
  if(should&&!running.has(n)&&ctx.state!=='closed')running.set(n,LOOPS[n]());
  else if(!should&&running.has(n)){running.get(n)();running.delete(n);}}
 if(hidden){clearTimeout(sync.t);sync.t=setTimeout(()=>{try{if(document.hidden&&ctx.state==='running')ctx.suspend().catch(()=>{});}catch{}},200);}
 else{clearTimeout(sync.t);if(ctx.state==='suspended')ctx.resume().catch(()=>{});}}catch{}}
/** Starts a loop (bubbling while processing). */
export function loopStart(name){if(!LOOPS[name])return;wanted.add(name);if(ensure())sync();}
/** Stops a loop with a short fade. */
export function loopStop(name){wanted.delete(name);sync();}

/* ---------- title theme (breaking-bad-intro.mp3) ---------- */
const saveIntro=startedAt=>{try{sessionStorage.setItem(ISKEY,JSON.stringify({startedAt}));}catch{}};
const clearIntro=()=>{try{sessionStorage.removeItem(ISKEY);}catch{}};
/** Plays the theme once through the shared limiter, from offsetMs. Never overlaps or restarts while playing; fades ~600 ms near the end and on page hide.
 *  Resolves true when it is playing, false on any failure (blocked autoplay, missing file). Never throws. */
export async function playIntro(url,offsetMs=0){try{if(intro)return true;gestured=true;if(!ensure()||!ready())return false;sync();
 const a=new Audio(url),g=ctx.createGain(),src=ctx.createMediaElementSource(a);g.gain.value=.0001;g.gain.linearRampToValueAtTime(.28,T()+.05);   // .28 <= the loudest one-shot voice (.3)
 src.connect(g);g.connect(sfx);const me={a,g,src,fading:false};intro=me;
 const clean=()=>{try{src.disconnect();g.disconnect();}catch{}if(intro===me)intro=null;};
 a.addEventListener('ended',()=>{clearIntro();clean();});a.addEventListener('error',clean);
 if(offsetMs>0)a.addEventListener('loadedmetadata',()=>{try{a.currentTime=offsetMs/1000;}catch{}},{once:true});
 a.addEventListener('timeupdate',()=>{if(a.duration&&a.duration-a.currentTime<.65){clearIntro();stopIntro();}});
 await a.play();return true;}catch{try{const me=intro;intro=null;me&&me.src.disconnect();}catch{}return false;}}
/** Milliseconds already played, or -1 when the theme is not playing. */
export const introPlayedMs=()=>intro&&!intro.fading?intro.a.currentTime*1000:-1;
/** Fades the intro out over ~600 ms. */
export function stopIntro(){try{const me=intro;if(!me||me.fading)return;me.fading=true;const n=T();me.g.gain.cancelScheduledValues(n);me.g.gain.setValueAtTime(Math.max(me.g.gain.value,.0001),n);me.g.gain.linearRampToValueAtTime(.0001,n+.6);
 setTimeout(()=>{try{me.a.pause();me.src.disconnect();me.g.disconnect();}catch{}if(intro===me)intro=null;},680);}catch{}}

/** Wires the title theme: starts it from a click on "Start cooking", a tool tile/link or a navbar Tools link, remembers the position for the next
 *  page, and resumes it there (only after an in-site link click, never on reload / back / typed URL). */
export function initIntro(url){
 const TOOLS=/(?:^|\/)(image-to-pdf|ppt-to-pdf|compress-pdf|merge-pdf|split-pdf|remove-pages)\.html(?:[?#]|$)/;
 const wants=el=>{const a=el.closest('a[href]');if(!a)return false;const h=a.getAttribute('href')||'';
  return TOOLS.test(h)||(!!a.closest('.nav')&&/#tools$/.test(h))||(a.matches('#hero a.btn')&&h==='#tools');};
 document.addEventListener('click',e=>{try{
  if(e.defaultPrevented||e.button!==0||e.ctrlKey||e.metaKey||e.shiftKey||e.altKey||!e.target.closest||!wants(e.target))return;
  const played=introPlayedMs();
  if(played<0)playIntro(url,0);                         // the click is the user gesture
  saveIntro(Date.now()-Math.max(0,played));}catch{}},true);
 const resume=async()=>{try{
  const st=JSON.parse(sessionStorage.getItem(ISKEY)||'null');if(!st)return;
  const left=()=>Date.now()-st.startedAt;
  if(!(left()>=0&&left()<TRACK_MS-700)){clearIntro();return;}
  const nav=performance.getEntriesByType&&performance.getEntriesByType('navigation')[0];
  let same=false;try{same=!!document.referrer&&new URL(document.referrer).origin===location.origin;}catch{}
  if(!same||(nav&&nav.type!=='navigate'))return;      // typed URL, reload or back/forward: stay silent
  const go=async()=>{if(!(left()>=0&&left()<TRACK_MS-700))return true;gestured=true;if(!ensure())return false;
   try{await Promise.race([ctx.resume(),new Promise(r=>setTimeout(r,250))]);}catch{}
   if(!ctx||ctx.state!=='running')return false;return playIntro(url,left());};
  if(await go())return;
  const kinds=['pointerdown','keydown','touchend','click'];                // autoplay blocked: resume on the first gesture
  const once=async()=>{kinds.forEach(k=>removeEventListener(k,once,true));gestured=true;await go();};
  kinds.forEach(k=>addEventListener(k,once,{capture:true,passive:true}));}catch{}};
 resume();}
export const sound={play,loopStart,loopStop,playIntro,stopIntro,initIntro,available};

/* first user gesture unlocks audio */
const arm=()=>{gestured=true;removeEventListener('pointerdown',arm,true);removeEventListener('keydown',arm,true);removeEventListener('touchend',arm,true);removeEventListener('click',arm,true);ensure();sync();};
if(typeof window!=='undefined')['pointerdown','keydown','touchend','click'].forEach(e=>addEventListener(e,arm,{capture:true,passive:true}));
document.addEventListener('visibilitychange',sync);
addEventListener('pagehide',stopIntro);

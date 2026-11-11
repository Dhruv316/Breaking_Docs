/* study/analyze.js — rule-based study analyzer. No AI model, no UI, deterministic.
   analyze(sections,{maxCards}) -> {terms,definitions,cards,quiz,cheat}  (async, yields to the event loop) */

const STOP=new Set(`a about above after again against all also am an and any are aren't as at be because been before being below between both but by can can't cannot could couldn't did do does doing don't down during each few for from further had has have having he her here hers him his how i if in into is isn't it its itself just let me more most my no nor not of off on once only or other our ours out over own same she should so some such than that the their theirs them then there these they this those through to too under until up very was we were what when where which while who whom why will with would you your yours however therefore thus may might must shall one two three often usually many much several another every either neither whether since although though yet via per etc eg ie new use used using make made like get gets got`.split(/\s+/));
const BAD_START=new Set('it this that these those they he she we there which who what one some many each such here its their his her our you i'.split(' '));
const LABEL=/^(?:note|example|e\.g|tip|warning|summary|key|remember|figure|fig|table|answer|question|step|source|see|hint|caution|important)\b/i;
const BUL=/^\s*(?:[-*•▪◦‣–—]|\d{1,2}[.)]|[a-z][.)])\s+/;
const ABBR=/\b(?:e\.g|i\.e|etc|vs|cf|Dr|Mr|Mrs|Ms|Prof|Fig|Figs|Eq|Eqs|approx|St|Inc|Ltd|Sr|Jr|Vol|pp|Ch|Sec|a\.m|p\.m|U\.S|U\.K|et al)\./gi;

const now=()=>typeof performance!=='undefined'?performance.now():Date.now();
let last=0;
const tick=async()=>{if(now()-last>12){await new Promise(r=>setTimeout(r,0));last=now();}};
function hash(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;}
function rng(seed){let a=seed>>>0;return()=>{a=(a+0x6D2B79F5)>>>0;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};}
const trunc=(s,n)=>{if(s.length<=n)return s;let c=s.slice(0,n-1);const i=c.lastIndexOf(' ');if(i>n*.6)c=c.slice(0,i);return c.replace(/[\s,;:.-]+$/,'')+'…';};
const cap1=s=>s?s[0].toUpperCase()+s.slice(1):s;

/* ---------- sentences ---------- */
export function splitSentences(text){
  let t=String(text||'').replace(/\s+/g,' ').trim(); if(!t)return[];
  t=t.replace(ABBR,m=>m.replace(/\./g,'\u0001')).replace(/(\d)\.(?=\d)/g,'$1\u0001')
     .replace(/\b(No|Nos)\.(?=\s*\d)/g,'$1\u0001');
  return t.split(/(?<=[.!?]["'”’)\]]?)\s+(?=["'“‘(\[]?[A-Z0-9])/).map(s=>s.replace(/\u0001/g,'.').trim()).filter(Boolean);
}
function termLineParts(body){
  const m=body.match(/^(.{2,48}?)\s*(?::|\s[-–—]+\s)\s*(\S.*)$/); if(!m)return null;
  const l=m[1].trim(),r=m[2].trim();
  if(LABEL.test(l)||/[.!?]/.test(l)||/\b(?:is|are|was|were)\b/i.test(l)||l.split(/\s+/).length>5||!/[A-Za-z]/.test(l)||r.split(/\s+/).length<3)return null;
  return[l,r];
}
function toUnits(text){
  const out=[];
  for(const p of String(text||'').replace(/\r/g,'').split(/\n\s*\n/)){
    let buf=[];
    const flush=()=>{if(buf.length){for(const s of splitSentences(buf.join(' ')))out.push({t:s,line:false,heading:false});buf=[];}};
    for(const raw of p.split('\n')){
      let line=raw.trim().replace(/\*\*|__|`/g,''); if(!line)continue;
      const md=/^#{1,6}\s+/.test(line); line=line.replace(/^#{1,6}\s+/,'');
      const bullet=BUL.test(line), body=line.replace(BUL,'').trim(); if(!body)continue;
      const heading=md||(!bullet&&body.split(/\s+/).length<=8&&!/[.!?:,;]$/.test(body)&&!termLineParts(body));
      if(bullet||heading||termLineParts(body)){flush();out.push({t:body,line:true,heading});}
      else buf.push(body);
    }
    flush();
  }
  return out;
}

/* ---------- tokens & keys ---------- */
function stem(w){
  w=w.toLowerCase().replace(/['’]s$/,'');
  if(w.length>4&&w.endsWith('ies'))return w.slice(0,-3)+'y';
  if(w.length>4&&/(?:ss|sh|ch|x|z)es$/.test(w))return w.slice(0,-2);
  if(w.length>3&&w.endsWith('s')&&!/(?:ss|us|is|as|ics)$/.test(w))return w.slice(0,-1);
  return w;
}
function tokenize(s){
  const out=[],re=/[A-Za-z][A-Za-z0-9'’-]*/g;let m;
  while((m=re.exec(s))){const w=m[0].replace(/['’-]+$/,'');if(!w)continue;const lo=w.toLowerCase();
    out.push({w,s:m.index,e:m.index+w.length,lo,st:stem(w),stop:STOP.has(lo)||STOP.has(lo.replace(/['’]s$/,''))||w.length<2});}
  return out;
}
const ok1=t=>!t.stop&&(t.w.length>=3||/^[A-Z]{2,}$/.test(t.w));
function keysOf(toks,src){
  const k=[];
  for(let i=0;i<toks.length;i++){
    if(!ok1(toks[i]))continue;
    k.push({key:toks[i].st,i,j:i,n:1});
    const b=toks[i+1];
    if(b&&ok1(b)&&src.slice(toks[i].e,b.s)===' ')k.push({key:toks[i].st+' '+b.st,i,j:i+1,n:2});
  }
  return k;
}
const keyOfPhrase=s=>tokenize(s).map(t=>t.st).join(' ');
const nsKey=s=>tokenize(s).filter(t=>!t.stop).map(t=>t.st).join(' ');
const esc=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');

/* ---------- definitions ---------- */
function okTerm(raw){
  let t=raw.replace(/\([^)]*\)/g,' ').replace(/\s+/g,' ').trim()
    .replace(/^["'“‘]+|["'”’:;,.]+$/g,'')
    .replace(/^(?:the\s+(?:term|word|phrase|concept)\s+|(?:the|a|an)\s+)/i,'').replace(/^["'“‘]+|["'”’]+$/g,'').trim();
  if(!t||/[,;:!?]/.test(t)||t.length<2||t.length>48||!/[A-Za-z]/.test(t))return null;
  const w=t.split(' ');
  if(w.length>5||BAD_START.has(w[0].toLowerCase()))return null;
  if(w.every(x=>STOP.has(x.toLowerCase()))||STOP.has(w[w.length-1].toLowerCase()))return null;
  if(/\b(?:is|are|was|were|has|have|can|will|does|do|may|must|should|would|could)\b/i.test(t))return null;
  return t;
}
const cleanDef=d=>cap1(d.replace(/\s+/g,' ').trim().replace(/[.;:,\s]+$/,''));
function matchDef(t,line){
  const c=[];let m;
  if(line){const p=termLineParts(t);if(p)c.push([p[0],p[1],/:/.test(t.slice(p[0].length,p[0].length+2))?.8:.75]);}
  if(m=t.match(/^(.{2,80}?)\s+(?:is|are)\s+defined\s+as\s+(.+)$/i))c.push([m[1],m[2],.95]);
  if(m=t.match(/^(.{2,80}?)\s+(?:refers?|referred)\s+to\s+(.+)$/i))c.push([m[1],m[2],.9]);
  if(m=t.match(/^(.{2,80}?)\s+means?\s+(.+)$/i))c.push([m[1],m[2],.85]);
  if(m=t.match(/^(.{2,80}?)\s+(?:is|are)\s+(?:also\s+)?(?:called|known\s+as|termed|named)\s+(.{2,60})$/i)){
    const a=okTerm(m[1]),b=okTerm(m[2]);
    if(a&&(!b||a.split(' ').length<=b.split(' ').length))c.push([m[1],m[2],.65]);else if(b)c.push([m[2],m[1],.65]);
  }
  if(m=t.match(/^(.{6,140}?),\s+(?:also\s+)?(?:called|termed|known\s+as|named)\s+(?:the\s+)?([^,;.]{2,50})(?:[,;.]|$)/i))c.push([m[2],m[1],.6]);
  if(m=t.match(/^(.{2,80}?)\s+(?:is|are|was|were)\s+((?:a|an|the)\s+.+)$/i))c.push([m[1],m[2],.7]);
  for(const[a,b,base]of c){const term=okTerm(a);if(term){const def=cleanDef(b);if(def)return{term,def,base};}}
  return null;
}
function confidence(d,headKeys){
  let c=d.base;const dw=d.def.split(' ').length,tw=d.term.split(' ').length;
  if(dw<4)c-=.25;else if(dw>=8)c+=.05; if(dw>45)c-=.15;
  if(tw>3&&d.term===d.term.toLowerCase())c-=.2; if(/^[A-Z]/.test(d.term))c+=.05;
  if(/^(?:it|this|that|these|those|they|which|who)\b/i.test(d.def))c-=.15;
  if(headKeys.has(keyOfPhrase(d.term))||headKeys.has(nsKey(d.term)))c+=.1;
  return Math.min(.99,c);
}

/* ---------- main ---------- */
export async function analyze(sections,{maxCards=30}={}){
  const empty={terms:[],definitions:[],cards:[],quiz:[],cheat:[]};
  if(!Array.isArray(sections)||!sections.length)return empty;
  last=now();
  const secs=sections.map((s,i)=>({title:String(s?.title??''),text:String(s?.text??''),source:String(s?.source??s?.title??'')}));
  const cap=Math.max(10,Math.min(100,Math.round(Number(maxCards))||30));
  const rand=rng(hash(secs.map(s=>s.title+'\n'+s.text).join('\u0002')+'|'+cap));
  const N=secs.length;

  /* pass 1: sentences, tokens, keyword stats */
  const K=new Map(),S=[],headKeys=new Set();
  const rec=(key,n,si,capFlag,surfO,surfL,acr)=>{
    let o=K.get(key);if(!o){o={key,n,tf:0,sec:new Map(),midCap:0,midLow:0,capSurf:'',surf:new Map(),head:false,def:0,upper:false};K.set(key,o);}
    o.tf++;o.sec.set(si,(o.sec.get(si)||0)+1);
    if(capFlag===1){o.midCap++;if(!o.capSurf)o.capSurf=surfO;}else if(capFlag===0)o.midLow++;
    if(acr)o.upper=true;o.surf.set(surfL,(o.surf.get(surfL)||0)+1);
  };
  for(let si=0;si<N;si++){
    const units=toUnits(secs[si].text);
    if(secs[si].title)units.unshift({t:secs[si].title,line:true,heading:true,isTitle:true});
    for(const u of units){
      await tick();
      const toks=tokenize(u.t),keys=keysOf(toks,u.t);
      const rec1={sec:si,t:u.t,line:u.line,heading:u.heading,toks,keys,words:toks.length,idx:S.length,score:0,def:null};
      if(u.isTitle)rec1.skip=true;
      S.push(rec1);
      const lowW=(t)=>(!u.heading&&/^[A-Z]{2,6}$/.test(t.w))?t.w:t.lo;
      for(const k of keys){
        const a=toks[k.i],b=toks[k.j];
        const so=k.n===1?a.w:a.w+' '+b.w, sl=k.n===1?lowW(a):lowW(a)+' '+lowW(b);
        const isCap=x=>/^[A-Z]/.test(x.w), acr=(k.n===1?/^[A-Z]{2,6}$/.test(a.w):false)&&!u.heading;
        let cf=-1;if(!u.heading&&k.i>0)cf=(k.n===1?isCap(a):isCap(a)&&isCap(b))?1:0;
        rec(k.key,k.n,si,cf,so,sl,acr);
        if(u.heading)headKeys.add(k.key);
      }
    }
  }
  for(const k of headKeys){const o=K.get(k);if(o)o.head=true;}

  /* pass 2: definitions */
  const found=new Map();
  for(const s of S){
    await tick();
    if(s.skip||/\?\s*$/.test(s.t))continue;
    const d=matchDef(s.t,s.line);if(!d)continue;
    const conf=confidence(d,headKeys);if(conf<.55)continue;
    const key=keyOfPhrase(d.term)||d.term.toLowerCase(),prev=found.get(key);
    if(!prev||conf>prev.conf||(conf===prev.conf&&d.def.length>prev.def.length))found.set(key,{term:d.term,def:d.def,conf,sec:s.sec,sidx:s.idx,key,nk:nsKey(d.term),text:s.t});
  }
  const defs=[...found.values()].sort((a,b)=>a.sidx-b.sidx);
  const defByKey=new Map();
  for(const d of defs){S[d.sidx].def=d;defByKey.set(d.key,d);if(d.nk)defByKey.set(d.nk,d);
    const tk=tokenize(d.term),ns=tk.filter(t=>!t.stop).length;
    for(const k of keysOf(tk,d.term)){const o=K.get(k.key);if(o)o.def=Math.max(o.def,k.n===ns||ns>2&&k.n===2&&false?2:1.4);}
    const whole=K.get(d.nk);if(whole)whole.def=2;
  }

  /* term scoring */
  for(const o of K.values()){
    const df=o.sec.size;o.idf=Math.log((N+1)/(df+.5))+1;
    let b=1;if(o.midCap>o.midLow&&o.midCap>0)b*=1.5;if(o.head)b*=1.8;if(o.def)b*=o.def;if(o.n===2)b*=1.25;if(o.upper)b*=1.2;
    o.boost=b;o.score=(1+Math.log(o.tf))*o.idf*b;
    o.valid=o.n===1||o.tf>=2||o.head||o.def>0||o.midCap>0;
  }
  const bestBi=new Map();
  for(const o of K.values())if(o.n===2&&o.valid)for(const w of o.key.split(' '))bestBi.set(w,Math.max(bestBi.get(w)||0,o.tf));
  for(const o of K.values())o.sub=o.n===1&&(bestBi.get(o.key)||0)>=o.tf*.7&&o.tf>=2&&!o.def&&!o.head;
  const display=o=>o.midCap>o.midLow&&o.capSurf?o.capSurf:[...o.surf.entries()].sort((a,b)=>b[1]-a[1]||(a[0]<b[0]?-1:1))[0][0];
  const ranked=[...K.values()].filter(o=>o.valid&&!o.sub).sort((a,b)=>b.score-a.score||(a.key<b.key?-1:1));
  const rank=new Map();ranked.forEach((o,i)=>rank.set(o.key,i));
  const maxScore=ranked.length?ranked[0].score:1;
  const terms=ranked.slice(0,100).map(o=>({term:display(o),score:Math.round(o.score*1000)/1000}));

  /* sentence scoring */
  for(const s of S){
    await tick();
    if(s.skip)continue;
    const ks=s.keys.map(k=>K.get(k.key)).filter(o=>o&&o.valid&&!o.sub).map(o=>o.score/maxScore).sort((a,b)=>b-a).slice(0,3);
    let sc=ks.reduce((a,b)=>a+b,0)/3;
    if(s.def)sc+=.25; if(s.words>=10&&s.words<=28)sc+=.1;
    if(/^(?:this|these|those|it|they|such|however|but|and|also|in addition)\b/i.test(s.t))sc*=.7;
    s.score=sc;
  }
  const firstOfSec=new Set();for(const s of S)if(!s.skip&&!s.heading&&!firstOfSec.has(s.sec)){firstOfSec.add(s.sec);s.score+=.15;}
  const srcOf=i=>secs[i].source;

  /* definitions output */
  const definitions=defs.map(d=>({term:d.term,definition:d.def,source:srcOf(d.sec),confidence:Math.round(d.conf*100)/100}));

  /* cloze candidates */
  const secCloze=secs.map(()=>[]),blankUse=new Map();
  const cands=[];
  for(const s of S){
    await tick();
    if(s.skip||s.heading||s.words<7||s.words>40||(!s.line&&!/[.!?]["'”’)]?$/.test(s.t)))continue;
    let best=null;
    for(const k of s.keys){const o=K.get(k.key);if(!o||!o.valid||o.sub||!rank.has(k.key)||rank.get(k.key)>=200)continue;
      if(s.def&&(k.key===s.def.key||k.key===s.def.nk))continue;
      if(k.n===1&&s.keys.some(k2=>k2.n===2&&(s.toks[k2.i].st===k.key||s.toks[k2.j].st===k.key)&&K.get(k2.key).valid))continue;
      if(!best||o.score>best.o.score)best={k,o};}
    if(!best)continue;
    cands.push({s,k:best.k,o:best.o});
  }
  cands.sort((a,b)=>b.s.score-a.s.score||a.s.idx-b.s.idx);
  for(const c of cands){
    const n=blankUse.get(c.o.key)||0;if(n>=2)continue;
    const spans=[];const tk=c.s.toks;
    for(let i=0;i<tk.length;i++){
      if(c.o.n===1&&tk[i].st===c.o.key&&ok1(tk[i]))spans.push([tk[i].s,tk[i].e]);
      else if(c.o.n===2&&tk[i+1]&&tk[i].st+' '+tk[i+1].st===c.o.key&&c.s.t.slice(tk[i].e,tk[i+1].s)===' ')spans.push([tk[i].s,tk[i+1].e]);
    }
    if(!spans.length)continue;
    let f=c.s.t;for(let i=spans.length-1;i>=0;i--)f=f.slice(0,spans[i][0])+'_____'+f.slice(spans[i][1]);
    blankUse.set(c.o.key,n+1);
    secCloze[c.s.sec].push({front:f,back:display(c.o),sec:c.s.sec,type:'cloze',text:c.s.t,key:c.o.key,sc:c.s.score});
  }

  /* cards: interleave def/cloze per section, round-robin across sections */
  const secLists=secs.map((_,si)=>{
    const d=defs.filter(x=>x.sec===si).sort((a,b)=>b.conf-a.conf||a.sidx-b.sidx).map(x=>({front:x.term,back:trunc(x.def,300),sec:si,type:'def',text:x.text,key:x.key,def:x.def}));
    const c=secCloze[si],out=[];
    for(let i=0;i<Math.max(d.length,c.length);i++){if(d[i])out.push(d[i]);if(c[i])out.push(c[i]);}
    return out;
  });
  const picked=[];
  for(let r=0;picked.length<cap;r++){let any=false;
    for(let si=0;si<N&&picked.length<cap;si++)if(secLists[si][r]){picked.push(secLists[si][r]);any=true;}
    if(!any)break;}
  const usedIds=new Set(),cards=[],internal=new Map();
  for(const p of picked){
    let id='c-'+hash(p.type+'|'+p.front).toString(36);if(usedIds.has(id)){let n=2;while(usedIds.has(id+'-'+n))n++;id+='-'+n;}
    usedIds.add(id);cards.push({id,front:p.front,back:p.back,source:srcOf(p.sec),type:p.type});internal.set(id,p);
  }

  /* quiz */
  const pat=t=>/^[A-Z0-9]{2,}\b/.test(t)?'U':/^[A-Z]/.test(t)?'T':'l';
  const pool=[],seen=new Set();
  const addPool=(text,key,tf)=>{const l=text.toLowerCase();if(seen.has(l))return;seen.add(l);
    pool.push({text,l,key,pat:pat(text),nw:text.split(' ').length,len:text.length,f:Math.log(1+tf)});};
  for(const o of ranked.slice(0,150))addPool(display(o),o.key,o.tf);
  for(const d of defs)addPool(d.term,d.key,K.get(d.nk)?.tf||1);
  const quiz=[];
  for(const c of cards){
    await tick();
    const p=internal.get(c.id),at=c.type==='def'?c.front:c.back,ans=pool.find(x=>x.l===at.toLowerCase())||{text:at,l:at.toLowerCase(),key:p.key,pat:pat(at),nw:at.split(' ').length,len:at.length,f:1};
    const body=c.type==='def'?p.def:c.front;
    const qStems=' '+tokenize(body).map(t=>t.st).join(' ')+' ';
    let qBody=body;
    if(c.type==='def'){ // mask the answer if the definition leaks it
      const re=new RegExp('\\b'+esc(at)+'(?:s|es)?\\b','gi');qBody=body.replace(re,'_____');
    }
    const cand=[];
    for(const x of pool){
      if(x.key===ans.key||x.l.includes(ans.l)||ans.l.includes(x.l))continue;
      if(qStems.includes(' '+x.key+' '))continue;
      const dist=(x.pat!==ans.pat?2:0)+Math.abs(x.nw-ans.nw)+Math.abs(x.len-ans.len)/8+Math.abs(x.f-ans.f)*.5+rand()*.3;
      cand.push([dist,x]);
    }
    cand.sort((a,b)=>a[0]-b[0]);
    const dis=[];const used=new Set([ans.l]);
    for(const[,x]of cand){if(dis.length>=3)break;
      if(used.has(x.l)||[...used].some(u=>u.includes(x.l)||x.l.includes(u)))continue;
      used.add(x.l);dis.push(x.text);}
    if(dis.length<3)continue;
    const opts=[at,...dis];
    for(let i=3;i>0;i--){const j=Math.floor(rand()*(i+1));[opts[i],opts[j]]=[opts[j],opts[i]];}
    quiz.push({id:'q-'+c.id.slice(2),
      question:c.type==='def'?'Which term matches this definition? '+qBody:'Fill in the blank: '+c.front,
      options:opts,correct:opts.indexOf(at),explanation:p.text,source:c.source,type:c.type});
  }

  /* cheat sheet */
  const cheat=[];
  for(let si=0;si<N;si++){
    await tick();
    const ss=S.filter(s=>s.sec===si&&!s.skip);
    const local=new Map();
    for(const s of ss)for(const k of s.keys){const o=K.get(k.key);if(o&&o.valid&&!o.sub&&!local.has(k.key))local.set(k.key,{o,sc:(1+Math.log(o.sec.get(si)||1))*o.idf*o.boost});}
    const top=[...local.values()].sort((a,b)=>b.sc-a.sc||(a.o.key<b.o.key?-1:1)).slice(0,8);
    const tl=[];
    for(const{o}of top){
      let def=defByKey.get(o.key)?.def;
      if(!def){const f=ss.filter(s=>!s.heading&&s.words>=5&&s.keys.some(k=>k.key===o.key)).sort((a,b)=>b.score-a.score)[0];def=f?.t;}
      if(def)tl.push({term:display(o),def:trunc(def,160)});
    }
    const cs=ss.filter(s=>!s.heading&&s.words>=6&&!/\?\s*$/.test(s.t));
    const pool2=cs.length?cs:ss.filter(s=>!s.heading&&s.words>=5);
    const nSent=pool2.length>=8?3:2;
    const sent=pool2.slice().sort((a,b)=>b.score-a.score||a.idx-b.idx).slice(0,nSent).sort((a,b)=>a.idx-b.idx).map(s=>trunc(s.t,240));
    cheat.push({title:secs[si].title,source:srcOf(si),terms:tl,sentences:sent});
  }
  return{terms,definitions,cards,quiz,cheat};
}
export default analyze;

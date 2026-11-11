/* office-decor.js — themed CSS/SVG stand-in for bg-office-albuquerque.jpg: a tacky lawyer's office, now lit.
   Layers (back to front, all viewBox 1600x900 so they align; parallax by scenes.js):
   wall + frames + neon  ->  column + flags  ->  window-blind light stripes  ->  desk + banker's lamp  ->  warm lamp glow.
   No text, no asset paths. Mounted by assets.js scene('office') only while bg-office-albuquerque.jpg is absent. */

const rays=(cx,cy,r0,r1)=>[0,90,180,270].flatMap(a=>[-14,-5,5,14].map(o=>{
 const t=(a+o)*Math.PI/180,x0=cx+Math.cos(t)*r0,y0=cy+Math.sin(t)*r0,x1=cx+Math.cos(t)*r1,y1=cy+Math.sin(t)*r1;
 return `<line x1="${x0.toFixed(1)}" y1="${y0.toFixed(1)}" x2="${x1.toFixed(1)}" y2="${y1.toFixed(1)}"/>`;})).join('');

/** Fluted marble column with capital, base and plinth, shaded from the lamp side (right). */
const column=(x,w)=>`<g transform="translate(${x} 0)">
  <rect x="-6" y="0" width="${w+12}" height="46" fill="url(#od-marble)" stroke="#2a2218" stroke-width="3"/>
  <rect x="-14" y="40" width="${w+28}" height="22" fill="url(#od-gold)"/>
  <rect x="0" y="62" width="${w}" height="650" fill="url(#od-marble)"/>
  ${[.12,.26,.4,.54,.68,.82].map(f=>`<rect x="${(w*f).toFixed(1)}" y="62" width="4" height="650" fill="#0004"/><rect x="${(w*f+4).toFixed(1)}" y="62" width="2" height="650" fill="#fff3"/>`).join('')}
  <rect x="0" y="62" width="${w}" height="650" fill="url(#od-colshade)"/>
  <rect x="-14" y="712" width="${w+28}" height="22" fill="url(#od-gold)"/>
  <rect x="-24" y="734" width="${w+48}" height="166" fill="url(#od-marble)" stroke="#2a2218" stroke-width="3"/>
  <rect x="-24" y="734" width="${w+48}" height="12" fill="#fff4"/></g>`;

const diploma=(x,y,w,h)=>`<g transform="translate(${x} ${y})">
  <rect width="${w}" height="${h}" fill="url(#od-gold)" stroke="#1b1208" stroke-width="3"/>
  <rect x="9" y="9" width="${w-18}" height="${h-18}" fill="#f1e6c8"/>
  <path d="M22 ${h*.3}h${w-44}M22 ${h*.42}h${w-44}M30 ${h*.54}h${w-60}" stroke="#7a6a48" stroke-width="3" stroke-linecap="round"/>
  <circle cx="${w*.5}" cy="${h*.78}" r="${h*.1}" fill="#a63220"/></g>`;

const flag=(x,children)=>`<g transform="translate(${x} 0)">
  <rect x="-5" y="170" width="10" height="730" fill="url(#od-gold)"/>
  <circle cx="0" cy="164" r="14" fill="url(#od-gold)"/><path d="M0 150l-9 14h18z" fill="#f5c400"/>
  ${children}
  <rect x="-34" y="860" width="68" height="40" rx="6" fill="url(#od-gold)"/></g>`;

const usFlag=()=>`<path d="M5 190q70-34 140 0t140 0v190q-70 34-140 0t-140 0z" fill="#fff"/>
  ${[0,1,2,3,4,5,6].map(i=>`<path d="M5 ${190+i*27}q70-34 140 0t140 0v14q-70 34-140 0t-140 0z" fill="${i%2?'#fff':'#b22234'}"/>`).join('')}
  <path d="M5 190q35-17 70 0v110q-35 17-70 0z" fill="#3c3b6e"/>
  ${Array.from({length:12},(_,i)=>`<circle cx="${16+(i%4)*15}" cy="${208+Math.floor(i/4)*26}" r="3" fill="#fff"/>`).join('')}
  <path d="M5 190q70-34 140 0t140 0v190q-70 34-140 0t-140 0z" fill="url(#od-fold)"/>`;

const svg=(inner,extra='')=>`<svg class="od" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" focusable="false" aria-hidden="true"${extra}>${inner}</svg>`;
const L=(cls,kx,ky,inner)=>`<div class="sc-l ${cls}" data-kx="${kx}" data-ky="${ky}">${inner}</div>`;

/** @returns {string} layered scene markup (decorative; aria-hidden is set by the mount point) */
export function officeDecor(){
 const defs=`<svg width="0" height="0" style="position:absolute" focusable="false" aria-hidden="true"><defs>
  <linearGradient id="od-wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4a1018"/><stop offset=".6" stop-color="#2c0a10"/><stop offset="1" stop-color="#14070a"/></linearGradient>
  <linearGradient id="od-gold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fbe58a"/><stop offset=".45" stop-color="#d9a21b"/><stop offset="1" stop-color="#7a5408"/></linearGradient>
  <linearGradient id="od-marble" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#a99f92"/><stop offset=".35" stop-color="#ece4d4"/><stop offset=".7" stop-color="#cfc5b4"/><stop offset="1" stop-color="#7d7365"/></linearGradient>
  <linearGradient id="od-colshade" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#2a0a0a" stop-opacity=".55"/><stop offset=".55" stop-color="#2a0a0a" stop-opacity="0"/><stop offset="1" stop-color="#ffb060" stop-opacity=".22"/></linearGradient>
  <linearGradient id="od-sun" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2b4a8c"/><stop offset=".5" stop-color="#e07b2a"/><stop offset="1" stop-color="#a63220"/></linearGradient>
  <linearGradient id="od-wood" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8a4c22"/><stop offset=".5" stop-color="#5a2f14"/><stop offset="1" stop-color="#241006"/></linearGradient>
  <linearGradient id="od-fold" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#000" stop-opacity=".3"/><stop offset=".25" stop-color="#fff" stop-opacity=".12"/><stop offset=".5" stop-color="#000" stop-opacity=".28"/><stop offset=".75" stop-color="#fff" stop-opacity=".1"/><stop offset="1" stop-color="#000" stop-opacity=".32"/></linearGradient>
  <linearGradient id="od-slat" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ffd890" stop-opacity="0"/><stop offset=".3" stop-color="#ffd890" stop-opacity=".3"/><stop offset="1" stop-color="#ffc060" stop-opacity=".12"/></linearGradient>
  <radialGradient id="od-lamp" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ffd07a" stop-opacity=".62"/><stop offset=".35" stop-color="#ff9a3c" stop-opacity=".24"/><stop offset="1" stop-color="#ff9a3c" stop-opacity="0"/></radialGradient>
  <radialGradient id="od-pool" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ffe4a0" stop-opacity=".5"/><stop offset="1" stop-color="#ffb860" stop-opacity="0"/></radialGradient>
  <filter id="od-glow" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="7" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  <pattern id="od-damask" width="60" height="60" patternUnits="userSpaceOnUse"><path d="M30 6c8 10 8 18 0 26-8-8-8-16 0-26zM30 54c8-10 8-18 0-26-8 8-8 16 0 26zM6 30c10-8 18-8 26 0-8 8-16 8-26 0zM54 30c-10 8-18 8-26 0 8-8 16-8 26 0z" fill="#f5c40016"/></pattern>
 </defs></svg>`;

 const wall=svg(`
 <rect width="1600" height="900" fill="url(#od-wall)"/><rect width="1600" height="900" fill="url(#od-damask)"/>
 <rect y="560" width="1600" height="340" fill="#1a0b08"/>
 ${[0,1,2,3,4,5,6,7].map(i=>`<rect x="${i*212-30}" y="580" width="190" height="230" rx="4" fill="none" stroke="#f5c40040" stroke-width="3"/>`).join('')}
 <rect y="556" width="1600" height="10" fill="url(#od-gold)"/>
 <g transform="translate(300 130)"><rect width="380" height="300" fill="#1b1208" stroke="url(#od-gold)" stroke-width="12"/><rect x="12" y="12" width="356" height="276" fill="url(#od-sun)"/>
  <path d="M12 220l60-40 50 22 70-60 60 44 60-30 76 54v66H12z" fill="#3a140c"/><path d="M60 288v-30l8-14 8 14v30M268 288v-24l10-16 10 16v24" fill="#0e1a0c"/>
  ${Array.from({length:14},(_,i)=>`<rect x="12" y="${12+i*20}" width="356" height="11" fill="#e8dcc0" opacity=".82"/>`).join('')}</g>
 ${diploma(760,110,120,160)}${diploma(900,100,150,190)}${diploma(1074,130,110,150)}${diploma(790,320,100,130)}${diploma(914,330,130,110)}
 <g class="od-neon" filter="url(#od-glow)" transform="translate(1230 110)" stroke="#55D0FF" stroke-width="6" fill="none" stroke-linecap="round" stroke-linejoin="round">
  <path d="M110 10v170M60 180h100M20 52h180M20 52l-26 70q26 26 52 0l-26-70M200 52l-26 70q26 26 52 0l-26-70" transform="translate(0 10)"/><circle cx="110" cy="8" r="9"/></g>
 <path d="M0 0h520q-60 90-150 70t-150 36q-80-20-220 70z" fill="#7a0f1e" opacity=".95"/><path d="M0 0h520q-60 90-150 70t-150 36q-80-20-220 70" fill="none" stroke="url(#od-gold)" stroke-width="8"/>
 ${Array.from({length:22},(_,i)=>`<path d="M${i*22+4} ${64+Math.sin(i*.7)*8}v26" stroke="#f5c400" stroke-width="4" stroke-linecap="round" opacity=".9"/>`).join('')}
 <path d="M1600 0h-420q60 90 150 70t150 36q50-12 120 40z" fill="#7a0f1e" opacity=".95"/><path d="M1600 0h-420q60 90 150 70t150 36q50-12 120 40" fill="none" stroke="url(#od-gold)" stroke-width="8"/>`);

 const props=svg(`${column(40,110)}${column(1450,110)}
 ${flag(250,usFlag())}
 ${flag(1360,`<g transform="translate(-300 0)"><rect x="5" y="190" width="290" height="190" fill="#fcd116" stroke="#00000030"/>
   <g transform="translate(150 285)" stroke="#bf0a30" stroke-width="7" stroke-linecap="round"><circle r="20" fill="none"/>${rays(0,0,34,64)}</g>
   <rect x="5" y="190" width="290" height="190" fill="url(#od-fold)"/></g>`)}`);

 /* window blinds: horizontal slats cast tilted stripes of warm light across wall, column, flag and desk */
 const slats=Array.from({length:17},(_,i)=>`<rect x="560" y="${40+i*50}" width="1100" height="24" fill="url(#od-slat)"/>`).join('');
 const blinds=svg(`<g class="od-blinds"><g transform="rotate(-9 1000 450)">${slats}<rect x="1000" y="0" width="14" height="900" fill="#14070a" opacity=".45"/><rect x="1330" y="0" width="14" height="900" fill="#14070a" opacity=".45"/></g></g>`);

 const desk=svg(`
 <rect y="760" width="1600" height="140" fill="url(#od-wood)"/><rect y="752" width="1600" height="14" fill="url(#od-gold)"/>
 <rect y="766" width="1600" height="8" fill="#fff" opacity=".1"/>
 ${[0,1,2,3,4].map(i=>`<rect x="${60+i*330}" y="800" width="290" height="80" rx="4" fill="none" stroke="#f5c40050" stroke-width="3"/>`).join('')}
 <g transform="translate(470 668)"><rect x="-6" y="70" width="110" height="14" rx="3" fill="url(#od-gold)"/><rect x="34" y="30" width="12" height="44" fill="url(#od-gold)"/><path d="M-6 30q50-62 112 0z" fill="#0f6b34" stroke="url(#od-gold)" stroke-width="5"/><path d="M6 24q40-44 80-4" fill="none" stroke="#7fe0a0" stroke-width="4" opacity=".5" stroke-linecap="round"/><circle cx="40" cy="22" r="6" fill="#ffe27a"/></g>
 <g transform="translate(1010 706)" fill="none" stroke="url(#od-gold)" stroke-width="6" stroke-linecap="round"><path d="M60 0v52M20 8h80M20 8l-14 30q14 12 28 0l-14-30M100 8l-14 30q14 12 28 0l-14-30M30 56h60"/></g>
 <g transform="translate(700 726)"><rect width="190" height="14" fill="#efe6d0" stroke="#0004"/><rect y="-12" width="176" height="12" fill="#fff8e6" stroke="#0004"/><rect y="-24" width="182" height="12" fill="#efe6d0" stroke="#0004"/></g>
 <g transform="translate(940 706)"><rect width="46" height="46" rx="4" fill="#2a1a10" stroke="url(#od-gold)" stroke-width="3"/><path d="M8-10l6 18M20-14l-2 22M32-8l-6 16" stroke="#c9b27a" stroke-width="3" stroke-linecap="round"/></g>
 <g transform="translate(590 738)"><rect width="84" height="16" rx="2" fill="url(#od-gold)" stroke="#0005"/></g>`);

 const glow=svg(`<g class="od-flick"><circle cx="520" cy="690" r="560" fill="url(#od-lamp)"/><ellipse cx="560" cy="770" rx="420" ry="46" fill="url(#od-pool)"/></g>`);

 return `${defs}<div class="sc sc--office" data-par="xy">
 ${L('sc-owall',3,.04,wall)}${L('sc-oprops',14,.03,props)}${L('sc-oblind',8,.05,blinds)}${L('sc-odesk',26,0,desk)}${L('sc-oglow',26,0,glow)}</div>`;}

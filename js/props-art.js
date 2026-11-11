/* props-art.js — detailed inline-SVG art for the drawn props (Round 1B-2).
   Each export is (id)=>svg markup, 100x100 viewBox. `id` is a unique prefix so gradients/clips never collide when the same prop
   is on the page several times. Same keys as ASSETS.props; used only while the real PNG is absent.
   Rules: no filters, no SMIL, no text. Only two classes animate (.pa-sp sparkle, .pa-bub bubble) and only with transform/opacity (components.css). */
const st=a=>a.map(([o,c,p])=>`<stop offset="${o}" stop-color="${c}"${p!=null?` stop-opacity="${p}"`:''}/>`).join('');
const lg=(id,[x1,y1,x2,y2],s,u)=>`<linearGradient id="${id}"${u?' gradientUnits="userSpaceOnUse"':''} x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">${st(s)}</linearGradient>`;
const rg=(id,[cx,cy,r],s,u)=>`<radialGradient id="${id}"${u?' gradientUnits="userSpaceOnUse"':''} cx="${cx}" cy="${cy}" r="${r}">${st(s)}</radialGradient>`;
const S=b=>`<svg viewBox="0 0 100 100" width="100%" fill="none" focusable="false" aria-hidden="true">${b}</svg>`;
const INK='#0A0C0A';
const shadow=(cx,cy,rx,ry,o=.3)=>`<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="#000" opacity="${o}"/>`;
const star=(x,y,k,i,d)=>`<g transform="translate(${x} ${y}) scale(${k})"><path class="pa-sp" style="--d:${d}s" d="M0-9L2.2-2.2L9 0L2.2 2.2L0 9L-2.2 2.2L-9 0L-2.2-2.2Z" fill="#fff"/></g>`;   // CSS animates the inner path only, so the placement transform is never overridden

/* ---- glasses: thick black rounded frames, tinted lenses with glare ---- */
export const glasses=i=>S(`<defs>${lg(i+'a',[0,0,1,1],[[0,'#eafcff',.92],[.4,'#7fe0ff',.55],[1,'#0b3550',.85]])}${lg(i+'b',[0,0,0,1],[[0,'#59605a'],[.35,INK],[1,'#000']])}</defs>
${shadow(50,80,38,3.5,.3)}
<path d="M9 46L2 37M91 46l7-9" stroke="${INK}" stroke-width="4.6" stroke-linecap="round"/>
<path d="M3.5 38.6L9 46" stroke="#59605a" stroke-width="1.2" stroke-linecap="round"/>
<path d="M44 47Q50 39 56 47" stroke="${INK}" stroke-width="4.6" stroke-linecap="round"/><path d="M45.5 44.6Q50 40.6 54.5 44.6" stroke="#6b726b" stroke-width="1.1" stroke-linecap="round"/>
<rect x="8" y="34" width="37" height="32" rx="13" fill="url(#${i}a)" stroke="url(#${i}b)" stroke-width="5"/>
<rect x="55" y="34" width="37" height="32" rx="13" fill="url(#${i}a)" stroke="url(#${i}b)" stroke-width="5"/>
<rect x="10.6" y="36.6" width="31.8" height="26.8" rx="10.8" stroke="#06202e" stroke-opacity=".55" stroke-width="1.4"/>
<rect x="57.6" y="36.6" width="31.8" height="26.8" rx="10.8" stroke="#06202e" stroke-opacity=".55" stroke-width="1.4"/>
<path d="M15 56L26 38h5L20 56zM34 58l6.5-11h2.6L36.6 58zM62 56L73 38h5L67 56zM81 58l6.5-11h2.6L83.6 58z" fill="#fff" opacity=".6"/>
<path d="M13 42Q18 36.6 30 36.4M60 42Q65 36.6 77 36.4" stroke="#8d958d" stroke-width="1.3" stroke-linecap="round"/>
<path d="M13 61Q26 66 41 61M60 61Q73 66 88 61" stroke="#fff" stroke-opacity=".28" stroke-width="1.2" stroke-linecap="round"/>
<circle cx="9" cy="44" r="1.6" fill="#8d958d"/><circle cx="91" cy="44" r="1.6" fill="#8d958d"/>`);

/* ---- hazmat suit: yellow coverall, hood, visor + respirator, gloves, boots ---- */
export const hazmatSuit=i=>S(`<defs>${lg(i+'y',[0,0,1,0],[[0,'#fff08a'],[.4,'#F5C400'],[1,'#a67c00']])}${lg(i+'v',[0,0,1,1],[[0,'#4c7388'],[.45,INK],[1,'#000']])}${lg(i+'k',[0,0,1,1],[[0,'#4b514b'],[1,'#0b0d0b']])}</defs>
${shadow(50,96,30,2.6,.3)}
<g stroke="${INK}" stroke-width="2.3" stroke-linejoin="round">
<path d="M33 66H49L48 90H34zM51 66H67L66 90H52z" fill="url(#${i}y)"/>
<path d="M32 88H49V93Q49 97 45 97H35Q30 97 30 93zM51 88H68L70 93Q70 97 65 97H55Q51 97 51 93z" fill="url(#${i}k)"/>
<path d="M35 33Q50 28 65 33L68 68H32z" fill="url(#${i}y)"/>
<path d="M36 35L25 41Q21 43 20 48L18 64L27 66L31 50L37 44z" fill="url(#${i}y)"/>
<path d="M64 35L75 41Q79 43 80 48L82 64L73 66L69 50L63 44z" fill="url(#${i}y)"/>
<path d="M17 63H28L29 70Q28 76 23 76Q17 76 16 70zM72 63H83L84 70Q83 76 77 76Q72 76 71 70z" fill="url(#${i}k)"/>
<path d="M40 28Q50 35 60 28V34Q50 39 40 34z" fill="#c99a00"/>
<ellipse cx="50" cy="17.5" rx="14" ry="14.5" fill="url(#${i}y)"/>
</g>
<path d="M50 38V67" stroke="${INK}" stroke-width="1.4"/><path d="M50 40V66" stroke="#fff3a0" stroke-width=".8" stroke-dasharray="1.4 2.2" transform="translate(1.3 0)"/>
<rect x="33" y="55" width="34" height="4.4" fill="#b88a00" stroke="${INK}" stroke-width="1.4"/><rect x="47" y="54.4" width="6" height="5.6" rx="1" fill="#e8e0b0" stroke="${INK}" stroke-width="1.2"/>
<g stroke="${INK}" stroke-width="1.5"><rect x="54" y="40" width="9" height="9" rx="1" fill="#F5C400"/><path d="M54 49L63 40M54 45L59 40M58 49L63 44" stroke-width="1.7"/></g>
<path d="M36 70L47 69M53 70L64 69M35.4 78L47 77.4M53 77.4L64.6 78" stroke="${INK}" stroke-opacity=".38" stroke-width="1.2"/>
<path d="M23 44Q22 52 21.4 60M77 44Q78 52 78.6 60" stroke="${INK}" stroke-opacity=".35" stroke-width="1.2"/>
<path d="M37 37Q36 50 36 65M40 20Q38 26 41 31" stroke="#fffbd0" stroke-opacity=".6" stroke-width="1.8" stroke-linecap="round"/>
<rect x="38.5" y="9.5" width="23" height="14" rx="6.5" fill="url(#${i}v)" stroke="${INK}" stroke-width="2"/>
<path d="M42 13.4Q46 11 52 11.2M44 20L48.4 13M50 21L53 16.4" stroke="#bff0ff" stroke-width="1.5" stroke-linecap="round" opacity=".8"/>
<path d="M43.4 23.4Q50 33 56.6 23.4Q58 31 50 34.4Q42 31 43.4 23.4z" fill="url(#${i}k)" stroke="${INK}" stroke-width="1.8" stroke-linejoin="round"/>
<circle cx="50" cy="28.8" r="3.2" fill="#262a26" stroke="#F5C400" stroke-width="1.2"/><circle cx="50" cy="28.8" r="1" fill="#F5C400"/>`);

/* ---- gas mask: rubber face piece, metal-ringed lenses, filter canister, straps ---- */
export const gasMask=i=>S(`<defs>${rg(i+'r',[.38,.28,.85],[[0,'#6a726a'],[.5,'#262b2c'],[1,'#0c0e0f']])}${rg(i+'l',[.3,.28,.9],[[0,'#e8fcff'],[.3,'#7fe0ff'],[.7,'#1f7fb0'],[1,'#06202e']])}${lg(i+'m',[0,0,1,1],[[0,'#ffe566'],[.5,'#F5C400'],[1,'#8f6a00']])}${rg(i+'c',[.4,.35,.8],[[0,'#59605a'],[1,'#101311']])}</defs>
${shadow(50,96,28,2.4,.28)}
<g stroke-linecap="round" fill="none"><path d="M23 32Q7 34 3 56M77 32Q93 34 97 56" stroke="${INK}" stroke-width="10"/><path d="M23 31Q8 33 4.4 52M77 31Q92 33 95.6 52" stroke="#4a514b" stroke-width="2.4"/></g>
<path d="M20 20Q50 7 80 20V52Q80 77 50 93Q20 77 20 52z" fill="url(#${i}r)" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
<path d="M24 24Q50 13 76 24" stroke="#9aa39a" stroke-opacity=".55" stroke-width="1.8" stroke-linecap="round"/>
<path d="M23 35Q50 26 77 35" stroke="${INK}" stroke-opacity=".55" stroke-width="2"/>
<rect x="45.4" y="39" width="9.2" height="14" rx="3" fill="#15181a" stroke="${INK}" stroke-width="1.6"/>
<g stroke="${INK}" stroke-width="2.4"><circle cx="35.5" cy="46" r="13" fill="url(#${i}m)"/><circle cx="64.5" cy="46" r="13" fill="url(#${i}m)"/></g>
<circle cx="35.5" cy="46" r="9.6" fill="url(#${i}l)" stroke="${INK}" stroke-width="1.6"/><circle cx="64.5" cy="46" r="9.6" fill="url(#${i}l)" stroke="${INK}" stroke-width="1.6"/>
<path d="M30 42Q33 38 38 38.6M59 42Q62 38 67 38.6" stroke="#fff" stroke-width="2.2" stroke-linecap="round" opacity=".85"/><circle cx="40.6" cy="51.6" r="1.4" fill="#fff" opacity=".6"/><circle cx="69.6" cy="51.6" r="1.4" fill="#fff" opacity=".6"/>
<path d="M26.4 40Q27.6 36.6 31 34.6M55.4 40Q56.6 36.6 60 34.6" stroke="#fff6b0" stroke-width="1.2" stroke-linecap="round" opacity=".8"/>
<circle cx="50" cy="74" r="12" fill="url(#${i}c)" stroke="${INK}" stroke-width="2.4"/>
<circle cx="50" cy="74" r="12" stroke="#F5C400" stroke-width="1.6" stroke-dasharray="3 2.4" transform="rotate(14 50 74)"/>
<circle cx="50" cy="74" r="8.2" stroke="${INK}" stroke-width="1.6"/><circle cx="50" cy="74" r="4.6" fill="#0b0d0b" stroke="#6b726b" stroke-width="1.2"/>
<path d="M50 65.8V82.2M41.8 74H58.2" stroke="${INK}" stroke-width="1.4"/><path d="M44 68.4Q47 66.6 51 66.4" stroke="#b9c2b9" stroke-width="1.4" stroke-linecap="round" opacity=".7"/>`);

/* ---- barrel: green drum, chime hoops, bungs, hazard label, scuffs ---- */
export const barrel=i=>S(`<defs>${lg(i+'b',[18,0,82,0],[[0,'#06240f'],[.18,'#1E7A3C'],[.38,'#52c473'],[.62,'#1E7A3C'],[1,'#06240f']],1)}${lg(i+'h',[18,0,82,0],[[0,'#04180a'],[.35,'#0F4A22'],[.45,'#2c8a4c'],[.7,'#0F4A22'],[1,'#04180a']],1)}${rg(i+'t',[.38,.4,.75],[[0,'#3bb360'],[.7,'#1E7A3C'],[1,'#0F4A22']])}${lg(i+'y',[0,0,1,1],[[0,'#ffe566'],[1,'#d9a800']])}</defs>
${shadow(50,95,34,3,.34)}
<path d="M18 16V84Q50 101 82 84V16z" fill="url(#${i}b)" stroke="#04180a" stroke-width="2.6" stroke-linejoin="round"/>
<g stroke="#04180a" stroke-width="1.6"><path d="M18 30Q50 40 82 30V38Q50 48 18 38z" fill="url(#${i}h)"/><path d="M18 66Q50 76 82 66V74Q50 84 18 74z" fill="url(#${i}h)"/></g>
<path d="M19 30.8Q50 40.8 81 30.8M19 66.8Q50 76.8 81 66.8" stroke="#8be8a8" stroke-opacity=".55" stroke-width="1.1"/>
<path d="M18 52Q50 62 82 52" stroke="#04180a" stroke-opacity=".45" stroke-width="1.2"/>
<rect x="35" y="47" width="30" height="21" rx="2.4" fill="url(#${i}y)" stroke="${INK}" stroke-width="1.8"/>
<path d="M50 50.4L59.2 65.4H40.8z" stroke="${INK}" stroke-width="2" stroke-linejoin="round" fill="#F5C400"/><path d="M50 55.6V60.4" stroke="${INK}" stroke-width="2" stroke-linecap="round"/><circle cx="50" cy="63" r="1.1" fill="${INK}"/>
<path d="M22 44V58M24 78V86" stroke="#9af0b4" stroke-opacity=".5" stroke-width="2" stroke-linecap="round"/>
<path d="M71 22Q73 32 72 41M74.6 54Q75.4 58 75 62" stroke="#04180a" stroke-opacity=".38" stroke-width="2" stroke-linecap="round"/>
<path d="M30.6 49.6l4 2M28 84l3 1.6" stroke="#04180a" stroke-opacity=".45" stroke-width="1.2"/>
<ellipse cx="50" cy="16" rx="32" ry="8.6" fill="url(#${i}t)" stroke="#04180a" stroke-width="2.6"/>
<ellipse cx="50" cy="16" rx="26" ry="6.2" stroke="#04180a" stroke-opacity=".6" stroke-width="1.4"/>
<path d="M26 13.4Q40 8.8 58 9.6" stroke="#b6f5c8" stroke-opacity=".8" stroke-width="1.5" stroke-linecap="round"/>
<g stroke="#04180a" stroke-width="1.5"><circle cx="38" cy="16.6" r="3.4" fill="#0F4A22"/><circle cx="62" cy="15.4" r="2.6" fill="#0F4A22"/></g>
<circle cx="37.2" cy="15.8" r="1" fill="#8be8a8"/><circle cx="61.4" cy="14.8" r=".8" fill="#8be8a8"/>
<path d="M50 14.4h6" stroke="#04180a" stroke-opacity=".5" stroke-width="1.4" stroke-linecap="round"/>`);

/* ---- blue crystals: faceted shards, light/dark facets, rim lights, animated sparkles ---- */
export const blueCrystals=i=>{const C=(pts,f)=>`<path d="${pts}" fill="${f}"/>`;
 return S(`<defs>${lg(i+'a',[0,0,1,1],[[0,'#f2fdff'],[1,'#a4ecff']])}${lg(i+'b',[0,0,1,1],[[0,'#8fe6ff'],[1,'#35b8ee']])}${lg(i+'c',[0,0,1,1],[[0,'#38b4ec'],[1,'#0b6aa6']])}${lg(i+'d',[0,0,1,1],[[0,'#1f8bcc'],[1,'#07406e']])}${rg(i+'g',[.5,.5,.5],[[0,'#55D0FF',.4],[1,'#55D0FF',0]])}</defs>
<circle cx="50" cy="56" r="46" fill="url(#${i}g)"/>${shadow(50,94,40,3.4,.34)}
<g stroke="#07406e" stroke-width="1.2" stroke-linejoin="round">
${C('M22 38L12 54L24 58z','url(#'+i+'a)')}${C('M22 38L24 58L30 52z','url(#'+i+'b)')}${C('M12 54L24 58V94L14 92z','url(#'+i+'c)')}${C('M24 58L30 52L32 90L24 94z','url(#'+i+'d)')}
${C('M80 44L70 58L82 62z','url(#'+i+'a)')}${C('M80 44L82 62L90 56z','url(#'+i+'b)')}${C('M70 58L82 62V94L72 91z','url(#'+i+'c)')}${C('M82 62L90 56L91 90L82 94z','url(#'+i+'d)')}
${C('M52 6L40 28L50 32z','url(#'+i+'a)')}${C('M52 6L50 32L64 26z','url(#'+i+'a)')}${C('M40 28L50 32V94L42 92z','url(#'+i+'b)')}${C('M50 32L64 26L62 92L50 94z','url(#'+i+'c)')}
${C('M36 74L30 86L40 90z','url(#'+i+'a)')}${C('M36 74L40 90L46 84z','url(#'+i+'b)')}${C('M68 80L63 90L72 93z','url(#'+i+'b)')}
</g>
<g stroke="#fff" stroke-linecap="round" fill="none"><path d="M52 6L40 28M52 6L64 26M22 38L12 54M80 44L70 58" stroke-width="1.5" opacity=".95"/><path d="M44 36V84M16 62V86M74 66V84" stroke-width="1.6" opacity=".4"/></g>
<path d="M50 32L64 26" stroke="#fff" stroke-opacity=".5" stroke-width="1"/>
${star(52,12,1.1,i,0)}${star(20,43,.7,i,.7)}${star(81,49,.75,i,1.3)}${star(63,60,.55,i,1.9)}${star(30,76,.5,i,.35)}`);};

/* ---- flask: Erlenmeyer, glass, blue liquid with meniscus, bubbles ---- */
export const flask=i=>{const body='M40 11V36L16 84Q12 94 24 94H76Q88 94 84 84L60 36V11';
 return S(`<defs>${lg(i+'l',[0,0,0,1],[[0,'#bdf1ff'],[.2,'#55D0FF'],[1,'#0d6a9a']])}${lg(i+'g',[0,0,1,0],[[0,'#fff',.34],[.5,'#fff',.08],[1,'#fff',.2]])}<clipPath id="${i}c"><path d="${body}Z"/></clipPath></defs>
${shadow(50,96,38,3,.3)}
<path d="${body}Z" fill="url(#${i}g)"/>
<g clip-path="url(#${i}c)"><path d="M0 60Q25 54 50 60T100 60V100H0z" fill="url(#${i}l)"/><ellipse cx="50" cy="60" rx="30" ry="2.2" fill="#d4f7ff" opacity=".55"/><path d="M14 90Q50 98 86 90V100H14z" fill="#07406e" opacity=".35"/>
<g stroke="#fff" stroke-opacity=".75" stroke-width="1"><circle cx="38" cy="78" r="3.4" fill="#fff" fill-opacity=".22"/><circle cx="55" cy="84" r="4.4" fill="#fff" fill-opacity=".2"/><circle cx="66" cy="72" r="2.6" fill="#fff" fill-opacity=".25"/><circle cx="47" cy="68" r="2" fill="#fff" fill-opacity=".3"/>
<circle class="pa-bub" style="--d:0s" cx="44" cy="58" r="2.2" fill="#fff" fill-opacity=".35"/><circle class="pa-bub" style="--d:1.1s" cx="56" cy="56" r="1.7" fill="#fff" fill-opacity=".35"/><circle class="pa-bub" style="--d:2.1s" cx="50" cy="57" r="2.6" fill="#fff" fill-opacity=".3"/></g>
<circle cx="37" cy="77" r="1" fill="#fff"/><circle cx="54" cy="82.6" r="1.3" fill="#fff"/></g>
<path d="${body}" stroke="${INK}" stroke-width="5.4" stroke-linejoin="round" stroke-linecap="round" opacity=".85"/>
<path d="${body}" stroke="#e9fbff" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"/>
<rect x="35" y="4.6" width="30" height="7.4" rx="3.6" fill="#dff8ff" stroke="${INK}" stroke-width="2.2"/><path d="M39 7.4H55" stroke="#fff" stroke-width="1.4" stroke-linecap="round"/>
<path d="M45 14V32M30.6 56L21 78" stroke="#fff" stroke-width="2.6" stroke-linecap="round" opacity=".7"/>
<path d="M60 18h-4M60 24h-3M60 30h-4" stroke="#e9fbff" stroke-width="1.4" stroke-linecap="round" opacity=".8"/>
<path d="M78 82Q80 88 74 90" stroke="#fff" stroke-width="1.6" stroke-linecap="round" opacity=".5"/>`);};

/* ---- cash pile: banded bundles in 3/4 view, loose bill ---- */
export const cashPile=i=>{
 const bundle=(x,y,w,h,d,id)=>{const dx=d,dy=-d*.8;
  return `<g stroke="#17331a" stroke-width="1.5" stroke-linejoin="round">
<path d="M${x} ${y}L${x+dx} ${y+dy}H${x+w+dx}L${x+w} ${y}z" fill="#a8d99a"/>
<path d="M${x+w} ${y}L${x+w+dx} ${y+dy}V${y+h+dy}L${x+w} ${y+h}z" fill="url(#${i}s)"/>
<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#${i}f)"/>
<path d="M${x+w*.45} ${y}L${x+w*.45+dx} ${y+dy}H${x+w*.45+w*.18+dx}L${x+w*.45+w*.18} ${y}z" fill="#e8d9a8"/>
<rect x="${x+w*.45}" y="${y}" width="${w*.18}" height="${h}" fill="#e8d9a8"/></g>
<g stroke="#2d6030" stroke-opacity=".55" stroke-width=".9">${[1,2,3].map(k=>`<path d="M${x} ${y+h*k/4}H${x+w*.45}M${x+w*.63} ${y+h*k/4}H${x+w}"/>`).join('')}${[1,2,3].map(k=>`<path d="M${x+w} ${y+h*k/4}l${dx} ${dy}"/>`).join('')}</g>
<rect x="${x+3}" y="${y+3}" width="${w*.45-6}" height="${h-6}" rx="1" stroke="#d8f2c8" stroke-opacity=".7" stroke-width=".9"/><circle cx="${x+w*.225}" cy="${y+h/2}" r="${h*.2}" fill="#d8f2c8" fill-opacity=".8" stroke="#2d6030" stroke-width=".8"/>
<rect x="${x+w*.63+3}" y="${y+3}" width="${w*.37-6}" height="${h-6}" rx="1" stroke="#d8f2c8" stroke-opacity=".6" stroke-width=".9"/><path d="M${x+w*.45} ${y+h}h${w*.18}" stroke="#17331a" stroke-opacity=".5"/>`;};
 return S(`<defs>${lg(i+'f',[0,0,1,1],[[0,'#7dc16f'],[1,'#468a40']])}${lg(i+'s',[0,0,1,1],[[0,'#3d7a38'],[1,'#1f4a22']])}</defs>
${shadow(50,92,44,3.4,.34)}
${bundle(6,64,40,20,10)}${bundle(42,68,40,20,10)}
<g transform="rotate(-9 78 34)"><path d="M62 24h30v18H62z" fill="url(#${i}f)" stroke="#17331a" stroke-width="1.5"/><rect x="65" y="27" width="24" height="12" stroke="#d8f2c8" stroke-opacity=".7" stroke-width=".8"/><circle cx="77" cy="33" r="3.8" fill="#d8f2c8" fill-opacity=".85" stroke="#2d6030" stroke-width=".8"/></g>
${bundle(22,42,40,20,10)}
<path d="M12 70H34M48 74H70" stroke="#fff" stroke-opacity=".28" stroke-width="1.2" stroke-linecap="round"/>`);};

/* ---- cactus: ribbed saguaro, shading, spines, flower ---- */
export const cactus=i=>S(`<defs>${lg(i+'g',[22,0,78,0],[[0,'#7bd05f'],[.3,'#4c9a3a'],[.65,'#2f7430'],[1,'#173f1d']],1)}${rg(i+'f',[.4,.35,.7],[[0,'#fff3a0'],[1,'#e07b2a']])}</defs>
${shadow(50,95,28,3.4,.32)}<path d="M26 94Q50 86 74 94Q50 98 26 94z" fill="#7a5a2e" opacity=".5"/>
<g stroke="#10301a" stroke-width="2.2" stroke-linejoin="round" fill="url(#${i}g)">
<path d="M40 52H36V36a7 7 0 0 0-14 0V56a10 10 0 0 0 10 10H40z"/>
<path d="M60 60H64V42a7 7 0 0 1 14 0V62a10 10 0 0 1-10 10H60z"/>
<path d="M38 22a12 12 0 0 1 24 0V86a12 12 0 0 1-24 0z"/></g>
<g stroke="#10301a" stroke-opacity=".38" stroke-width="1.2" stroke-linecap="round" fill="none"><path d="M44 11Q43 50 44 90M50 9V92M56 11Q57 50 56 90M29 33V58M71 41V64"/></g>
<g stroke="#e8f5c0" stroke-opacity=".75" stroke-width="1" stroke-linecap="round">${[18,30,42,54,66,78].map((y,k)=>`<path d="M${44-1.6} ${y+k%2*3}l-2.2-1.2M${56+1.6} ${y+3-k%2*3}l2.2-1.2M${50} ${y-2}l0-2"/>`).join('')}<path d="M29 40l-2-1M29 50l-2-1M71 48l2-1M71 58l2-1"/></g>
<path d="M41 20Q40.6 46 41 82M25 38V54" stroke="#d6f5a8" stroke-opacity=".4" stroke-width="2.2" stroke-linecap="round"/>
<g transform="translate(50 9)"><g fill="url(#${i}f)" stroke="#9a4a10" stroke-width=".8"><circle cx="-3.6" cy="0" r="3.2"/><circle cx="3.6" cy="0" r="3.2"/><circle cx="0" cy="-3.4" r="3.2"/><circle cx="0" cy="3" r="3"/></g><circle r="2" fill="#F5C400" stroke="#9a4a10" stroke-width=".7"/></g>`);

/* ---- tumbleweed: tangled brittle twigs, three passes (shadow, body, highlight) ---- */
const twigs=(()=>{let s=7;const r=()=>(s=(s*16807)%2147483647)/2147483647;const pt=(a,k)=>[50+Math.cos(a)*k,50+Math.sin(a)*k];let d='',t='';
 for(let n=0;n<34;n++){const a=r()*6.283,b=a+2.2+r()*2.2,k=26+r()*14,m=pt((a+b)/2+(r()-.5)*1.4,r()*18),p=pt(a,k),q=pt(b,k*(.85+r()*.3));d+=`M${p[0].toFixed(1)} ${p[1].toFixed(1)}Q${m[0].toFixed(1)} ${m[1].toFixed(1)} ${q[0].toFixed(1)} ${q[1].toFixed(1)}`;}
 for(let n=0;n<40;n++){const a=r()*6.283,p=pt(a,8+r()*30),q=pt(a+(r()-.5)*1.8,28+r()*12),m=pt(a+(r()-.5)*1.2,10+r()*26);t+=`M${p[0].toFixed(1)} ${p[1].toFixed(1)}Q${m[0].toFixed(1)} ${m[1].toFixed(1)} ${q[0].toFixed(1)} ${q[1].toFixed(1)}`;}
 return {d,t};})();
export const tumbleweed=i=>S(`<defs>${rg(i+'b',[.5,.5,.5],[[0,'#1b0b04',.55],[.7,'#4a2a12',.25],[1,'#6b4423',0]])}${rg(i+'k',[.4,.34,.7],[[0,'#e8c98a',.3],[1,'#6b4423',0]])}
<g id="${i}w" fill="none" stroke-linecap="round"><path d="M12 50a38 38 0 0 1 76 0a38 38 0 0 1-76 0zM50 12Q30 50 50 88Q70 50 50 12zM16 36Q50 62 84 36M16 64Q50 38 84 64"/><path d="${twigs.d}"/></g><g id="${i}t" fill="none" stroke-linecap="round"><path d="${twigs.t}"/></g></defs>
<circle cx="50" cy="50" r="39" fill="url(#${i}b)"/><circle cx="50" cy="50" r="39" fill="url(#${i}k)"/>
<g transform="translate(1.4 1.8)" stroke="#1d0d05" opacity=".8"><use href="#${i}w" stroke-width="2.6"/><use href="#${i}t" stroke-width="1.6"/></g>
<g stroke="#8a5a2c"><use href="#${i}w" stroke-width="1.7"/><use href="#${i}t" stroke-width=".9"/></g>
<g transform="translate(-.7 -.9)" stroke="#d9b277" opacity=".9"><use href="#${i}w" stroke-width=".8"/><use href="#${i}t" stroke-width=".45"/></g>
<path d="M22 28Q30 18 44 15" stroke="#f3dfae" stroke-opacity=".7" stroke-width="1.4" stroke-linecap="round"/>`);

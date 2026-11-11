/* grade.js — injects the ONE shared colour grade that every character photo uses (see css/grade.css).
   Split-tone curve per channel: blacks crushed a touch, shadows pushed warm (R > G > B), highlights a hint amber, saturation +8%.
   Kept as an SVG filter (feComponentTransfer) because CSS filters cannot tone shadows and highlights separately. */
const SVG=`<svg id="bd-grade-defs" width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><defs>
<filter id="bd-grade" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">
 <feColorMatrix type="saturate" values="1.08"/>
 <feComponentTransfer>
  <feFuncR type="table" tableValues="0 .18 .52 .81 1"/>
  <feFuncG type="table" tableValues="0 .14 .475 .78 .99"/>
  <feFuncB type="table" tableValues="0 .09 .41 .70 .92"/>
 </feComponentTransfer>
</filter>
<filter id="bd-poster" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">
 <feColorMatrix in="SourceGraphic" type="matrix" values=".33 .33 .33 0 0 .33 .33 .33 0 0 .33 .33 .33 0 0 0 0 0 1 0" result="lum"/>
 <feComponentTransfer in="lum" result="duo"><feFuncR type="table" tableValues=".043 .35 .94"/><feFuncG type="table" tableValues=".165 .45 .90"/><feFuncB type="table" tableValues=".09 .30 .81"/></feComponentTransfer>
 <feColorMatrix in="lum" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 -1.6 0 0 0 .95" result="sh"/>
 <feImage href="data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='5' height='5'%3E%3Ccircle cx='2.5' cy='2.5' r='1.25' fill='%23000'/%3E%3C/svg%3E" x="0" y="0" width="5" height="5" result="dot"/>
 <feTile in="dot" result="dots"/>
 <feComposite in="dots" in2="sh" operator="in" result="dsh"/>
 <feMerge result="m"><feMergeNode in="duo"/><feMergeNode in="dsh"/></feMerge>
 <feComposite in="m" in2="SourceAlpha" operator="in"/>
</filter></defs></svg>`;
/** Adds the grade filter to the page once. Call before characters are rendered. */
export function installGrade(){if(typeof document==='undefined'||document.getElementById('bd-grade-defs'))return;document.body.insertAdjacentHTML('afterbegin',SVG);}

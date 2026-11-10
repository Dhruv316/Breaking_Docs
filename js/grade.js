/* grade.js — injects the ONE shared colour grade that every character photo uses (see css/grade.css).
   Split-tone curve per channel: blacks crushed a touch, shadows pushed warm (R > G > B), highlights a hint amber, saturation +8%.
   Kept as an SVG filter (feComponentTransfer) because CSS filters cannot tone shadows and highlights separately. */
const SVG=`<svg id="bd-grade-defs" width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><defs>
<filter id="bd-grade" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">
 <feColorMatrix type="saturate" values="1.08"/>
 <feComponentTransfer>
  <feFuncR type="table" tableValues="0 .21 .52 .79 1"/>
  <feFuncG type="table" tableValues="0 .165 .475 .755 .985"/>
  <feFuncB type="table" tableValues="0 .115 .415 .68 .91"/>
 </feComponentTransfer>
</filter></defs></svg>`;
/** Adds the grade filter to the page once. Call before characters are rendered. */
export function installGrade(){if(typeof document==='undefined'||document.getElementById('bd-grade-defs'))return;document.body.insertAdjacentHTML('afterbegin',SVG);}

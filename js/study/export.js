/* study/export.js — Anki export. toAnkiTSV(cards) -> text; downloadText(name,text) saves it. */
const H=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))
 .replace(/\t/g,' ').replace(/\r\n|\r|\n/g,'<br>');
/** Tab-separated "front<TAB>back" lines with Anki header lines. Fields are HTML-escaped; newlines become <br>. @returns {string} */
export function toAnkiTSV(cards){
 return ['#separator:tab','#html:true',...(cards||[]).map(c=>H(c.front)+'\t'+H(c.back))].join('\n')+'\n';}
/** Saves text as a file through a temporary link. */
export function downloadText(filename,text,type='text/plain;charset=utf-8'){
 const url=URL.createObjectURL(new Blob([text],{type})),a=document.createElement('a');
 a.href=url;a.download=filename;a.hidden=true;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);}

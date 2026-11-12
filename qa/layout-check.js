/* layout-check.js — static-layout QA across every root .html page.
   Run: node qa/layout-check.js http://localhost:8000 [--summary]   (serve the project root first; needs playwright)
   Checks: (a) horizontal overflow (b) text/interactive boxes overlapping (c) [data-art-fg] overlapping UI/text
           (d) tap targets <44px (360 & 412 only; inline links inside running text exempt) (e) text <14px.
   Writes qa/report.txt; exits 1 if anything is found. */
const fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const base = (process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : 'http://localhost:8000').replace(/\/$/, '');
const summaryOnly = process.argv.includes('--summary');
const root = path.resolve(__dirname, '..');
const pages = fs.readdirSync(root).filter(f => f.endsWith('.html')).sort();
const VPS = [[360, 740], [412, 915], [768, 1024], [1440, 900]];

function inPage() {
  const UI = 'button,a,input,select,label,h1,h2,h3,h4,p,li,.tile,.file-card,.dropzone,[class*=dropzone]';
  const INTER = 'button,a[href],input:not([type=hidden]),select,textarea,[role=button],summary';
  const desc = e => { const t = (e.innerText || e.value || e.getAttribute('aria-label') || '').trim().replace(/\s+/g, ' ').slice(0, 28);
    return e.tagName.toLowerCase() + (e.id ? '#' + e.id : '') + (e.classList.length ? '.' + [...e.classList].slice(0, 2).join('.') : '') + (t ? ` "${t}"` : ''); };
  const visible = e => { const r = e.getBoundingClientRect(), cs = getComputedStyle(e);
    if (r.width < 2 || r.height < 2 || cs.visibility !== 'visible' || cs.display === 'none' || +cs.opacity === 0) return false;
    if (e.closest('[hidden],[aria-hidden=true]:not([data-art-fg]),.sr-only,.visually-hidden')) return false;
    if (cs.clip === 'rect(0px, 0px, 0px, 0px)') return false; return true; };
  const box = e => { const r = e.getBoundingClientRect(); return { l: r.left + scrollX, t: r.top + scrollY, r: r.right + scrollX, b: r.bottom + scrollY, w: r.width, h: r.height }; };
  const hit = (a, b) => Math.min(a.r, b.r) - Math.max(a.l, b.l) > 1 && Math.min(a.b, b.b) - Math.max(a.t, b.t) > 1;
  const out = { overflow: [], overlap: [], fg: [], tap: [], small: [] };
  const de = document.documentElement;
  if (Math.max(de.scrollWidth, document.body.scrollWidth) > innerWidth + 1) out.overflow.push(`scrollWidth ${Math.max(de.scrollWidth, document.body.scrollWidth)} > viewport ${innerWidth}`);
  const ui = [...document.querySelectorAll(UI)].filter(visible);
  const bx = new Map(ui.map(e => [e, box(e)]));
  const seen = new Set();
  for (let i = 0; i < ui.length; i++) for (let j = i + 1; j < ui.length; j++) {
    const a = ui[i], b = ui[j]; if (a.contains(b) || b.contains(a)) continue;
    if (hit(bx.get(a), bx.get(b))) { const k = desc(a) + ' x ' + desc(b); if (!seen.has(k)) { seen.add(k); out.overlap.push(k); } }
  }
  for (const f of [...document.querySelectorAll('[data-art-fg]')].filter(visible)) {
    const fb = box(f);
    for (const u of ui) if (!f.contains(u) && !u.contains(f) && hit(fb, bx.get(u))) out.fg.push(desc(f) + ' x ' + desc(u));
  }
  if (innerWidth <= 412) for (const e of [...document.querySelectorAll(INTER)].filter(visible)) {
    const b = box(e), cs = getComputedStyle(e);
    if (e.tagName === 'A' && cs.display === 'inline' && e.closest('p,li,span,dd')) continue;
    if (e.type === 'file' || e.type === 'checkbox' || e.type === 'radio') { const l = e.labels && e.labels[0]; if (l) { const lb = box(l); if (lb.w >= 44 && lb.h >= 44) continue; } }
    if (b.w < 44 || b.h < 44) out.tap.push(`${desc(e)} ${Math.round(b.w)}x${Math.round(b.h)}`);
  }
  const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT), sm = new Set();
  for (let n; (n = w.nextNode());) { if (!n.nodeValue.trim()) continue; const e = n.parentElement;
    if (!e || /^(SCRIPT|STYLE|NOSCRIPT)$/.test(e.tagName) || !visible(e)) continue;
    const fs = parseFloat(getComputedStyle(e).fontSize); if (fs < 14) sm.add(`${desc(e)} ${fs}px`); }
  out.small = [...sm];
  return out;
}

(async () => {
  const browser = await chromium.launch();
  const names = { overflow: 'overflow', overlap: 'overlap', fg: 'art-fg overlap', tap: 'tap<44', small: 'text<14' };
  let report = `Layout report ${new Date().toISOString()}  base=${base}\n`, total = 0;
  const summary = [];
  for (const pg of pages) {
    const counts = { overflow: 0, overlap: 0, fg: 0, tap: 0, small: 0 }; let body = '';
    for (const [w, h] of VPS) {
      const ctx = await browser.newContext({ viewport: { width: w, height: h }, hasTouch: w < 768 });
      const p = await ctx.newPage(); let res;
      try { await p.goto(`${base}/${pg}`, { waitUntil: 'load', timeout: 20000 }); await p.waitForTimeout(700); res = await p.evaluate(inPage); }
      catch (e) { res = { overflow: ['LOAD ERROR ' + e.message.split('\n')[0]], overlap: [], fg: [], tap: [], small: [] }; }
      await ctx.close();
      for (const k in counts) { counts[k] += res[k].length; if (res[k].length) body += `  [${w}x${h}] ${names[k]} (${res[k].length}):\n` + res[k].map(x => '      ' + x).join('\n') + '\n'; }
    }
    const n = Object.values(counts).reduce((a, b) => a + b, 0); total += n;
    report += `\n=== ${pg}: ${n} issue(s) — ` + Object.keys(counts).map(k => `${names[k]} ${counts[k]}`).join(', ') + '\n' + body;
    summary.push(`${pg.padEnd(18)} ${String(n).padStart(4)}  (` + Object.keys(counts).map(k => `${names[k]} ${counts[k]}`).join(', ') + ')');
  }
  report += `\nTOTAL ${total}\n`;
  fs.writeFileSync(path.join(__dirname, 'report.txt'), report);
  console.log(summaryOnly ? summary.join('\n') + `\nTOTAL ${total} (full list: qa/report.txt)` : report);
  await browser.close(); process.exit(total ? 1 : 0);
})();

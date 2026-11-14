/* perf-check.js — measures smoothness under CPU throttle. Needs playwright (node).
   Run: node qa/perf-check.js http://localhost:8000 [page1 page2 ...]   (serve the project root first, in the same command)
   Prints per page: avg fps while scrolling, % frames over 33ms, long tasks, infinite animations (total and actually running), DOM elements,
   blend-mode elements, filter elements, KB loaded. Headless has no GPU, so judge by BEFORE vs AFTER, not absolute fps. */
const { chromium } = require('playwright');
const base = (process.argv[2] || 'http://localhost:8000').replace(/\/$/, '');
const pages = process.argv.slice(3).length ? process.argv.slice(3) : ['index', 'image-to-pdf', 'compress-pdf'];
const SAMPLER = () => new Promise(res => {
  const frames = [], longs = []; let last = performance.now();
  try { new PerformanceObserver(l => l.getEntries().forEach(e => longs.push(e.duration))).observe({ entryTypes: ['longtask'] }); } catch (e) {}
  let run = true; (function tick(t) { frames.push(t - last); last = t; if (run) requestAnimationFrame(tick); })(performance.now());
  const H = document.documentElement.scrollHeight - innerHeight; let y = 0; const step = H / 90;
  const iv = setInterval(() => { y += step; scrollTo(0, y); if (y >= H) { clearInterval(iv); setTimeout(() => { run = false;
    const f = frames.slice(2).sort((a, b) => a - b), n = f.length, sum = f.reduce((a, b) => a + b, 0);
    res({ fps: Math.round(1000 / (sum / n)), over33: Math.round(f.filter(x => x > 33).length / n * 100), longTasks: longs.length }); }, 300); } }, 60);
});
const COUNT = () => { const a = document.getAnimations().filter(x => { try { return x.effect.getComputedTiming().iterations === Infinity; } catch (e) { return false; } });
  let blend = 0, filt = 0; const all = [...document.querySelectorAll('*')];
  all.forEach(e => { const c = getComputedStyle(e); if (c.mixBlendMode !== 'normal') blend++; if (c.filter !== 'none') filt++; });
  const running = a.filter(x => x.playState === 'running').length;
  return { infAnims: a.length, running, dom: all.length, blend, filt }; };
(async () => {
  const b = await chromium.launch(); const rows = [];
  for (const [label, vp, mobile, cpu] of [['desktop 4x', { width: 1440, height: 900 }, false, 4], ['phone 6x', { width: 390, height: 844 }, true, 6]]) {
    const ctx = await b.newContext({ viewport: vp, isMobile: mobile, hasTouch: mobile }); const pg = await ctx.newPage();
    const cdp = await ctx.newCDPSession(pg); await cdp.send('Emulation.setCPUThrottlingRate', { rate: cpu });
    for (const n of pages) {
      let kb = 0; const h = async r => { try { kb += (await r.body()).length; } catch (e) {} }; pg.on('response', h);
      await pg.goto(`${base}/${n}.html`, { waitUntil: 'load' }); await pg.waitForTimeout(2500);
      const c = await pg.evaluate(COUNT); const s = await pg.evaluate(SAMPLER); pg.off('response', h);
      rows.push({ view: label, page: n, fps: s.fps, 'frames>33ms%': s.over33, longTasks: s.longTasks, infAnims: c.infAnims, running: c.running, dom: c.dom, blend: c.blend, filt: c.filt, KB: Math.round(kb / 1024) });
    }
    await ctx.close();
  }
  console.table(rows); await b.close();
})();

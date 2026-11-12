/* parallax.js — tiny mouse parallax. Moves [data-depth] layers inside .art-scene by a few px via --art-x/--art-y
   (consumed as transform in art.css). Off on touch + reduced motion; paused when tab hidden. */
(function () {
  var mq = function (q) { return window.matchMedia && matchMedia(q).matches; };
  if (mq('(prefers-reduced-motion: reduce)') || !mq('(hover: hover) and (pointer: fine)')) return;
  var MAX = 6, scenes = [], raf = 0, active = true, tx = 0, ty = 0, cx = 0, cy = 0;
  function collect() {
    scenes = [].map.call(document.querySelectorAll('.art-scene'), function (s) {
      return { el: s, layers: [].slice.call(s.querySelectorAll('[data-depth]')) };
    }).filter(function (s) { return s.layers.length; });
  }
  function tick() {
    cx += (tx - cx) * 0.08; cy += (ty - cy) * 0.08;
    scenes.forEach(function (s) {
      s.layers.forEach(function (l) {
        var d = parseFloat(l.getAttribute('data-depth')) || 0;
        l.style.setProperty('--art-x', (cx * d * MAX).toFixed(2) + 'px');
        l.style.setProperty('--art-y', (cy * d * MAX).toFixed(2) + 'px');
      });
    });
    raf = (active && (Math.abs(tx - cx) > 0.002 || Math.abs(ty - cy) > 0.002)) ? requestAnimationFrame(tick) : 0;
  }
  function kick() { if (!raf && active) raf = requestAnimationFrame(tick); }
  function start() {
    collect(); if (!scenes.length) return;
    window.addEventListener('pointermove', function (e) {
      if (e.pointerType !== 'mouse' || !active) return;
      tx = e.clientX / window.innerWidth * 2 - 1; ty = e.clientY / window.innerHeight * 2 - 1; kick();
    }, { passive: true });
    document.addEventListener('visibilitychange', function () {
      active = !document.hidden; if (!active && raf) { cancelAnimationFrame(raf); raf = 0; } else kick();
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();

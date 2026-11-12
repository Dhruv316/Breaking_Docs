/* sprites.js — original vector art sprite. Injects one hidden SVG once.
   Use: <svg width="120" height="60" aria-hidden="true"><use href="#art-rv"/></svg>  or  Art.svg('rv', 80)
   Flask liquid: inside an svg with viewBox "0 0 100 130" draw <rect clip-path="url(#art-flask-clip)" .../> */
(function () {
  if (window.Art) return;
  var G = 'var(--tile-green,#1E7A3C)', GD = 'var(--tile-green-dark,#0F4A22)', Y = 'var(--hazmat,#F5C400)',
      K = 'var(--heisenberg,#0A0C0A)', O = 'var(--desert-orange,#E07B2A)', R = 'var(--sunset-red,#A63220)',
      B = 'var(--blue-sky,#55D0FF)', D = 'var(--dust,#D6C08F)', W = 'var(--bone,#F2EBD8)', P = 'var(--pink-bear,#F29BBE)';
  var S = 'stroke-linejoin="round" stroke-linecap="round"';
  var flaskBody = 'M38 8H62V44L91 108Q96 124 82 124H18Q4 124 9 108L38 44Z';

  var defs = [
    // id, w, h, markup
    ['rv', 240, 120,
      '<g stroke="' + K + '" stroke-width="3" ' + S + '>' +
      '<path d="M14 36Q14 22 28 22H190Q206 22 214 40L228 62Q232 70 232 78V88H14Z" fill="' + W + '"/>' +
      '<path d="M14 70H232V88H14Z" fill="' + D + '"/>' +
      '<rect x="14" y="48" width="218" height="11" fill="' + G + '"/><rect x="14" y="62" width="218" height="4" fill="' + O + '"/>' +
      '<path d="M196 30H192V46H216L204 34Z" fill="' + B + '"/>' +
      '<rect x="40" y="30" width="26" height="14" rx="3" fill="' + B + '"/><rect x="74" y="30" width="26" height="14" rx="3" fill="' + B + '"/>' +
      '<path d="M130 28V86M160 28V86" fill="none" stroke-width="2.5"/><rect x="134" y="66" width="8" height="4" fill="' + K + '"/>' +
      '<rect x="104" y="12" width="32" height="10" rx="3" fill="' + D + '"/><rect x="112" y="6" width="16" height="6" rx="2" fill="' + W + '"/>' +
      '<path d="M8 24V84M20 24V84" fill="none" stroke-width="3.5"/><path d="M8 34H20M8 46H20M8 58H20M8 70H20" fill="none" stroke-width="2.5"/>' +
      '<rect x="226" y="76" width="10" height="8" rx="2" fill="' + Y + '"/>' +
      '<circle cx="58" cy="90" r="15" fill="' + K + '"/><circle cx="58" cy="90" r="6" fill="' + D + '"/>' +
      '<circle cx="182" cy="90" r="15" fill="' + K + '"/><circle cx="182" cy="90" r="6" fill="' + D + '"/></g>'],

    ['hat-bust', 120, 140,
      '<g stroke="' + W + '" stroke-width="2.5" ' + S + '>' +
      '<path d="M8 140Q10 108 44 100L52 90H68L76 100Q110 108 112 140Z" fill="' + K + '"/>' +
      '<path d="M52 84V98L60 108L68 98V84Z" fill="' + GD + '"/>' +
      '<path d="M44 108L60 124L76 108" fill="none" stroke-width="2"/>' +
      '<ellipse cx="60" cy="64" rx="22" ry="26" fill="' + GD + '"/>' +
      '<path d="M44 76Q60 100 76 76Q70 86 60 87Q50 86 44 76Z" fill="' + K + '" stroke="' + W + '" stroke-width="1.5"/>' +
      '<circle cx="50" cy="60" r="8" fill="' + B + '" fill-opacity=".25"/><circle cx="70" cy="60" r="8" fill="' + B + '" fill-opacity=".25"/>' +
      '<path d="M58 60H62" fill="none"/><path d="M42 58L38 56M78 58L82 56" fill="none"/>' +
      '<path d="M40 40L42 20Q60 12 78 20L80 40Z" fill="' + K + '"/>' +
      '<path d="M40 38H80V32H40Z" fill="' + Y + '" stroke="' + K + '" stroke-width="1.5"/>' +
      '<ellipse cx="60" cy="42" rx="40" ry="8" fill="' + K + '"/></g>'],

    ['hazmat-figure', 100, 200,
      '<g stroke="' + K + '" stroke-width="3" ' + S + '>' +
      '<path d="M32 118L28 186H46L50 128L54 186H72L68 118Z" fill="' + Y + '"/>' +
      '<path d="M50 128L54 186H72L68 118Z" fill="' + K + '" fill-opacity=".2" stroke="none"/>' +
      '<path d="M24 186H48V196H22Z M52 186H76V196H54Z" fill="' + K + '"/>' +
      '<path d="M26 56Q12 58 10 100L20 102L30 74Z" fill="' + Y + '"/><path d="M74 56Q88 58 90 100L80 102L70 74Z" fill="' + Y + '"/>' +
      '<rect x="6" y="98" width="18" height="14" rx="6" fill="' + K + '"/><rect x="76" y="98" width="18" height="14" rx="6" fill="' + K + '"/>' +
      '<rect x="28" y="50" width="44" height="74" rx="12" fill="' + Y + '"/>' +
      '<path d="M50 50H72Q72 50 72 112Q72 124 60 124H50Z" fill="' + K + '" fill-opacity=".2" stroke="none"/>' +
      '<rect x="28" y="96" width="44" height="8" fill="' + K + '"/><rect x="45" y="94" width="10" height="12" rx="2" fill="' + O + '"/>' +
      '<circle cx="50" cy="28" r="22" fill="' + Y + '"/>' +
      '<path d="M32 22H68V32Q68 40 50 40Q32 40 32 32Z" fill="' + K + '"/>' +
      '<circle cx="42" cy="28" r="6" fill="' + B + '"/><circle cx="58" cy="28" r="6" fill="' + B + '"/>' +
      '<path d="M36 36Q50 56 64 36Q64 52 50 54Q36 52 36 36Z" fill="' + K + '"/>' +
      '<circle cx="38" cy="46" r="5" fill="' + D + '"/><circle cx="62" cy="46" r="5" fill="' + D + '"/></g>'],

    ['gas-mask', 100, 110,
      '<g stroke="' + W + '" stroke-width="2.5" ' + S + '>' +
      '<path d="M10 40H90M10 56H90" stroke="' + Y + '" stroke-width="5" fill="none"/>' +
      '<path d="M18 40Q18 8 50 8Q82 8 82 40V62Q82 90 50 100Q18 90 18 62Z" fill="' + K + '"/>' +
      '<path d="M50 8Q82 8 82 40V62Q82 90 50 100Z" fill="' + GD + '" fill-opacity=".55" stroke="none"/>' +
      '<circle cx="36" cy="44" r="14" fill="' + B + '"/><circle cx="64" cy="44" r="14" fill="' + B + '"/>' +
      '<path d="M29 40Q32 34 38 33" stroke="' + W + '" stroke-width="3" fill="none"/><path d="M57 40Q60 34 66 33" stroke="' + W + '" stroke-width="3" fill="none"/>' +
      '<path d="M50 56V62" fill="none"/>' +
      '<circle cx="50" cy="82" r="14" fill="' + G + '"/><circle cx="50" cy="82" r="6" fill="' + K + '" stroke="none"/>' +
      '<path d="M50 82M44 76H56M44 88H56" stroke="' + K + '" stroke-width="2" fill="none"/></g>'],

    ['flask', 100, 130,
      '<path d="' + flaskBody + '" fill="' + W + '" fill-opacity=".14"/>' +
      '<path d="' + flaskBody + '" fill="none" stroke="' + K + '" stroke-width="9" ' + S + '/>' +
      '<path d="' + flaskBody + '" fill="none" stroke="' + W + '" stroke-width="4" ' + S + '/>' +
      '<rect x="34" y="3" width="32" height="8" rx="3" fill="' + W + '" stroke="' + K + '" stroke-width="2.5"/>' +
      '<path d="M46 14V44L22 104" fill="none" stroke="' + W + '" stroke-opacity=".6" stroke-width="3.5" ' + S + '/>' +
      '<path d="M30 78H38M26 90H36M22 102H32" stroke="' + W + '" stroke-width="2.5" ' + S + '/>'],

    ['barrel', 80, 100,
      '<g stroke="' + K + '" stroke-width="3" ' + S + '>' +
      '<path d="M10 14Q40 6 70 14V88Q40 98 10 88Z" fill="' + Y + '"/>' +
      '<path d="M40 10Q70 10 70 14V88Q56 94 40 95Z" fill="' + O + '" fill-opacity=".45" stroke="none"/>' +
      '<path d="M10 14Q40 22 70 14" fill="none"/><path d="M10 34Q40 42 70 34M10 66Q40 74 70 66M10 88Q40 96 70 88" fill="none" stroke-width="4"/>' +
      '<circle cx="40" cy="52" r="12" fill="' + K + '"/><path d="M40 52L40 42M40 52L31.5 57M40 52L48.5 57" stroke="' + Y + '" stroke-width="3" fill="none"/>' +
      '<path d="M22 14V24Q22 28 26 26V22" fill="' + G + '" stroke="none"/></g>'],

    ['crystals', 120, 100,
      '<g stroke="' + K + '" stroke-width="2.5" ' + S + '>' +
      '<path d="M6 94L18 50L30 94Z" fill="' + B + '"/><path d="M18 50L30 94H22Z" fill="' + K + '" fill-opacity=".25" stroke="none"/>' +
      '<path d="M86 94L100 36L114 94Z" fill="' + B + '"/><path d="M100 36L114 94H104Z" fill="' + K + '" fill-opacity=".25" stroke="none"/>' +
      '<path d="M24 94L34 58L46 94Z" fill="' + B + '"/>' +
      '<path d="M34 94L52 12L72 94Z" fill="' + B + '"/><path d="M52 12L72 94H58Z" fill="' + K + '" fill-opacity=".28" stroke="none"/><path d="M52 12L44 94H34Z" fill="' + W + '" fill-opacity=".55" stroke="none"/>' +
      '<path d="M66 94L78 48L92 94Z" fill="' + B + '"/><path d="M78 48L92 94H80Z" fill="' + K + '" fill-opacity=".22" stroke="none"/>' +
      '<path d="M2 94H118" fill="none"/></g>'],

    ['saguaro', 80, 140,
      '<g fill="none" ' + S + '>' +
      '<path d="M40 128V22M40 90H18V54M40 74H62V38" stroke="' + K + '" stroke-width="22"/>' +
      '<path d="M40 128V22M40 90H18V54M40 74H62V38" stroke="' + G + '" stroke-width="16"/>' +
      '<path d="M46 124V26M62 70V42M22 86V58" stroke="' + GD + '" stroke-width="5" stroke-opacity=".7"/>' +
      '<path d="M36 112V40M18 78V60" stroke="' + W + '" stroke-width="2" stroke-opacity=".3"/></g>' +
      '<path d="M30 134H50" stroke="' + K + '" stroke-width="5" ' + S + '/>'],

    ['mesa-set', 300, 110,
      '<path d="M0 100V62L24 58L34 36H92L102 56L130 60L140 100Z" fill="' + O + '" fill-opacity=".6"/>' +
      '<path d="M120 100V50L140 46L150 24H230L242 44L268 50L290 54V100Z" fill="' + R + '"/>' +
      '<path d="M200 24H230L242 44L268 50L290 54V100H236Z" fill="' + K + '" fill-opacity=".18"/>' +
      '<path d="M150 40H242M144 60H260" stroke="' + O + '" stroke-width="3" stroke-opacity=".55"/>' +
      '<path d="M0 108V82L30 78L42 62H112L124 80L170 84L190 108Z" fill="' + K + '" fill-opacity=".92"/>' +
      '<path d="M0 98L180 98" stroke="' + R + '" stroke-width="3" stroke-opacity=".6"/>' +
      '<path d="M200 108V92L224 88L232 76H284L292 90L300 92V108Z" fill="' + K + '" fill-opacity=".92"/>'],

    ['sun-rays', 200, 200,
      '<g transform="translate(100 100)"><g fill="' + O + '">' +
      [0,1,2,3,4,5,6,7,8,9,10,11].map(function (i) { return '<path d="M-9 -52L0 -96L9 -52Z" transform="rotate(' + i * 30 + ')" fill-opacity="' + (i % 2 ? '.55' : '1') + '"/>'; }).join('') +
      '</g><circle r="46" fill="' + Y + '"/><path d="M0 -46A46 46 0 0 1 0 46A30 46 0 0 0 0 -46Z" fill="' + O + '" fill-opacity=".4"/></g>'],

    ['tumbleweed', 100, 100,
      '<g fill="none" stroke="' + K + '" stroke-width="7" ' + S + '>' +
      '<circle cx="50" cy="50" r="40"/><ellipse cx="50" cy="50" rx="40" ry="20" transform="rotate(30 50 50)"/>' +
      '<ellipse cx="50" cy="50" rx="40" ry="20" transform="rotate(-35 50 50)"/><ellipse cx="50" cy="50" rx="18" ry="40" transform="rotate(12 50 50)"/>' +
      '</g><g fill="none" stroke="' + D + '" stroke-width="3" ' + S + '>' +
      '<circle cx="50" cy="50" r="40"/><ellipse cx="50" cy="50" rx="40" ry="20" transform="rotate(30 50 50)"/>' +
      '<ellipse cx="50" cy="50" rx="40" ry="20" transform="rotate(-35 50 50)"/><ellipse cx="50" cy="50" rx="18" ry="40" transform="rotate(12 50 50)"/>' +
      '<path d="M18 62Q40 40 82 36M24 28Q52 52 80 70M50 12Q38 40 58 88" stroke="' + O + '" stroke-width="2.5"/>' +
      '<path d="M10 40L2 36M90 62L98 66M56 10L58 2" stroke-width="2.5"/></g>'],

    ['pointing-hand', 120, 80,
      '<g stroke="' + K + '" stroke-width="3.5" ' + S + '>' +
      '<rect x="56" y="26" width="58" height="15" rx="7.5" fill="' + W + '"/>' +
      '<rect x="22" y="24" width="48" height="44" rx="16" fill="' + W + '"/>' +
      '<path d="M46 20Q46 10 56 12L66 24" fill="' + W + '"/>' +
      '<path d="M34 50H64M32 59H62" fill="none" stroke-width="3"/>' +
      '<path d="M22 44Q38 50 62 46V68H36Q22 68 22 54Z" fill="' + D + '" fill-opacity=".5" stroke="none"/>' +
      '<rect x="4" y="22" width="18" height="48" rx="3" fill="' + Y + '"/><path d="M4 36H22M4 56H22" stroke-width="3" fill="none"/></g>'],

    ['scissors', 100, 100,
      '<g stroke="' + K + '" stroke-width="3" ' + S + '>' +
      '<g><circle cx="24" cy="82" r="13" fill="none" stroke="' + K + '" stroke-width="14"/><circle cx="24" cy="82" r="13" fill="none" stroke="' + R + '" stroke-width="8"/>' +
      '<path d="M32 72L52 52L84 8L92 12L60 60L42 78Z" fill="' + W + '"/></g>' +
      '<g transform="translate(100 0) scale(-1 1)"><circle cx="24" cy="82" r="13" fill="none" stroke="' + K + '" stroke-width="14"/><circle cx="24" cy="82" r="13" fill="none" stroke="' + O + '" stroke-width="8"/>' +
      '<path d="M32 72L52 52L84 8L92 12L60 60L42 78Z" fill="' + D + '"/></g>' +
      '<circle cx="50" cy="56" r="4.5" fill="' + Y + '"/></g>'],

    ['eraser', 100, 60,
      '<g stroke="' + K + '" stroke-width="3" ' + S + ' transform="rotate(-12 50 30)">' +
      '<rect x="6" y="14" width="88" height="34" rx="9" fill="' + P + '"/><path d="M6 36H94V39Q94 48 85 48H15Q6 48 6 39Z" fill="' + K + '" fill-opacity=".18" stroke="none"/>' +
      '<path d="M60 14V48" fill="none"/><path d="M60 14H85Q94 14 94 23V39Q94 48 85 48H60Z" fill="' + B + '"/>' +
      '<path d="M70 24H84M70 34H84" stroke="' + K + '" stroke-width="2.5" fill="none"/></g>' +
      '<path d="M8 56H16M22 57H26" stroke="' + P + '" stroke-width="3" ' + S + '/>'],

    ['stack-of-slides', 120, 100,
      '<g stroke="' + K + '" stroke-width="3" ' + S + '>' +
      '<rect x="22" y="6" width="88" height="56" rx="5" fill="' + D + '"/>' +
      '<rect x="14" y="18" width="88" height="56" rx="5" fill="' + O + '"/>' +
      '<rect x="6" y="32" width="88" height="56" rx="5" fill="' + W + '"/>' +
      '<rect x="14" y="40" width="48" height="10" rx="2" fill="' + G + '" stroke="none"/>' +
      '<path d="M14 60H80M14 68H70M14 76H58" stroke="' + K + '" stroke-opacity=".6" stroke-width="3" fill="none"/>' +
      '<rect x="68" y="42" width="18" height="14" rx="2" fill="' + Y + '" stroke-width="2"/></g>'],

    ['image-frames', 120, 100,
      '<g stroke="' + K + '" stroke-width="3" ' + S + '>' +
      '<g transform="rotate(-8 40 40)"><rect x="8" y="10" width="64" height="50" rx="4" fill="' + W + '"/><rect x="14" y="16" width="52" height="38" fill="' + B + '" fill-opacity=".6" stroke="none"/></g>' +
      '<rect x="40" y="30" width="72" height="60" rx="4" fill="' + W + '"/>' +
      '<rect x="47" y="37" width="58" height="46" fill="' + B + '" stroke="none"/>' +
      '<path d="M47 83L66 58L80 74L90 64L105 83Z" fill="' + G + '" stroke="none"/><path d="M80 74L90 64L105 83H86Z" fill="' + GD + '" stroke="none"/>' +
      '<circle cx="92" cy="48" r="6" fill="' + Y + '" stroke="none"/></g>'],

    ['merge-arrows', 120, 100,
      '<g fill="none" stroke="' + K + '" stroke-width="15" ' + S + '><path d="M8 20H34Q54 20 54 50"/><path d="M8 80H34Q54 80 54 50"/><path d="M54 50H92"/></g>' +
      '<g fill="none" stroke="' + Y + '" stroke-width="9" ' + S + '><path d="M8 20H34Q54 20 54 50"/><path d="M8 80H34Q54 80 54 50" stroke="' + O + '"/><path d="M54 50H92"/></g>' +
      '<path d="M90 30L116 50L90 70Z" fill="' + Y + '" stroke="' + K + '" stroke-width="3" ' + S + '/>'],

    ['squeeze-press', 120, 110,
      '<g stroke="' + K + '" stroke-width="3" ' + S + '>' +
      '<rect x="6" y="94" width="108" height="12" rx="3" fill="' + GD + '"/>' +
      '<rect x="14" y="18" width="10" height="78" fill="' + G + '"/><rect x="96" y="18" width="10" height="78" fill="' + G + '"/>' +
      '<rect x="10" y="12" width="100" height="10" rx="3" fill="' + G + '"/>' +
      '<rect x="55" y="2" width="10" height="26" fill="' + D + '"/><rect x="38" y="0" width="44" height="7" rx="3" fill="' + Y + '"/>' +
      '<rect x="26" y="30" width="68" height="12" rx="3" fill="' + Y + '"/>' +
      '<rect x="30" y="58" width="60" height="30" rx="2" fill="' + W + '"/><path d="M36 66H84M36 74H76M36 82H66" stroke-width="2.5" fill="none" stroke-opacity=".6"/>' +
      '<rect x="26" y="88" width="68" height="6" fill="' + Y + '"/>' +
      '<path d="M60 46V56M54 52L60 58L66 52" fill="none" stroke="' + R + '" stroke-width="4"/></g>'],

    ['money-stack', 120, 90,
      '<g stroke="' + K + '" stroke-width="3" ' + S + '>' +
      '<rect x="8" y="48" width="104" height="34" rx="4" fill="' + GD + '"/>' +
      '<rect x="8" y="36" width="104" height="34" rx="4" fill="' + G + '"/>' +
      '<rect x="8" y="24" width="104" height="34" rx="4" fill="' + GD + '"/>' +
      '<rect x="8" y="12" width="104" height="34" rx="4" fill="' + G + '"/>' +
      '<rect x="48" y="12" width="24" height="70" fill="' + W + '"/>' +
      '<circle cx="28" cy="29" r="9" fill="none" stroke-width="2.5" stroke="' + K + '" stroke-opacity=".6"/><circle cx="92" cy="29" r="9" fill="none" stroke-width="2.5" stroke="' + K + '" stroke-opacity=".6"/>' +
      '<path d="M54 40H66M54 52H66M54 64H66" stroke-width="2.5" stroke-opacity=".5" fill="none"/></g>' +
      '<text x="60" y="34" text-anchor="middle" font-family="Anton,Impact,sans-serif" font-size="20" fill="' + K + '">$</text>'],

    ['stamp-frame', 200, 120,
      '<g fill="none" stroke="currentColor" ' + S + '>' +
      '<path d="M8 10L60 7L120 11L192 8L193 60L191 112L130 114L70 110L9 113L7 62Z" stroke-width="7" stroke-dasharray="70 4 38 2 90 6 52 3 110 5 44 3 86 4 60 2 100"/>' +
      '<path d="M18 22L100 20L182 22L181 98L98 100L19 98Z" stroke-width="2.5" stroke-dasharray="44 5 90 3 60 6 120 4" stroke-opacity=".85"/>' +
      '<path d="M4 4L9 9M196 112L191 106M5 114L10 108" stroke-width="3"/></g>']
  ];

  var pattern = '<pattern id="art-hazard-tape" width="40" height="40" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">' +
    '<rect width="40" height="40" fill="' + K + '"/><rect width="20" height="40" fill="' + Y + '"/></pattern>' +
    '<clipPath id="art-flask-clip"><path d="' + flaskBody + '"/></clipPath>';

  var meta = {};
  defs.forEach(function (d) { meta[d[0]] = { w: d[1], h: d[2] }; });

  function build() {
    if (document.getElementById('art-sprite')) return;
    var s = '<svg id="art-sprite" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false" ' +
      'style="position:absolute;width:0;height:0;overflow:hidden;pointer-events:none"><defs>' + pattern + '</defs>' +
      defs.map(function (d) { return '<symbol id="art-' + d[0] + '" viewBox="0 0 ' + d[1] + ' ' + d[2] + '">' + d[3] + '</symbol>'; }).join('') + '</svg>';
    document.body.insertAdjacentHTML('afterbegin', s);
  }
  function hide() {
    var q = '.art-layer,.art-grain,.art-vignette,.art-rays,.art-drift,[data-art-fg],[data-art]';
    [].forEach.call(document.querySelectorAll(q), function (el) { el.setAttribute('aria-hidden', 'true'); });
  }
  function init() { build(); hide(); }

  window.Art = {
    ids: Object.keys(meta), meta: meta, hide: hide,
    svg: function (id, h, cls) {
      var m = meta[id]; if (!m) return '';
      var w = Math.round(h * m.w / m.h * 10) / 10;
      return '<svg class="' + (cls || '') + '" width="' + w + '" height="' + h + '" viewBox="0 0 ' + m.w + ' ' + m.h +
        '" aria-hidden="true" focusable="false"><use href="#art-' + id + '" width="' + m.w + '" height="' + m.h + '"/></svg>';
    }
  };
  if (document.body) init(); else document.addEventListener('DOMContentLoaded', init);
})();

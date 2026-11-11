# Breaking Docs

A Breaking Bad-themed, fully in-browser PDF toolkit: Image to PDF, PPT to PDF, Compress PDF.
No backend, no build step, no uploads. Files never leave the browser.

## Run it

From the folder that contains `index.html`:

```
python -m http.server 8000
```

Then open <http://localhost:8000>. (Use `python3` if `python` is not found.)

Serve it over http. Opening `index.html` straight from disk (`file://`) will not work, because the site uses ES modules.
The first load needs internet for the CDN libraries and Google Fonts (see below). Nothing else is fetched.

The themed `404.html` is shown by hosts that serve it for missing pages (Netlify, GitHub Pages, Cloudflare Pages, ...). `python -m http.server` shows its own plain 404 instead.

## Files that are still placeholders

Every placeholder is already wired to its final file name and is drawn as CSS/SVG until the real file is switched on.
Nothing 404s while a file is missing, because nothing is requested until its flag is `true`.

All switches live in one place: `js/assets.js`, in the `ASSETS` object. Put the file in `assets/` with the exact name, then flip that entry's `present` flag to `true`. No other code changes.

### Background scenes (JPG, 1920x1080, under 400 KB)

| File in `assets/` | `ASSETS.bg` key | Where it shows |
|---|---|---|
| `bg-desert-sunset.jpg` | `sunset` | Home hero |
| `bg-desert-night.jpg` | `night` | Home tool grid, "More tools" strips, footer, 404 |
| `bg-lab-interior.jpg` | `lab` | Home "Pure/Private/Free" strip, Compress PDF |
| `bg-rv-desert.jpg` | `rv` | Image to PDF (placeholder art; the real photo is `bg-pilot-desert.jpg`, key `pilot`) |
| `bg-office-albuquerque.jpg` | `office` | PPT to PDF |

Already real (Round 1A): `bg-superlab.jpg` (`superlab`, Compress PDF page and the result screen, two different crops and grades), `bg-pilot-desert.jpg` (`pilot`, Image to PDF, 1080 px wide so it is blurred, darkened and grained and never scaled past `cover`), `bg-cast-clouds.jpg` (`cast`, registered only, for a future About page).

How: copy the JPG into `assets/`, then change `sunset:f('bg-desert-sunset.jpg',false)` to `...,true)` (same pattern for the others).
The real image is laid over the placeholder; if it fails to load it removes itself and the placeholder shows again.

### Props (PNG or SVG with transparency, about 512 px)

Until a real file is switched on, each prop below is a detailed SVG drawing from `js/props-art.js` (Round 1B-2: shaded, outlined, with crystal sparkles and flask bubbles). The drawings are replaced automatically when you flip `present` to `true`.

| File in `assets/` | `ASSETS.props` key | Used by |
|---|---|---|
| `prop-barrel.png` | `barrel` | Dropzone corner (all tools) |
| `prop-flask.png` | `flask` | Dropzone icon (all tools) |
| `prop-gas-mask.png` | `gasMask` | Warnings and error panels |
| `prop-rv.png` | `rv` | Image to PDF progress bar (real file since Round 1A) |
| `prop-cactus.png` | `cactus` | Image to PDF progress bar |
| `prop-blue-crystals.png` | `blueCrystals` | Progress finish flag, result sparkles |
| `prop-tumbleweed.png` | `tumbleweed` | Home hero idle animation |
| `prop-pizza-roof.png` | `pizzaRoof` | Logo x5 easter egg (real file since Round 1A) |
| `prop-glasses.png` | `glasses` | Declared in the manifest, not used on any page yet |
| `prop-hazmat-suit.png` | `hazmatSuit` | Declared in the manifest, not used on any page yet |
| `prop-cash-pile.png` | `cashPile` | Declared in the manifest, not used on any page yet |

How: copy the file into `assets/` and change that entry in `ASSETS.props` from `f('prop-flask.png',false)` to `f('prop-flask.png',true)` (same pattern for the others). `hat`, `pollos` and `bear` are already real files.
Props are sized by their container and `img{max-width:100%}`, so a 512 px PNG scales down automatically. Look at each one once after switching it on, because a few CSS animations were written for the SVG versions (for example the tumbleweed hop).

### Sound (Round 2A: no files needed)

All sound is synthesized in the browser with the Web Audio API (`js/sound.js`), so there are no MP3s to supply. It is off by default and never autoplays; the navbar "Sound" toggle is always visible, with a chevron button for three volume steps and a separate "Desert wind" ambience option (also off by default, and never on under reduced motion). The choice is remembered in `localStorage` (`bd.sound.v1`); if storage is blocked the site just starts off.
Two cues belong to the title card (`tile`, `curtain`, Round 2B). To change a sound, edit its function in the `SFX` table (or `startBubbling` / `startAmbience`) in `js/sound.js`. Keep peaks at or below 0.3 and keep the attack/release envelope helpers.

### Declared but not wired

- `bg-loop-desert.mp4` (`ASSETS.video.desert`): no page uses video yet. The hero uses a CSS heat-shimmer instead.
- `intro-title-card.mp4`, `fonts/brba-title.woff2`, `quotes.txt` (all mentioned in `kit/ASSETS.md`): not implemented. Adding them is new work, not a file swap.

### Real files already in place

Logo, tiles SVG, favicon, og-image, both textures, all ten character cutouts, the pork-pie hat, Los Pollos, pink bear, RV and pizza-roof props, and (Round 1A) `char-green-shirt-fullbody.png` (404 only, shown at 1.25x), `char-green-shirt-gun.png` (Konami egg ONLY, never a main page) and `char-trio.png` (registered only, for a future About page).

### Cinematic grade (Round 1A)

Every character photo shares one treatment in `css/grade.css` + `js/grade.js`: colour grade (warm shadows, crushed blacks), rim light, soft halo (hazmat yellow or tile green per page), drop shadow and feathered edge masks. Tune one photo with `--g-rim --g-glow --g-halo --fb --fl --fr --ft` on its placement rule. The Home hero (low-res source) also gets softening, grain and a vignette via the `char--lowres` class. `bg-superlab.jpg` is about 457 KB, above the 400 KB target in the kit; recompress it if page weight matters.
Characters are cropped through the `box(...)` values in `ASSETS.char`. If you replace one with a different crop, update its numbers (source width, height, visible x, y, w, h in source pixels).

### Scene art (Round 1B-1)
The sunset hero, night (footer, 404, dark sections), lab strip and office are now layered SVG/CSS scenes with parallax (`js/scenes.js`, `js/office-decor.js`, `css/scenes.css`). They need no files. Parallax is transform-only, pauses when the tab is hidden or the scene is off-screen, is fully off under `prefers-reduced-motion`, and shows fewer layers under 768 px. Real JPGs still replace them when `present` is switched on.

## Libraries (pinned, loaded only when a tool needs them)

| Library | Exact URL | Global |
|---|---|---|
| pdf-lib 1.17.1 | `https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.min.js` | `PDFLib` |
| pdf.js 3.11.174 | `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js` | `pdfjsLib` |
| pdf.js worker | `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js` | (set as `GlobalWorkerOptions.workerSrc`; Blob-URL fallback if cross-origin workers are blocked) |
| JSZip 3.10.1 | `https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js` | `JSZip` |
| html2canvas 1.4.1 | `https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js` | `html2canvas` |
| pptx-preview 1.0.7 | `https://cdn.jsdelivr.net/npm/pptx-preview@1.0.7/dist/pptx-preview.umd.js` | `pptxPreview` (`PptxPreview` also accepted) |
| Google Fonts | `https://fonts.googleapis.com/css2?family=Anton&family=Barlow:wght@400;600&family=Share+Tech+Mono&display=swap` | n/a (CSS) |

If a library fails to load, the tool shows a themed error with a "Try again" button.

## Where things are

- `js/copy.js` holds every user-facing string. `kit/COPY.md` mirrors it.
- `js/assets.js` is the single manifest of asset paths and the placeholder art.
- `js/sound.js` (synth) + `js/sound-ui.js` (navbar control) make all the sound.
- `css/motion.css` + `js/motion.js` hold the Round 2B motion: title card, page transitions, stamp slam and crystal burst, micro-interactions.
- `js/scenes.js` + `css/scenes.css` draw the layered scenes and run the parallax.
- `js/props-art.js` holds the detailed SVG drawings of the props that are not real files yet (Round 1B-2).
- `js/tools/*.js` is one module per tool, each exporting `init()`.
- `kit/` holds the build notes (SKILL, RULES, DESIGN, ...). It is not needed to run the site and can be deleted when you deploy.

## Before you deploy

- `og:image` is a relative path (`assets/og-image.jpg`). Some link-preview crawlers need an absolute URL, so change it to `https://your-domain/assets/og-image.jpg` once the domain is known.
- Each page's `<title>` and meta description in the static `<head>` are a no-JS and crawler fallback. JS sets the same titles from `js/copy.js` at runtime; if you change the copy, change those too.

## Accessibility and QA notes (Phase 6C-2)

Checked in Chromium at 360, 768 and 1440 px, light and dark scheme, with reduced motion on and off. See `kit/DESIGN.md` ("Phase 6C-2") for what changed.
The light scheme only changes the page base colour: every section keeps its dark scene, so the "daylight desert" palette is barely visible by design of the existing CSS.
Not covered here: real-file runs of PPT to PDF and Compress PDF (they need pdf.js, html2canvas and pptx-preview from the CDN), the real Anton/Barlow/Share Tech Mono fonts, screen readers, and Safari/Firefox.

## Round 1B-2 QA notes

Prop art checked in Chromium at 360, 768 and 1440 px, light and dark scheme, reduced motion on and off: all five pages load with no JS errors and no horizontal overflow, and the props render on the dropzone, warnings, RV progress strip, result screen and hero. With reduced motion no `pa-*` animation runs.
Not verified: end-to-end runs of the three tools and the real fonts (the test sandbox cannot reach the CDN; the tool JS files are byte-identical to the previous round), Safari/Firefox, real-device touch.

## Round 2A QA notes

Sound checked in headless Chromium: the context does not exist before a gesture, turns on with the toggle, every cue fires from its hook (tool states, warnings, drop, Konami, logo x5) with no console output, blocked storage and a missing `AudioContext` fail silently, reduced motion disables ambience, and layout has no horizontal overflow at 360, 768 and 1440 px in light and dark.
Not verified: how it actually sounds (no speakers here; levels were measured, not heard), Safari/iOS audio unlocking, Firefox, and the three tools on real files (the sandbox cannot reach the CDN; tool modules are unchanged).

## Round 2B QA notes (Motion)

Added: a dark title card (Br then Dc flip in with glow, tagline, curtain lift, ~3 s; skip with click, Esc, Enter, Space or the button; `?intro=1` replays; 8-second failsafe kept), cross-document View Transitions with a plain-fade fallback (under 300 ms, never blocks navigation), a result screen with stamp slam + overshoot, 250 ms panel shake and a 30-shard crystal burst (removed after 1.5 s, plays once per result), and the micro-interactions (tile lift/glow, button sink, dropzone drag pulse, file cards sliding in, eased progress; the big-button ping ring is kept). Only `transform` and `opacity` move; reduced motion turns everything off or into instant state changes; animations pause while the tab is hidden.
Checked in headless Chromium: intro plays, lifts and removes itself; the burst creates 30 shards, never takes pointer events and is gone by 1.5 s; the shake runs once; reduced motion creates no burst and no animations; the RV lands exactly at the end of the road at 100 %; no console errors beyond the blocked CDN/fonts.
Not verified: the real feel and frame rate on a phone, cross-document View Transitions in Safari and Firefox (the fallback is untested there), how `tile` and `curtain` sound, and the three tools end to end on real files (the sandbox cannot reach the CDN, so the result screen and progress were driven directly).

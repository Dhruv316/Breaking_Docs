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

### Audio (MP3, all optional)

`sfx-click.mp3`, `sfx-drop.mp3`, `sfx-bubbling.mp3` (loop), `sfx-success.mp3`, `sfx-error.mp3`, `sfx-knock.mp3`, `music-theme-loop.mp3` (optional loop).

How: copy into `assets/` and change `false` to `true` on its entry in `ASSETS.audio` (keys `click, drop, bubbling, success, error, knock, theme`).
The navbar "Sound off / Sound on" toggle appears as soon as at least one is `true`. It always starts OFF and nothing autoplays.

### Declared but not wired

- `bg-loop-desert.mp4` (`ASSETS.video.desert`): no page uses video yet. The hero uses a CSS heat-shimmer instead.
- `intro-title-card.mp4`, `fonts/brba-title.woff2`, `quotes.txt` (all mentioned in `kit/ASSETS.md`): not implemented. Adding them is new work, not a file swap.

### Real files already in place

Logo, tiles SVG, favicon, og-image, both textures, all ten character cutouts, the pork-pie hat, Los Pollos, pink bear, RV and pizza-roof props, and (Round 1A) `char-green-shirt-fullbody.png` (404 only, shown at 1.25x), `char-green-shirt-gun.png` (Konami egg ONLY, never a main page) and `char-trio.png` (registered only, for a future About page).

### Cinematic grade (Round 1A)

Every character photo shares one treatment in `css/grade.css` + `js/grade.js`: colour grade (warm shadows, crushed blacks), rim light, soft halo (hazmat yellow or tile green per page), drop shadow and feathered edge masks. Tune one photo with `--g-rim --g-glow --g-halo --fb --fl --fr --ft` on its placement rule. The Home hero (low-res source) also gets softening, grain and a vignette via the `char--lowres` class. `bg-superlab.jpg` is about 457 KB, above the 400 KB target in the kit; recompress it if page weight matters.
Characters are cropped through the `box(...)` values in `ASSETS.char`. If you replace one with a different crop, update its numbers (source width, height, visible x, y, w, h in source pixels).

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
- `js/tools/*.js` is one module per tool, each exporting `init()`.
- `kit/` holds the build notes (SKILL, RULES, DESIGN, ...). It is not needed to run the site and can be deleted when you deploy.

## Before you deploy

- `og:image` is a relative path (`assets/og-image.jpg`). Some link-preview crawlers need an absolute URL, so change it to `https://your-domain/assets/og-image.jpg` once the domain is known.
- Each page's `<title>` and meta description in the static `<head>` are a no-JS and crawler fallback. JS sets the same titles from `js/copy.js` at runtime; if you change the copy, change those too.

## Accessibility and QA notes (Phase 6C-2)

Checked in Chromium at 360, 768 and 1440 px, light and dark scheme, with reduced motion on and off. See `kit/DESIGN.md` ("Phase 6C-2") for what changed.
The light scheme only changes the page base colour: every section keeps its dark scene, so the "daylight desert" palette is barely visible by design of the existing CSS.
Not covered here: real-file runs of PPT to PDF and Compress PDF (they need pdf.js, html2canvas and pptx-preview from the CDN), the real Anton/Barlow/Share Tech Mono fonts, screen readers, and Safari/Firefox.

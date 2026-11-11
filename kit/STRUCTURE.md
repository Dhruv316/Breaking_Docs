# STRUCTURE.md — Pages, routes, folders

## Folder layout
```
/index.html                 Home (hero + tool grid)
/image-to-pdf.html
/ppt-to-pdf.html
/compress-pdf.html
/404.html
/css/
  tokens.css                Variables from DESIGN.md
  base.css                  Reset, type, grain, vignette, hazard tape
  components.css            Tile, buttons, dropzone, progress, stamp, navbar, footer
  pages.css                 Per-page backgrounds and character placement
  motion.css                Round 2B motion: intro, page transitions, stamp/burst, micro-interactions (loaded last)
/js/
  assets.js                 SINGLE manifest of all /assets paths (+ placeholder fallback)
  ui.js                     Navbar, footer, theme, sound toggle, easter eggs, reduced-motion
  sound.js                  Web Audio synthesizer (off by default, no audio files)
  sound-ui.js               Navbar sound control: toggle + options popover
  dropzone.js               Reusable drag-drop + file picker + validation
  progress.js               Themed progress components
  result.js                 Result screen, stamp, download handling
  format.js                 File size formatting, percent, helpers
  motion.js                 File-card entrance class + page-transition fallback (Round 2B)
  /tools/
    image-to-pdf.js
    ppt-to-pdf.js
    compress-pdf.js
/assets/                    Owner files (see ASSETS.md)
/fonts/                     Optional brba-title.woff2
```

## Pages
### Home (index.html)
1. Top bar
2. Hero: giant headline (COPY.md), sub-line, big yellow "Start cooking" button (scrolls to tools), char-heisenberg, desert bg
3. Tool grid: 3 live tiles (Im, Pp, Cp) + dimmed coming-soon tiles
4. "Why Breaking Docs" strip: 3 short promises (Private, Free, No signup) as tiles
5. Footer

### Tool pages (all 3 share one template)
Top bar → title block → dropzone → options → big button → progress → result → "More tools" tile row → footer.
Each page loads `/js/tools/<tool>.js` which exports `init()`.

### 404
Gus on desert night. Copy from COPY.md. One button back home.

## Shared behaviors
- Navigation is normal links between pages (no SPA router needed).
- Active tool state lives in memory only (no localStorage requirement).
- Every tool follows the same state machine: `idle → filesChosen → processing → done | error`.
- "Cook another batch" resets to `idle` without reload.
- Tool tiles on every page link to the other tools.

## Adding a tool later
Add: a tile in the home grid (symbol, name), one `.html` from the template, one `js/tools/<name>.js`, and entries in COPY.md and assets.js. Nothing else should need to change.

## Phase 5 additions
New modules (all under /js, named exports, no build step):
- `sound.js` — Web Audio synthesizer (Round 2A). OFF by default, never autoplays, AudioContext created only after a user gesture. API: `play(name)`, `loopStart/loopStop(name)`, `setOn`, `setVolume(0-2)`, `setAmbience`, `onChange`, also the `sound` object. `sound-ui.js` renders and wires the navbar control (`soundControl()`, `mountSound()`).
- `intro.js` — first-visit intro on Home (remembered with an optional `localStorage` key `bd.intro.v1`; `?intro=1` replays it). Overlay markup is in index.html.
- `fx.js` — cursors (shard / yellow shard / pork-pie hat on the logo, built from `prop-pork-pie-hat.png` at runtime), hat-on-logo, hero parallax, scroll reveal, sound cues driven by `#tool[data-state]`, `body[data-page]` flag.
- `eggs.js` — Konami code and logo×5 easter eggs.
- `ui-kit.js` — side-effect-free helpers (`reducedMotion`, `toast`, `store`) so fx modules never import ui.js.
`office-decor.js` is now only a placeholder generator that `assets.js` uses for `scene('office')` while the real JPG is absent. Tool pages no longer mount it themselves.

## Round 1B-1 additions
- `js/scenes.js` (new): `sunsetScene()`, `nightScene()`, `labScene()` + `initScenes()` (parallax, visibility pause, reduced-motion and <768px rules). Called from `ui.js` `init()` right after `bind()`.
- `css/scenes.css` (new): layout and motion for all `.sc` scenes. Linked after `grade.css` on every page (404 loads it from its CSS list).
- `js/office-decor.js`: rewritten as a layered scene (wall, column + flags, blind light, desk + lamp, glow).
- `js/assets.js`: `LAYERED` map routes sunset/night/lab to `scenes.js`. Tool logic files are unchanged.

## Round 1B-2 changes
- `js/props-art.js` (new): detailed SVG for glasses, hazmatSuit, gasMask, barrel, blueCrystals, flask, cashPile, cactus, tumbleweed. `assets.js` imports it and `prop()` gives each drawing a unique id prefix. `css/components.css` gained the sparkle/bubble keyframes at its end. Tool logic, copy, pages and scenes are unchanged.

## Round 2A changes
- `js/sound.js` rewritten (synth, no files); `js/sound-ui.js` new; `ui.js` mounts the control (no more `hasAudio` check); `ASSETS.audio` and `hasAudio()` removed from `assets.js`; `fx.js` cues now cover every button/tile, warnings in `#msgs`, drop, processing, done, error; `eggs.js` adds a pizza thump. `copy.js` `nav.*` gained the sound labels. Tool modules, scenes, props and page markup are unchanged.

## Round 2B changes
- New: `css/motion.css` (linked last in all five pages; the 404 loader list has `motion`), `js/motion.js` (called from `ui.js` `init()`), a one-line head script on every page that adds `html.pg-fb` when `PageRevealEvent` does not exist.
- Edited: `intro.js` (2.4 s timer, fast skip, `play('tile')`/`play('curtain')`), `sound.js` (two new one-shots, `tile` and `curtain`), `result.js` (crystal burst), `progress.js` (RV uses `--p` instead of `left`; rendering only). Tool modules, copy, scenes, props and page structure are unchanged.

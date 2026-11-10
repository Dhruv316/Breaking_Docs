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
/js/
  assets.js                 SINGLE manifest of all /assets paths (+ placeholder fallback)
  ui.js                     Navbar, footer, theme, sound toggle, easter eggs, reduced-motion
  sound.js                  Audio manager (off by default)
  dropzone.js               Reusable drag-drop + file picker + validation
  progress.js               Themed progress components
  result.js                 Result screen, stamp, download handling
  format.js                 File size formatting, percent, helpers
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
- `sound.js` — audio manager. OFF by default, never autoplays. `available()` is false unless a file in `ASSETS.audio` has `present:true`; the navbar toggle is only rendered when it is true.
- `intro.js` — first-visit intro on Home (remembered with an optional `localStorage` key `bd.intro.v1`; `?intro=1` replays it). Overlay markup is in index.html.
- `fx.js` — cursors (shard / yellow shard / pork-pie hat on the logo, built from `prop-pork-pie-hat.png` at runtime), hat-on-logo, hero parallax, scroll reveal, sound cues driven by `#tool[data-state]`, `body[data-page]` flag.
- `eggs.js` — Konami code and logo×5 easter eggs.
- `ui-kit.js` — side-effect-free helpers (`reducedMotion`, `toast`, `store`) so fx modules never import ui.js.
`office-decor.js` is now only a placeholder generator that `assets.js` uses for `scene('office')` while the real JPG is absent. Tool pages no longer mount it themselves.

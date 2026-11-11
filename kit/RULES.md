# RULES.md — Constraints and quality bar

## Hard rules
1. **No backend. No uploads.** All processing in the browser.
2. **No build step.** Plain HTML/CSS/JS with ES modules. Must run by opening via any static server.
3. **Theme is mandatory everywhere** (DESIGN.md). Never ship a neutral-looking screen.
4. **All asset paths go through `/js/assets.js`.** If a file in ASSETS.md is missing, render a themed placeholder (CSS/SVG), do not break layout, do not 404 in the console loudly.
5. **All user-facing strings come from `/js/copy.js`**, mirroring COPY.md.
6. **Do not invent features** outside TOOLS.md. Ask nothing; follow the files.
7. No `localStorage` requirement. Keep state in memory.
8. Sound is OFF by default. Never autoplay audio. All sound is synthesized in `js/sound.js` (Web Audio); never add audio files.
9. Never hand the user a result bigger than the input in Compress.

## Libraries (CDN, pin exact versions, pick versions ≥ 2 weeks old)
- pdf-lib 1.17.1 (build/edit PDFs) — cdnjs
- pdf.js 3.11.174 + its worker (render PDF pages) — cdnjs. Load the worker via `workerSrc`; if cross-origin worker loading fails, create the worker from a Blob URL of the fetched script.
- JSZip 3.10.1 — cdnjs
- html2canvas 1.4.1 — cdnjs
- jsPDF 2.5.1 — cdnjs (only if pdf-lib embedding of slide images is awkward)
- pptx-preview (npm package, via jsDelivr UMD) — verify the exact version exists before pinning
- Fonts: Google Fonts (Anton, Barlow, Share Tech Mono) with real fallback stacks
If any library fails to load, show a themed error with a Retry button. Do not use any other libraries unless unavoidable; if used, say so.

## Code quality
- Small modules, one job each, named exports, JSDoc on public functions.
- Every async step wrapped in try/catch with a user-facing message from copy.js.
- Free memory: revoke Blob URLs, zero canvases, drop big arrays after use.
- Process long jobs in chunks and `await` a frame between chunks so the UI stays alive.
- Cancel support via AbortController where possible.

## Performance
- Images optimized (the owner supplies them; lazy-load below the fold, `decoding="async"`).
- Hero background uses `<picture>`/CSS image; video is `preload="metadata"`, muted, `playsinline`, `loop`, paused when tab hidden.
- Target Lighthouse performance ≥ 85 on desktop.

## Accessibility & responsive
- AA contrast, visible focus, keyboard reachable, labelled inputs, `aria-live="polite"` on progress and errors.
- `prefers-reduced-motion` respected; `prefers-color-scheme` supported.
- Works at 360px wide up to 1920px+.

## Quality checklist (the builder verifies before finishing each phase)
- [ ] Opens with no console errors (missing optional assets use placeholders silently)
- [ ] Theme is overpowered: background, character/prop, tile motif, hazard tape, grain, themed copy all present
- [ ] The tool works end-to-end on a real file, and the downloaded PDF opens
- [ ] Error paths tested: wrong type, too large, corrupt, cancel
- [ ] Mobile layout checked
- [ ] Reduced-motion checked
- [ ] No text outside COPY.md
- [ ] No uploads or network calls except library/font loads

## Never do
- Never use stock SaaS gradients, generic gray cards, or default fonts.
- Never use a bare spinner.
- Never say a result is "perfect" or "lossless".
- Never remove the "Fine print" honesty notes on PPT and Compress.

## Output format each phase
Deliver the complete working files for that phase, a 3-line summary of what changed, and a list of any assets that were missing and got placeholders.

## Scene art rules (Round 1B-1)
- Scenes are SVG/CSS only and live in `js/scenes.js` / `js/office-decor.js` / `css/scenes.css`. Do not add asset files for them.
- Parallax and ambient motion use `transform` and `opacity` only. No `filter` animation, no SMIL, no `top/left/width/height` animation.
- Every scene must pause when the tab is hidden or the scene is off-screen, and must be fully static under `prefers-reduced-motion`.
- Under 768px a scene shows fewer layers: mark optional layers or particles with `data-full`.
- Scenes never carry text and never sit above content. The dropzone and the main button stay the loudest elements; keep AA contrast behind headings and body copy.
- Real photos (`ASSETS.bg.<key>.present`) always win over the scene; do not change the grade or the photo assets from here.

## Prop art rules (Round 1B-2)
- Drawn props live in `js/props-art.js` as `(id)=>svg` functions, 100x100 viewBox, referenced only from `PROPS` in `js/assets.js`. Do not add asset files for them; a real file (`present:true`) always replaces the drawing.
- Every gradient, clip and `<use>` id must start with the passed prefix. Never hard-code ids in a prop.
- No filters, no SMIL, no text. Animate only `transform` and `opacity`, only on `.pa-sp` / `.pa-bub`, and keep a static, fully visible fallback for `prefers-reduced-motion`.
- Props are decorative: `aria-hidden` unless `prop()` is given an alt.

## Sound rules (Round 2A)
- Create the AudioContext only after a user gesture, and only while sound is on. Wrap every Web Audio call in try/catch; unsupported or suspended audio must be silent and log nothing.
- Every voice: attack >= 4 ms, exponential release, peak <= 0.3, routed through the master gain and limiter. No sound longer than ~1.2 s except the two loops (bubbling, ambience), which fade in and out.
- Trigger sounds only through `play(name)` / `loopStart` / `loopStop` from `sound.js`. Tool modules do not call it directly; cues come from `fx.js` (DOM state), `eggs.js` and the title card in `intro.js` (`tile`, `curtain`).
- Ambience is a separate opt-in, off by default, and stays off under `prefers-reduced-motion`.
- The toggle is always rendered. Preferences go in `localStorage` (`bd.sound.v1`) inside try/catch; blocked storage means off.

## Motion rules (Round 2B)
- Only `transform` and `opacity` may animate or transition. No `left/top/width/height`, no `box-shadow`, `filter`, `background` or `border-color` transitions. Glows are pseudo-elements whose opacity moves; colour states snap.
- All new motion lives in `css/motion.css` (last stylesheet on every page, also in the 404 loader list) and `js/motion.js`; one-off DOM effects (the result burst) live next to their component and must be `aria-hidden`, `pointer-events:none`, capped (about 30 elements) and removed within 1.5 s.
- Every animation must be off under `prefers-reduced-motion` (base.css does this globally; JS-created effects check `reducedMotion` and are not created) and paused while the tab is hidden (`html.sc-hidden`).
- Page transitions use cross-document View Transitions with a plain-fade fallback; they stay under 300 ms and must never delay, cancel or replace a navigation (no `preventDefault` on links).
- The dropzone and the big button stay the loudest elements: no new motion may out-shout their ping rings and drag pulse.
- Progress components are rendered with CSS custom properties (`--p` on the RV) plus transform; do not go back to `left`.

# RULES.md — Constraints and quality bar

## Hard rules
1. **No backend. No uploads.** All processing in the browser.
2. **No build step.** Plain HTML/CSS/JS with ES modules. Must run by opening via any static server.
3. **Theme is mandatory everywhere** (DESIGN.md). Never ship a neutral-looking screen.
4. **All asset paths go through `/js/assets.js`.** If a file in ASSETS.md is missing, render a themed placeholder (CSS/SVG), do not break layout, do not 404 in the console loudly.
5. **All user-facing strings come from `/js/copy.js`**, mirroring COPY.md.
6. **Do not invent features** outside TOOLS.md. Ask nothing; follow the files.
7. No `localStorage` requirement. Keep state in memory.
8. Sound is OFF by default. Never autoplay audio.
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

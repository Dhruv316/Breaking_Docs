# DESIGN.md — Breaking Docs visual system

## Principle: OVERPOWERED
Theme is in the **colors, type, buttons, backgrounds, cursors, loaders, errors, sounds, copy, and even the file-size numbers**. No neutral gray SaaS look anywhere. Every screen has: a Breaking Bad background, a character or prop, the periodic-tile motif, hazard tape somewhere, film grain, and themed words. Overpowered, but never at the cost of a usable tool: the drop zone and the main button are always the loudest, clearest things on a tool page.

## Color tokens (CSS variables on :root)
| Token | Hex | Use |
|---|---|---|
| --tile-green | #1E7A3C | Periodic tile fill, brand primary |
| --tile-green-dark | #0F4A22 | Tile borders, shadows |
| --hazmat | #F5C400 | Primary buttons, hazard tape, highlights |
| --heisenberg | #0A0C0A | Page base, text on yellow |
| --desert-orange | #E07B2A | Sunset gradients, warm accents |
| --sunset-red | #A63220 | Danger, errors, "burn" states |
| --blue-sky | #55D0FF | Crystal/progress/success glow |
| --dust | #D6C08F | Body text on dark, RV tones |
| --bone | #F2EBD8 | Headings on dark |
| --pink-bear | #F29BBE | Rare accent: error/easter eggs only |

Base: dark. Page background = `--heisenberg` with a themed image + dark overlay (min 55% opacity so text stays readable). Text contrast must be AA.
Also support `prefers-color-scheme: light`: swap to a "daylight desert" scheme (--dust/--bone backgrounds, --heisenberg text), same accents. Add `:root[data-theme]` overrides.

## Typography
- Display / headings / tile symbols: **Anton**, uppercase allowed for tile symbols and the logo only. Tight tracking.
- Body / UI: **Barlow** 400/600, 16–18px, line length under 70ch.
- Numbers, atomic-number labels, file sizes: **Share Tech Mono**.
- Scale: 14 / 16 / 20 / 28 / 44 / 72 / 120 (hero). Hero headline is huge.

## Signature motif: the element tile
Every tool and many UI blocks are periodic-table tiles:
- Square, `--tile-green` fill, 3px `--tile-green-dark` border, slight inner highlight.
- Top-left: tiny mono "atomic number" (the tool's order). Top-right: tiny mono "mass" (e.g. max file size).
- Center: huge Anton **symbol** (2 letters). Bottom: tool name, small.
- Hover: lifts, border turns `--hazmat`, soft green glow. Pressed: sinks 2px.
- Tool symbols: Image to PDF = **Im**, PPT to PDF = **Pp**, Compress PDF = **Cp**. Coming-soon tiles: Mg (Merge), Sp (Split), Ro (Rotate), Wm (Watermark), Pn (Page Numbers), Ul (Unlock) — dimmed, with char-hank.png "Not yet."
- The logo is built from this motif: **Br**eaking **D**ocs → tiles "Br" and "Dc" if the supplied logo is missing.

## Buttons
- **Primary ("big button")**: `--hazmat` fill, `--heisenberg` Anton text, thick bottom shadow (4px) like a physical key, hazard-stripe left edge. Hover brightens, pressed sinks. Min height 64px on tool pages.
- **Secondary**: transparent, 2px `--dust` border, mono small caps text.
- **Danger/Reset**: `--sunset-red`.
- Disabled: desaturated, no shadow, cursor not-allowed.
- Visible keyboard focus ring in `--blue-sky`, 3px.

## Backgrounds per page (from /assets)
- Home: bg-desert-sunset + (optional) bg-loop-desert.mp4 + char-heisenberg right side, huge.
- Image to PDF: bg-rv-desert + char-jesse.
- Compress PDF: bg-lab-interior + char-walter-hazmat.
- PPT to PDF: bg-office-albuquerque + char-saul.
- Result screen: bg-superlab + char-heisenberg + crystals sparkle.
- 404: bg-desert-night + char-gus.
Always overlay `texture-grain.png` (opacity .08–.12) and a radial vignette.

## Page chrome
- **Top bar**: black with a hazard-tape bottom border, logo left, nav (Tools, About), sound toggle right.
- **Footer**: bg-desert-night, char-gus peeking from the corner, small line of themed copy, hazard tape top.
- **Section dividers**: hazard tape strips, or a row of tiny element tiles.

## Tool page layout
1. Page title as a giant tile symbol + tool name + one-line promise.
2. **Drop zone** = "lab tray": big dashed hazard-stripe border, prop-barrel in a corner, prop-flask icon, text "Drop your files here".
3. Options panel (only what the tool needs) as a "lab sheet": mono labels, chunky controls.
4. Big button.
5. Progress = themed (see below). 6. Result = purity stamp + download.

## Themed progress & loaders
- **Image to PDF**: prop-rv drives left→right along a road while the percentage ticks. Text from COPY.md.
- **Compress PDF**: prop-flask fills with `--blue-sky` liquid, bubbles rise, "Cooking…".
- **PPT to PDF**: a stack of slides flips into a pile, Saul-style lines.
- Never show a bare spinner.

## Result screen
Giant rubber-stamp: **"99.1% PURE"** (Compress shows real % saved on the stamp, others show "PURE"). Blue crystals sparkle behind. Download button is the biggest element. Secondary: "Cook another batch" (restart), "Back to the lab" (home).

## Motion (purposeful, not constant)
- One page-load moment: home hero tiles "Br" + "Dc" flip in, then the tool grid stagger-reveals.
- Idle: faint heat-shimmer on the horizon, tumbleweed crosses the hero every ~25s.
- Interactions: tile hover, button press, drop-zone pulse when dragging, stamp slam on result.
- Respect `prefers-reduced-motion`: disable all of the above except instant state changes.

## Cursor & easter eggs
- Custom cursor: small crystal shard (hat on hover over the logo).
- Konami code → plays sfx-knock, character slides in.
- Click logo 5× → prop-pizza-roof falls.
- Footer: prop-los-pollos link "Visit Los Pollos".
All easter eggs are silent unless sound is toggled on.

## Responsive
Mobile first. Tiles 2-up on phone, 3-up tablet, 3×N desktop. Characters shrink and move behind content on phones (reduced opacity). Tap targets ≥ 48px.

## Accessibility floor
Alt text on all characters/props (decorative ones `alt=""`), visible focus, AA contrast, no audio autoplay, all functions keyboard-reachable.

---
## Phase 5 — Overpower pass (implemented)
- **Intro (Home, first visit only):** full-screen green stage, Br then Dc tiles flip in, tagline rises, overlay lifts after ~3.3 s. Skippable by button, click, Esc, Enter or Space. Skipped entirely with `prefers-reduced-motion`, with a `#hash` URL, or after the first visit. The hero tiles and hero character wait for the overlay to lift; the tool grid reveals when it scrolls into view.
- **Hero motion:** CSS heat-shimmer band on the horizon, tumbleweed crossing every ~25 s (now hopping), hero character pointer parallax (fine pointers only), tile hover = glow pulse + sheen sweep.
- **Result screen:** stamp slam now adds an impact ring, a short screen thud and a blue flash.
- **Cursors:** blue crystal shard by default, yellow shard on clickable things, pork-pie hat cursor on the logo plus a hat that drops onto the logo.
- **Easter eggs:** Konami → Heisenberg slides in with "I am the one who knocks." and the screen edges flash; logo ×5 (Home) → pizza lands on the roof (navbar) and bounces.
- **Per-page tuning:** grain and vignette are CSS variables (`--grain`, `--vig`, `--vcx`, `--vcy`, `--vin`) set per page in pages.css. Tool pages keep a clear vignette centre and a lighter global grain so the dropzone and big button stay the loudest elements (they also get a slow "ping" ring).
- **About cameo strip:** char-skyler, char-walter-jr, char-saul-alt under the promise tiles.
- **Sound:** off by default, toggle hidden until an audio file is present.

---
## Phase 6C-2 — Final QA (implemented)
- Skip link ("Skip to content") is the first tab stop; `html{scroll-padding-top}` keeps focused items clear of the sticky top bar.
- Progress components: the wrapper is `role="group"`; a separate hidden `role="progressbar"` carries the value (a progressbar's children are presentational, which hid the Cancel button from assistive tech). Progress text is announced through `role="status"` every 10%.
- Focus is moved on every state change: Cancel while processing, the result heading when done, the Cook button or dropzone after a cancel.
- Tile numbers/masses are solid white on a slightly deeper tile-green; "coming soon" tiles are dimmed with colour, not `filter`, so the "Not yet." tape keeps full contrast; About heading uses a lighter orange (#FFB066).
- Footer links and nav links are at least 48 x 48 px. Intro overlay traps Tab (`aria-modal`).
- Reduced motion also removes the SMIL heat-haze `<animate>` (CSS cannot stop SMIL).
- Below 480 px a long hero word may wrap if Anton fails to load, instead of being clipped.

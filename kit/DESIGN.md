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
- **Intro (Home, first visit only):** full-screen dark stage (reworked in Round 2B, see below), Br then Dc tiles flip in, tagline fades in, curtain lifts after ~2.4 s (about 3 s in all). Skippable by button, click, Esc, Enter or Space. Skipped entirely with `prefers-reduced-motion`, with a `#hash` URL, or after the first visit. The hero tiles and hero character wait for the overlay to lift; the tool grid reveals when it scrolls into view.
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

## Round 1A — Cinematic grade (implemented)
- ONE shared treatment for every character photo (`css/grade.css`, `js/grade.js`): SVG split-tone grade (warm shadows, slightly crushed blacks) -> rim light -> halo (hazmat yellow on Home / Image to PDF / PPT / eggs, tile green on Compress / result / 404 / footer / cameos) -> drop shadow, then feathered masks on all four edges (defaults 8/8/6/7%, set `--fb --fl --fr --ft`). Edges always fade a little: the halo is clipped by the mask box and would otherwise show a faint rectangle.
- Home hero is low-res: `.char--lowres` adds a 0.55px soften, film grain and a vignette clipped to the silhouette (the photo itself is the mask via `--src`), plus a 3px rim.
- 404 full-body figure: no masks, 441px tall (1.25x of 353px), stands on the hazard tape with a ground shadow.
- Backgrounds: `.scene-img` has a real style now. `data-bg=pilot` is blurred 1.4px, tinted, extra grain, and its right 40% fades out on desktop. `superlab` uses two crops via `--bgx --bgy --bgz --bgo`: Compress = lower-right, green; result = top-right, blue. Both avoid the face so there is never a second Walter.
- Progress RV is `prop-rv.png` with its ground strip feathered by a radial mask; width is `--rv-w`.

## Round 1B-1 — Top-level scene art (implemented)
SVG/CSS only, no new files in /assets. Real photos and the Part A grade are untouched. Code: `js/scenes.js` (sunset, night, lab, parallax engine), `js/office-decor.js` (office), `css/scenes.css`.
- **Desert sunset (Home hero):** sky gradient, sun + halo + slow-rotating light rays, distant mesas, mid mesas, foreground rocks + saguaros, drifting dust, heat shimmer band, subtle lens flare (ghosts along the sun-to-centre line). The old flat `.hero .shimmer` is hidden when the scene is present.
- **Desert night (footer, 404, dark sections):** starfield (~120 stars, 3 twinkling groups), moon with glow, moonlit mesa silhouettes, saguaros, two drifting mist bands.
- **Office (PPT to PDF):** wall + frames + neon, column + flags, window-blind light stripes (slow drift), desk with banker's lamp and warm flickering glow.
- **Lab interior (Home "About" strip):** glassware shelves (flasks, beakers, test tubes), steam, blue-green light beams and glow.
- **Layers:** every scene is a stack of `.sc-l` layers with `data-kx` (horizontal, pointer) and `data-ky` (vertical, scroll) factors; far layers move least in X, near layers most.
- **Motion budget:** parallax = `translate3d` on layers only; ambient motion = transform/opacity keyframes only. No filters, no SMIL, no layout reads after writes (reads batched, then writes).
- **Pauses:** whole page when the tab is hidden (`html.sc-hidden`), each scene when off-screen (`.sc-off`, via IntersectionObserver). Both set `animation-play-state: paused`.
- **Reduced motion:** all `.sc` animation and transitions off, parallax never applied, dust/steam/shimmer hidden; scenes stay as still art.
- **Under 768px:** layers marked `data-full` are removed (distant mesas, flare, rays, extra dust, mist, light beams, extra steam); transitions off; blind drift, lamp flicker and star twinkle off.
- **Text safety:** sun and halo sit away from the headline; hero headline/subtitle contrast sampled equal to or better than Round 1A (headline 4.5:1 on the brightest 5% of pixels behind it, subtitle 6.5:1).

## Round 1B-2 — Drawn prop art (implemented)
All nine remaining drawn props were redrawn as detailed inline SVG in `js/props-art.js`, under the same `ASSETS.props` keys, so no caller changed. Real files still win: `prop-rv`, `prop-pizza-roof`, `prop-pork-pie-hat`, `prop-los-pollos`, `prop-pink-bear` are untouched.
- **Shared style:** 100x100 viewBox, dark ink outline, 2-4 tone gradient shading, a rim/glare highlight, a soft ground shadow. No SVG filters, no text, no SMIL.
- **Props:** glasses (black rounded frames, tinted lenses with glare), hazmat suit (hood, visor, respirator, gloves, boots, hazard patch), gas mask (rubber shield, metal-ringed lenses, filter canister, straps), barrel (green drum, hoops, bungs, hazard label, scuffs), blue crystals (faceted shards, rim lights, sparkles), flask (glass, liquid with meniscus, bubbles), cash pile (banded bundles in 3/4 view, loose bill), cactus (ribbed saguaro, spines, flower), tumbleweed (generated tangle of twigs, three passes: shadow, body, highlight).
- **Unique ids:** `prop()` passes a fresh prefix (`pa0`, `pa1`, ...) into each drawing, so gradients and clip paths never collide when one prop is on the page several times (3 cacti, 5 crystals).
- **Motion:** only crystal sparkles (`.pa-sp`) and flask bubbles (`.pa-bub`) move, with `transform`/`opacity` only (end of `css/components.css`). They pause under `html.sc-hidden` and are static and fully visible under `prefers-reduced-motion`. The placement transform sits on a wrapper `<g>`; CSS animates the inner element so it is never overridden.
- **Placement unchanged:** sizes, drop-shadows and the tumbleweed hop still come from the existing container CSS. The tumbleweed is still a root `<svg>` so `.tumble svg{animation:hop}` applies.
- **Contrast:** props are decorative (`aria-hidden`); outlines are dark with a light rim so they read on both dark panels and the light page base. The dropzone and big button stay the loudest elements (props are 44-92 px with no new glow).

## Round 2A — Sound (implemented)
Everything is synthesized with the Web Audio API in `js/sound.js`; no audio files exist or are needed.
- **Rules:** OFF by default, never autoplays. The AudioContext is created only after a user gesture AND only when sound is on, so a remembered "on" becomes audible on the first click/key/tap of the next visit. Unsupported, blocked or suspended audio fails silently (no console output).
- **Sounds:** `click` (soft blip), `drop` (low thud), `bubbling` (lab loop: random bubble pops over a faint simmer, only while a tool is processing), `success` (four-note rising chime), `error` (two soft low buzzes), `knock` (three door knocks, Konami egg), `thump` (two thuds, logo x5 pizza egg), `ambience` (quiet looping desert wind: filtered brown noise with slow LFOs plus a faint whistle band).
- **Safety:** every voice has an attack of at least 4 ms and an exponential release; per-voice peaks capped at 0.3; master volume steps 0.4 / 0.7 / 1.0 (default Medium); a hard limiter then a x0.45 output trim. Measured at the destination, the loudest one-shot at High peaks at about 0.26 (-12 dBFS), ambience about 0.05. Turning sound off fades out, then suspends the context; hiding the tab suspends it too.
- **Ambience:** separate option in the same control, off by default, ducks to 30% under any one-shot and recovers. It is never allowed under `prefers-reduced-motion` (the option is disabled with a note).
- **Navbar control:** the toggle is always visible (icon + "Sound off/on" text above 700 px, icon only below), `aria-pressed` + `aria-label="Sound"`, 48 px targets. A chevron button opens a popover with three volume steps and the ambience switch (`aria-expanded`, Esc closes and returns focus, click outside or tabbing away closes). State lives in `localStorage` key `bd.sound.v1` inside try/catch; if storage is blocked the site simply starts off and works for the session.
- **Hooks (no tool code touched):** `fx.js` plays `click` for every button, tile and nav link, `drop` on drop, starts/stops `bubbling` from `#tool[data-state]`, plays `success` on done and `error` on error or when a warning lands in `#msgs`; `eggs.js` plays `knock` and `thump`.

## Round 2B — Motion (implemented)
New files: `css/motion.css` (loaded last on every page, incl. the 404 loader list) and `js/motion.js`. Nothing in tools, copy, scenes, props or page markup changed; two small shared-component edits: `progress.js` (RV position) and `result.js` (burst).
- **Title card (Home, first visit, `?intro=1` replays):** dark stage with a faint green-blue halo. `Br` flips in at 0.2 s, `Dc` at 0.55 s, each with a soft glow (opacity of a pseudo-element, not box-shadow); the tagline fades in at 1.3 s; at 2.4 s the curtain (hazard-tape hem) lifts away on a 0.62 s `translateY`, and the hero tiles start flipping underneath as it goes. Skip by click, Esc, Enter, Space or the Skip button (lifts in 0.35 s). Sound cues, only when sound is on: `tile` at the two flips, `curtain` at the lift. The inline 8-second failsafe in the head script is unchanged. Reduced motion skips the title card entirely (unchanged).
- **Page transitions:** `@view-transition{navigation:auto}` (cross-document View Transitions) with a 0.12 s fade-out of the old page and a 0.18 s fade-in of the new one (under 300 ms, `mix-blend-mode` normal so it never flashes bright). The top bar has its own `view-transition-name` and stays put. The browser owns the transition and never waits on the page, so navigation is never blocked. Browsers without `pagereveal` get `html.pg-fb` from a one-line head script: the new page fades in over 0.2 s and a plain click on an internal link fades the old page out over 0.12 s. The fallback never calls `preventDefault`, ignores downloads, `target`, modifier clicks, other origins and same-page `#hash` links, and clears itself after 1.5 s if no navigation happens. Under reduced motion neither runs.
- **Result screen (once per result):** stamp `slamB` — drops from 3.4x, squashes to 0.88x at impact (0.43 s after the panel appears), overshoots to 1.09x, settles; the old impact ring and blue flash still fire at the same moment. The panel shakes for 250 ms with a transform-only `translate3d` (max 5 px). 30 crystal shards (`.res-burst i`, a clip-path diamond with a blue gradient) burst out from behind the stamp at impact, `pointer-events:none`, `aria-hidden`, done by 1.45 s, the wrapper removed after 1.5 s. `result.js` places them with a `ResizeObserver` on the stamp, so timing is right even though the panel is hidden while the result is built. No burst under reduced motion.
- **Micro-interactions:** tile hover = lift 8 px + slight scale, inner glow pulse and sheen sweep; button press sinks 3 px with a tiny squeeze; dropzone while dragging swells 1.2 %, the blue glow layer (`.tray-in::after`) pulses in opacity and the flask bobs (replaces the old box-shadow pulse); file cards (image thumbnails, PDF card, deck card) slide in from the left with a small stagger — the thumbnail class is added once per new tile, so reordering never replays it; the RV progress is now a `translateX` on a track one RV-width shorter than the road, easing over 0.45 s (the flask liquid eases over 0.5 s); the big button and the dropzone ping rings are unchanged and still the loudest things.
- **Rules of motion:** only `transform` and `opacity` move. Colour/border/shadow states change instantly (`.tile`, `.btn`, `.tray-in`, `.seg span`, `.act`, `.nav a` no longer transition them). Under `prefers-reduced-motion` every animation and transition is off (base.css) and view transitions are not opted in. While the tab is hidden, `html.sc-hidden` (set by scenes.js) pauses every animation.

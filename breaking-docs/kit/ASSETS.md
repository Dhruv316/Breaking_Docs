# ASSETS.md — Every file the owner will provide

All files go in `/assets/` using EXACTLY these names. Code must reference them only through `/js/assets.js` (one manifest). **If a file is missing, the builder generates a themed CSS/SVG placeholder and keeps the same path in the manifest, so dropping in the real file later needs no code change.**

## A. Logo & branding
| File | Format | Spec | Used where |
|---|---|---|---|
| logo-breaking-docs.png | PNG transparent | ~1200px wide, Br/Ba tile style, "Breaking Docs" wording | Navbar, loader, footer |
| logo-brba-tiles.svg | SVG or PNG | square, the Br + Ba element tiles | Favicon, tool-page badge, watermark |
| favicon.png | PNG | 512×512 | Browser tab |
| og-image.jpg | JPG | 1200×630 | Link previews |

## B. Backgrounds (JPG, optimized < 400 KB each unless noted)
| File | Spec | Used where |
|---|---|---|
| bg-desert-sunset.jpg | 1920×1080 | Home hero |
| bg-desert-night.jpg | 1920×1080 | Footer, 404, dark sections |
| bg-lab-interior.jpg | 1920×1080 | Compress PDF page |
| bg-rv-desert.jpg | 1920×1080 | Image to PDF page |
| bg-office-albuquerque.jpg | 1920×1080 | PPT to PDF page (Saul's office vibe) |
| bg-superlab.jpg | 1920×1080 | Result / success screen |
| texture-grain.png | 512×512 tileable, transparent | Film-grain overlay everywhere |
| texture-hazard-stripes.png | 256×256 tileable | Hazard tape borders (can be CSS instead) |

## C. Character cutouts (PNG, transparent background, ~1000px tall)
| File | Used where |
|---|---|
| char-heisenberg.png (hat + glasses, serious) | Home hero (big), result screen |
| char-walter-hazmat.png (yellow suit + mask up) | Compress PDF page |
| char-jesse.png | Image to PDF page |
| char-saul.png | PPT to PDF page |
| char-gus.png | 404 page, footer |
| char-mike.png | Error states |
| char-hank.png | "Coming soon" tiles |
| char-skyler.png (optional) | About section |
| char-walter-jr.png (optional) | Easter egg |

## D. Props & icons (PNG/SVG transparent, ~512px)
| File | Used where |
|---|---|
| prop-pork-pie-hat.png | Cursor/hover easter egg, loader |
| prop-glasses.png | Loader |
| prop-rv.png | Image to PDF progress bar vehicle |
| prop-hazmat-suit.png | Compress icon |
| prop-gas-mask.png | Error icon |
| prop-barrel.png | Upload drop zone corner |
| prop-blue-crystals.png | Progress fill, result stamp, sparkles |
| prop-flask.png | Loader, Compress progress |
| prop-cash-pile.png | Success screen |
| prop-pink-bear.png | Error screen |
| prop-los-pollos.png | Footer easter egg |
| prop-pizza-roof.png | Hidden easter egg |
| prop-cactus.png | Desert decoration |
| prop-tumbleweed.png | Idle animation |

## E. Audio (MP3, short, under 150 KB each, all optional)
| File | Length | Trigger |
|---|---|---|
| sfx-click.mp3 | <0.3s | Button click |
| sfx-drop.mp3 | <1s | File dropped |
| sfx-bubbling.mp3 | loop 3–5s | While processing |
| sfx-success.mp3 | <3s | Download ready |
| sfx-error.mp3 | <2s | Error |
| sfx-knock.mp3 | <2s | Easter egg ("I am the one who knocks") |
| music-theme-loop.mp3 | 30–60s loop | Optional background, OFF by default, toggle in navbar |

## F. Video / animation (optional)
| File | Spec | Used where |
|---|---|---|
| bg-loop-desert.mp4 | 8–15s loop, muted, <3 MB | Home hero behind Heisenberg |
| intro-title-card.mp4 | 3–5s, <2 MB | First-visit intro (skippable) |

## G. Fonts
Loaded from Google Fonts: Anton, Barlow, Share Tech Mono. Owner may add `fonts/brba-title.woff2` (show-style title font) → if present, use it for the logo wordmark only.

## H. Copy to supply (optional)
`quotes.txt` — one short line per row, used for loading messages. If missing, use COPY.md.

## Totals
~8 backgrounds/textures, 9 characters, 14 props, 7 audio, 2 video, 4 branding = ~44 files. Everything optional except section A and at least one background + char-heisenberg.png.

---
## DELIVERED STATUS (authoritative — overrides the tables above where they conflict)
All delivered files sit FLAT in `/assets/` (no subfolders). Use exactly these names.

**Present (real files):**
- Branding: logo-breaking-docs.png, logo-brba-tiles.svg, favicon.png, og-image.jpg
- Textures: texture-grain.png, texture-hazard-stripes.png
- Characters: char-heisenberg.png, char-walter-hazmat.png, char-jesse.png, char-saul.png (desk, pointing, wide), char-saul-alt.png (pink shirt, pointing, tight crop), char-gus.png, char-mike.png, char-hank.png, char-skyler.png, char-walter-jr.png
- Props: prop-pork-pie-hat.png, prop-los-pollos.png, prop-pink-bear.png

**Missing → use themed CSS/SVG placeholders, never block:**
- Backgrounds: bg-desert-sunset, bg-desert-night, bg-lab-interior, bg-rv-desert, bg-office-albuquerque, bg-superlab → build these as rich CSS/SVG scenes (gradients, silhouettes of mesa/cactus/RV/lab glassware, grain overlay), using the same asset paths in assets.js so real photos can replace them later.
- Props: glasses, rv, hazmat-suit, gas-mask, barrel, blue-crystals, flask, cash-pile, pizza-roof, cactus, tumbleweed → draw as inline SVG.
- All audio and video → skip. Keep sound.js and the toggle, but hide the toggle if no audio files exist. No video: hero uses a CSS heat-shimmer animation instead.

**Character notes:** cutouts have transparent backgrounds and different crops (some are head-and-shoulders, some full body). Use CSS object-fit/position and mask-image fades so crops look intentional. Characters are real photos: place them large and let them bleed off the edge of the frame, with a vignette and a tinted overlay so they sit inside the scene.
**Page assignments:** Home: char-heisenberg. Image to PDF: char-jesse. Compress: char-walter-hazmat. PPT to PDF: char-saul. 404: char-gus. Errors: char-mike. Coming-soon tiles: char-hank. About/footer strip: char-skyler, char-walter-jr, char-saul-alt (optional small cameo).

---
## PHASE 5 — how real files drop in (authoritative)
- Backgrounds: `scene(key)` in `/js/assets.js` always paints the placeholder first. When `ASSETS.bg.<key>.present` is `true`, the real `<img>` is laid on top; if it fails to load it removes itself and the placeholder shows. To go live: put `bg-<name>.jpg` in `/assets` and flip that one flag to `true`. Nothing else changes (the PPT page no longer has an office mount).
- Custom placeholders per key live in the `PLACEHOLDERS` map in assets.js (`office` → `office-decor.js`).
- Audio: put `sfx-click.mp3`, `sfx-drop.mp3`, `sfx-bubbling.mp3`, `sfx-success.mp3`, `sfx-error.mp3`, `sfx-knock.mp3` and/or `music-theme-loop.mp3` in `/assets` and set `present:true`. The navbar sound toggle appears automatically; it starts OFF.
- Still placeholders: all six `bg-*` scenes, props glasses / rv / hazmat-suit / gas-mask / barrel / blue-crystals / flask / cash-pile / pizza-roof / cactus / tumbleweed, all audio, all video.

# PROJECT.md — Breaking Docs

## What it is
**Breaking Docs** is an iLovePDF-style website where every pixel is Breaking Bad. Users pick a tool, drop a file, press one big button, download the result. No login. No server. Files never leave the browser.

## The one rule that beats every other rule
**The Breaking Bad theme is OVERPOWERED.** It is not a skin on top of a normal PDF site. It is the product. If a screen could belong to any other PDF site, it is wrong. See DESIGN.md.

## Tools (v1 — only these three)
1. **Image to PDF** — any image format (JPG, PNG, WEBP, GIF, BMP, SVG, HEIC if supported, TIFF if feasible) → one PDF.
2. **PPT to PDF** — .pptx → PDF, decent fidelity, in-browser.
3. **Compress PDF** — shrink PDF size with 3 strength presets, show before/after.

More tools come later (merge, split, rotate, etc.). Build so adding a tool = adding one tile + one page + one tool module.

## Stack
- Static multi-page site. Plain HTML + CSS + vanilla JS (ES modules). **No build step, no backend.**
- Libraries are loaded from CDN (see RULES.md).
- All processing is client-side.

## Users
Students, office people, anyone who Googles "jpg to pdf". They want fast and obvious. The theme is the fun, never the friction.

## Success looks like
- A stranger lands on the home page and says "whoa" within 2 seconds.
- Each tool works in 3 clicks: choose file → press the big button → download.
- Output quality is decent (not perfect) and honest limits are shown in the UI.
- Swapping any image in /assets requires zero code change.

## Out of scope (v1)
Accounts, payments, cloud storage, server processing, mobile app, languages other than English, legacy binary .ppt files (show a themed "convert to .pptx first" message).

## Build order
See PROMPTS.md. Phases: 1 Foundation + home → 2 Image to PDF → 3 Compress PDF → 4 PPT to PDF → 5 Overpower pass (motion, audio, easter eggs) → 6 QA.

## Files the builder must read first
PROJECT.md → DESIGN.md → ASSETS.md → STRUCTURE.md → TOOLS.md → COPY.md → RULES.md

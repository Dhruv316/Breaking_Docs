# PROMPTS.md — Paste one per step into the builder Claude

Attach the whole kit (all .md files) and your /assets files to the first message of the conversation. Later phases: re-attach the previous phase's output files.

## Phase 1 — Foundation + Home
Read SKILL.md, then all kit files in order. Build Phase 1: the folder structure, tokens.css, base.css, components.css, assets.js with placeholders for any missing asset, ui.js, the shared navbar/footer, and the full Home page (hero, tile grid with 3 live tiles + coming-soon tiles, promise tiles). Theme must be overpowered. Output complete files and the RULES.md checklist result.

## Phase 2 — Image to PDF
Using the Phase 1 files, build image-to-pdf.html and js/tools/image-to-pdf.js exactly per TOOLS.md section 1, with dropzone.js, progress.js (RV progress), result.js (stamp + download). Test mentally against all edge cases. Output only new/changed files.

## Phase 3 — Compress PDF
Build compress-pdf.html and js/tools/compress-pdf.js exactly per TOOLS.md section 3 (flask progress, presets, before/after, never-bigger rule, fine print). Reuse shared modules. Output only new/changed files.

## Phase 4 — PPT to PDF
Build ppt-to-pdf.html and js/tools/ppt-to-pdf.js exactly per TOOLS.md section 2 (slide-by-slide progress, .ppt error, fine print). If the pptx rendering library is a problem, choose the best CDN-loadable approach and note it. Output only new/changed files.

## Phase 5 — Overpower pass
Take the whole site and push the theme to maximum: sound.js with toggle, loader/intro, hero motion, tumbleweed, stamp slam, custom cursor, Konami and logo easter eggs, per-page character placement, grain/vignette tuning. Respect reduced motion and keep tools usable. Output changed files.

## Phase 6 — QA
Audit the full site against the RULES.md checklist and TOOLS.md edge cases. Fix every issue found. Output changed files and a short list of what was fixed.

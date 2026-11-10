# COPY.md — Every word in the app

Voice: confident, dry, a little menacing, always clear about what the button does. Show-flavored lines are seasoning; instructions stay plain. Sentence case except tile symbols and logo. No exclamation marks except where noted.

## Brand
- Name: **Breaking Docs**
- Tagline: "Break it down. Build it back."
- Footer line: "Your files never leave this browser. That's the business model."

## Home
- Hero headline: "We cook documents."
- Hero sub: "Images, slides, and bloated PDFs. Done in your browser. Pure and private."
- Hero button: "Start cooking"
- Tool grid heading: "The product"
- Coming-soon tile note: "Not yet."
- Promise tiles: "Private — nothing is uploaded." / "Free — no signup, no limits." / "Pure — decent output, honest limits."

## Tools
| Tool | Name | Promise | Big button | Progress verb |
|---|---|---|---|---|
| Im | Image to PDF | Turn any picture into a clean PDF. | Cook it into PDF | Loading the RV… |
| Pp | PPT to PDF | Turn your slides into a PDF that holds up. | Present it as PDF | Slide {n} of {total}… |
| Cp | Compress PDF | Cut the size. Keep the quality. | Cook it down | Cooking… {percent}% |

## Dropzone
- Idle: "Drop your files here"
- Sub: "or click to choose. Nothing leaves your device."
- Dragging over: "Yeah. Right there."
- Accepted types line: "{types} · up to {size}"

## Progress / loading lines (rotate randomly)
- "Cooking… keep the lid on."
- "Measuring purity."
- "Calling the lab."
- "Stay out of the way. Almost done."
- "Tread lightly."
- "Applying science."

## Result
- Stamp: "99.1% PURE" (Compress: "{percent}% SMALLER")
- Heading: "Say my name." → button "Download your PDF"
- Stats: "Before {a} → After {b}" / "{n} pages"
- Secondary: "Cook another batch" / "Back to the lab"
- Already pure (compress can't improve): "Already pure. Nothing left to cut."

## Options labels
- Page size / Orientation / Margin / Fit: "Page size", "Orientation", "Margin", "Fit"
- Compress presets: "Street grade (light)", "Lab grade (recommended)", "Blue Sky grade (extreme)"
- Fine print link: "Fine print"

## Errors (state what happened and how to fix it)
- Wrong file type: "That's not what we cook here. Use {types}."
- File too large: "Too much product. Max {size} per file."
- Corrupt file: "This one's contaminated. Try a different copy."
- Skipped files: "Skipped {n} file(s) we couldn't read: {names}."
- Legacy PPT: "Old .ppt format. Open it in PowerPoint and save as .pptx, then come back."
- Password PDF/PPT: "This file is locked. Remove the password first, then try again."
- Out of memory: "The batch is too big for this browser. Try fewer or smaller files."
- Generic: "Something went wrong. Reload and try again."
- Cancelled: "Batch cancelled."

## 404
- Heading: "You're not supposed to be here."
- Sub: "This page doesn't exist." Button: "Back to the lab"

## Misc
- Sound toggle: "Sound off" / "Sound on"
- Reduced motion note: none needed.
- Easter egg line (Konami): "I am the one who knocks."
- Easter egg (logo ×5): "Pizza's on the roof."

## Phase 2 additions (Image to PDF, 404) — mirrored in /js/copy.js
- Dropzone: "Up to {n} files per batch." / aria label "Choose image files"
- Accepted types list: "JPG, PNG, WEBP, GIF, BMP, SVG, AVIF, HEIC, TIFF"
- Progress: "Image {n} of {total}" / "Cancel"
- Result: "{n} pages" / "1 page"
- Grid: "Add more", "Rotate", "Remove", "Rotate {name} 90 degrees", "Remove {name}", "Drag to reorder, or hold Alt and press an arrow key.", "{name} moved to position {n} of {total}.", "Your images, in page order"
- Options: "Lab sheet"; Page size: "Fit to image" / "A4" / "US Letter"; Orientation: "Auto" / "Portrait" / "Landscape"; Margin: "None" / "Small" / "Big"; Fit: "Contain" / "Cover"
- Errors: "Too many files. Max {n} per batch, so we skipped {extra}." / "HEIC and TIFF depend on your browser. Convert those to JPG or PNG, then add them again." / "The lab equipment (pdf-lib) didn't load. Check your connection, then try again." / "Try again"
- Notes: "Big images were scaled down to 4000 px on the long side so your browser stays alive."

## Phase 3 additions (Compress PDF) — mirrored in /js/copy.js
- Dropzone types line: "PDF · up to 100 MB" ({types} = "PDF")
- Progress: "Page {n} of {total}" (detail line under "Cooking… {percent}%")
- Result (Compress): stamp "{percent}% SMALLER"; stats "Before {a} → After {b}" / "{n} pages"; already pure: stamp "PURE", heading "Already pure. Nothing left to cut.", button "Get your original back"
- Presets: "Street grade (light)" / "Lab grade (recommended)" / "Blue Sky grade (extreme)"; spec line "{dpi} DPI · quality {q}%"
- Fine print: link "Fine print"; always-visible line "Pages become images, so text won't be selectable."; inside: "Text-only PDFs may not shrink much." / "Want sharper pages? Pick Street grade." / "Very large pages are rendered at a lower DPI to fit your browser's memory."
- Errors: "One PDF at a time. We took {name}." / "This file is locked. Remove the password first, then try again." / "The lab equipment (pdf.js) didn't load. Check your connection, then try again." / "{n} pages. This one takes a while, so we cook it in batches. Keep this tab open."
- Notes: "Some very large pages were rendered at a lower DPI to fit your browser."
- Preview alt: "First page preview"

## Phase 4 additions (PPT to PDF) — mirrored in /js/copy.js
- Dropzone: types list "PPTX, POTX" ({types} in "{types} · up to 50 MB"); aria label "Choose a PowerPoint file"
- Deck card: "{n} slides" / "1 slide"; preview alt "First slide preview"
- Progress: big line "Slide {n} of {total}…" (from the Tools table); phases "Opening the deck…" / "Binding the pages…"; cancel "Cancel"
- Progress lines (Saul-style, rotate): "Presentation is everything. Ask my billboards." / "Objection sustained. Slide approved." / "Filing slides, no billable hours." / "Counselor's rule: no slide left behind." / "Stamping each page. Notarized, more or less." / "Keep this tab open. It's a retainer."
- Options: "Quality" → "Standard" ("1.5x · smaller file") / "High" ("2x · sharper slides"), default High; "Include slide numbers" → "Off" / "On", default Off
- Fine print: link "Fine print"; always-visible line "Text becomes part of the image, so it won't be selectable in this version."; inside: "Fonts are swapped for similar ones, so line breaks and spacing can shift." / "SmartArt, animations and embedded video may differ from PowerPoint." / "Check the PDF before you send it. We never promise a perfect match."
- Errors: legacy .ppt "Old .ppt format. Open it in PowerPoint and save as .pptx, then come back." / locked "This file is locked. Remove the password first, then try again." / zero slides "This deck has no slides. Open it in PowerPoint, add one, save it again, then come back." / library "The lab equipment (slide renderer) didn't load. Check your connection, then try again." / "One deck at a time. We took {name}." / 100+ slides "{n} slides. This one takes a while, so keep this tab open."
- Notes (result): "{n} slide(s) couldn't be drawn and came out blank: {list}." / "Some very large slides were rendered at a lower scale to fit your browser."
- Alt: "Saul at his desk, pointing straight at you"
- Result: filename `<original-name>.pdf`, stamp and heading as in Result above; stats "{n} pages" · size

## Phase 5 additions (Overpower pass) — mirrored in /js/copy.js
- Intro: tagline "Break it down. Build it back." / skip button "Skip intro" / aria "Welcome to Breaking Docs"
- About cameo strip: heading "The family business"; captions "Keeps the books." (Skyler) / "Approves of the breakfast." (Walter Jr.) / "Handles the paperwork." (Saul)
- Alt text added: skyler, walterJr, saulAlt, greenShirt ("Walter in a green shirt, standing alone in the desert")
- Easter egg lines unchanged ("I am the one who knocks." / "Pizza's on the roof.")

## Phase 6C-1 additions (QA) — mirrored in /js/copy.js
- Skip link: `nav.skip` = "Skip to content" (first focusable element, jumps to `main`).
- Aria labels that were hard-coded now live in copy: nav landmark `nav.aria` = "Main"; cameo list `about.aria` = "Cameos". HTML binds the latter with `data-copy-aria="about.aria"`.
- Existing keys now actually used: `dropzone.label` ("Choose image files") and `dropzone.pdfLabel` ("Choose a PDF file") label the dropzone button on Image to PDF and Compress PDF, like `dropzone.pptLabel` already did on PPT to PDF.
- Not in copy.js on purpose: tile symbols and numbers (Br, Dc, Im, 404, ??), which COPY.md exempts, and the `<title>` / meta description in each page's static `<head>` (a no-JS and crawler fallback; JS sets the same titles from copy.js at runtime).

## Creator credit — mirrored in /js/copy.js (`credit`)
- `credit.by` = "Created by"; `credit.aria` = "Created by Dhruv Rane" (aria-label + tooltip).
- `credit.name` = D + tiles H(1) Ru(44) V(23), gap, tiles Ra(88) Ne(10).

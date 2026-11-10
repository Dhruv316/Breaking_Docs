# TOOLS.md — Behavior of each tool

All tools: 100% client-side. Show file name + size for each chosen file. Validate type and size before processing. Errors use COPY.md voice and explain how to fix. Processing must not freeze the UI (yield to the event loop between pages/slides; use progress callbacks).

---
## 1. Image to PDF (`Im`)

**Accepts:** JPG/JPEG, PNG, WEBP, GIF (first frame), BMP, SVG, AVIF, HEIC/HEIF (try if the browser can decode; otherwise themed message), TIFF (best effort). Multiple files, up to 100 files, up to 25 MB each.

**Pipeline:** decode each image via `createImageBitmap` / `<img>` → draw to canvas when conversion is needed (non-JPG/PNG) → embed with pdf-lib (JPG embedded as-is, PNG as-is, everything else re-encoded to PNG or JPEG) → one page per image.

**UI**
- Thumbnail grid of added images, drag to reorder, per-image rotate 90° and remove buttons, "Add more" tile.
- Options:
  - Page size: **Fit to image** (default), A4, US Letter.
  - Orientation: Auto (default), Portrait, Landscape.
  - Margin: None (default), Small, Big.
  - Image fit when page is fixed: Contain (default) / Cover.
- Big button: "Cook it into PDF".
- Result: one PDF, name `breaking-docs-images.pdf`. Show page count and size.

**Edge cases:** EXIF orientation respected; very large images downscaled to max 4000px longest side to avoid memory crashes (tell the user in a small note); transparent PNG on a white page background; corrupt file → skip it, list it in a themed warning, still build the rest; zero valid files → disable button.

---
## 2. PPT to PDF (`Pp`)

**Accepts:** `.pptx` only, one file, up to 50 MB. `.ppt` (legacy binary) → friendly error telling the user to save as .pptx first. Also accept `.potx` if trivially supported.

**Pipeline (in-browser, best effort):**
1. Read file with JSZip / use `pptx-preview` to render each slide into an offscreen container at 16:9 or the deck's own size.
2. Rasterize each slide with html2canvas at scale 2.
3. Place each slide image on its own PDF page (pdf-lib or jsPDF) matching slide aspect ratio.
4. Update progress per slide ("Slide 4 of 18").

**UI**
- Shows slide count after upload, and a small first-slide preview.
- Options: Quality (Standard = scale 1.5, High = scale 2, default High); Include slide numbers (off).
- Big button: "Present it as PDF".
- Result: `<original-name>.pdf`.

**Honest limits (show in a collapsible "Fine print" under the button):** text becomes part of the image (not selectable) in this version; unusual fonts, SmartArt, animations, and embedded video may differ from PowerPoint. Never claim perfect output.

**Edge cases:** password-protected deck → themed error; zero slides → error; huge decks (>100 slides) → warn about time; fonts missing → fall back to a similar web font, never crash.

---
## 3. Compress PDF (`Cp`)

**Accepts:** one `.pdf`, up to 100 MB.

**Pipeline (in-browser):** pdf.js renders each page to canvas at a target DPI → export as JPEG at a target quality → rebuild the PDF with pdf-lib, one image per page at the original page size. Measure output size.

**Presets (default Recommended)**
| Preset | DPI | JPEG quality | Label |
|---|---|---|---|
| Less (cleaner) | 150 | 0.85 | "Street grade" |
| Recommended | 110 | 0.70 | "Lab grade" |
| Extreme | 72 | 0.50 | "Blue Sky grade" |

**UI**
- After upload show page count, original size, and a small first-page preview.
- Big button: "Cook it down".
- Result shows: before size → after size, percent saved on the stamp. If the output is **not smaller** than the original, do NOT hand over the bigger file: show "Already pure — can't improve this one" and offer the original back.

**Honest limits:** pages become images (text not selectable) — say so plainly under the presets. Vector-heavy text-only PDFs may not shrink much. Suggest "Less" preset if the user cares about sharpness.

**Edge cases:** password-protected PDF → themed error; 300+ pages → warn and process in chunks with progress; memory pressure → free canvases after each page (`canvas.width = 0`).

---
## Shared requirements
- Dropzone: drag-over highlight, click to browse, paste support optional, keyboard accessible.
- Download: a normal `<a download>` with a Blob URL; revoke URLs when resetting.
- Never upload anything. Say so in the UI near the dropzone.
- A "Cancel" button while processing (abort cleanly).
- All text strings come from COPY.md so they can be changed in one place (`/js/copy.js`).

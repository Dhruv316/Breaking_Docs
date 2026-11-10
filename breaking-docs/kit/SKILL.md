---
name: breaking-docs-builder
description: Use when building or extending the Breaking Docs website, a Breaking Bad-themed, fully in-browser PDF toolkit (Image to PDF, PPT to PDF, Compress PDF). Read this first, then the project files in the listed order.
---

# Breaking Docs builder

## Read in this order, every session
1. PROJECT.md — what and why
2. DESIGN.md — the overpowered Breaking Bad system
3. ASSETS.md — files the owner supplies, exact names
4. STRUCTURE.md — folders, pages, shared behavior
5. TOOLS.md — exact behavior of each tool
6. COPY.md — every string
7. RULES.md — constraints and checklist

## Working agreement
- The owner's prompt names a phase. Build only that phase, fully, to the checklist in RULES.md.
- Do not re-think decisions already made in these files. Implement them.
- Do not ask clarifying questions unless a file is contradictory. Make a sensible choice and note it in one line.
- If an asset is missing, use a themed placeholder with the same path; never block on assets.
- Keep the theme turned to maximum on every screen. A screen that looks generic is a bug.
- Keep tools honest: show real limits, never overpromise quality.
- Every phase ends with: files delivered, 3-line summary, list of placeholders used.

## When extending
Adding a new tool = new tile + new page from the template + new `js/tools/<name>.js` + COPY/assets entries. Update TOOLS.md and COPY.md in the same change.

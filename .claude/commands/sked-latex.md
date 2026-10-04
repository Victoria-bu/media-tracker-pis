---
name: sked-latex
description: >
  This skill should be used in phase 5 of a SKED session to generate the LaTeX
  document from the confirmed K* and structure, compile it with XeLaTeX
  (Cyrillic-ready), fix build problems, inspect the rendered pages and deliver
  the PDF. Trigger phrases include "generate the LaTeX", "compile the report",
  "make the PDF", "rebuild the document", "change the profile to DSTU",
  "згенеруй LaTeX", "зкомпілюй звіт", "зроби PDF". Also used to revise a
  delivered SKED document.
metadata:
  version: "0.1.0"
---

# SKED phase 5: LaTeX generation and PDF compilation

Turn K* and T_structure into a compiled document R. Read `/Users/victoriabuksha/media-tracker-pis/.claude/plugins/sked/references/latex-guide.md` before writing any LaTeX; it defines the class interface, ledger tags, figure, table, algorithm and code patterns and the fix table. `sked` below means `python3 /Users/victoriabuksha/media-tracker-pis/.claude/plugins/sked/scripts/sked.py --session <session dir>`, `build` means `python3 /Users/victoriabuksha/media-tracker-pis/.claude/plugins/sked/scripts/build.py --dir <session dir>/report`.

## 1. Preconditions and scaffold

`sked status`: phase 5, kstar and structure gates confirmed. Then `sked scaffold`. It creates `report/` with `main.tex` (metadata filled from the session), `sections/`, `figures/`, the class file and `refs.bib` from source entries. It reports sources without BibTeX; fix those first (`edit` the source's `bib`, then `sked bib`).

## 2. Write the document section by section

Work through `structure.md` in order, one file per top-level section (`sections/01-vstup.tex`, ...), and add the `\input` lines to `main.tex`.

- Draft each section only from its mapped entries (read them with `sked show --id K1,K2,...`). Tag every knowledge-bearing paragraph, list item, caption and table note with `\sked{...}`.
- Build the planned figures (TikZ), tables, algorithms, equations and code blocks with the patterns from latex-guide.md.
- Cite sources where their knowledge is used, with the bibkeys from the ledger.
- Need a fact that K* lacks? Do not write it. Add it to the ledger as a model proposal, ask the user in one line, and continue with the rest; come back once it is agreed or dropped.
- Write the abstract last, from the K* narrative, within the profile's length; keywords from the session metadata.
- Honor `context.house_style` (for example no em dashes) in every sentence.
- For long documents, send the user the first compiled draft after the first two or three sections so they can redirect early.

## 3. Build

First build: `build --ensure-deps`. It checks TeX packages, hyphenation patterns for the document language (installs them when possible), Cyrillic fonts, renders the bibliography with `bibfmt.py`, runs XeLaTeX until references settle, analyses the log, and renders page previews. Later builds: `build` alone. Read the printed summary; details are in `report/build/build-summary.json`.

Fix every error, undefined reference or citation, overfull box above 1 pt and missing glyph using the fix table in latex-guide.md, and rebuild. Bibliography warnings (`incomplete`, `uncited`, `missing_keys`) are fixed in the ledger's source entries, not in `references.tex`.

If hyphenation is reported MISSING after `--ensure-deps` (no permission to install), continue: the class keeps lines inside the margins; mention it to the user when delivering.

## 4. Look at the pages

Open `report/build/preview/contact-sheet-*.png` to see every page, then open at full size (`page-NN.png`) every page with a figure, table, algorithm, code block or the title page. Check: labels overlapping boxes or arrows, text or tables running into margins, empty or nearly empty pages, orphaned headings at page bottoms, captions on the wrong side for the profile, unreadable diagram text. Fix and rebuild until clean. `build --review` produces `build/main-review.pdf` with the ledger tags in the margin, which helps spot untagged paragraphs.

## 5. Quality gate

Run the sked-quality skill. It computes Q(R) and lists blockers and failed checks. Fix what it reports and rebuild, at most `params.max_fix_loops` (default 3) times; then present the remaining issues to the user instead of looping.

## 6. Deliver

When the gate passes:
- `sked phase done`.
- Send `report/main.pdf` with the file delivery tool, with one line of context (profile, pages, Q score).
- Offer the sources: zip `report/` without `build/` (`cd <session> && zip -r <slug>-latex.zip report -x 'report/build/*'`) and send it when wanted. It compiles anywhere with `xelatex main` run twice.
- Mention in one sentence anything the user must know: hyphenation unavailable, unverified sources that were removed, deferred questions stated as limitations.

## Revisions after delivery

- Wording or layout only: edit the `.tex`, rebuild, rerun sked-quality, redeliver.
- Knowledge changes: ledger ops first, then regenerate and reconfirm K* (sked-synthesis steps 4 and 5) and the structure if affected, `sked phase 5`, then update the text.
- Profile or language switch: change `\documentclass` options in `main.tex` (and `sked set profile ...`), rebuild, look at every page again (numbering, captions and headings change), rerun the quality gate.

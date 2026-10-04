# SKED plugin

SKED (Socratic Knowledge Elicitation & Documentation) is a method for writing technical documents together with an LLM. Instead of generating text from a prompt, Claude interviews the expert, records what is agreed in a knowledge ledger, confirms the consensus, agrees a structure, and only then writes and compiles a LaTeX document. This plugin implements the five phases of the method as described in the SKED technical report (v1.0.0) and fills the places the report left open with concrete, checkable rules.

## Phases and skills

| Phase | Skill | What happens | Gate |
|---|---|---|---|
| 1 Initialization | `sked-start` | session, context packet {A, E, C, R, M}, model's initial frame K(0), first question; also resumes existing sessions | round 0 closed |
| 2 Socratic dialogue | `sked-dialogue` | one round per reply: maieutics, elenchus in both directions, aporia, dialectic; every change recorded; δ computed | convergence criteria met, or the human ends it |
| 3 Synthesis of K* | `sked-synthesis` | leftovers resolved, model claims verified against sources, `kstar.md` with a narrative | human confirmation, hash-frozen |
| 4 Structuring | `sked-structure` | outline with every agreed entry mapped to a section, planned tables, diagrams, algorithms | human confirmation, plan coverage 1.0 |
| 5 LaTeX and PDF | `sked-latex`, `sked-quality` | sections written from K* only, XeLaTeX build, log analysis, visual page check, Q(R) gate, delivery | Q(R) ≥ threshold and no blockers |

Agent: `sked-reviewer` reads the finished PDF with fresh context (no access to the dialogue) and grades coherence issues for the Coh component.

## How to use

Say, for example, "Start SKED for a technical report on our dataset cleaning method" or "Почнемо SKED: звіт про методику очищення датасетів". Answer the questions. Say "досить" or "enough" at any point to end the dialogue early; open points then become stated limitations. Say "continue the SKED session" in a later conversation to resume where you left off. Sessions live in `sked-sessions/<slug>/` in the working folder.

## Files in a session

```
session.json     parameters, context packet, phase, metrics, confirmations
ledger.jsonl     append-only knowledge ledger (K(t) is its replay)
dialogue.jsonl   compact log of the exchanges
kstar.md         confirmed consensus K*
structure.md     confirmed outline T_structure
report/          main.tex, sections/, refs.bib, skedreport.cls, main.pdf
quality/         quality.md, quality.json, coherence.json, fc-judged.json
```

## Operational definitions

- **Convergence δ.** Jaccard distance between consecutive ledger states, where a state is the set of (id, normalized text, status). Converged when at least 3 rounds are done, δ < 0.05 for 2 consecutive rounds, and no high-priority question is open and no entry is contested. Budget of 15 rounds, then Claude asks.
- **Quality Q(R) = 0.4·Cq + 0.3·Coh + 0.3·Fc**, threshold 0.85. Cq is the priority-weighted share of agreed entries tagged in the LaTeX with `\sked{K..}`. Coh is 1 minus penalties from the independent review. Fc is the share of passed automatic and judged format checks. Blockers (compile errors, uncovered high-priority entries, model figures without a verified source, critical coherence issues) fail the gate regardless of the score.
- All parameters are in `session.json` under `params` and can be changed per session.

These are working definitions, not validated metrics: δ measures ledger stability rather than truth, and Q(R) is an acceptance gate for this workflow.

## Document profiles

- `ieee` (default): technical report in the style of the SKED report, numeric IEEE references.
- `dstu`: Ukrainian research report following ДСТУ 3008:2015 structure (титульний аркуш, реферат with automatic statistics, зміст, sections on new pages, "Рисунок 2.1 – …", "Таблиця 2.1 – …", appendices А, Б, В) and ДСТУ 8302:2015 references (simplified form). Layout defaults (14 pt, 1.5 spacing, margins 25/15/20/20 mm) should be confirmed against your institution's requirements.
- `apa`: APA 7 report with author-year citations.

Document language `uk` or `en` (other babel languages fall back to English labels).

## Requirements

- Python 3.8+ (standard library only; Pillow optional for contact sheets).
- XeLaTeX with common packages (TeX Live `texlive-xetex`, `texlive-latex-extra`, `texlive-science`, `texlive-pictures`), `pdftoppm`, `pdfinfo`, `pdffonts` (poppler-utils).
- For Ukrainian hyphenation: `texlive-lang-cyrillic`. `build.py --ensure-deps` installs missing pieces with apt-get when it runs as root, and reports clearly when it cannot.
- Fonts with Cyrillic: the class takes the first available of Times New Roman, Liberation Serif, PT Serif, CMU Serif, FreeSerif, DejaVu Serif.

No biber or BibTeX is needed: `bibfmt.py` renders the bibliography from `refs.bib` in the chosen style, so a report compiles with two `xelatex` runs anywhere.

## Differences from the report's reference implementation

1. Bibliography pre-rendered by Python instead of biber (Cyrillic initials, fewer dependencies).
2. babel instead of polyglossia.
3. Hyphenation patterns are checked and installed; missing patterns are the cause of lines running into the margin.
4. Algorithm and listing captions are localized.
5. Code with Cyrillic uses a Unicode-safe verbatim environment; `listings` reorders non-ASCII characters under XeTeX.
6. Every build is inspected visually from page images, which catches overlapping diagram labels.
7. Model-origin claims are tracked; figures and citations need a verified source before they reach the document.
8. A warning fires when the human accepts most model proposals unchanged, a sign that the document is drifting toward the model's frame.

## Scripts

`scripts/sked.py` (session, ledger, δ, K*, coverage, Q(R)), `scripts/build.py` (dependencies, compile, log analysis, previews), `scripts/bibfmt.py` (IEEE, DSTU 8302, APA rendering). Each has `-h`. Reference material for Claude is in `references/`.

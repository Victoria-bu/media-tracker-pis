# SKED method reference

Source: technical report "Методологія Сократичного Діалогу в Контексті Людино-AI Співпраці для Генерації Структурованих Технічних Документів" (SKED, v1.0.0). This file condenses the method and records how the plugin turns each concept into something executable. Read it once per session before the first phase skill runs.

## 1. Formal model

- Domain D, human expert H with partial or unstructured knowledge K_H of D, model M with its own knowledge K_M.
- Goal of the dialogue: a consensus knowledge space `K* = f(K_H, K_M, D_dialogue)`, where D_dialogue is the sequence of questions and answers and f is realized by the iterative Socratic process.
- Goal of the whole cycle: a document `R = g(K*, T_structure, S_style)`, where T_structure is the agreed outline and S_style the formatting standard (IEEE, DSTU, APA).

## 2. Socratic components and what they become here

| Component | Meaning | Operation in the plugin |
|---|---|---|
| Maieutics | M asks questions that bring out H's implicit knowledge | M asks; H's answers become `add` ops with origin H |
| Elenchus | Testing claims with counterexamples and clarifying questions | Two directions. M tests H's claims (counterexample, boundary, consistency with earlier entries). M invites H to test M's proposals. Outcomes are `edit`, `status contested` or `retract` ops |
| Aporia | Admitting the limits of current knowledge | An open `question` entry with priority. Resolved by research, by H, or deferred into the document's limitations |
| Dialectic | Synthesis of opposing positions | Contested entries get a proposed synthesis; H decides; the loser is retracted or kept as an alternative |

## 3. Context packet (Context Engineering, {A, E, C, R, M})

Collected in phase 1 and stored in `session.json` under `context`:
- A, Authority: author role and target audience (`authority`, `audience`)
- E, Exemplars: sample documents or earlier drafts the user supplies (`exemplars`)
- C, Constraints: length, standard, language, deadline, house style (`constraints`, `house_style`)
- R, Rubric: what quality means for this document; mapped to the Q(R) weights (`rubric`, `params.weights`)
- M, Metadata: title, author, affiliation, document type, version, date, keywords (`metadata`)

## 4. Phases and gates

| Phase | Skill | Output | Gate to the next phase |
|---|---|---|---|
| 1 Initialization | sked-start | session, context packet, frame K(0), first question | round 0 closed |
| 2 Socratic dialogue | sked-dialogue | ledger K(t), dialogue log | `converge` recorded (criteria met, or human decision) |
| 3 Synthesis of K* | sked-synthesis | `kstar.md` with narrative | human confirms, `confirm kstar` (hash-frozen) |
| 4 Structuring | sked-structure | `structure.md`, every K* entry mapped | human confirms, `confirm structure` |
| 5 LaTeX and PDF | sked-latex + sked-quality | `report/main.pdf`, sources, `quality.md` | Q(R) at or above threshold with no blockers |

Gates are enforced by `sked.py phase N`. `--force` exists for the human's explicit override only.

## 5. What the report left open and how the plugin fills it

**Convergence distance.** The report writes `δ = d(K(t+1), K(t))` and names its formalization an open problem. The plugin uses the Jaccard distance between the sets of `(id, normalized text, status)` tuples of the two ledger states. It is a proper metric, lies in [0, 1], is 1 when everything changed and 0 when nothing did. Convergence requires all of:
1. at least `min_rounds` dialogue rounds (default 3);
2. δ below `epsilon` (default 0.05) for `stable_rounds` consecutive rounds (default 2);
3. no open high-priority question and no contested entry.

The human can end the dialogue at any time (`converge --by human`), which matches `H.isConverged()` in Algorithm 1. At `max_rounds` (default 15) the plugin asks the human instead of continuing silently.

Known weakness, stated plainly: δ measures stability of the ledger, not truth or completeness. A dialogue that keeps asking shallow questions converges fast. The safeguards are the move-selection order in `socratic-moves.md`, the requirement that high-priority questions be closed, and the model-proposal acceptance ratio (below).

**Quality metric.** `Q(R) = α·Cq + β·Coh + γ·Fc`, α+β+γ = 1, defaults 0.4 / 0.3 / 0.3, pass threshold 0.85.
- Cq, completeness: priority-weighted share of agreed K* entries (and deferred questions) tagged in the LaTeX sources with `\sked{...}`. Weights high 3, normal 2, low 1. Computed by `sked.py coverage`.
- Coh, coherence: 1 minus penalties for issues found by a reviewer with fresh context (critical 0.15, major 0.07, minor 0.02). Written to `quality/coherence.json` by the `sked-reviewer` agent.
- Fc, formal compliance: share of passed checks. Automatic checks come from the build log and the sources (errors, undefined references, overfull boxes, missing glyphs, hyphenation, embedded fonts, bibliography integrity, verified sources, referenced floats, placeholders, house style). Judged checks come from the profile checklist in `style-profiles.md`.
- Blockers override the score: compile errors, uncovered high-priority entries, model claims containing figures without a verified source, critical coherence issues, citations to missing keys, missing coherence review.

Q(R) is an internal acceptance gate. It is not a validated measure of document quality, and the report's empirical figures (a 23 % improvement, 3.8 to 2.0 iterations) come from a single cited source that the plugin does not rely on.

## 6. Deliberate deviations from the report

1. **Bibliography without biber.** The report compiles with xelatex, biber, xelatex, xelatex. The plugin pre-renders the bibliography from `refs.bib` with `bibfmt.py` (IEEE, DSTU 8302:2015 simplified form, APA 7). Reason: biber and biblatex are often missing, and BibTeX mangles Cyrillic initials. Two xelatex runs suffice.
2. **babel instead of polyglossia.** babel's `\babelprovide` locales ship with the base TeX installation; polyglossia may be absent.
3. **Hyphenation is checked, not assumed.** Missing Ukrainian patterns produce justified text with stretched gaps or lines running into the margin, which is visible in the source report. `build.py --ensure-deps` detects this and installs the patterns when it can.
4. **Localized floats.** Algorithm and listing captions follow the document language ("Алгоритм", "Лістинг"); the source report left them in English.
5. **Unicode-safe code blocks.** `listings` reorders characters above U+00FF under XeTeX. Code with Cyrillic goes into `skedcode` inside a `codelisting` float.
6. **Visual inspection is mandatory.** Diagram labels overlapping boxes (as in the report's Figure 1) and URLs overflowing the margin are caught by rendering pages to images and looking at them.
7. **Hallucination guard.** Every model-origin claim is marked as such; figures and citations need a verified source before they may appear in the document; bibliography entries are verified before use.
8. **Anti-sycophancy signal.** `round-close` reports how many model proposals the human accepted unchanged. A share above 80 % over five or more decisions triggers a warning to switch to open questions.

## 7. Tool mapping

| Report tool | Role | This environment |
|---|---|---|
| web_search | sources for K_M | web search and fetch tools |
| bash_tool | LaTeX compilation, packages | shell: `build.py` |
| create_file | .tex and .bib files | file write and edit tools; `sked.py scaffold` |
| present_files | give the PDF to the user | file delivery tool (for example SendUserFile) |
| visualize | preview | page PNGs from `build.py`, viewed with the image reader |

## 8. Limitations to state in documents made with SKED when relevant

- Dialogue time: for simple documents direct prompting is cheaper; offer brisk mode or skipping SKED.
- Model knowledge may be wrong; only verified entries are used.
- Convergence is a heuristic.
- Non-Latin scripts need XeLaTeX, fonts with the script, and hyphenation patterns.

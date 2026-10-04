---
name: sked-synthesis
description: >
  This skill should be used in phase 3 of a SKED session, after the Socratic
  dialogue has converged, to write down the agreed understanding K* and get the
  user's confirmation or corrections. Trigger phrases include "summarize what we
  agreed", "show me K*", "synthesize the consensus", "what's our shared
  position", "підсумуй, про що домовились", "покажи K*". It resolves leftovers,
  verifies model claims, writes kstar.md and freezes it after confirmation.
metadata:
  version: "0.1.0"
---

# SKED phase 3: synthesis of K*

After consensus, state the shared position explicitly: the model writes a summary of the agreed understanding, and the human confirms or corrects it. Nothing enters the document later unless it is in the confirmed K*. `sked` below means `python3 ${CLAUDE_PLUGIN_ROOT}/scripts/sked.py --session <session dir>`.

## 1. Check entry conditions

`sked status`. Convergence must be recorded (phase 3). If it is not, go back to sked-dialogue.

## 2. Clear leftovers

- **Contested entries**: present each conflict with a proposed synthesis and let the user decide. Apply the decision (agree one, retract or edit the other).
- **Model proposals still `proposed`**: list them compactly and ask for a yes, a correction, or a no. Unanswered ones are retracted, not silently kept.
- **Open questions**: resolved, deferred (they become stated limitations) or retracted.

Apply the changes in one `sked apply` call and `sked round-close`.

## 3. Verify model knowledge

Run `sked show --origin M --status agreed`. For every entry that contains a figure, a date, a named result or a citation and is not `verified: source`, find a source (web search, then fetch the page or DOI record to confirm it says what the entry claims). Add the source entry with full BibTeX and `verified: source`, link it through `refs`, and `verify` the claim. If no source can be found, tell the user and let them choose: keep it as their own statement (edit origin to H with their confirmation), weaken it to an assumption, or retract it.

Also verify every source entry that is still `verified: none`: the record must exist and its metadata must match. Fix the BibTeX with an `edit` of `bib` when needed.

## 4. Write kstar.md

`sked kstar` writes `kstar.md` from the ledger: definitions table, claims, requirements, constraints, decisions, assumptions, examples (grouped, high priority first), open or deferred questions, sources. It keeps a narrative block for the synthesis.

Write the narrative block between `<!-- SKED:NARRATIVE:BEGIN -->` and `<!-- SKED:NARRATIVE:END -->`: 120 to 300 words in the document language that state the agreed understanding as a coherent position, citing entry IDs in parentheses (K3, K7). Use only ledger content, add no new facts, and follow the house style. The narrative becomes the seed of the abstract and conclusions.

## 5. Get confirmation

Show the user the narrative, then one line of counts (for example "18 тверджень, 5 визначень, 2 обмеження документа, 6 джерел") and the list of deferred questions that will appear as limitations. Offer the full `kstar.md` as a file if they want to read it all.

- Corrections: turn them into ledger ops, `sked round-close`, regenerate with `sked kstar` (the narrative is kept; edit it to match), and show the changed parts again.
- Confirmation: `sked confirm kstar`, then `sked phase 4`, and continue with the sked-structure skill.

The confirmation is hash-frozen: if `kstar.md` changes later, phase 4 and 5 gates ask for a new confirmation.

---
name: sked-quality
description: >
  This skill should be used to evaluate a compiled SKED document with the
  quality metric Q(R) = alpha*Cq + beta*Coh + gamma*Fc (completeness,
  coherence, formal compliance) before delivery, or whenever the user asks how
  good the document is. Trigger phrases include "check the report quality",
  "run the quality gate", "is the document ready", "score the document",
  "перевір якість звіту", "чи готовий документ", "оціни документ".
metadata:
  version: "0.1.0"
---

# SKED quality gate Q(R)

Q(R) = α·Cq + β·Coh + γ·Fc with weights from `session.json` (defaults 0.4, 0.3, 0.3) and a pass threshold (default 0.85). Blockers fail the gate regardless of the score. Definitions are in section 5 of `${CLAUDE_PLUGIN_ROOT}/references/sked-method.md`. `sked` below means `python3 ${CLAUDE_PLUGIN_ROOT}/scripts/sked.py --session <session dir>`.

The gate is only as honest as its inputs. Score what the rendered document shows, not what was intended.

## 1. Fresh build

Make sure `report/build/build-summary.json` is newer than every `.tex` file; otherwise run `python3 ${CLAUDE_PLUGIN_ROOT}/scripts/build.py --dir <session>/report` first.

## 2. Completeness Cq

`sked coverage` shows which agreed K* entries are tagged in the LaTeX. Before accepting the number, spot-check three tagged paragraphs: the text must actually state the tagged entry. A tag without content is a defect to fix, not coverage.

## 3. Coherence Coh (independent review)

Delegate to the `sked-reviewer` agent when a subagent tool is available, so the document is judged by a reader who did not write it and has not seen the dialogue. Give it: the session directory, the path to `report/main.pdf`, the path to `kstar.md`, the document language and profile. It writes `quality/coherence.json`.

Without a subagent tool, do the review yourself with the same instructions (read `${CLAUDE_PLUGIN_ROOT}/agents/sked-reviewer.md` and follow its procedure): extract the text with `pdftotext -layout report/main.pdf -`, read it start to finish as the target reader, and record issues. State in the report that the review was not independent.

## 4. Formal compliance Fc

Automatic checks run inside `sked quality`. Judged checks: go through the checklist in `${CLAUDE_PLUGIN_ROOT}/references/style-profiles.md` (common items plus the profile's items) while looking at the page images, and write `quality/fc-judged.json`:

```json
[{"item": "Title page shows every metadata field the profile needs", "pass": true, "note": ""},
 {"item": "Captions above figures and tables (apa)", "pass": false, "note": "fig:pipeline caption below"}]
```

Be strict: when in doubt, fail the item and say why in `note`.

## 5. Compute and decide

`sked quality`. It writes `quality/quality.json` and `quality/quality.md` and prints Q, the components, blockers and failed checks.

- **PASS**: return to sked-latex step 6 (deliver).
- **FAIL**: turn every blocker and failed check into a concrete fix (which file, what change), apply the fixes, rebuild, and rerun this skill. Stop after `params.max_fix_loops` rounds and show the user the remaining issues with a recommendation, instead of lowering the bar.

Never edit weights, the threshold or the checklist to make a document pass unless the user asks for it; record such a change with `sked set` and mention it in the delivery message.

## 6. Report to the user

One line: `Q(R) = 0.91 (повнота 1.00, узгодженість 0.86, відповідність 0.85), поріг 0.85`. Then at most three bullets for anything material that remains (minor coherence notes, a failed judged check the user accepted). The full `quality.md` is available as a file on request.

---
name: sked-structure
description: >
  This skill should be used in phase 4 of a SKED session, when the confirmed
  consensus K* has to become a document outline (T_structure): sections,
  subsections, tables, diagrams, algorithms, and the mapping of every agreed
  entry to a place in the document. Trigger phrases include "plan the document
  structure", "what sections will the report have", "outline the report",
  "change the structure", "структура звіту", "зміст документа", "план розділів".
metadata:
  version: "0.1.0"
---

# SKED phase 4: document structure

Build T_structure from K* and agree it with the user. The outline decides where every agreed entry will live, so completeness is designed in before any LaTeX is written. `sked` below means `python3 ${CLAUDE_PLUGIN_ROOT}/scripts/sked.py --session <session dir>`. Profile rules are in `${CLAUDE_PLUGIN_ROOT}/references/style-profiles.md`.

## 1. Load inputs

`sked status` (phase must be 4 and the kstar gate confirmed), read `kstar.md`, and read `session.json` for profile, language, audience, length constraints and house style.

## 2. Draft the outline

Start from the profile skeleton (ieee, dstu or apa) and fill the main part from K*:
- Group entries by what the reader needs, in the reader's order: problem and context, concepts and definitions, the method or system itself, evidence and examples, evaluation or comparison, limitations, conclusions. Merge or split to fit the length constraint.
- Every agreed entry (and every deferred question) is mapped to exactly one primary section. High-priority entries go into the main part, not appendices.
- A section with no entries is filler: drop it or merge it. A section with more than about a dozen entries usually wants subsections.
- Plan artifacts where they carry knowledge better than prose: a table for comparisons or parameter sets, a diagram for processes, flows or architecture, an algorithm for procedures, an equation for formal definitions, a code block for formats and examples. Each artifact lists the entries it expresses.
- Limitations section: all deferred questions. Conclusions: the high-priority claims, restated, nothing new.
- Abstract and keywords: planned from the K* narrative.

## 3. Write structure.md

In the document language. Format, one block per section:

```
## 2 Фази SKED  (≈1.5 с.)
Мета: читач розуміє п'ять фаз і переходи між ними.
Записи: K1, K2, K9, K12
Артефакти: рис. «Конвеєр фаз» (K1, K9); алгоритм «Сократичний діалог» (K12)
### 2.1 Ініціалізація  (K9)
### 2.2 Сократичний діалог  (K12, K13)
```

Start the file with a header naming profile, language, target length, and any institutional requirements the user gave.

## 4. Check coverage of the plan

`sked coverage --plan <session>/structure.md`. Fix every uncovered entry and every unknown ID before showing the plan. Cq of the plan should be 1.0.

## 5. Agree with the user

Show the outline as a compact numbered list of sections with one-line purposes and the planned figures and tables, plus the page estimate. Ask for changes in one question. Also confirm here, for the dstu profile, the layout values (margins, font size, spacing) and any institutional template; for any profile, the final title and author line.

Apply changes to `structure.md`, rerun the coverage check, show only what changed. When the user approves: `sked confirm structure`, `sked phase 5`, and continue with the sked-latex skill.

If the user changes the knowledge itself during this phase ("actually, X is wrong"), that is a ledger change: apply it, regenerate and reconfirm K* (sked-synthesis steps 4 and 5), then return here.

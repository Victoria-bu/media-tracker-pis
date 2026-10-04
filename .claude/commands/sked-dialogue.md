---
name: sked-dialogue
description: >
  This skill should be used during phase 2 of a SKED session, when the user is
  answering Claude's Socratic questions about the topic of a technical document,
  challenges Claude's framing, or asks whether the dialogue is finished. Trigger
  phrases include "next question", "let's continue the dialogue", "I disagree
  with that", "are we done?", "enough questions", "наступне питання",
  "продовжимо діалог", "досить питань". It runs the iterative Socratic dialogue
  (Algorithm 1 of the SKED method) and records every step in the knowledge
  ledger until convergence.
metadata:
  version: "0.1.0"
---

# SKED phase 2: Socratic dialogue

Run one round per user reply. Each round implements one iteration of Algorithm 1: model question (maieutics), human answer, counter-question (elenchus, in either direction), clarification, ledger update, distance δ. Read `/Users/victoriabuksha/media-tracker-pis/.claude/plugins/sked/references/socratic-moves.md` at the start of the phase; it holds the move-selection order, question templates, anti-patterns and extraction rules. `sked` below means `python3 /Users/victoriabuksha/media-tracker-pis/.claude/plugins/sked/scripts/sked.py --session <session dir>`.

When resuming in a new conversation, first run `sked status` and `sked show` (and `sked dialogue --last 3`) to reload the state.

## Each round

1. **Interpret the reply.** Separate what the user asserted, what they hedged, what they asked (their own elenchus, q_H), and what contradicts existing entries.
2. **Answer the user's own questions first** when they asked any. Answers that add knowledge are model contributions: record them as origin M, status proposed, and research factual points (web search) before stating them; attach a source entry when you rely on one.
3. **Extract ledger changes** following section 4 of socratic-moves.md: atomic entries in the document language, correct origin, status, priority; edits for refinements; `contested` for contradictions; `resolved` or `deferred` for questions that got settled or parked; `agreed` (which also marks human verification) for model proposals the user confirmed.
4. **Choose the next move** with the gap-analysis order in section 1 of socratic-moves.md. One question in deep mode, up to three related questions in brisk mode. Give the user the floor to challenge Claude's framing every third round and whenever Claude contributed content.
5. **Apply everything in one call**: all ledger ops plus one `turn` op (`move`, `q_M`, `a_H`, and `q_H`/`a_M` when present, short paraphrases).
6. **Close the round**: `sked round-close`. Read the δ, the convergence verdict and any warning.
7. **Reply to the user** in the compact turn format (socratic-moves.md section 5): status line, "Записано/Recorded" line naming the changes, then the dialectic summary if any, then the question. Nothing else.

## Factual support

- When the user asserts a number, date, standard or published result, ask where it comes from or find the source; store the source (full BibTeX in `bib`, `verified: source` only after checking that the DOI, URL or catalogue record exists and matches).
- Never invent references. An unverifiable model claim stays `proposed`, gets downgraded to an assumption with the user's consent, or is retracted.

## Convergence

`round-close` reports `converged=True` when: at least `min_rounds` rounds, δ below ε for `stable_rounds` consecutive rounds, no open high-priority question, no contested entry. Then:
1. Tell the user the dialogue has stabilized, in one or two sentences, and name anything low-priority still open.
2. Ask whether anything important is missing. If they add something, continue the loop.
3. Otherwise record `sked converge --by delta`, then `sked phase 3`, and continue with the sked-synthesis skill.

The user can stop at any point ("enough", "досить"): list open high-priority questions and contested entries in one short message and let them choose to answer, defer (they become limitations) or drop them; then `sked converge --by human --note "<their words>"`.

When `round-close` reports the budget is reached, ask whether to continue, switch to brisk mode (`sked set mode brisk`), or converge by human decision.

When it warns that most model proposals were accepted unchanged, change tactics: open questions, ask the user to restate the core ideas in their own words, and stop proposing content for a few rounds.

## Mid-dialogue changes

- Change of document type, language or profile: `sked set profile dstu`, `sked set language.document en` and so on; entries already written in another language stay valid but new entries follow the new language.
- The user uploads material: read it, add its facts as origin H entries (status agreed), and tell them how many entries were added and which questions it answered.
- The user wants to see the ledger: show `sked show` output reformatted as a short grouped list, not raw.

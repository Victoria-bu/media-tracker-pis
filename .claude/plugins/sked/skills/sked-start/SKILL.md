---
name: sked-start
description: >
  This skill should be used when the user wants to write a technical document
  (technical report, method description, research report, specification-style
  write-up) through a Socratic dialogue with Claude, starts or resumes a SKED
  session, or asks about the SKED method. Trigger phrases include "start SKED",
  "let's write a technical report through dialogue", "interview me and turn it
  into a document", "Socratic dialogue for a document", "continue the SKED
  session", "where is my SKED session", "почнемо SKED", "сократичний діалог для
  звіту", "продовжимо сесію SKED". It runs phase 1 (initialization) and routes
  to the other phase skills.
metadata:
  version: "0.1.0"
---

# SKED phase 1: initialization, and session routing

SKED (Socratic Knowledge Elicitation & Documentation) turns a human expert's knowledge into a formal LaTeX/PDF document in five phases: initialization, Socratic dialogue, synthesis of the consensus knowledge K*, document structuring, LaTeX generation with a quality gate. Read `${CLAUDE_PLUGIN_ROOT}/references/sked-method.md` once per conversation before acting.

Scripts live in `${CLAUDE_PLUGIN_ROOT}/scripts/`. If that variable is not expanded in this environment, locate them once with `find / -path '*/scripts/sked.py' -path '*sked*' 2>/dev/null | head -1` and use that directory. Below, `sked` means `python3 <scripts>/sked.py --session <session dir>`.

## 0. Route first

1. Run `python3 <scripts>/sked.py list` in the working directory (and in any folder the user names).
2. If the user refers to an existing session, or exactly one unfinished session exists and the user says "continue", run `sked status` and hand over to the skill for the current phase: 2 → sked-dialogue, 3 → sked-synthesis, 4 → sked-structure, 5 → sked-latex (then sked-quality). Tell the user in one sentence where the session stands (topic, phase, round, what is next).
3. Otherwise start a new session (steps 1 to 6 below).

Speak the user's language throughout. Keep the machinery invisible: no command output, JSON or file paths in the conversation unless asked.

## 1. Check that SKED fits

SKED costs several dialogue rounds. If the request is a short text that direct writing would handle (a paragraph, a one-page note with facts already given), say so in one sentence and offer to write it directly. Proceed with SKED when the document depends on knowledge the user holds and Claude does not, or when the user asked for SKED.

## 2. Create the session

Pick a topic title from the user's words. Create the session in the working directory unless the user named another folder:

```
python3 <scripts>/sked.py init --topic "<topic>" --profile <ieee|dstu|apa> --lang-doc <uk|en> --lang-dialogue <uk|en> --mode <deep|brisk>
```

Defaults: dialogue language = the language the user writes in; document language = the same unless they say otherwise; profile `ieee` (the SKED report's own style); mode `deep`. Use `dstu` when the user mentions ДСТУ, НДР, a Ukrainian university or ministry report; `apa` when they mention APA or a social-science venue.

## 3. Collect the context packet {A, E, C, R, M}

Ask at most one compact batch (AskUserQuestion when available, otherwise one short message), and only for what is not already known from the request or from what you know about the user:
- Document type and reader (Authority): who reads it and what they should be able to do afterwards.
- Standard and language (Constraints): confirm profile and language; ask about length and any institutional template.
- Exemplars: invite an earlier draft, notes or a sample document to attach. Attached material is read now; its facts go into the ledger as H entries (status agreed) because the user supplied them.
- Rubric: what matters most (completeness, rigor, brevity). Map a stated emphasis onto `params.weights` (for example rigor → raise beta).
- Metadata: title, author, affiliation, version, keywords. Use the user's name and affiliation when known and ask only to confirm.

Record answers with `sked set`, for example `sked set context.audience "..."`, `sked set context.metadata.author "..."`, `sked set context.house_style.forbid_chars '["—"]'` when the user avoids em dashes, `sked set mode brisk` for a faster dialogue.

## 4. Write the initial frame K(0)

Draft the model's starting understanding of the topic as 6 to 15 ledger entries with origin M (status proposed): the likely scope, the core concepts with tentative definitions, the key claims Claude would expect, assumptions, and the open questions that only the user can answer (type question, priority high for the ones that decide the document's shape). Mark any figure or citation as needing a source. Apply them in one call (`sked apply -` with a JSON array; schema in `${CLAUDE_PLUGIN_ROOT}/references/ledger-schema.md`).

Show the frame to the user compactly, as hypotheses to challenge, grouped as scope, concepts, open questions. Five to ten short lines, not a document.

## 5. Ask the first question

Pick the first question with the move-selection rules in `${CLAUDE_PLUGIN_ROOT}/references/socratic-moves.md` (usually purpose and reader, or the most consequential high-priority open question). Ask exactly one question (up to three related ones in brisk mode). Record it as a `turn` op.

## 6. Close round 0 and move on

```
sked round-close
sked phase 2
```

From the user's next answer onward, follow the sked-dialogue skill.

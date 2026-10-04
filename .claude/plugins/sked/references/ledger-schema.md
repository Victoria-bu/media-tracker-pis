# Knowledge ledger and session files

## 1. Session directory

```
sked-sessions/<slug>/
  session.json        parameters, context packet, phase, round, metrics, gates
  ledger.jsonl        append-only ledger events (the knowledge state K(t) is their replay)
  dialogue.jsonl      compact log of the Socratic exchanges (D_dialogue)
  kstar.md            phase 3 output, human-confirmed, hash-frozen
  structure.md        phase 4 output, human-confirmed, hash-frozen
  report/             main.tex, sections/*.tex, figures/, refs.bib, skedreport.cls, main.pdf, build/
  quality/            fc-judged.json, coherence.json, quality.json, quality.md
```

Never edit `ledger.jsonl` by hand; use `sked.py apply`. Everything else is plain text that can be read and edited.

## 2. Entry fields

| Field | Values | Notes |
|---|---|---|
| id | K1.., Q1.., S1.. | K knowledge, Q question, S source. Assigned by the script |
| type | claim, definition, assumption, constraint, decision, requirement, example, question, source | |
| text | string | one atomic statement in the document language |
| origin | H, M, S | human, model, external source |
| status | proposed, agreed, contested, open, deferred, resolved, retracted | questions use open, resolved, deferred |
| priority | high, normal, low | coverage weights 3, 2, 1 |
| verified | none, human, source | human agreement to a model proposal sets `human` automatically |
| refs | list of S ids | evidence for the entry |
| term | string | for definitions |
| bib, bibkey | BibTeX string, key | for sources; bibkey is parsed from bib when omitted |
| note | string | reason for a status change, deferral note |

K* consists of entries with status agreed (and resolved questions), plus deferred questions, which become stated limitations.

## 3. Operations for `sked.py apply`

Pass a JSON array through stdin (`apply -`) or a file. All ops in one call share the current round.

```json
[
  {"op": "add", "type": "claim", "text": "…", "origin": "H", "priority": "high"},
  {"op": "add", "type": "definition", "term": "K*", "text": "…", "origin": "M"},
  {"op": "add", "type": "question", "text": "…", "origin": "M", "priority": "high"},
  {"op": "add", "type": "source", "text": "Ji et al. 2023, hallucination survey", "origin": "S",
   "verified": "source", "bib": "@article{ji2023, author = {…}, title = {…}, journal = {…}, year = {2023}, doi = {…}}"},
  {"op": "add", "type": "claim", "text": "…", "origin": "M", "refs": ["$4"], "verified": "source"},
  {"op": "edit", "id": "K3", "text": "…"},
  {"op": "status", "id": "K3", "status": "agreed"},
  {"op": "status", "id": "Q2", "status": "deferred", "note": "limitation, future work"},
  {"op": "verify", "id": "S2", "verified": "source"},
  {"op": "retract", "id": "K5", "note": "H: wrong for batch mode"},
  {"op": "turn", "move": "elenchus", "q_M": "…", "a_H": "…", "q_H": "…", "a_M": "…"}
]
```

`$n` in `refs` or `id` refers to the entry created by the n-th `add` of the same batch.

Defaults: origin H → status agreed, verified human; origin M → status proposed, verified none; questions → status open.

## 4. Command reference

All commands take `--session <dir>` (or run from inside the session directory, or with exactly one session under `./sked-sessions`).

| Command | Purpose |
|---|---|
| `init --topic T [--profile ieee|dstu|apa] [--lang-doc uk] [--lang-dialogue uk] [--mode deep|brisk] [--root DIR]` | create a session |
| `list [--root DIR]` | list sessions |
| `status [--json]` | dashboard: phase, round, counts, deltas, convergence blockers, gates, next step |
| `set KEY VALUE` | set any `session.json` value by dot path, JSON-parsed (`set params.epsilon 0.1`, `set context.house_style.forbid_chars '["—"]'`) |
| `apply FILE or -` | apply ledger ops |
| `round-close [--json]` | compute δ for the round, record metrics, report convergence, start the next round |
| `show [--type] [--status] [--origin] [--id] [--round N] [--all] [--format md|json]` | view entries |
| `dialogue [--last N]` | view the exchange log |
| `converge --by delta|human|budget [--note]` | record the end of the dialogue |
| `phase 1..5|done [--force]` | move phases with gate checks |
| `kstar [--out]` | write `kstar.md`, keeping an existing narrative block |
| `confirm kstar|structure` | record human confirmation (sha256 of the file) |
| `coverage --plan structure.md` or `coverage [--report DIR]` | coverage of K* in the outline or in the LaTeX |
| `scaffold [--profile] [--force]` | create `report/` from the templates and write `refs.bib` |
| `bib` | rewrite `report/refs.bib` from source entries |
| `quality [--report DIR]` | compute Q(R), write `quality/quality.md` |

`build.py --dir report [--ensure-deps] [--review] [--update-class] [--dpi N]` compiles, analyses the log, renders previews and writes `report/build/build-summary.json`.
`bibfmt.py` is called by `build.py`; run it directly only to debug a reference.

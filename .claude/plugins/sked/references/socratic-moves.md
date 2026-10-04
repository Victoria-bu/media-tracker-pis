# Socratic moves: selection, wording, extraction

## 1. Choosing the next move (gap analysis)

Before each question, look at the ledger (`sked.py show` or the entries already in context) and take the first rule that applies:

1. **Contested entries exist** → dialectic. Lay out both positions in one or two sentences each, propose a synthesis, ask H to choose or amend.
2. **Open high-priority questions** → aporia work. If the answer is public knowledge, research it (web search) and bring back a sourced proposal. If only H can know, ask H. If nobody can settle it now, propose deferring it as a stated limitation.
3. **Model proposals awaiting H** (origin M, status proposed) → invite elenchus from H: "I assumed X. Is that right for your case, or where does it break?" Ask about the most consequential one first.
4. **H claims that were never tested** (high priority, no counterexample tried) → elenchus by M: counterexample, boundary case, consistency with another entry, or "how would we measure that?".
5. **Structural gaps** for the intended document → maieutics. Typical gaps in order: purpose and reader, scope and exclusions, key terms, the mechanism (how it works), rationale (why this and not the alternative), evidence and examples, risks and limitations, what the reader should do next.
6. **Nothing left above** → ask H whether anything important is missing ("What would a newcomer most likely get wrong about this?"). Two quiet rounds in a row lead to convergence.

Every third round, and whenever M has contributed content, give H the floor explicitly: "Is there anything in how I framed this that you would challenge?" This is the H.generateQuestion step of Algorithm 1; H's questions are answered and recorded like any other exchange.

## 2. Question types and templates

Use one question per turn in deep mode; up to three tightly related questions in brisk mode. Keep M's turn under about 120 words, excluding answers to H's own questions.

| Type | Purpose | Ukrainian | English |
|---|---|---|---|
| Clarification | pin down meaning | Що саме ви маєте на увазі під «X»? Можете навести приклад? | What exactly do you mean by "X"? Could you give an example? |
| Assumptions | surface what is taken for granted | Що має бути правдою, щоб це працювало? | What has to be true for this to work? |
| Reasons and evidence | ground a claim | На чому це ґрунтується: вимірювання, досвід, джерело? | What is this based on: a measurement, experience, a source? |
| Counterexample (elenchus) | test a claim | Чи бувають випадки, коли X не виконується? | Are there cases where X does not hold? |
| Boundary (elenchus) | find limits | До якого масштабу чи за яких умов це ще правильно? | Up to what scale or under which conditions does this still hold? |
| Consistency (elenchus) | reconcile entries | Раніше ви сказали K7; як це узгоджується з тим, що зараз? | Earlier you said K7; how does that fit with this? |
| Operationalization | make it checkable | Як читач перевірить, що це виконано? | How would a reader check that this has been achieved? |
| Perspectives | alternatives | Хто б із цим не погодився і чому? | Who would disagree with this, and why? |
| Implications | consequences | Що з цього випливає для читача? | What follows from this for the reader? |
| Meta | the question itself | Чи правильне це питання для цього документа? | Is this the right question for this document? |
| Example elicitation (maieutics) | tacit knowledge | Розкажіть про останній випадок, коли ви це робили, крок за кроком. | Walk me through the last time you did this, step by step. |
| Novice lens (maieutics) | hidden expertise | Що новачок найімовірніше зробить неправильно? | What would a newcomer most likely get wrong? |

## 3. Anti-patterns

- **Leading questions** that plant the model's answer ("Surely X is better, right?"). They inflate agreement and turn K* into K_M.
- **Stacked questions** in deep mode. H answers the easiest one.
- **Lecturing.** Explaining the domain back to the expert instead of asking.
- **Re-asking** what the ledger or the exemplars already hold.
- **Accepting vague answers.** "It depends" needs a follow-up: on what?
- **Silent recording.** Every change to the ledger is shown to H in the compact "Записано / Recorded" line so H can correct it.
- **Fake convergence.** Several rounds of trivial questions push δ down without adding knowledge. If the last rounds were quiet but high-value gaps from rule 5 remain, keep asking.
- **Sycophancy signal.** If `round-close` warns that most model proposals were accepted unchanged, switch to open questions and ask H to restate positions in their own words.

## 4. Turning answers into ledger entries

- One fact, decision, definition or constraint per entry. Split compound answers.
- Keep H's wording where possible; tidy grammar, do not change meaning.
- Write entries in the document language, even when the dialogue language differs.
- Origin: H for what H said; M for what the model contributed; S for content taken from a source.
- Status: H statements are `agreed` unless H hedged ("I think", "probably"), then `proposed`. M contributions are `proposed` until H confirms. Contradictions with existing entries: mark both `contested` and raise them next round.
- Priority `high` for anything the document cannot do without (core mechanism, main claims, scope), `low` for color and examples.
- Definitions carry `term`. Sources carry `bib` (full BibTeX) and `bibkey`.
- Every figure, date, percentage or named result from M needs a source entry (`refs`) with `verified: source` before it may appear in the document.

## 5. Turn format shown to the user

```
Раунд 4 · δ = 0.08 · 23 записи · відкритих питань 2
Записано: +K14 (межа масштабу 10^5 записів), K9 уточнено, Q3 відкладено
<one question, or a dialectic summary followed by one question>
```

In English sessions: `Round 4 · δ = 0.08 · 23 entries · 2 open questions` and `Recorded:`. Omit the status line on the very first turn. Never paste JSON or command output into the conversation.

# Style profiles (S_style)

The class option `profile=` switches layout, headings, captions, numbering and bibliography style together. Choose the profile in phase 1, confirm in phase 4. When the user's institution publishes its own requirements (методичні вказівки, a journal template), those win: record them as `constraint` entries and adjust with `\skedgeometry{...}` or small preamble changes.

## ieee (default): technical report in the style of the SKED source report

- Layout: A4, 11 pt, margins 25 mm left/right, 27 mm top/bottom, no paragraph indent, small paragraph spacing, navy accent color, running header with short title and page number.
- Title page: rule, title, subtitle, document type, metadata table (author, affiliation, version, date, platform), abstract and keywords on the same page. Table of contents on its own page.
- Headings: numbered "1.", "1.1.", "1.1.1.", sections with a rule underneath.
- Captions: "Рис. 1." below figures; "Таблиця 1." above tables; "Алгоритм 1"; "Лістинг 1." below code.
- Equations numbered (1), referenced as \eqnref.
- Bibliography: "Список літератури" / "References", numeric [1] in order of first citation, IEEE format, descriptors in the document language (т., №, с., та ін. in Ukrainian).
- Skeleton: Анотація (title page) · Зміст · 1 Вступ (problem, reader, contribution) · 2..n main sections from structure.md · Обмеження · Висновки · Список літератури · Додатки (optional).

## dstu: Ukrainian research report (ДСТУ 3008:2015 structure, ДСТУ 8302:2015 references)

- Layout defaults: A4, 14 pt, 1.5 line spacing, paragraph indent 1.25 cm, margins left 25, right 15, top 20, bottom 20 mm, page number top right, title page counted but unnumbered. These values follow common Ukrainian academic practice and sit within the standard's minimums as usually cited; confirm them with the user's institution in phase 4.
- Mandatory elements per ДСТУ 3008:2015: title page, abstract (реферат), introduction, main part, conclusions. Contents is required when the report has at least two sections, or one section and an appendix, and at least ten pages. Keywords: 5 to 15 words or phrases, in capitals.
- Title page: organization, УДК (optional), document type in capitals (for example "ЗВІТ ПРО НАУКОВО-ДОСЛІДНУ РОБОТУ"), title in capitals, author line with signature rule (label via `\skedauthorlabel{Керівник НДР}`), city and year at the bottom.
- Реферат: statistics line generated automatically (pages, figures, tables, sources with correct Ukrainian plural), text, keywords in capitals.
- Headings: structural elements (РЕФЕРАТ, ЗМІСТ, ВСТУП, ВИСНОВКИ, ПЕРЕЛІК ДЖЕРЕЛ ПОСИЛАНЬ) centered bold capitals via `\skedunnumbered{ВСТУП}`; sections "1 НАЗВА" centered bold capitals, each on a new page; subsections "1.1 Назва" bold from the paragraph indent. No period after the number.
- Captions: "Рисунок 2.1 – Назва" below, centered; "Таблиця 2.1 – Назва" above, left-aligned; numbering within sections; equations (2.1). Lists use a dash.
- Bibliography: "ПЕРЕЛІК ДЖЕРЕЛ ПОСИЛАНЬ", numbered "1." in order of first citation (alphabetical on request, `build.py --bib-order alpha`), DSTU 8302:2015 simplified form, descriptors in the language of each source (Т., №, С. for Cyrillic sources; Vol., No., P. for Latin ones). Electronic sources need `urldate` for "(дата звернення: DD.MM.YYYY)".
- Appendices: `\skedappendix` then `\section{Назва}` gives "Додаток А", Б, В … (letters Ґ, Є, З, І, Ї, Й, О, Ч, Ь skipped).
- Skeleton: Титульний аркуш · Реферат · Зміст · Перелік умовних позначень (optional, `\skedunnumbered`) · Вступ · 1..n розділи · Висновки · Перелік джерел посилань · Додатки.

## apa: APA 7 report

- Layout: A4 with 1 inch margins, 12 pt, double spacing, paragraph indent 0.5 in, page number top right.
- Title page: bold title in the upper half, author, affiliation, document type, date. Abstract on its own page with centered bold heading and indented italic "Keywords:" line.
- Headings unnumbered: level 1 centered bold, level 2 flush left bold, level 3 flush left bold italic.
- Captions: label in bold on its own line, title in italics on the next line, both **above** the figure or table. Put `\caption{}` before the figure body in this profile.
- Citations: author-year with natbib, `\citep{key}` → (Wei et al., 2022), `\citet{key}` → Wei et al. (2022). Reference list alphabetical with hanging indent, same-author same-year entries get a, b suffixes. Cyrillic sources precede Latin ones in Ukrainian documents.
- Skeleton: Title page · Abstract · Introduction (no heading label "Introduction" is needed in strict APA, keep one for reports) · main sections · Discussion or Limitations · Conclusion · References · Appendices.

## Judged Fc checklist

Write `quality/fc-judged.json` as a list of `{"item": "...", "pass": true|false, "note": "..."}`. Judge each item by reading the rendered pages, not the source.

Common to all profiles:
1. Title page shows every metadata field the profile needs, with no empty labels.
2. Abstract length fits the profile (ieee 120 to 250 words; dstu up to about 500 words; apa up to 250 words) and contains no facts absent from the body.
3. Keywords present (ieee 3 to 8; dstu 5 to 15 in capitals; apa 3 to 6).
4. Every section listed in structure.md exists in the same order.
5. Every figure, table, algorithm and code block has a caption and is referenced in the text before or near where it appears.
6. Terms are used consistently with the K* definitions; abbreviations are expanded at first use.
7. No text runs into margins; no diagram labels overlap boxes or lines; no table wider than the text block.
8. Limitations section states every deferred question from K*.
9. Bibliography formatting matches the profile on a spot check of three entries of different types.

ieee only:
10. Running header shows the short title; headings are numbered with trailing periods.

dstu only:
10. Section headings are in capitals, each section starts on a new page, caption dashes and numbering follow "Рисунок 2.1 – …", "Таблиця 2.1 – …".
11. Реферат statistics line matches the actual counts.
12. Electronic sources carry the access date.

apa only:
10. Captions sit above figures and tables with bold label and italic title.
11. In-text citations are author-year and every one matches a reference-list entry.

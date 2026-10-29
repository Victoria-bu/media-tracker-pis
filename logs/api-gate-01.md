# API-GATE — перша перевірка (REVISE)

**Дата:** 2026-10-29
**Раунд:** 1 з 2

---

## Знайдені проблеми

| # | Проблема | Файл | Статус |
|---|---|---|---|
| R1 | Відсутні сценарії для `POST /items/{id}/cover` і `DELETE /items/{id}/cover` | docs/api-scenarios.md | → виправлено в api-gate-02 |
| R2 | Відсутні негативні сценарії для 404 і 409 (EMAIL_TAKEN, ITEM_ALREADY_IN_COLLECTION) | docs/api-scenarios.md | → виправлено в api-gate-02 |
| R3 | Суперечність щодо бази статистики: SRS мовчить, openapi.yaml використовує completedAt, але sked-summary вказував на Sessions | docs/api-addendum.md | → вирішено рішенням А (completedAt, v2 для Sessions) |
| R4 | Хибне обґрунтування ADD-01 (snake_case) — JSON enum допускає пробіли | docs/api-addendum.md | → виправлено в api-gate-02 |
| R5 | Неточна фраза «для однокористувацьких систем» у ADD-06 | docs/api-addendum.md | → виправлено в api-gate-02 |
| R6 | F-010 у матриці: відсутні `POST /items`, `PATCH /items/{id}` | spec/traceability-matrix.md | → виправлено в api-gate-02 |

## Рішення

**REVISE** — виправлення виконано, повторна перевірка у api-gate-02.md.

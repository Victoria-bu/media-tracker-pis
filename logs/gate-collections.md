# Gate: Collections integrity — G2

**Дата:** 2026-11-07  
**Перевіряючий:** Victoria  
**Рішення:** **GO**

---

## Що перевірено

| Артефакт | Результат |
|---|---|
| Тест-лог (logs/test-log-etape3-4-*.md) | 111/111 passed, 7 test files |
| git diff c880c2e..HEAD (G1→G2) | Додано: Stage 3 (tags/sessions) і Stage 4 (collections) гілками |
| Ручна перевірка CASCADE | ✓ collections.test.ts: `AC-009: cascade — item removed from collection_items` |
| Ізоляція між користувачами | ✓ tags/sessions/collections: кожен тест перевіряє, що інший user бачить `[]` |

---

## AC-010 — повне покриття

Після G2 перевірки виявлено, що два аспекти AC-010 не мали явних тестів:
1. "тег з'являється в Item.tags після POST" — тест `AC-007: title+type` перевіряв `tags: []`, але не POST з тегами
2. "видалення тега не змінює інші атрибути" — тест `update tags → tags replaced` не перевіряв title/rating/notes

**Дія:** додано 2 тести до `tests/integration/items.test.ts` (рядки 246–266):

| Тест | Файл |
|---|---|
| `AC-010: tags stored after POST, appear in GET response` | items.test.ts |
| `AC-010: removing a tag via PATCH does not affect other attributes` | items.test.ts |

Оскільки реалізація вже існувала (Etape 2), ці тести одразу Green — не новий TDD-цикл, а доповнення покриття. Зафіксовано чесно: gap закритий post-factum.

GET /tags (tags.test.ts) покриває автодоповнення (повертає дедупліковані теги по user).

**Статус AC-010:** ✓ покрито повністю (5 тестів у tags.test.ts + 4 у items.test.ts).

---

## AC і BDD, що не тестуються через API (клієнтська логіка)

| AC / BDD | Причина відсутності в API-тестах |
|---|---|
| AC-011 (F-011) | Фільтрація за тегом — клієнтська. GET /items повертає всі елементи з полем `tags`. Фільтрування в браузері без server-запиту |
| AC-027 (F-027) | Сортування елементів всередині добірки — клієнтська. GET /collections/{id} повертає items з `createdAt` і `rating` для client-side sort |
| BDD "Filtering the catalog by tag" | Залежить від AC-011. Сервер лише надає дані; логіка фільтру — UI |
| BDD "Automatic completion date fill" | F-021: auto-fill = client form logic. Сервер зберігає те, що надіслано (PATCH /items/{id} приймає `completedAt`). Серверна частина тестується в Stage 5 |

Джерело: api-design.md §1 — розподіл функціональних вимог між API і клієнтом.

---

## Результати G2 за планом

З plan.md: "12 AC (Etapes 3–4) + AC-009 + 4 BDD"

| # | AC | Перевірено |
|---|---|---|
| 1 | AC-009 | ✓ cascade: items.test.ts + collections.test.ts |
| 2 | AC-010 | ✓ items.test.ts (4 tests) + tags.test.ts (5 tests) |
| 3 | AC-012 | ✓ sessions.test.ts |
| 4 | AC-013 | ✓ sessions.test.ts (sort + total) |
| 5 | AC-014 | ✓ sessions.test.ts (edit/delete) |
| 6 | AC-015 | ✓ collections.test.ts |
| 7 | AC-016 | ✓ collections.test.ts |
| 8 | AC-017 | ✓ collections.test.ts |
| 9 | AC-018 | ✓ collections.test.ts |
| 10 | AC-019 | ✓ collections.test.ts |
| 11 | AC-020 | ✓ collections.test.ts |
| — | AC-011 | Клієнтська (не API) |
| — | AC-027 | Клієнтська (не API) |

BDD G2:
- "Re-watching a film with a different rating" ✓ (sessions.test.ts, AC-012)
- "An item belongs to multiple collections simultaneously" ✓ (collections.test.ts, AC-015)
- "Filtering the catalog by tag" — не API
- "Automatic completion date fill" → Stage 5

---

## Зауваження

1. AC-010 gap — виправлено; 2 тести додані post-factum (не Red-Green).
2. app.ts merge conflict (Stage 3 + 4 обидві модифікували app.ts) — вирішено: всі 6 роутерів коректно зареєстровані.
3. ADD-03 (409 ITEM_ALREADY_IN_COLLECTION) і ADD-04 (server-side session sort) явно перевірені тестами.

# Gate: TEST-GATE (Addendum 8а) — TG

**Дата:** 2026-11-07  
**Перевіряючий:** Victoria  
**Рішення:** REVISE → виправлено → **GO**

---

## Перший прогін (REVISE)

| Результат | Деталь |
|---|---|
| 10/12 fail | 2 тести проходили з хибної причини |
| AC-048 | `no items → zeros` проходив, бо completedAt теж повертає zeros |
| AC-049 Dec-1 | `NOT in Nov` проходив, бо completedAt з неCompleted item = 0 = очікуване |

## Виправлення

| Тест | Зміна |
|---|---|
| AC-048 | Додано: session у LAST_YEAR + completed item у Nov → completedAt=1, очікується=0 |
| AC-049 Dec-1 NOT in Nov | Додано completed item у Nov → виникає реальний конфлікт між режимами |
| AC-049 Dec-1 IS in Dec | Новий тест: clock→Dec-15, session Dec-1, очікується books=1, completedAt повертає 0 |

## Підтвердження після виправлень

| Перевірка | Результат |
|---|---|
| stats-addendum.test.ts | **13/13 fail** (всі з очікуваної причини) |
| 131 наявних тестів (окремий прогін) | **131/131 pass** |
| setClock у AC-041, AC-042, AC-049 | ✓ FIXED_NOW = 2026-11-07T12:00:00Z у beforeEach |
| Всі падіння через відсутність basis | ✓ жодного синтаксичного чи import-помилки |

## Відповідність AC ↔ тест

| AC | Кількість тестів | Файл |
|---|---|---|
| AC-040 | 1 | stats-addendum.test.ts |
| AC-041 | 1 | stats-addendum.test.ts |
| AC-042 | 1 | stats-addendum.test.ts |
| AC-043 | 1 | stats-addendum.test.ts |
| AC-044 | 2 | stats-addendum.test.ts |
| AC-045 | 1 | stats-addendum.test.ts |
| AC-046 | 1 | stats-addendum.test.ts |
| AC-047 | 1 | stats-addendum.test.ts |
| AC-048 | 1 | stats-addendum.test.ts |
| AC-049 | 3 (Nov-30, Dec-1 NOT Nov, Dec-1 IS Dec) | stats-addendum.test.ts |

**Разом: 13 тестів на 10 AC**

## Рішення

**GO** — всі 13 тестів падають з очікуваної причини (basis не реалізовано).
Переходимо до Etape 8б: реалізація basis=sessions.

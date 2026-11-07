# Gate: Foundation Ready — G1

**Дата:** 2026-11-07  
**Перевіряючий:** Victoria  
**Рішення:** **GO**

---

## Що перевірено

| Артефакт | Результат |
|---|---|
| Тест-лог (logs/test-log-etape2-*.md) | 68/68 passed, 4 test files |
| git diff 1db0d91..HEAD | 36 файлів, 8147 insertions |
| Ручні BDD-сценарії (6 штук, список нижче) | ✓ пройшли |

---

## Розбіжність: план — 19 AC, у звіті — 15

### Розклад 19 AC

| Група | ACs | Кількість |
|---|---|---|
| Stage 1 — Auth | AC-001, AC-002, AC-003, AC-029, AC-031, AC-033, AC-035, AC-039 | 8 |
| Stage 2 — Server | AC-004, AC-007, AC-008, AC-009, AC-025, AC-028 | 6 |
| Stage 2 — Data-only | AC-005, AC-006, AC-023, AC-024, AC-026 | 5 |
| **Разом** | | **19** |

### Чому 15 у звіті

У звіті перелічено 14 унікальних ACs + ADD-06 (адендум). Відсутні 4:

| AC | REQ | Причина відсутності |
|---|---|---|
| AC-005 | F-005 | Фільтрація за типом — клієнтська. Сервер повертає тип у кожному елементі GET /items |
| AC-006 | F-006 | Фільтрація за статусом — клієнтська. Сервер повертає status у GET /items |
| AC-023 | F-023 | Пошук за назвою — клієнтська. Сервер повертає title у GET /items |
| AC-026 | F-026 | Сортування — клієнтське. Сервер повертає createdAt і rating в GET /items |

Джерело: api-design.md §1 — «Фільтрація, сортування, пошук: клієнт, оскільки каталог до 100 елементів завантажується цілком».

**AC-024** (F-024, type-specific fields): серверна частина (прийняти і повернути поля author/pages/seasons/director/duration) покрита тестами AC-007 — `type-specific fields (book/film/series)`. Клієнтська частина (показ полів у формі) не тестується в API.

**Висновок:** 19 AC усі є в плані; 14 (сервер) + 5 (data-only) = 19. Звіт перелічував лише серверні, що й дало 15 (14 AC + ADD-06).

---

## BDD-сценарії G1 (6 із 10+)

| Сценарій | Статус |
|---|---|
| New User Registration | ✓ тест AC-001 (auth.test.ts) |
| Login with correct credentials | ✓ тест AC-002 |
| Accessing a protected page after logout | ✓ тест AC-003 |
| Adding a new content item to the catalog | ✓ тест AC-007 |
| Deleting an item removes it from all collections | ✓ тест AC-009 (cascade в items.test.ts) |
| Registration with invalid input is rejected | ✓ тест AC-031 |

## BDD-сценарії, що переходять до G2+

| Сценарій | Переходить до |
|---|---|
| Re-watching a film with a different rating | G2, Stage 3 — Sessions (AC-012, AC-013) |
| An item belongs to multiple collections simultaneously | G2, Stage 4 — Collections (AC-015, AC-019) |
| Filtering the catalog by tag | G2, Stage 3 — Tags data (AC-010); фактична фільтрація — клієнт |
| Automatic completion date fill | Stage 5 — completedAt на клієнті, сервер зберігає (AC-021) |
| Searching the catalog by partial title | Не тестується в API (клієнтська); AC-023 — data-only |

---

## Зауваження

1. **TDD-порушення Etape 1** виправлено: authService/userRepo написані до тестів. Коміт-історію реструктуровано, зафіксовано в logs/tdd-note-etape1.md.
2. Коміти тепер відповідають конвенції: `chore(setup)` → `spec` → `test(Red)` → `feat(Green)` → `chore(NF-009)` на кожен етап.
3. AC-005, AC-006, AC-023, AC-026, AC-024 (клієнтська частина) не мають API-тестів — це відповідає контракту api-design.md §1.

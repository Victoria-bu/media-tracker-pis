# Перевірка відповідності глосарію (Пункт 3)

Порівняння термінів глосарію SRS з іменами в коді та API.

---

## Таблиця відповідності

| Термін глосарію (SRS) | Ім'я в коді / API | Статус | Пояснення |
|----------------------|-------------------|--------|-----------|
| **Catalog** | `GET /items` (список всіх items) | ✓ Відповідає концепту | Явна сутність Catalog у коді відсутня — каталог моделюється як сукупність всіх `item` користувача. Це відповідає SRS: «Catalog — the complete list of all content items added by the user.» |
| **Content Item** | `item` (ApiItem, itemService, itemRepo, routes/items) | ✓ Допустиме скорочення | SRS: «Content Item». Код використовує `item` — стандартне скорочення, загальноприйнята практика. Повне ім'я `ContentItem` було б надмірним. |
| **Collection** | `collection` (ApiCollection, collectionService, routes/collections) | ✓ Точне співпадіння | |
| **Session** | `session` (ApiSession, sessionService, routes/sessions) | ✓ Точне співпадіння | |
| **Tag** | `tag` (tagService, routes/tags, `item.tags: string[]`) | ✓ Точне співпадіння | |
| **Status** | `status` (поле Item) | ✓ Ім'я збігається | |
| **Status** (значення) `in progress` | `in_progress` у API та DB | ⚠ snake_case | **ADD-01** (docs/api-addendum.md): SRS описує статус як «in progress» (рядок UI), але API та DB використовують `in_progress` (snake_case без пробілу). Обґрунтовано: пробіли незручні в URL-параметрах та SQL-енумах. Задокументовано у ADD-01. |
| **Status** (значення) `on hold` | `on_hold` у API та DB | ⚠ snake_case | Те саме обґрунтування, що й `in_progress` — ADD-01. |
| **TV Series** | `series` у коді (`type: 'book' \| 'series' \| 'film'`) | ⚠ Скорочення | SRS вживає «TV series» (повна назва). Код скорочує до `series`. Причина: мінімалізм enum-значень; «TV» надлишкове, бо тип уже однозначно ідентифікується контекстом. Вплив: фільтр у UI показує «Series» — відповідає очікуванням. |
| **nickname** | `nickname` (ApiUser.nickname, userRepo, authService) | ✓ Точне співпадіння | |
| **completedAt** | `completedAt` в API / `completed_at` у DB | ✓ Відповідає конвенції | camelCase в API, snake_case у DB — стандартний маппінг конвенції. SRS використовує «completion date» як концепт; конкретна назва поля `completedAt` визначена в ADD-05. |

---

## Розбіжності — деталі

### ADD-01 — `in_progress` / `on_hold` замість «in progress» / «on hold»

**Джерело:** `docs/api-addendum.md`, розділ ADD-01.  
**Вимога:** REQ-F-006 (тип фільтрації).  
**Рішення:** snake_case для багатослівних enum-значень — загальноприйнята практика в REST API (наприклад, GitHub, Stripe). Уникає URL-encoding при передачі як query param.  
**Вплив на код:** жодного; `planned` та `completed` залишились незмінними.

### `series` замість «TV series»

**Немає окремого ADD-запису** (неявне рішення при першому проектуванні).  
**Код:** `type: 'book' | 'series' | 'film'` — три значення без префіксів.  
**Відповідність:** SRS §3.1 Glossary посилається на «TV series», але в таблиці REQ-F-007 та REQ-F-005 вживає просто «TV series / film / book» — скорочення «series» є природним.  
**Рекомендація:** Якщо виникне потреба розширити до підтипів (TV / аніме / вебсеріал) — додати окремий addendum. Поточна форма `series` достатня.

---

## Висновок

Усі ключові терміни мають прямі відповідники в коді. Розбіжності (2 з 9 термінів) задокументовані в addendum або є стандартними скороченнями. **Виправлень у коді не потрібно.**

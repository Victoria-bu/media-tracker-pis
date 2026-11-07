# API Contract Run — Prism Proxy Validation

**Дата:** 2026-11-07  
**Метод:** Prism proxy v5.14.x  
**Конфігурація:** `npx prism proxy spec/openapi.yaml http://localhost:3099/api/v1 --port 4055`  
**Spec:** spec/openapi.yaml (після ADD-07)

---

## Запити та результати

| # | Метод | URL (через proxy :4055) | HTTP | Prism violation? |
|---|---|---|---|---|
| 1 | POST | /auth/register | 201 | security warning (очікуване, див. нижче) |
| 2 | POST | /auth/login | 200 | security warning |
| 3 | GET | /items | 200 `[]` | security warning |
| 4 | POST | /items `{title,type,tags}` | 201 | **response.createdAt format** |
| 5 | GET | /tags | 200 `["fantasy"]` | security warning |
| 6 | POST | /items/{id}/sessions | 201 | security warning |
| 7 | GET | /items/{id}/sessions | 200 `{sessions,total}` | security warning |
| 8 | POST | /collections | 201 | security warning |
| 9 | GET | /collections | 200 | security warning |
| 10 | GET | /stats?period=all | 200 `{period,basis,books,series,films,total}` | security warning |
| 11 | GET | /stats?period=month&basis=completedAt | 200 | security warning |
| 12 | GET | /stats?period=month&basis=sessions | 200 | security warning |
| 13 | GET | /stats?period=all&basis=invalid | 400 `INVALID_BASIS` | request violation (коректно — сервер теж відхиляє) |
| 14 | GET | /stats (без period) | 400 `VALIDATION_ERROR` | request violation (коректно — поле обов'язкове) |
| 15 | POST | /auth/logout | 204 | security warning |

---

## Порушення

### V-01: `response.body.createdAt` format (РЕАЛЬНА РОЗБІЖНІСТЬ)

| Параметр | Значення |
|---|---|
| Маршрут | POST /items (і всі відповіді з Item) |
| Схема spec | `createdAt: {type: string, format: date-time}` |
| Фактична відповідь | `"createdAt": "2026-11-07 16:31:50"` |
| Очікувана ISO 8601 | `"createdAt": "2026-11-07T16:31:50.000Z"` |
| Причина | SQLite `datetime('now')` повертає формат `YYYY-MM-DD HH:MM:SS` без `T` і без timezone |
| Вплив | Порушення `format: date-time` (RFC 3339) |

**Також зачіпає:** `CollectionItem.createdAt` у GET /collections/{id} (та ж схема).

---

### V-02: `request Invalid security scheme used` (ХИБНЕ СПРАЦЮВАННЯ)

| Параметр | Значення |
|---|---|
| Маршрут | Усі захищені ендпоінти |
| Схема spec | `securitySchemes: cookieAuth: {type: apiKey, in: cookie, name: session}` |
| Причина | Prism передає cookie через заголовок `Cookie:`, але Prism v5 не розпізнає `apiKey in cookie` як валідну схему для перевірки запиту і не бачить cookie у форматі Bearer/Basic |
| Вплив | **Хибне спрацювання** — сервер коректно читає cookie і повертає 200/201/204 |
| Доказ | Усі відповіді (3-15) містять реальні дані, а не 401 |

---

## Аналіз V-01: що змінити

**Варіант А — виправити код (рекомендовано):**  
Серіалізувати `created_at` з SQLite у ISO 8601 перед поверненням:  
- `src/repositories/itemRepo.ts`: після вибірки `new Date(item.created_at).toISOString()`  
- Або в `src/services/itemService.ts`: `toApi()` → `createdAt: new Date(db.created_at).toISOString()`

**Варіант Б — послабити специфікацію:**  
Змінити `format: date-time` на `format: string` у openapi.yaml.  
Не рекомендовано: клієнт не може покластися на парсинг дати.

**Варіант В — обробити у тестах:**  
Поточні тести не перевіряють формат createdAt (тільки наявність). Їх можна додати.

---

## Відповідність ключових схем

| Схема | Поле | Spec | Факт | Статус |
|---|---|---|---|---|
| User | id, email, nickname | required | ✓ присутні | ✓ |
| Item | id, title, type, status, tags, createdAt | required | ✓ присутні | **createdAt format ✗** |
| Session | id, itemId, date | required | ✓ присутні | ✓ |
| Collection | id, name | required | ✓ присутні | ✓ |
| Stats | period, basis, books, series, films, total | required | ✓ присутні | ✓ |
| Error (400) | code, message | required | ✓ INVALID_BASIS, VALIDATION_ERROR | ✓ |

---

## Висновок

**Знайдено 1 реальну розбіжність (V-01):** `Item.createdAt` та `CollectionItem.createdAt`
повертаються у форматі `"YYYY-MM-DD HH:MM:SS"` (SQLite), а spec вимагає `format: date-time`
(ISO 8601, RFC 3339). Пропонується виправити у коді (Варіант А).

**V-02 — хибне спрацювання** Prism щодо cookie auth: не є порушенням реального контракту
(сервер приймає cookie і повертає дані).

**Чекаю рішення: виправити `createdAt` у коді чи обмежити до зауваження у матриці?**

# Посібник користувача — Media Tracker API

Технічний опис основних сценаріїв роботи через REST API.  
Термінологія відповідає глосарію `spec/srs.md §3`.  
Повний API-контракт: `spec/openapi.yaml` · Rendered: `docs/api/index.html`

**Base URL:** `http://localhost:3000/api/v1`  
**Аутентифікація:** HTTP-only session cookie, встановлюється автоматично після реєстрації/входу.  
**curl:** прапор `-c cookies.txt -b cookies.txt` зберігає та передає cookie між запитами.

---

## Зміст

1. [Реєстрація](#1-реєстрація)
2. [Вхід](#2-вхід)
3. [Каталог — додавання елементів контенту](#3-каталог--додавання-елементів-контенту)
4. [Каталог — перегляд та редагування](#4-каталог--перегляд-та-редагування)
5. [Теги](#5-теги)
6. [Сесії](#6-сесії)
7. [Добірки](#7-добірки)
8. [Статистика](#8-статистика)
9. [Вихід](#9-вихід)

---

## 1. Реєстрація

**REQ-F-001.** Три обов'язкові поля: `email`, `password` (мін. 8 символів), `nickname` (2–50 символів).

```bash
curl -s -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{
    "email": "alice@example.com",
    "password": "secret123",
    "nickname": "Alice"
  }'
```

**201 Created** — сесійна cookie встановлена:

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "alice@example.com",
  "nickname": "Alice"
}
```

**Помилки:**

| Ситуація | Код | Відповідь |
|----------|-----|-----------|
| Пароль < 8 символів | `400` | `{"code":"VALIDATION_ERROR","field":"password"}` |
| Email вже зареєстрований | `409` | `{"code":"EMAIL_TAKEN","field":"email"}` |

---

## 2. Вхід

**REQ-F-002.** Якщо вже є обліковий запис — входьте замість реєстрації.

```bash
curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{
    "email": "alice@example.com",
    "password": "secret123"
  }'
```

**200 OK:**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "alice@example.com",
  "nickname": "Alice"
}
```

**401** при невірних credentials: `{"code":"INVALID_CREDENTIALS"}`.  
Однаковий код для «email не знайдено» і «невірний пароль» — захист від enumeration.

---

## 3. Каталог — додавання елементів контенту

**REQ-F-007.** Елемент контенту (Content Item) — книга, серіал або фільм.  
Обов'язкові поля: `title`, `type`. Решта — необов'язкові.

### Додати книгу

```bash
curl -s -X POST http://localhost:3000/api/v1/items \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "title": "The Name of the Wind",
    "type": "book",
    "author": "Patrick Rothfuss",
    "pages": 662,
    "status": "in_progress",
    "tags": ["fantasy", "favourite"]
  }'
```

**201 Created:**

```json
{
  "id": "a1b2c3d4-...",
  "title": "The Name of the Wind",
  "type": "book",
  "status": "in_progress",
  "rating": null,
  "notes": null,
  "tags": ["fantasy", "favourite"],
  "coverUrl": null,
  "completedAt": null,
  "createdAt": "2026-11-17T10:00:00.000Z",
  "author": "Patrick Rothfuss",
  "pages": 662,
  "seasons": null,
  "director": null,
  "duration": null
}
```

### Додати серіал

```bash
curl -s -X POST http://localhost:3000/api/v1/items \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "title": "Severance",
    "type": "series",
    "seasons": 2,
    "status": "completed",
    "rating": 9
  }'
```

### Додати фільм

```bash
curl -s -X POST http://localhost:3000/api/v1/items \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "title": "Interstellar",
    "type": "film",
    "director": "Christopher Nolan",
    "duration": 169,
    "status": "completed",
    "rating": 10
  }'
```

**Допустимі значення `type`:** `book` · `series` · `film`  
**Допустимі значення `status`:** `planned` · `in_progress` · `completed` · `on_hold`  
**`rating`:** ціле число 0–10 або `null`

---

## 4. Каталог — перегляд та редагування

### Список всіх елементів

```bash
curl -s http://localhost:3000/api/v1/items -b cookies.txt
```

**200 OK** — масив усіх елементів контенту, відсортованих за датою додавання (новіші першими).

### Отримати один елемент

```bash
curl -s http://localhost:3000/api/v1/items/a1b2c3d4-... -b cookies.txt
```

**200 OK** — один об'єкт. **404** якщо не існує або чужий.

### Оновити елемент

**REQ-F-008.** PATCH — часткове оновлення: передаються лише поля, що змінюються.

```bash
curl -s -X PATCH http://localhost:3000/api/v1/items/a1b2c3d4-... \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "status": "completed",
    "rating": 8,
    "completedAt": "2026-11-17"
  }'
```

**200 OK** — оновлений об'єкт.

### Завантажити обкладинку

**REQ-F-025.** Формати: JPEG, PNG, WebP. Ліміт: 5 MB.

```bash
curl -s -X POST http://localhost:3000/api/v1/items/a1b2c3d4-.../cover \
  -b cookies.txt \
  -F "file=@/path/to/cover.jpg"
```

**200 OK:** `{"coverUrl":"/covers/uuid.jpg"}`

### Видалити елемент

**REQ-F-009.** Елемент автоматично видаляється з усіх добірок (ON DELETE CASCADE).

```bash
curl -s -X DELETE http://localhost:3000/api/v1/items/a1b2c3d4-... -b cookies.txt
```

**204 No Content.**

---

## 5. Теги

**REQ-F-010.** Теги — довільні текстові мітки на елементах контенту.

### Список тегів (для автодоповнення)

**REQ-F-011.** Повертає унікальні теги з усіх елементів поточного користувача.

```bash
curl -s http://localhost:3000/api/v1/tags -b cookies.txt
```

**200 OK:**

```json
["fantasy", "favourite", "sci-fi", "drama"]
```

### Додати / видалити теги на елементі

Теги оновлюються через PATCH елемента — передається повний новий масив.

```bash
# Додати тег "epic" до наявних
curl -s -X PATCH http://localhost:3000/api/v1/items/a1b2c3d4-... \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"tags": ["fantasy", "favourite", "epic"]}'

# Видалити всі теги
curl -s -X PATCH http://localhost:3000/api/v1/items/a1b2c3d4-... \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"tags": []}'
```

---

## 6. Сесії

**REQ-F-012.** Сесія — окремий запис перегляду або читання елемента.  
Один елемент контенту може мати декілька сесій з різними датами та рейтингами.

### Список сесій елемента

```bash
curl -s http://localhost:3000/api/v1/items/a1b2c3d4-.../sessions -b cookies.txt
```

**200 OK:**

```json
{
  "sessions": [
    {
      "id": "s1b2c3...",
      "itemId": "a1b2c3d4-...",
      "date": "2026-11-17",
      "rating": 9,
      "note": "Дивилась вдруге — ще кращий"
    }
  ],
  "total": 1
}
```

### Додати сесію

```bash
curl -s -X POST http://localhost:3000/api/v1/items/a1b2c3d4-.../sessions \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "date": "2026-11-17",
    "rating": 9,
    "note": "Перший перегляд"
  }'
```

**201 Created** — об'єкт сесії.  
`rating` та `note` — необов'язкові.

### Оновити сесію

```bash
curl -s -X PATCH http://localhost:3000/api/v1/items/a1b2c3d4-.../sessions/s1b2c3... \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"note": "Переглянула вдруге, рейтинг змінила", "rating": 8}'
```

### Видалити сесію

```bash
curl -s -X DELETE \
  http://localhost:3000/api/v1/items/a1b2c3d4-.../sessions/s1b2c3... \
  -b cookies.txt
```

**204 No Content.**

---

## 7. Добірки

**REQ-F-015–020.** Добірка (Collection) — іменована група елементів контенту.  
Один елемент може входити до кількох добірок одночасно (many-to-many).

### Створити добірку

```bash
curl -s -X POST http://localhost:3000/api/v1/collections \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"name": "Улюблені"}'
```

**201 Created:**

```json
{"id": "c1d2e3...", "name": "Улюблені"}
```

### Список добірок

```bash
curl -s http://localhost:3000/api/v1/collections -b cookies.txt
```

**200 OK** — масив `[{"id":"...","name":"..."}]`.

### Вміст добірки

```bash
curl -s http://localhost:3000/api/v1/collections/c1d2e3... -b cookies.txt
```

**200 OK:**

```json
{
  "id": "c1d2e3...",
  "name": "Улюблені",
  "items": [
    {"id": "a1b2c3...", "title": "Severance", "type": "series", "status": "completed", "rating": 9, "createdAt": "2026-11-17T10:00:00.000Z"}
  ]
}
```

### Додати елемент до добірки

```bash
curl -s -X POST http://localhost:3000/api/v1/collections/c1d2e3.../items \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"itemId": "a1b2c3d4-..."}'
```

**201 Created:** `{"itemId":"...","collectionId":"..."}`.  
**409** якщо елемент вже є в цій добірці.

### Видалити елемент із добірки

**REQ-F-019.** Елемент лишається в каталозі та інших добірках.

```bash
curl -s -X DELETE \
  http://localhost:3000/api/v1/collections/c1d2e3.../items/a1b2c3d4-... \
  -b cookies.txt
```

**204 No Content.**

### Перейменувати добірку

```bash
curl -s -X PATCH http://localhost:3000/api/v1/collections/c1d2e3... \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"name": "Топ фільми 2026"}'
```

### Видалити добірку

**REQ-F-018.** Елементи каталогу лишаються.

```bash
curl -s -X DELETE http://localhost:3000/api/v1/collections/c1d2e3... -b cookies.txt
```

**204 No Content.**

---

## 8. Статистика

**REQ-F-022.** Персональна статистика — кількість елементів або сесій за типом і часовим проміжком.

### Параметри

| Параметр | Значення | Опис |
|----------|----------|------|
| `period` | `month` | Поточний календарний місяць |
| `period` | `year` | Поточний рік |
| `period` | `all` | Весь час |
| `basis` | `completedAt` *(дефолт)* | Рахує елементи зі `status=completed` та відповідною датою `completedAt` |
| `basis` | `sessions` | Рахує Сесії за їхньою датою (незалежно від статусу елемента) |

### Завершені елементи цього місяця

```bash
curl -s "http://localhost:3000/api/v1/stats?period=month" -b cookies.txt
```

**200 OK:**

```json
{
  "period": "month",
  "basis": "completedAt",
  "books": 1,
  "series": 0,
  "films": 2,
  "total": 3
}
```

### Перегляди (Сесії) цього року

```bash
curl -s "http://localhost:3000/api/v1/stats?period=year&basis=sessions" -b cookies.txt
```

**200 OK:**

```json
{
  "period": "year",
  "basis": "sessions",
  "books": 4,
  "series": 2,
  "films": 7,
  "total": 13
}
```

> Якщо фільм переглянуто двічі в поточному році — він дає **2** у `films` при `basis=sessions`,
> але лише **1** при `basis=completedAt`.

### Вся статистика за всі часи

```bash
curl -s "http://localhost:3000/api/v1/stats?period=all" -b cookies.txt
```

---

## 9. Вихід

**REQ-F-003.** Інвалідує сесійну cookie.

```bash
curl -s -X POST http://localhost:3000/api/v1/auth/logout \
  -b cookies.txt \
  -c cookies.txt
```

**204 No Content.** Після цього всі запити з цією cookie повертають **401**.

---

## Загальні коди відповідей

| HTTP | `code` | Значення |
|------|--------|----------|
| `200` | — | Успішний запит |
| `201` | — | Ресурс створено |
| `204` | — | Успішно, тіло відсутнє |
| `400` | `VALIDATION_ERROR` | Невалідне тіло запиту (Zod) |
| `401` | `UNAUTHORIZED` | Не аутентифіковано (немає сесії) |
| `404` | `NOT_FOUND` | Ресурс не знайдено або належить іншому користувачу |
| `409` | `EMAIL_TAKEN` / `ITEM_ALREADY_IN_COLLECTION` | Конфлікт стану |
| `500` | `INTERNAL_ERROR` | Непередбачена помилка сервера |

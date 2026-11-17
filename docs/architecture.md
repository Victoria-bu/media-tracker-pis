# Архітектура системи — Media Tracker PIS

## Зміст
1. [Шари системи](#шари-системи)
2. [Компоненти](#компоненти)
3. [Потік HTTP-запиту](#потік-http-запиту)
4. [Схема бази даних](#схема-бази-даних)
5. [Логування](#логування)

---

## Шари системи

Система побудована за **шаровою архітектурою** з чіткою однонаправленою залежністю:

```
HTTP Client
    │
    ▼
┌─────────────────────────────────────────────┐
│  Routes (src/routes/)                        │  HTTP: парсинг body, відповідь, статус-коди
│  Middleware (src/middleware/)                │  Cross-cutting: auth, logging, error handler
└─────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────┐
│  Services (src/services/)                    │  Бізнес-логіка; не знає про req/res
└─────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────┐
│  Repositories (src/repositories/)            │  Прямі SQL-запити; не знає про бізнес-логіку
└─────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────┐
│  SQLite (better-sqlite3)                     │  Файловий DB / in-memory для тестів
└─────────────────────────────────────────────┘
```

**Правило:** жоден шар не імпортує з шару вище. Сервіс може викликати репозиторій,
але не навпаки. Route-handler не викликає репозиторій напряму.

---

## Компоненти

### Entry point — `src/server.ts`

Ініціалізує singleton SQLite (`getDb()`), передає `db` у `createApp()`, запускає
HTTP-сервер. `db` передається dependency-injection-style через аргумент функцій,
а не як глобальна змінна — це дозволяє тестам замінити його на in-memory SQLite.

### Express application — `src/app.ts`

Збирає middleware і підключає роутери:

```
requestLogger → express.json → express-session → routes → errorHandler
```

Session store: in-memory (express-session default). У production слід замінити на
persistent store (Redis / SQLite session store) для відновлення після перезапуску.

### Middleware

| Файл | Призначення |
|------|-------------|
| `middleware/auth.ts` | Блокує неавтентифіковані запити; повертає 401 |
| `middleware/errorHandler.ts` | Перехоплює всі `next(err)`, логує, повертає 500 |
| `middleware/requestLogger.ts` | Логує кожен запит (метод, шлях, статус, час) |

### Services

Містять всю бізнес-логіку. Кожен сервіс відповідає за одну предметну область:

| Файл | Відповідальність |
|------|-----------------|
| `authService.ts` | Реєстрація (bcrypt hash), вхід (bcrypt compare), оновлення нікнейму |
| `itemService.ts` | CRUD каталогу, управління обкладинкою |
| `sessionService.ts` | CRUD сесій перегляду/читання |
| `collectionService.ts` | CRUD добірок, many-to-many зв'язки з items (транзакція) |
| `statsService.ts` | Агрегація статистики (basis: completedAt / sessions) |
| `tagService.ts` | Список унікальних тегів поточного користувача |

### Validators — `src/validators/`

Zod-схеми для всіх вхідних HTTP-тіл. Статичні TypeScript-типи виводяться через
`z.infer`. Валідація виконується у route-handler перед викликом сервісу.

### Configuration — `src/config/env.ts`

Єдина точка доступу до `process.env`. Усі значення мають безпечні dev-дефолти.

### Utilities

| Файл | Призначення |
|------|-------------|
| `utils/errors.ts` | `makeError()` / `notFound()` — фабрика domain-помилок; `isAppError()` — type guard |
| `utils/clock.ts` | Замінювана clock-функція для детермінованих тестів статистики |

---

## Потік HTTP-запиту

Приклад: `PATCH /api/v1/items/:id` (оновлення елемента каталогу).

```
1. Client → POST /api/v1/items/abc-123
       body: { "rating": 8, "status": "completed" }

2. requestLogger middleware
       → logRequest("PATCH", "/items/abc-123", …)

3. requireAuth middleware
       → перевіряє req.session.userId
       → якщо відсутній: 401 UNAUTHORIZED, стоп

4. Route handler (src/routes/items.ts)
       → updateItemSchema.parse(req.body)   ← Zod validation
       → якщо invalid: 400 VALIDATION_ERROR, стоп
       → itemService.updateItem(db, id, userId, data)

5. itemService.updateItem()
       → assertOwner(itemRepo.getItemById(db, id), userId)
       → якщо не знайдено / чужий: throw notFound() → 404
       → itemRepo.updateItem(db, id, data)

6. itemRepo.updateItem()
       → db.prepare("UPDATE items …").run(…)
       → повертає оновлений DbItem

7. toApi(DbItem) → ApiItem  (snake_case → camelCase, ISO date)

8. Route handler → res.status(200).json(ApiItem)

9. requestLogger middleware (finish event)
       → logRequest("PATCH", "/items/abc-123", 200, 12ms)
```

**Обробка помилок:** якщо в кроці 5–6 кинуто виняток, що не є AppError
(наприклад, помилка SQLite), `next(err)` передає його до `errorHandler` → 500.

---

## Схема бази даних

```
┌──────────────────────────────────────┐
│ users                                │
│ ─────────────────────────────────── │
│ id           TEXT PK                 │
│ email        TEXT UNIQUE NOT NULL    │
│ password_hash TEXT NOT NULL          │
│ nickname     TEXT NOT NULL (2–50)    │
│ created_at   TEXT                    │
└─────────────────┬────────────────────┘
                  │ ON DELETE CASCADE
        ┌─────────┴──────────┐
        │                    │
┌───────▼──────────┐  ┌──────▼──────────────┐
│ items            │  │ collections          │
│ ──────────────── │  │ ─────────────────── │
│ id      TEXT PK  │  │ id      TEXT PK      │
│ user_id TEXT FK  │  │ user_id TEXT FK      │
│ title   TEXT     │  │ name    TEXT (≥1)    │
│ type    TEXT     │  └──────┬──────────────┘
│   book|series|film│        │ ON DELETE CASCADE
│ status  TEXT     │        │
│   planned|in_progress│     │
│   completed|on_hold│       │
│ rating  INTEGER 0–10│      │
│ notes   TEXT     │  ┌──────▼──────────────┐
│ tags    TEXT(JSON)│  │ collection_items     │
│ cover_url TEXT   │  │ ─────────────────── │
│ completed_at TEXT│◄─┤ collection_id FK    │
│ created_at  TEXT │  │ item_id      FK      │
│ author  TEXT     │  │ PK(coll_id, item_id) │
│ pages   INTEGER  │  └─────────────────────┘
│ seasons INTEGER  │
│ director TEXT    │
│ duration INTEGER │
└────────┬─────────┘
         │ ON DELETE CASCADE
┌────────▼─────────┐
│ sessions         │
│ ──────────────── │
│ id      TEXT PK  │
│ item_id TEXT FK  │
│ date    TEXT     │
│ rating  INTEGER 0–10 │
│ note    TEXT     │
└──────────────────┘
```

**Примітки:**
- `tags` зберігається як JSON-масив рядків у TEXT-полі (немає окремої таблиці тегів — спрощення MVP).
- `ON DELETE CASCADE` забезпечує каскадне видалення: users → items + collections → sessions + collection_items.
- WAL mode (`PRAGMA journal_mode = WAL`) увімкнено для конкурентного читання.
- `PRAGMA foreign_keys = ON` увімкнено явно (SQLite вимикає FK за замовчуванням).

---

## Логування

Логер: **pino** (JSON до stdout). У test-середовищі рівень `'silent'` — жодних виводів.

| Функція | Поле `type` | Коли викликається |
|---------|-------------|-------------------|
| `logRequest` | `request` | Кожен HTTP-запит (middleware, подія `finish`) |
| `logAuth` | `auth` | register, login, logout, login_failed |
| `logCrud` | `crud` | Кожна мутація через сервіс (create/update/delete) |
| `logValidationError` | `validation_error` | Невалідне тіло запиту (Zod fail) |
| `logError` | `server_error` | Непередбачена помилка (errorHandler) |

Формат запису (приклад):

```json
{"level":30,"time":1700000000000,"type":"request","method":"POST","path":"/items","status":201,"durationMs":14}
{"level":30,"time":1700000000001,"type":"crud","operation":"create","resource":"item","userId":"u-1","resourceId":"i-42"}
```

Структурований JSON-формат дозволяє парсити логи стандартними інструментами
(jq, Grafana Loki, Datadog тощо) без додаткового парсингу.

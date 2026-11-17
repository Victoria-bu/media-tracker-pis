# Coding Convention — Media Tracker PIS

**Стек:** TypeScript 5 · Node.js / Express · React 19 · Vite · better-sqlite3 · Zod  
**Первинне джерело:** [Google TypeScript Style Guide](https://google.github.io/styleguide/tsguide.html)  
**Інструмент:** `eslint.config.mjs` (eslint + typescript-eslint recommended)

---

## 1. Базовий стандарт

Конвенція базується на **Google TypeScript Style Guide**. Де він мовчить —
застосовується [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/).
TypeScript скомпільований у `strict: true` (`tsconfig.json`).

---

## 2. Іменування

| Сутність | Стиль | Приклад |
|----------|-------|---------|
| Змінна, параметр, поле об'єкта | `camelCase` | `userId`, `coverUrl` |
| Функція, метод | `camelCase` | `handleSave`, `getItemById` |
| Інтерфейс, тип | `PascalCase` | `ApiItem`, `AppError` |
| React-компонент | `PascalCase` | `ItemDetail`, `AddSheet` |
| Константа рівня модуля | `SCREAMING_SNAKE_CASE` | `ALLOWED_MIME`, `MAX_COVER_SIZE` |
| Файл | `camelCase` | `itemService.ts`, `sessionRepo.ts` |
| DB-поле | `snake_case` | `user_id`, `cover_url`, `created_at` |

**Булеві змінні** — prefix `is` / `has` / `can`: `isLoading`, `hasRating`.

---

## 3. Типізація

- **`interface`** — для форм API-відповідей і DB-рядків.
- **`type`** — для union-типів та псевдонімів.
- **`any` заборонено.** Для невідомих форм — `unknown` з подальшим звуженням.
- **Catch-блоки:** `catch (err)` (не `catch (err: any)`); для domain-помилок — `isAppError(err)` type guard.
- **Runtime-валідація** вхідних HTTP-тіл — виключно через Zod-схеми; статичні типи виводяться через `z.infer`.

```ts
// ✓ правильно
} catch (err) {
  if (isAppError(err) && err.status === 404) { ... }
  next(err);
}
```

---

## 4. Форматування

| Параметр | Правило |
|----------|---------|
| Відступи | 2 пробіли |
| Лапки — backend | одинарні `'express'` |
| Лапки — frontend JSX | подвійні `"className"` |
| Крапка з комою | обов'язкова |
| Довжина рядка | ≤ 100 символів |
| Trailing comma | так у багаторядкових структурах |

---

## 5. Файли та директорії

Backend дотримується шарової архітектури:

```
src/
├── server.ts         # точка входу
├── app.ts            # налаштування Express
├── config/           # змінні середовища (ENV)
├── db/               # SQLite singleton + міграції
├── middleware/       # auth, errorHandler, requestLogger
├── routes/           # HTTP-маршрути (тонкий шар)
├── services/         # бізнес-логіка
├── repositories/     # прямі SQL-запити
├── validators/       # Zod-схеми
├── types/            # глобальні розширення типів
└── utils/            # errors, clock
```

Правило: **один файл — одна відповідальність**.
Route-handler не містить бізнес-логіки; сервіс не знає про `req`/`res`.

---

## 6. Імпорти

Порядок блоків: (1) вбудовані Node-модулі, (2) зовнішні пакети, (3) внутрішні.
Між групами — порожній рядок.  
`import type` — обов'язковий для type-only imports (`@typescript-eslint/consistent-type-imports`).  
`import * as` — для сервісів і репозиторіїв; named import — для функцій і типів.

---

## 7. Функції

- **Іменовані `function`-декларації** на рівні модуля в backend.
- **Стрілкові функції** — для коротких утиліт і колбеків.
- **React-компоненти** — завжди `function`-декларації.

---

## 8. Обробка помилок

- Всі domain-помилки — через `makeError()` / `notFound()` з `utils/errors.ts`.
- Route-handlers перехоплюють помилки через `isAppError()` guard; решта йде через `next(err)` до `errorHandler`.
- `errorHandler` реєструється останнім у `app.ts`, повертає 500 для непередбачених помилок.

---

## 9. Коментарі

- Пишуться лише тоді, коли **«чому»** не очевидне з коду.
- JSDoc — для публічних функцій сервісного, репозиторного та утилітного шарів.
- Секційні розділювачі у великих файлах: `// ─── Назва ──────`.
- Механічне повторення назви функції у коментарі заборонено.

---

## 10. Backend — специфіка

- Змінні середовища виключно через `config/env.ts` (об'єкт `ENV`).
- Route-handler завжди завершується `res.json()`, `res.status().json()` або `next(err)`.

---

## 11. Frontend — специфіка (React)

- Всі API-виклики через централізований `lib/api.ts`; прямий `fetch` у компонентах заборонений.
- Стилізація — CSS-класи в `index.css`; inline-стилі лише для динамічних значень.
- Стан — локальний або підняти до root `App`; зовнішній state-менеджер не використовується.

---

## 12. Інструменти

| Інструмент | Призначення | Конфіг |
|------------|-------------|--------|
| TypeScript | строга типізація | `tsconfig.json` |
| ESLint + typescript-eslint | лінтинг | `eslint.config.mjs` |
| tsx | backend dev-сервер | `scripts.dev` |
| Vite | frontend bundler | `client/vite.config.ts` |
| Zod | runtime-валідація | `validators/*.ts` |
| Vitest | тести | `vitest.config.ts` |

# JSDoc-теги в проєкті Media Tracker

Документація до публічних функцій пишеться у форматі JSDoc.  
Охоплює: сервісний шар (`src/services/`), репозиторний шар (`src/repositories/`), утиліти (`src/utils/`), валідатори (`src/validators/`), middleware (`src/middleware/`).

---

## Теги, що використовуються

### `@param`

Описує вхідний параметр функції.

```ts
/**
 * @param itemId  ID of the parent catalog item.
 * @param userId  ID of the authenticated user.
 */
```

Формат: `@param назва  Опис.`  
Подвійний пробіл між назвою і описом — для вирівнювання при кількох параметрах.

---

### `@returns`

Описує повернене значення. Використовується, коли тип не очевидний із сигнатури.

```ts
/**
 * @returns The newly created item with all fields populated.
 */
```

Якщо функція повертає `void` або `Promise<void>` — тег не пишеться.

---

### `@throws`

Описує виняток, який функція може кинути. У проєкті завжди `AppError`.

```ts
/**
 * @throws {AppError} 404 NOT_FOUND if the item does not exist or belongs to another user.
 * @throws {AppError} 409 EMAIL_TAKEN if the email address is already registered.
 */
```

Формат: `@throws {AppError} HTTP-код КОД_ПОМИЛКИ умова.`  
Коди помилок визначені в `src/utils/errors.ts`.

---

## Коли писати docstring

| Шар | Правило |
|-----|---------|
| `src/services/` | Обов'язково для кожної публічної функції |
| `src/repositories/` | Обов'язково для складних запитів (кілька JOIN, агрегація) |
| `src/utils/` | Обов'язково |
| `src/validators/` | Однорядковий `/** Validates the POST /... request body. */` |
| `src/middleware/` | Однорядковий опис призначення |
| `src/routes/` | Не пишеться — маршрути описані в OpenAPI |

---

## Коли НЕ писати docstring

- Якщо назва функції вже повністю описує, що вона робить (`getUserById`, `deleteSession`).
- Якщо функція приватна або використовується лише всередині одного файлу.
- Якщо `@param` лише повторює тип із TypeScript-сигнатури без додаткового контексту.

---

## Приклади з коду

**Однорядковий** (`src/utils/clock.ts`):
```ts
/** Returns the currently active clock function. */
export function getClock(): () => Date { ... }
```

**Багаторядковий з `@param` і `@throws`** (`src/services/statsService.ts`):
```ts
/**
 * Returns item counts grouped by media type for the requested period.
 *
 * @param period  Time window: `month` (current calendar month), `year` (current year), `all`.
 * @param basis   Counting method:
 *                - `completedAt` — counts items by their completion date (default).
 *                - `sessions`    — counts individual view sessions.
 */
```

**Тільки `@throws`** (`src/services/authService.ts`):
```ts
/**
 * Registers a new user account.
 *
 * @throws {AppError} 409 EMAIL_TAKEN if the email address is already registered.
 */
```

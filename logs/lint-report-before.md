# ESLint Report — Before Fixes

Запуск: `npx eslint src/` на коді до будь-яких виправлень (стан на момент встановлення ESLint).  
Конфіг: `eslint.config.mjs` (eslint + typescript-eslint, recommended + project rules).

**Загалом: 53 проблеми (16 errors, 37 warnings)**

---

## Errors (16) — `@typescript-eslint/no-explicit-any`

| Файл | Рядок | Опис |
|------|------:|------|
| `src/repositories/collectionRepo.ts` | 79 | `new Error(...) as any` — ручне кидання помилки без типу |
| `src/routes/collections.ts` | 40 | `catch (err: any)` |
| `src/routes/collections.ts` | 61 | `catch (err: any)` |
| `src/routes/collections.ts` | 72 | `catch (err: any)` |
| `src/routes/collections.ts` | 93 | `catch (err: any)` |
| `src/routes/collections.ts` | 107 | `catch (err: any)` |
| `src/routes/items.ts` | 76 | `catch (err: any)` |
| `src/routes/items.ts` | 95 | `catch (err: any)` |
| `src/routes/items.ts` | 106 | `catch (err: any)` |
| `src/routes/items.ts` | 113 | `(uploadErr: any)` у multer-callback |
| `src/routes/items.ts` | 135 | `catch (err: any)` |
| `src/routes/items.ts` | 147 | `catch (err: any)` |
| `src/routes/sessions.ts` | 15 | `catch (err: any)` |
| `src/routes/sessions.ts` | 34 | `catch (err: any)` |
| `src/routes/sessions.ts` | 55 | `catch (err: any)` |
| `src/routes/sessions.ts` | 66 | `catch (err: any)` |

## Warnings (37) — авто-виправні

### `@typescript-eslint/consistent-type-imports` (35 попереджень)

Усі файли, де типи імпортувались як `import X from` замість `import type X from`:

`src/app.ts`, `src/middleware/auth.ts`, `src/middleware/errorHandler.ts`,
`src/middleware/requestLogger.ts`, `src/repositories/collectionRepo.ts`,
`src/repositories/itemRepo.ts`, `src/repositories/sessionRepo.ts`,
`src/repositories/statsRepo.ts`, `src/repositories/userRepo.ts`,
`src/routes/auth.ts`, `src/routes/collections.ts`, `src/routes/items.ts`,
`src/routes/sessions.ts`, `src/routes/stats.ts`, `src/routes/tags.ts`,
`src/routes/users.ts`, `src/services/authService.ts`,
`src/services/collectionService.ts`, `src/services/itemService.ts`,
`src/services/sessionService.ts`, `src/services/statsService.ts`,
`src/services/tagService.ts`

### `@typescript-eslint/no-unused-vars` (2 попередження)

| Файл | Рядок | Символ |
|------|------:|--------|
| `src/repositories/itemRepo.ts` | 2 | `uuidv4` (імпортовано, не використовується) |
| `src/routes/items.ts` | 3 | `path` (імпортовано, не використовується) |

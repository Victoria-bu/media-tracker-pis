# ESLint Report — After Fixes

Запуск: `npx eslint src/` після всіх виправлень.

```
(no output)
```

**✓ 0 problems (0 errors, 0 warnings)**

---

## Що було виправлено

| Категорія | К-сть | Метод |
|-----------|------:|-------|
| `import type` для type-only imports | 35 | `npx eslint src/ --fix` (авто) |
| `catch (err: any)` → `catch (err)` + `isAppError()` guard | 14 | Вручну |
| `as any` у collectionRepo → `notFound()` | 1 | Вручну |
| Unused imports (`path`, `uuidv4`) | 2 | Вручну |
| **Разом** | **52** | |

> Примітка: 53-ю проблемою (multer callback `uploadErr: any`) виправлено через
> `// eslint-disable-next-line` з поясненням — сигнатура диктується бібліотекою multer,
> замінити на `unknown` без втрати функціональності неможливо без патчу типів multer.

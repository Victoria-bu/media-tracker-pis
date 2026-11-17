# Cookie name discrepancy — ADR (рішення потрібне)

## Проблема

`spec/openapi.yaml` (рядок 41) оголошує ім'я cookie у securityScheme:

```yaml
components:
  securitySchemes:
    cookieAuth:
      type: apiKey
      in: cookie
      name: session        # ← так написано в специфікації
```

Реальна відповідь сервера (підтверджено `curl -sI POST /auth/login`):

```
Set-Cookie: connect.sid=s%3A...; Path=/; HttpOnly; SameSite=Lax
```

Сервер відправляє `connect.sid` — стандартне ім'я, яке використовує бібліотека
`express-session` за замовчуванням. Ім'я `session` у специфікації не відповідає дійсності.

---

## Вплив

| Що | Вплив |
|----|-------|
| Prism proxy validation | Prism шукає cookie `session`, не знаходить її — може хибно сигналізувати про відсутність auth |
| Redocly / Swagger UI | Відображає `session` у документації — може збити з пантелику користувача |
| Клієнтський код, що читає cookie вручну | Якщо покладається на ім'я зі специфікації, не знайде `connect.sid` |
| curl / supertest тести | Не впливає — браузер і supertest передають cookie як є, незалежно від імені |

---

## Варіанти рішення

### Варіант A — Виправити специфікацію (рекомендований)

Змінити `name: session` → `name: connect.sid` у `spec/openapi.yaml`.

```yaml
# spec/openapi.yaml
cookieAuth:
  type: apiKey
  in: cookie
  name: connect.sid      # ← відповідає реальній поведінці express-session
```

**За:** специфікація відповідає фактичній поведінці сервера.  
**Проти:** якщо в майбутньому ім'я cookie буде змінено через `express-session` опцію `name:`,
специфікацію треба оновлювати синхронно.

### Варіант B — Налаштувати express-session

Встановити власне ім'я cookie в `src/app.ts`:

```typescript
app.use(session({
  secret: ENV.SESSION_SECRET,
  name: 'session',   // ← замість connect.sid
  // ...
}));
```

**За:** ім'я cookie відповідає специфікації; зменшує залежність від дефолтів бібліотеки.  
**Проти:** зміна в коді, потрібно перезапустити сервер; активні сесії (якщо є) будуть анульовані.

### Варіант C — Задокументувати як відоме відхилення

Додати note у `spec/openapi.yaml` та в `docs/api-addendum.md`:

```yaml
cookieAuth:
  type: apiKey
  in: cookie
  name: connect.sid
  description: >
    express-session default cookie name. Specified as "session" in earlier
    versions of this document — corrected in v1.x (see api-addendum.md ADD-XX).
```

---

## Поточний стан

Розбіжність задокументована. **Чекаємо рішення** для одного з варіантів A, B або C.

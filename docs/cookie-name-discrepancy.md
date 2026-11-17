# Cookie name discrepancy — RESOLVED (Variant B)

## Проблема (вирішена)

`spec/openapi.yaml` (рядок 41) оголошував ім'я cookie:

```yaml
cookieAuth:
  type: apiKey
  in: cookie
  name: session
```

До виправлення сервер відправляв `connect.sid` — стандартне ім'я `express-session`.

## Рішення — Варіант B

Додано `name: 'session'` у виклик `session()` в `src/app.ts`:

```typescript
app.use(
  session({
    secret: ENV.SESSION_SECRET,
    name: 'session',   // ← explicit, matches openapi.yaml securityScheme
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true, secure: ENV.NODE_ENV === 'production', sameSite: 'lax' },
  }),
);
```

## Верифікація (TDD)

**Red commit** `7188cd6` — тест `NF-007-B` у `tests/integration/auth.test.ts`:
```
expected 'connect.sid=s%3A...' to match /^session=/   ← FAIL
```

**Green commit** `a9c578d` — після додавання `name: 'session'`:
```
Set-Cookie: session=s%3A...; Path=/; HttpOnly; SameSite=Lax   ← PASS
```

Повний прогін: **147/147** тестів (146 + NF-007-B).  
Лог: `logs/test-log-etapeall-1794924516777.md`

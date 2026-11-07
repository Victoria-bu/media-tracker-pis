# Матриця простежуваності вимог

> Таблиця зв'язує кожну функціональну вимогу з відповідним критерієм прийняття та BDD-сценарієм.  
> Колонки «Тест» і «Код» заповнено для серверних вимог.  
> Клієнтські вимоги (client) — API лише повертає дані; тести не тестуються через API.

## 9. Requirements Traceability Matrix

| Requirement ID | AC | BDD Scenario | Ticket | API Endpoint | Test | Code | Documentation |
|---|---|---|---|---|---|---|---|
| REQ-F-001 | AC-001 | New User Registration | 1 | `POST /auth/register` (ADD-02) | tests/integration/auth.test.ts | src/routes/auth.ts, src/services/authService.ts | docs/api-addendum.md ADD-02 |
| REQ-F-002 | AC-002 | Account Login | 1 | `POST /auth/login` | tests/integration/auth.test.ts | src/routes/auth.ts, src/services/authService.ts | — |
| REQ-F-003 | AC-003 | Logout and Protected Page Access | 1 | `POST /auth/logout` | tests/integration/auth.test.ts | src/routes/auth.ts | — |
| REQ-F-004 | AC-004 | — | 2 | `GET /items`, `GET /items/{id}` | tests/integration/items.test.ts | src/routes/items.ts, src/services/itemService.ts | — |
| REQ-F-005 | AC-005 | — | 2 | `GET /items` (client) | — (client only) | — | docs/api-design.md §1 |
| REQ-F-006 | AC-006 | — | 2 | `GET /items` (client) (ADD-01) | — (client only) | — | docs/api-addendum.md ADD-01 |
| REQ-F-007 | AC-007 | Adding a New Item | 2 | `POST /items` | tests/integration/items.test.ts | src/routes/items.ts, src/services/itemService.ts | — |
| REQ-F-008 | AC-008 | — | 2 | `GET /items/{id}`, `PATCH /items/{id}` | tests/integration/items.test.ts | src/routes/items.ts, src/services/itemService.ts | — |
| REQ-F-009 | AC-009 | Deleting an Item with Cascade Removal | 2 | `DELETE /items/{id}` | tests/integration/items.test.ts | src/routes/items.ts, src/services/itemService.ts | — |
| REQ-F-010 | AC-010 | — | 4 | `GET /tags`, `POST /items`, `PATCH /items/{id}` | tests/integration/tags.test.ts, tests/integration/items.test.ts | src/routes/tags.ts, src/services/tagService.ts | — |
| REQ-F-011 | AC-011 | Filtering by Tag | 4 | `GET /items` (client) | — (client only) | — | docs/api-design.md §1 |
| REQ-F-012 | AC-012 | Repeated Viewing with a Different Rating | 4 | `POST /items/{id}/sessions` | tests/integration/sessions.test.ts | src/routes/sessions.ts, src/services/sessionService.ts | — |
| REQ-F-013 | AC-013 | — | 4 | `GET /items/{id}/sessions` (ADD-04) | tests/integration/sessions.test.ts | src/routes/sessions.ts, src/services/sessionService.ts | docs/api-addendum.md ADD-04 |
| REQ-F-014 | AC-014 | — | 4 | `PATCH /items/{id}/sessions/{sid}`, `DELETE /items/{id}/sessions/{sid}` | tests/integration/sessions.test.ts | src/routes/sessions.ts, src/services/sessionService.ts | — |
| REQ-F-015 | AC-015 | Item in Multiple Collections | 5 | `POST /collections/{id}/items` (ADD-03) | tests/integration/collections.test.ts | src/routes/collections.ts, src/services/collectionService.ts | docs/api-addendum.md ADD-03 |
| REQ-F-016 | AC-016 | — | 5 | `GET /collections`, `POST /collections` | tests/integration/collections.test.ts | src/routes/collections.ts, src/services/collectionService.ts | — |
| REQ-F-017 | AC-017 | — | 5 | `PATCH /collections/{id}` | tests/integration/collections.test.ts | src/routes/collections.ts, src/services/collectionService.ts | — |
| REQ-F-018 | AC-018 | — | 5 | `DELETE /collections/{id}` | tests/integration/collections.test.ts | src/routes/collections.ts, src/services/collectionService.ts | — |
| REQ-F-019 | AC-019 | Item in Multiple Collections | 5 | `DELETE /collections/{id}/items/{itemId}` | tests/integration/collections.test.ts | src/routes/collections.ts, src/services/collectionService.ts | — |
| REQ-F-020 | AC-020 | — | 5 | `GET /collections`, `GET /collections/{id}` | tests/integration/collections.test.ts | src/routes/collections.ts, src/services/collectionService.ts | — |
| REQ-F-021 | AC-021 | Automatic Completion Date Fill | 7 | `PATCH /items/{id}` (client logic, persisted) | tests/integration/stats.test.ts (completedAt storage) | src/routes/items.ts, src/repositories/itemRepo.ts | docs/api-addendum.md ADD-05 |
| REQ-F-022 | AC-022 | — | 7 | `GET /stats` (ADD-05) | tests/integration/stats.test.ts | src/routes/stats.ts, src/services/statsService.ts | docs/api-addendum.md ADD-05 |
| REQ-F-022a | AC-030 | — | 7 | `GET /stats?period=` | tests/integration/stats.test.ts | src/routes/stats.ts, src/validators/statsValidators.ts | — |
| REQ-F-022b | AC-040…049 | — | 7 | `GET /stats?basis=sessions` (ADD-07) | tests/integration/stats-addendum.test.ts | src/routes/stats.ts, src/services/statsService.ts, src/repositories/statsRepo.ts | spec/addendum-07.md |
| REQ-F-023 | AC-023 | Searching by Partial Title | 2 | `GET /items` (client) | — (client only) | — | docs/api-design.md §1 |
| REQ-F-024 | AC-024 | — | 2 | `POST /items`, `PATCH /items/{id}` (type-specific fields) | tests/integration/items.test.ts (type-specific fields) | src/routes/items.ts, src/repositories/itemRepo.ts | — |
| REQ-F-025 | AC-025 | — | 2 | `POST /items/{id}/cover`, `DELETE /items/{id}/cover` | tests/integration/items.test.ts | src/routes/items.ts, src/services/itemService.ts | — |
| REQ-F-026 | AC-026 | — | 2 | `GET /items` (client) | — (client only) | — | docs/api-design.md §1 |
| REQ-F-027 | AC-027 | — | 5 | `GET /collections/{id}` (client) | — (client only) | — | docs/api-design.md §1 |
| REQ-F-028 | AC-028 | — | 2 | `POST /items/{id}/cover` | tests/integration/items.test.ts | src/routes/items.ts | — |
| REQ-F-029 | AC-029 | — | 1 | `PATCH /users/me` | tests/integration/users.test.ts | src/routes/users.ts, src/services/authService.ts | — |
| REQ-NF-001 | AC-034 | — | 7 | All read endpoints | tests/integration/stats.test.ts (performance) | src/repositories/itemRepo.ts | — |
| REQ-NF-002 | AC-035 | — | 1 | `POST /auth/register`; 401 on all protected (ADD-06) | tests/integration/auth.test.ts, tests/unit/services/authService.test.ts | src/services/authService.ts, src/middleware/auth.ts | docs/api-addendum.md ADD-06 |
| REQ-NF-003 | AC-036 | — | 7 | All write endpoints | tests/integration/stats.test.ts (reliability) | src/services/collectionService.ts (transaction) | — |
| REQ-NF-004 | AC-037 | — | 7 | — (UI only) | — (not API) | — | — |
| REQ-NF-005 | AC-038 | — | 7 | — (browser compat) | — (not API) | — | — |
| REQ-NF-006 | AC-031 | Registration Input Validation | 1 | `POST /auth/register`, `PATCH /users/me` | tests/integration/auth.test.ts, tests/integration/users.test.ts | src/validators/authValidators.ts, src/validators/userValidators.ts | — |
| REQ-NF-007 | AC-039 | — | 1 | `Set-Cookie` on register/login | tests/integration/auth.test.ts (HttpOnly) | src/app.ts (session config) | — |
| REQ-NF-008 | AC-032 | — | 7 | — (UI empty state) | — (not API) | — | — |
| REQ-NF-009 | AC-033 | — | 1 | — (test logging) | — (meta: logs/ directory) | scripts/write-test-log.js | — |

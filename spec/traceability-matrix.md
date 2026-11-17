# Матриця простежуваності вимог

> Зв'язує кожну вимогу / аденднум / верифікаційний запис з критерієм прийняття,
> тестом, кодом і документацією.  
> **UI element** — «— (API only)» для суто серверних вимог; «(client)» якщо
> функціонал реалізується лише на клієнті; конкретний елемент де доречно.

---

## Функціональні вимоги

| Requirement ID | AC | BDD Scenario | Ticket | API Endpoint | Test | Code | UI element | Documentation |
|---|---|---|---|---|---|---|---|---|
| REQ-F-001 | AC-001 | New User Registration | 1 | `POST /auth/register` | tests/integration/auth.test.ts | src/routes/auth.ts, src/services/authService.ts | Register form | docs/api-addendum.md ADD-02; docs/user-guide.md §1 |
| REQ-F-002 | AC-002 | Account Login | 1 | `POST /auth/login` | tests/integration/auth.test.ts | src/routes/auth.ts, src/services/authService.ts | Login form | docs/user-guide.md §2 |
| REQ-F-003 | AC-003 | Logout and Protected Page Access | 1 | `POST /auth/logout` | tests/integration/auth.test.ts | src/routes/auth.ts | Sign out button | docs/user-guide.md §10 |
| REQ-F-004 | AC-004 | — | 2 | `GET /items`, `GET /items/{id}` | tests/integration/items.test.ts | src/routes/items.ts, src/services/itemService.ts | Library screen | docs/user-guide.md §4 |
| REQ-F-005 | AC-005 | — | 2 | `GET /items` (client filter) | — (client only) | — | Type filter chips (client) | docs/api-design.md §1 |
| REQ-F-006 | AC-006 | — | 2 | `GET /items` (client filter) | — (client only) | — | Status filter chips (client) | docs/api-addendum.md ADD-01 |
| REQ-F-007 | AC-007 | Adding a New Item | 2 | `POST /items` | tests/integration/items.test.ts | src/routes/items.ts, src/services/itemService.ts | Add item sheet | docs/user-guide.md §3 |
| REQ-F-008 | AC-008 | — | 2 | `PATCH /items/{id}` | tests/integration/items.test.ts | src/routes/items.ts, src/services/itemService.ts | Edit status / PATCH fields | docs/user-guide.md §4 |
| REQ-F-009 | AC-009 | Deleting an Item with Cascade Removal | 2 | `DELETE /items/{id}` | tests/integration/items.test.ts | src/routes/items.ts, src/services/itemService.ts | Delete button in item detail | docs/user-guide.md §4 |
| REQ-F-010 | AC-010 | — | 4 | `GET /tags`, `POST /items`, `PATCH /items/{id}` | tests/integration/tags.test.ts, tests/integration/items.test.ts (AC-010: 'update tags → tags replaced') | src/routes/tags.ts, src/services/tagService.ts | Tag input + autocomplete | docs/user-guide.md §5 |
| REQ-F-011 | AC-011 | Filtering by Tag | 4 | `GET /items` (client filter) | — (client only) | — | Tag filter chip (client) | docs/api-design.md §1 |
| REQ-F-012 | AC-012 | Repeated Viewing with a Different Rating | 4 | `POST /items/{id}/sessions` | tests/integration/sessions.test.ts | src/routes/sessions.ts, src/services/sessionService.ts | Add session sheet | docs/user-guide.md §6 |
| REQ-F-013 | AC-013 | — | 4 | `GET /items/{id}/sessions` | tests/integration/sessions.test.ts | src/routes/sessions.ts, src/services/sessionService.ts | Session list in item detail | docs/api-addendum.md ADD-04; docs/user-guide.md §6 |
| REQ-F-014 | AC-014 | — | 4 | `PATCH /items/{id}/sessions/{sid}`, `DELETE /items/{id}/sessions/{sid}` | tests/integration/sessions.test.ts | src/routes/sessions.ts, src/services/sessionService.ts | Delete session button | docs/user-guide.md §6 |
| REQ-F-015 | AC-015 | Item in Multiple Collections | 5 | `POST /collections/{id}/items` | tests/integration/collections.test.ts | src/routes/collections.ts, src/services/collectionService.ts | Collection picker in item detail | docs/api-addendum.md ADD-03; docs/user-guide.md §7 |
| REQ-F-016 | AC-016 | — | 5 | `POST /collections` | tests/integration/collections.test.ts | src/routes/collections.ts, src/services/collectionService.ts | New collection input | docs/user-guide.md §7 |
| REQ-F-017 | AC-017 | — | 5 | `PATCH /collections/{id}` | tests/integration/collections.test.ts | src/routes/collections.ts, src/services/collectionService.ts | Rename collection | docs/user-guide.md §7 |
| REQ-F-018 | AC-018 | — | 5 | `DELETE /collections/{id}` | tests/integration/collections.test.ts | src/routes/collections.ts, src/services/collectionService.ts | Delete collection button | docs/user-guide.md §7 |
| REQ-F-019 | AC-019 | Item in Multiple Collections | 5 | `DELETE /collections/{id}/items/{itemId}` | tests/integration/collections.test.ts | src/routes/collections.ts, src/services/collectionService.ts | Remove from collection | docs/user-guide.md §7 |
| REQ-F-020 | AC-020 | — | 5 | `GET /collections/{id}` | tests/integration/collections.test.ts | src/routes/collections.ts, src/services/collectionService.ts | Collection detail screen | docs/user-guide.md §7 |
| REQ-F-021 | AC-021 | Automatic Completion Date Fill | 7 | `PATCH /items/{id}` (completedAt persisted) | tests/integration/stats.test.ts | src/routes/items.ts, src/repositories/itemRepo.ts | Status change → auto completedAt (client) | docs/api-addendum.md ADD-05 |
| REQ-F-022 | AC-022 | — | 7 | `GET /stats` | tests/integration/stats.test.ts | src/routes/stats.ts, src/services/statsService.ts | Stats screen | docs/api-addendum.md ADD-05; docs/user-guide.md §8 |
| REQ-F-022a | AC-030 | — | 7 | `GET /stats?period=` | tests/integration/stats.test.ts | src/routes/stats.ts, src/validators/statsValidators.ts | Period selector (client) | docs/user-guide.md §8 |
| REQ-F-022b | AC-040…049 | — | 7 | `GET /stats?basis=sessions` | tests/integration/stats-addendum.test.ts | src/routes/stats.ts, src/services/statsService.ts, src/repositories/statsRepo.ts | — (API only) | spec/addendum-07.md; docs/user-guide.md §8 |
| REQ-F-023 | AC-023 | Searching by Partial Title | 2 | `GET /items` (client search) | — (client only) | — | Search input (client) | docs/api-design.md §1 |
| REQ-F-024 | AC-024 | — | 2 | `POST /items`, `PATCH /items/{id}` | tests/integration/items.test.ts | src/routes/items.ts, src/repositories/itemRepo.ts | Type-specific fields in form | docs/api-design.md §REQ-F-024 |
| REQ-F-025 | AC-025 | — | 2 | `POST /items/{id}/cover`, `DELETE /items/{id}/cover` | tests/integration/items.test.ts | src/routes/items.ts, src/services/itemService.ts | Cover upload button | docs/user-guide.md §4 |
| REQ-F-026 | AC-026 | — | 2 | `GET /items` (client sort) | — (client only) | — | Sort control (client) | docs/api-design.md §1 |
| REQ-F-027 | AC-027 | — | 5 | `GET /collections/{id}` (client sort) | — (client only) | — | Sort control in collection (client) | docs/api-design.md §1 |
| REQ-F-028 | AC-028 | — | 2 | `POST /items/{id}/cover` | tests/integration/items.test.ts | src/routes/items.ts | — (API only) | docs/user-guide.md §4 |
| REQ-F-029 | AC-029 | — | 1 | `PATCH /users/me` | tests/integration/users.test.ts | src/routes/users.ts, src/services/authService.ts | Account settings nickname field | docs/user-guide.md §9 |

---

## Нефункціональні вимоги

| Requirement ID | AC | BDD Scenario | Ticket | API Endpoint | Test | Code | UI element | Documentation |
|---|---|---|---|---|---|---|---|---|
| REQ-NF-001 | AC-034 | — | 7 | All read endpoints | tests/integration/stats.test.ts (performance) | src/repositories/itemRepo.ts | — (API only) | docs/api-design.md §REQ-NF-001 |
| REQ-NF-002 | AC-035 | — | 1 | `POST /auth/register`; 401 on all protected | tests/integration/auth.test.ts, tests/unit/services/authService.test.ts | src/services/authService.ts, src/middleware/auth.ts | — (API only) | docs/api-addendum.md ADD-06 |
| REQ-NF-003 | AC-036 | — | 7 | All write endpoints | tests/integration/stats.test.ts (reliability) | src/services/collectionService.ts (transaction) | — (API only) | docs/architecture.md |
| REQ-NF-004 | AC-037 | — | 7 | — (UI responsiveness) | — (not API) | — | (client) | — |
| REQ-NF-005 | AC-038 | — | 7 | — (browser compat) | — (not API) | — | (client) | — |
| REQ-NF-006 | AC-031 | Registration Input Validation | 1 | `POST /auth/register`, `PATCH /users/me` | tests/integration/auth.test.ts, tests/integration/users.test.ts | src/validators/authValidators.ts, src/validators/userValidators.ts | Error messages in forms | docs/known-deviations.md DEV-01 |
| REQ-NF-007 | AC-039, NF-007-B | — | 1 | `Set-Cookie` on register/login | tests/integration/auth.test.ts | src/app.ts (session name: 'session') | — (API only) | docs/cookie-name-discrepancy.md |
| REQ-NF-008 | AC-032 | — | 7 | — (UI empty state) | — (not API) | — | Empty state UI (client) | — |
| REQ-NF-009 | AC-033 | — | 1 | — (test logging) | — (meta) | scripts/write-test-log.js | — (dev tooling) | — |

---

## Аденднуми (уточнення контракту)

| Addendum | Parent REQ | AC | API Endpoint | Test | Code | Documentation |
|---|---|---|---|---|---|---|
| ADD-01 | REQ-F-006 | AC-006 | `GET /items` — status enum values as snake_case | — (client only) | src/validators/itemValidators.ts | docs/api-addendum.md ADD-01 |
| ADD-02 | REQ-F-001 | AC-001 | `POST /auth/register` → 409 EMAIL_TAKEN | tests/integration/auth.test.ts (AC-001 negative) | src/services/authService.ts | docs/api-addendum.md ADD-02 |
| ADD-03 | REQ-F-015 | AC-015 | `POST /collections/{id}/items` → 409 ITEM_ALREADY_IN_COLLECTION | tests/integration/collections.test.ts | src/services/collectionService.ts | docs/api-addendum.md ADD-03 |
| ADD-04 | REQ-F-013 | AC-013 | `GET /items/{id}/sessions` — ordered newest first | tests/integration/sessions.test.ts | src/repositories/sessionRepo.ts | docs/api-addendum.md ADD-04 |
| ADD-05 | REQ-F-022 | AC-022 | `GET /stats` — filter by completedAt, default basis | tests/integration/stats.test.ts | src/repositories/statsRepo.ts (getStatsByPeriod) | docs/api-addendum.md ADD-05 |
| ADD-06 | REQ-NF-002 | AC-035 | 404 (not 403) for other user's resources | tests/integration/auth.test.ts (AC-035) | src/services/itemService.ts (assertOwner) | docs/api-addendum.md ADD-06 |
| ADD-07 | REQ-F-022b | AC-040…049 | `GET /stats?basis=sessions` | tests/integration/stats-addendum.test.ts | src/repositories/statsRepo.ts (getSessionStatsByPeriod) | spec/addendum-07.md |

---

## Верифікаційні записи (контрактний прогін Prism)

| ID | Опис | Статус | Test | Code | Documentation |
|---|---|---|---|---|---|
| V-01 | `Item.createdAt` / `CollectionItem.createdAt` не відповідали `format: date-time` OpenAPI (SQLite text without T/Z) | ✅ Виправлено | tests/integration/items.test.ts (V-01 describe block) | src/services/itemService.ts (toApi), src/services/collectionService.ts (toApiItem) | logs/api-contract-run.md |
| V-02 | Prism v5: «Invalid security scheme used» при cookie auth | ⚠ Хибне спрацювання (Prism v5 не валідує `in: cookie`) | — | — | logs/api-contract-run.md; docs/known-deviations.md DEV-02 |
| NF-007-B | Cookie name: специфікація `name: session`, сервер відправляв `connect.sid` | ✅ Виправлено | tests/integration/auth.test.ts (NF-007-B) | src/app.ts (name: 'session') | docs/cookie-name-discrepancy.md |

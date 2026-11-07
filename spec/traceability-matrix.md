# Матриця простежуваності вимог

> Таблиця зв'язує кожну функціональну вимогу з відповідним критерієм прийняття та BDD-сценарієм.  
> Колонка «API Endpoint» додана у рамках Частини 4 (крок 16). Де поведінка API розширює або уточнює SRS — вказано посилання на docs/api-addendum.md (ADD-NN).  
> Колонки «Тест», «Код», «Документація» залишені порожніми для заповнення на наступних етапах.

## 9. Requirements Traceability Matrix

| Requirement ID | Acceptance Criterion | BDD Scenario | Ticket | API Endpoint | Test | Code | Documentation |
|---|---|---|---|---|---|---|---|
| REQ-F-001 | AC-001 | New User Registration | 1 | `POST /auth/register` (ADD-02) | — | — | — |
| REQ-F-002 | AC-002 | Account Login | 1 | `POST /auth/login` | — | — | — |
| REQ-F-003 | AC-003 | Logout and Protected Page Access | 1 | `POST /auth/logout` | — | — | — |
| REQ-F-004 | AC-004 | — | 2 | `GET /items`, `GET /items/{id}` | — | — | — |
| REQ-F-005 | AC-005 | — | 2 | `GET /items` (client) | — | — | — |
| REQ-F-006 | AC-006 | — | 2 | `GET /items` (client) (ADD-01) | — | — | — |
| REQ-F-007 | AC-007 | Adding a New Item | 2 | `POST /items` | — | — | — |
| REQ-F-008 | AC-008 | — | 2 | `GET /items/{id}`, `PATCH /items/{id}` | — | — | — |
| REQ-F-009 | AC-009 | Deleting an Item with Cascade Removal | 2 | `DELETE /items/{id}` | — | — | — |
| REQ-F-010 | AC-010 | — | 4 | `GET /tags`, `POST /items`, `PATCH /items/{id}` | — | — | — |
| REQ-F-011 | AC-011 | Filtering by Tag | 4 | `GET /items` (client) | — | — | — |
| REQ-F-012 | AC-012 | Repeated Viewing with a Different Rating | 4 | `POST /items/{id}/sessions` | — | — | — |
| REQ-F-013 | AC-013 | — | 4 | `GET /items/{id}/sessions` (ADD-04) | — | — | — |
| REQ-F-014 | AC-014 | — | 4 | `PATCH /items/{id}/sessions/{sid}`, `DELETE /items/{id}/sessions/{sid}` | — | — | — |
| REQ-F-015 | AC-015 | Item in Multiple Collections | 5 | `POST /collections/{id}/items` (ADD-03) | — | — | — |
| REQ-F-016 | AC-016 | — | 5 | `GET /collections`, `POST /collections` | — | — | — |
| REQ-F-017 | AC-017 | — | 5 | `PATCH /collections/{id}` | — | — | — |
| REQ-F-018 | AC-018 | — | 5 | `DELETE /collections/{id}` | — | — | — |
| REQ-F-019 | AC-019 | Item in Multiple Collections | 5 | `DELETE /collections/{id}/items/{itemId}` | — | — | — |
| REQ-F-020 | AC-020 | — | 5 | `GET /collections`, `GET /collections/{id}` | — | — | — |
| REQ-F-021 | AC-021 | Automatic Completion Date Fill | 7 | `PATCH /items/{id}` (client logic, persisted here) | — | — | — |
| REQ-F-022 | AC-022 | — | 7 | `GET /stats` (ADD-05) | — | — | — |
| REQ-F-022a | AC-030 | — | 7 | `GET /stats?period=` | — | — | — |
| REQ-F-023 | AC-023 | Searching by Partial Title | 2 | `GET /items` (client) | — | — | — |
| REQ-F-024 | AC-024 | — | 2 | `POST /items`, `PATCH /items/{id}` (type-specific fields) | — | — | — |
| REQ-F-025 | AC-025 | — | 2 | `POST /items/{id}/cover`, `DELETE /items/{id}/cover` | — | — | — |
| REQ-F-026 | AC-026 | — | 2 | `GET /items` (client) | — | — | — |
| REQ-F-027 | AC-027 | — | 5 | `GET /collections/{id}` (client) | — | — | — |
| REQ-F-028 | AC-028 | — | 2 | `POST /items/{id}/cover` | — | — | — |
| REQ-F-029 | AC-029 | — | 1 | `PATCH /users/me` | — | — | — |
| REQ-NF-001 | AC-034 | — | 7 | All read endpoints | — | — | — |
| REQ-NF-002 | AC-035 | — | 1 | `POST /auth/register`; 401 on all protected endpoints (ADD-06) | — | — | — |
| REQ-NF-003 | AC-036 | — | 7 | All write endpoints | — | — | — |
| REQ-NF-004 | AC-037 | — | 7 | — (UI only) | — | — | — |
| REQ-NF-005 | AC-038 | — | 7 | — (browser compat) | — | — | — |
| REQ-NF-006 | AC-031 | Registration Input Validation | 1 | `POST /auth/register`, `PATCH /users/me` | — | — | — |
| REQ-NF-007 | AC-039 | — | 1 | `Set-Cookie` on `POST /auth/register`, `POST /auth/login` | — | — | — |
| REQ-NF-008 | AC-032 | — | 7 | — (UI empty state) | — | — | — |
| REQ-NF-009 | AC-033 | — | 1 | — (test logging) | — | — | — |
| REQ-F-022b | AC-040…049 | — | 7 | `GET /stats?basis=sessions` (ADD-07) | — | — | spec/addendum-07.md |

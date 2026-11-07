# Test Run Log — Etape 9-after

**Date:** 2026-11-07 16:06:54
**Stage:** 9-after
**REQ-NF-009:** AC-033

## Summary

| Total | Passed | Failed | Skipped | Duration |
|---|---|---|---|---|
| 144 | 144 | 0 | 0 | 928ms |

## Individual Tests

| | Test | Status |
|---|---|---|
| ✓ |  POST /api/v1/auth/register  [REQ-F-001] AC-001 positive: valid data → 201 + user object (no password_hash) | passed |
| ✓ |  POST /api/v1/auth/register  [REQ-F-001] AC-039 / NF-007: register sets HttpOnly session cookie | passed |
| ✓ |  POST /api/v1/auth/register  [REQ-F-001] AC-001 negative: duplicate email → 409 EMAIL_TAKEN | passed |
| ✓ |  POST /api/v1/auth/register  [REQ-F-001] AC-031 / NF-006: password < 8 chars → 400, field=password | passed |
| ✓ |  POST /api/v1/auth/register  [REQ-F-001] AC-031 / NF-006: invalid email format → 400, field=email | passed |
| ✓ |  POST /api/v1/auth/register  [REQ-F-001] AC-031 / NF-006: nickname 1 char (too short) → 400, field=nickname | passed |
| ✓ |  POST /api/v1/auth/register  [REQ-F-001] AC-031 / NF-006: nickname 51 chars (too long) → 400, field=nickname | passed |
| ✓ |  POST /api/v1/auth/register  [REQ-F-001] boundary: nickname exactly 2 chars → 201 | passed |
| ✓ |  POST /api/v1/auth/register  [REQ-F-001] boundary: nickname exactly 50 chars → 201 | passed |
| ✓ |  POST /api/v1/auth/register  [REQ-F-001] boundary: password exactly 8 chars → 201 | passed |
| ✓ |  POST /api/v1/auth/register  [REQ-F-001] AC-035 / NF-002: password stored as bcrypt hash, never plain text | passed |
| ✓ |  POST /api/v1/auth/register  [REQ-F-001] missing required fields → 400 | passed |
| ✓ |  POST /api/v1/auth/login  [REQ-F-002] AC-002 positive: correct credentials → 200 + user object + session cookie | passed |
| ✓ |  POST /api/v1/auth/login  [REQ-F-002] AC-039 / NF-007: login sets HttpOnly cookie | passed |
| ✓ |  POST /api/v1/auth/login  [REQ-F-002] AC-002 negative: wrong password → 401 INVALID_CREDENTIALS | passed |
| ✓ |  POST /api/v1/auth/login  [REQ-F-002] AC-002 negative: unknown email → 401 INVALID_CREDENTIALS | passed |
| ✓ |  POST /api/v1/auth/login  [REQ-F-002] missing email/password → 400 | passed |
| ✓ |  POST /api/v1/auth/logout  [REQ-F-003] AC-003 positive: logout with valid session → 204 | passed |
| ✓ |  POST /api/v1/auth/logout  [REQ-F-003] AC-003: after logout, protected endpoint returns 401 | passed |
| ✓ |  POST /api/v1/auth/logout  [REQ-F-003] AC-035 / NF-002: protected endpoint without session → 401 UNAUTHORIZED | passed |
| ✓ |  POST /api/v1/auth/logout  [REQ-F-003] logout without session → 401 | passed |
| ✓ |  POST /api/v1/collections  [REQ-F-016] AC-016: create → 201 + collection in list | passed |
| ✓ |  POST /api/v1/collections  [REQ-F-016] empty name → 400 (minLength:1) | passed |
| ✓ |  POST /api/v1/collections  [REQ-F-016] without session → 401 | passed |
| ✓ |  GET /api/v1/collections  [REQ-F-020] AC-020: empty → [] | passed |
| ✓ |  GET /api/v1/collections  [REQ-F-020] AC-020: returns own collections only | passed |
| ✓ |  GET /api/v1/collections/:id  [REQ-F-020] AC-020: returns collection with items (title, type, status) | passed |
| ✓ |  GET /api/v1/collections/:id  [REQ-F-020] unknown id → 404 | passed |
| ✓ |  GET /api/v1/collections/:id  [REQ-F-020] ADD-06: other user collection → 404 | passed |
| ✓ |  PATCH /api/v1/collections/:id  [REQ-F-017] AC-017: rename → 200 + updated name | passed |
| ✓ |  PATCH /api/v1/collections/:id  [REQ-F-017] empty name → 400 | passed |
| ✓ |  PATCH /api/v1/collections/:id  [REQ-F-017] unknown id → 404 | passed |
| ✓ |  DELETE /api/v1/collections/:id  [REQ-F-018] AC-018: delete collection → 204, items still in catalog | passed |
| ✓ |  DELETE /api/v1/collections/:id  [REQ-F-018] unknown id → 404 | passed |
| ✓ |  POST /api/v1/collections/:id/items  [REQ-F-015] AC-015: item can be in multiple collections simultaneously | passed |
| ✓ |  POST /api/v1/collections/:id/items  [REQ-F-015] ADD-03: duplicate → 409 ITEM_ALREADY_IN_COLLECTION | passed |
| ✓ |  POST /api/v1/collections/:id/items  [REQ-F-015] unknown collection → 404 | passed |
| ✓ |  POST /api/v1/collections/:id/items  [REQ-F-015] unknown item → 404 | passed |
| ✓ |  POST /api/v1/collections/:id/items  [REQ-F-015] invalid itemId (not uuid) → 400 | passed |
| ✓ |  DELETE /api/v1/collections/:id/items/:itemId  [REQ-F-019] AC-019: remove from collection — item stays in catalog + other collections | passed |
| ✓ |  DELETE /api/v1/collections/:id/items/:itemId  [REQ-F-019] unknown collection/item → 404 | passed |
| ✓ |  POST /api/v1/items  [REQ-F-007] AC-007 positive: title+type → 201 + item with coverUrl=null | passed |
| ✓ |  POST /api/v1/items  [REQ-F-007] AC-007: type-specific fields (book: author, pages) | passed |
| ✓ |  POST /api/v1/items  [REQ-F-007] AC-007: type-specific fields (film: director, duration) | passed |
| ✓ |  POST /api/v1/items  [REQ-F-007] AC-007: type-specific fields (series: seasons) | passed |
| ✓ |  POST /api/v1/items  [REQ-F-007] missing title → 400 VALIDATION_ERROR | passed |
| ✓ |  POST /api/v1/items  [REQ-F-007] empty title → 400 VALIDATION_ERROR (minLength:1) | passed |
| ✓ |  POST /api/v1/items  [REQ-F-007] invalid type → 400 VALIDATION_ERROR | passed |
| ✓ |  POST /api/v1/items  [REQ-F-007] invalid status → 400 VALIDATION_ERROR | passed |
| ✓ |  POST /api/v1/items  [REQ-F-007] rating out of range → 400 VALIDATION_ERROR | passed |
| ✓ |  POST /api/v1/items  [REQ-F-007] without session → 401 | passed |
| ✓ |  GET /api/v1/items  [REQ-F-004] AC-004: returns all items for current user | passed |
| ✓ |  GET /api/v1/items  [REQ-F-004] AC-004: empty catalog → empty array | passed |
| ✓ |  GET /api/v1/items  [REQ-F-004] isolation: user sees only their own items | passed |
| ✓ |  GET /api/v1/items  [REQ-F-004] without session → 401 | passed |
| ✓ |  GET /api/v1/items/:id  [REQ-F-008] AC-008: returns item by id | passed |
| ✓ |  GET /api/v1/items/:id  [REQ-F-008] unknown id → 404 | passed |
| ✓ |  GET /api/v1/items/:id  [REQ-F-008] ADD-06 / NF-002: other user item → 404 | passed |
| ✓ |  PATCH /api/v1/items/:id  [REQ-F-008] AC-008: update title and rating → 200 + updated item | passed |
| ✓ |  PATCH /api/v1/items/:id  [REQ-F-008] AC-008: partial update — untouched fields remain | passed |
| ✓ |  PATCH /api/v1/items/:id  [REQ-F-008] update tags → tags replaced | passed |
| ✓ |  PATCH /api/v1/items/:id  [REQ-F-008] AC-010: tags stored after POST, appear in GET response | passed |
| ✓ |  PATCH /api/v1/items/:id  [REQ-F-008] AC-010: removing a tag via PATCH does not affect other attributes | passed |
| ✓ |  PATCH /api/v1/items/:id  [REQ-F-008] empty title → 400 | passed |
| ✓ |  PATCH /api/v1/items/:id  [REQ-F-008] unknown id → 404 | passed |
| ✓ |  PATCH /api/v1/items/:id  [REQ-F-008] ADD-06: other user item → 404 | passed |
| ✓ |  DELETE /api/v1/items/:id  [REQ-F-009] AC-009: delete → 204, item no longer in catalog | passed |
| ✓ |  DELETE /api/v1/items/:id  [REQ-F-009] AC-009: cascade — item removed from collection_items in DB | passed |
| ✓ |  DELETE /api/v1/items/:id  [REQ-F-009] unknown id → 404 | passed |
| ✓ |  DELETE /api/v1/items/:id  [REQ-F-009] ADD-06: other user item → 404 | passed |
| ✓ |  POST /api/v1/items/:id/cover  [REQ-F-025, REQ-F-028] AC-025: upload valid JPEG → 200, coverUrl set | passed |
| ✓ |  POST /api/v1/items/:id/cover  [REQ-F-025, REQ-F-028] AC-025: coverUrl is persisted on item | passed |
| ✓ |  POST /api/v1/items/:id/cover  [REQ-F-025, REQ-F-028] AC-028: unsupported format (PDF) → 400 VALIDATION_ERROR | passed |
| ✓ |  POST /api/v1/items/:id/cover  [REQ-F-025, REQ-F-028] AC-028: file > 5MB → 400 VALIDATION_ERROR | passed |
| ✓ |  POST /api/v1/items/:id/cover  [REQ-F-025, REQ-F-028] no file attached → 400 | passed |
| ✓ |  POST /api/v1/items/:id/cover  [REQ-F-025, REQ-F-028] unknown item → 404 | passed |
| ✓ |  DELETE /api/v1/items/:id/cover  [REQ-F-025] AC-025: delete cover → 204, coverUrl back to null | passed |
| ✓ |  DELETE /api/v1/items/:id/cover  [REQ-F-025] unknown item → 404 | passed |
| ✓ |  POST /api/v1/items/:id/sessions  [REQ-F-012] AC-012 positive: creates session with date/rating/note → 201 | passed |
| ✓ |  POST /api/v1/items/:id/sessions  [REQ-F-012] AC-012: multiple sessions for same item, each stored separately | passed |
| ✓ |  POST /api/v1/items/:id/sessions  [REQ-F-012] missing date → 400 | passed |
| ✓ |  POST /api/v1/items/:id/sessions  [REQ-F-012] rating out of range → 400 | passed |
| ✓ |  POST /api/v1/items/:id/sessions  [REQ-F-012] unknown item → 404 | passed |
| ✓ |  POST /api/v1/items/:id/sessions  [REQ-F-012] ADD-06: other user item → 404 | passed |
| ✓ |  POST /api/v1/items/:id/sessions  [REQ-F-012] without session → 401 | passed |
| ✓ |  GET /api/v1/items/:id/sessions  [REQ-F-013, ADD-04] AC-013: sessions sorted newest→oldest, total count correct | passed |
| ✓ |  GET /api/v1/items/:id/sessions  [REQ-F-013, ADD-04] AC-013: ADD-04 — ordering is server-side regardless of creation order | passed |
| ✓ |  GET /api/v1/items/:id/sessions  [REQ-F-013, ADD-04] no sessions → {sessions: [], total: 0} | passed |
| ✓ |  GET /api/v1/items/:id/sessions  [REQ-F-013, ADD-04] unknown item → 404 | passed |
| ✓ |  GET /api/v1/items/:id/sessions  [REQ-F-013, ADD-04] ADD-06: other user item → 404 | passed |
| ✓ |  PATCH /api/v1/items/:id/sessions/:sid  [REQ-F-014] AC-014: update date, rating, note → 200 + updated session | passed |
| ✓ |  PATCH /api/v1/items/:id/sessions/:sid  [REQ-F-014] AC-014: partial update — untouched fields remain | passed |
| ✓ |  PATCH /api/v1/items/:id/sessions/:sid  [REQ-F-014] unknown session → 404 | passed |
| ✓ |  PATCH /api/v1/items/:id/sessions/:sid  [REQ-F-014] ADD-06: other user → 404 | passed |
| ✓ |  DELETE /api/v1/items/:id/sessions/:sid  [REQ-F-014] AC-014: delete → 204, session disappears, total decreases | passed |
| ✓ |  DELETE /api/v1/items/:id/sessions/:sid  [REQ-F-014] unknown session → 404 | passed |
| ✓ |  AC-040: basis=sessions + period=all → Session counts by type returns books=2, films=1, total=3 from sessions (not from completedAt) | passed |
| ✓ |  AC-041: basis=sessions + period=month → current month only counts sessions with date in 2026-11, ignores 2026-10 and 2025 | passed |
| ✓ |  AC-042: basis=sessions + period=year → current year only counts sessions in 2026, excludes 2025 | passed |
| ✓ |  AC-043: 1 item with 2 sessions in same month → count=2 (not 1) total=2 when one film has two sessions in Nov 2026 | passed |
| ✓ |  AC-044: no basis param → backward-compatible completedAt behavior response with no basis param includes basis=completedAt and counts items | passed |
| ✓ |  AC-044: no basis param → backward-compatible completedAt behavior basis=completedAt explicit → same result as no basis | passed |
| ✓ |  AC-045: completed item without Sessions → not counted at basis=sessions completed book with no sessions → books=0 at basis=sessions | passed |
| ✓ |  AC-046: Session on in_progress item → counted at basis=sessions in_progress film with a session is counted | passed |
| ✓ |  AC-047: invalid basis → 400 INVALID_BASIS basis=weekly → 400, code INVALID_BASIS, field basis | passed |
| ✓ |  AC-048: no sessions in queried period → zeros (basis=sessions) sessions exist in LAST_YEAR only → period=month returns 0 at basis=sessions | passed |
| ✓ |  AC-049: boundary dates — month attribution (server clock = 2026-11-07) session on 2026-11-30 (last day of Nov) → counted in Nov (period=month) | passed |
| ✓ |  AC-049: boundary dates — month attribution (server clock = 2026-11-07) session on 2026-12-01 NOT counted in Nov (period=month, clock=2026-11-07) | passed |
| ✓ |  AC-049: boundary dates — month attribution (server clock = 2026-11-07) session on 2026-12-01 IS counted in Dec (period=month, clock advanced to 2026-12-15) | passed |
| ✓ |  PATCH /items/:id — completedAt storage  [REQ-F-021] AC-021: completedAt value stored and returned unchanged | passed |
| ✓ |  PATCH /items/:id — completedAt storage  [REQ-F-021] AC-021: server does NOT auto-fill completedAt when status=completed but no date sent | passed |
| ✓ |  PATCH /items/:id — completedAt storage  [REQ-F-021] AC-021: completedAt=null explicitly clears the field | passed |
| ✓ |  GET /api/v1/stats  [REQ-F-022, REQ-F-022a] AC-022/AC-030: period=all → counts completed items by type | passed |
| ✓ |  GET /api/v1/stats  [REQ-F-022, REQ-F-022a] AC-022: planned items are not counted | passed |
| ✓ |  GET /api/v1/stats  [REQ-F-022, REQ-F-022a] AC-022: empty catalog → all zeros | passed |
| ✓ |  GET /api/v1/stats  [REQ-F-022, REQ-F-022a] AC-030: period=month → only current month items counted | passed |
| ✓ |  GET /api/v1/stats  [REQ-F-022, REQ-F-022a] AC-030: period=year → only current year items counted | passed |
| ✓ |  GET /api/v1/stats  [REQ-F-022, REQ-F-022a] ADD-05: stats use completedAt, NOT session date | passed |
| ✓ |  GET /api/v1/stats  [REQ-F-022, REQ-F-022a] ADD-05: completed item without completedAt not counted in period filters | passed |
| ✓ |  GET /api/v1/stats  [REQ-F-022, REQ-F-022a] isolation: user sees only their own stats | passed |
| ✓ |  GET /api/v1/stats  [REQ-F-022, REQ-F-022a] missing period → 400 VALIDATION_ERROR | passed |
| ✓ |  GET /api/v1/stats  [REQ-F-022, REQ-F-022a] invalid period → 400 | passed |
| ✓ |  GET /api/v1/stats  [REQ-F-022, REQ-F-022a] without session → 401 | passed |
| ✓ |  Performance  [REQ-NF-001, AC-034] AC-034: GET /items with 100 items responds within 500ms | passed |
| ✓ |  Performance  [REQ-NF-001, AC-034] AC-034: GET /stats responds within 500ms | passed |
| ✓ |  Reliability  [REQ-NF-003, AC-036] AC-036: failed PATCH with invalid type leaves item data unchanged | passed |
| ✓ |  Reliability  [REQ-NF-003, AC-036] AC-036: failed POST (validation) produces no partial item in catalog | passed |
| ✓ |  GET /api/v1/tags  [REQ-F-010] AC-010: returns sorted deduplicated tag list | passed |
| ✓ |  GET /api/v1/tags  [REQ-F-010] AC-010: no items → empty array | passed |
| ✓ |  GET /api/v1/tags  [REQ-F-010] AC-010: items without tags → empty array | passed |
| ✓ |  GET /api/v1/tags  [REQ-F-010] isolation: user sees only their own tags | passed |
| ✓ |  GET /api/v1/tags  [REQ-F-010] without session → 401 | passed |
| ✓ |  PATCH /api/v1/users/me  [REQ-F-029] AC-029 positive: change nickname → 200 + updated user (no password_hash) | passed |
| ✓ |  PATCH /api/v1/users/me  [REQ-F-029] AC-031 / NF-006: nickname 1 char → 400, field=nickname | passed |
| ✓ |  PATCH /api/v1/users/me  [REQ-F-029] AC-031 / NF-006: nickname 51 chars → 400, field=nickname | passed |
| ✓ |  PATCH /api/v1/users/me  [REQ-F-029] boundary: nickname 2 chars → 200 | passed |
| ✓ |  PATCH /api/v1/users/me  [REQ-F-029] boundary: nickname 50 chars → 200 | passed |
| ✓ |  PATCH /api/v1/users/me  [REQ-F-029] AC-035 / NF-002: without session → 401 UNAUTHORIZED | passed |
| ✓ |  PATCH /api/v1/users/me  [REQ-F-029] missing nickname field → 400 | passed |
| ✓ |  authService.register  [REQ-F-001, NF-002] stores bcrypt hash — never plain-text password | passed |
| ✓ |  authService.register  [REQ-F-001, NF-002] returns ApiUser without password_hash | passed |
| ✓ |  authService.register  [REQ-F-001, NF-002] throws EMAIL_TAKEN (409) when email already exists | passed |
| ✓ |  authService.login  [REQ-F-002, NF-002] throws INVALID_CREDENTIALS (401) for unknown email | passed |
| ✓ |  authService.login  [REQ-F-002, NF-002] throws INVALID_CREDENTIALS (401) for wrong password | passed |

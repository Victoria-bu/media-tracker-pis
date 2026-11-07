# Test Run Log — Etape v01-red

**Date:** 2026-11-07 16:37:00
**Stage:** v01-red
**REQ-NF-009:** AC-033

## Summary

| Total | Passed | Failed | Skipped | Duration |
|---|---|---|---|---|
| 59 | 57 | 2 | 0 | 309ms |

## Individual Tests

| | Test | Status |
|---|---|---|
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
| ✗ |  CollectionItem.createdAt — ISO 8601 format  [V-01, openapi format:date-time] GET /collections/{id} → items[0].createdAt is RFC 3339 ISO 8601 | failed |
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
| ✗ |  Item.createdAt — ISO 8601 date-time format  [V-01, openapi format:date-time] POST /items → createdAt is RFC 3339 ISO 8601 (YYYY-MM-DDTHH:MM:SS.mmmZ) | failed |

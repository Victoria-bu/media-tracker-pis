# Test Run Log — Etape 8a-red-fixed

**Date:** 2026-11-07 16:00:45
**Stage:** 8a-red-fixed
**REQ-NF-009:** AC-033

## Summary

| Total | Passed | Failed | Skipped | Duration |
|---|---|---|---|---|
| 13 | 0 | 13 | 0 | 103ms |

## Individual Tests

| | Test | Status |
|---|---|---|
| ✗ |  AC-040: basis=sessions + period=all → Session counts by type returns books=2, films=1, total=3 from sessions (not from completedAt) | failed |
| ✗ |  AC-041: basis=sessions + period=month → current month only counts sessions with date in 2026-11, ignores 2026-10 and 2025 | failed |
| ✗ |  AC-042: basis=sessions + period=year → current year only counts sessions in 2026, excludes 2025 | failed |
| ✗ |  AC-043: 1 item with 2 sessions in same month → count=2 (not 1) total=2 when one film has two sessions in Nov 2026 | failed |
| ✗ |  AC-044: no basis param → backward-compatible completedAt behavior response with no basis param includes basis=completedAt and counts items | failed |
| ✗ |  AC-044: no basis param → backward-compatible completedAt behavior basis=completedAt explicit → same result as no basis | failed |
| ✗ |  AC-045: completed item without Sessions → not counted at basis=sessions completed book with no sessions → books=0 at basis=sessions | failed |
| ✗ |  AC-046: Session on in_progress item → counted at basis=sessions in_progress film with a session is counted | failed |
| ✗ |  AC-047: invalid basis → 400 INVALID_BASIS basis=weekly → 400, code INVALID_BASIS, field basis | failed |
| ✗ |  AC-048: no sessions in queried period → zeros (basis=sessions) sessions exist in LAST_YEAR only → period=month returns 0 at basis=sessions | failed |
| ✗ |  AC-049: boundary dates — month attribution (server clock = 2026-11-07) session on 2026-11-30 (last day of Nov) → counted in Nov (period=month) | failed |
| ✗ |  AC-049: boundary dates — month attribution (server clock = 2026-11-07) session on 2026-12-01 NOT counted in Nov (period=month, clock=2026-11-07) | failed |
| ✗ |  AC-049: boundary dates — month attribution (server clock = 2026-11-07) session on 2026-12-01 IS counted in Dec (period=month, clock advanced to 2026-12-15) | failed |

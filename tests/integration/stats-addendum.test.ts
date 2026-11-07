/**
 * RED tests — ADD-07 / REQ-F-022b
 * AC-040 … AC-049
 *
 * These tests MUST fail before implementation (basis param not yet handled).
 * Expected Red reason: server ignores basis → returns completedAt-based stats,
 * basis field absent in response, no 400 for invalid basis.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { v4 as uuidv4 } from 'uuid';
import request from 'supertest';
import Database from 'better-sqlite3';
import { createApp } from '../../src/app';
import { createTestDb } from '../../src/db';
import { setClock, resetClock } from '../../src/utils/clock';

// Fix server clock to 2026-11-07 for all tests (Рішення 6 / AC-049)
const FIXED_NOW = new Date('2026-11-07T12:00:00Z');
const THIS_MONTH_DATE = '2026-11-07';   // in-period
const LAST_MONTH_DATE = '2026-10-15';   // out of month, in year
const LAST_YEAR_DATE  = '2025-06-15';   // out of year
const MONTH_LAST_DAY  = '2026-11-30';   // boundary: last day of Nov 2026
const NEXT_MONTH_FIRST = '2026-12-01';  // boundary: first day of Dec 2026

beforeEach(() => setClock(() => FIXED_NOW));
afterEach(() => resetClock());

async function setup() {
  const db = createTestDb();
  const agent = request.agent(createApp(db));
  await agent.post('/api/v1/auth/register')
    .send({ email: 'user@example.com', password: 'password123', nickname: 'User' });
  return { db, agent };
}

async function createItem(agent: ReturnType<typeof request.agent>, type: 'book' | 'series' | 'film') {
  return (await agent.post('/api/v1/items').send({ title: `${type}-${Date.now()}`, type })).body;
}

async function addSession(
  agent: ReturnType<typeof request.agent>,
  itemId: string,
  date: string,
  rating = 7,
) {
  return (await agent.post(`/api/v1/items/${itemId}/sessions`).send({ date, rating })).body;
}

// ── AC-040 ────────────────────────────────────────────────────────────────────

describe('AC-040: basis=sessions + period=all → Session counts by type', () => {
  it('returns books=2, films=1, total=3 from sessions (not from completedAt)', async () => {
    const { agent } = await setup();
    const book1 = await createItem(agent, 'book');
    const book2 = await createItem(agent, 'book');
    const film1 = await createItem(agent, 'film');

    await addSession(agent, book1.id, THIS_MONTH_DATE);
    await addSession(agent, book2.id, LAST_YEAR_DATE);
    await addSession(agent, film1.id, LAST_MONTH_DATE);

    const res = await agent.get('/api/v1/stats?period=all&basis=sessions');
    expect(res.status).toBe(200);
    expect(res.body.books).toBe(2);
    expect(res.body.films).toBe(1);
    expect(res.body.series).toBe(0);
    expect(res.body.total).toBe(3);
    expect(res.body.basis).toBe('sessions');
  });
});

// ── AC-041 ────────────────────────────────────────────────────────────────────

describe('AC-041: basis=sessions + period=month → current month only', () => {
  it('counts sessions with date in 2026-11, ignores 2026-10 and 2025', async () => {
    const { agent } = await setup();
    const book = await createItem(agent, 'book');
    const film = await createItem(agent, 'film');

    await addSession(agent, book.id, THIS_MONTH_DATE);  // in
    await addSession(agent, film.id, LAST_MONTH_DATE);  // out
    await addSession(agent, film.id, LAST_YEAR_DATE);   // out

    const res = await agent.get('/api/v1/stats?period=month&basis=sessions');
    expect(res.status).toBe(200);
    expect(res.body.books).toBe(1);
    expect(res.body.films).toBe(0);
    expect(res.body.total).toBe(1);
  });
});

// ── AC-042 ────────────────────────────────────────────────────────────────────

describe('AC-042: basis=sessions + period=year → current year only', () => {
  it('counts sessions in 2026, excludes 2025', async () => {
    const { agent } = await setup();
    const book = await createItem(agent, 'book');

    await addSession(agent, book.id, THIS_MONTH_DATE);  // 2026 — in
    await addSession(agent, book.id, LAST_MONTH_DATE);  // 2026 — in
    await addSession(agent, book.id, LAST_YEAR_DATE);   // 2025 — out

    const res = await agent.get('/api/v1/stats?period=year&basis=sessions');
    expect(res.status).toBe(200);
    expect(res.body.books).toBe(2);
    expect(res.body.total).toBe(2);
  });
});

// ── AC-043 ────────────────────────────────────────────────────────────────────

describe('AC-043: 1 item with 2 sessions in same month → count=2 (not 1)', () => {
  it('total=2 when one film has two sessions in Nov 2026', async () => {
    const { agent } = await setup();
    const film = await createItem(agent, 'film');

    await addSession(agent, film.id, '2026-11-01');
    await addSession(agent, film.id, '2026-11-15');

    const res = await agent.get('/api/v1/stats?period=month&basis=sessions');
    expect(res.status).toBe(200);
    expect(res.body.films).toBe(2);
    expect(res.body.total).toBe(2);
  });
});

// ── AC-044 ────────────────────────────────────────────────────────────────────

describe('AC-044: no basis param → backward-compatible completedAt behavior', () => {
  it('response with no basis param includes basis=completedAt and counts items', async () => {
    const { agent } = await setup();
    const book = await createItem(agent, 'book');
    // completed item — should appear in completedAt stats
    await agent.patch(`/api/v1/items/${book.id}`)
      .send({ status: 'completed', completedAt: THIS_MONTH_DATE });

    const res = await agent.get('/api/v1/stats?period=month');
    expect(res.status).toBe(200);
    expect(res.body.books).toBe(1);
    expect(res.body.basis).toBe('completedAt');
  });

  it('basis=completedAt explicit → same result as no basis', async () => {
    const { agent } = await setup();
    const book = await createItem(agent, 'book');
    await agent.patch(`/api/v1/items/${book.id}`)
      .send({ status: 'completed', completedAt: THIS_MONTH_DATE });

    const res = await agent.get('/api/v1/stats?period=month&basis=completedAt');
    expect(res.status).toBe(200);
    expect(res.body.books).toBe(1);
    expect(res.body.basis).toBe('completedAt');
  });
});

// ── AC-045 ────────────────────────────────────────────────────────────────────

describe('AC-045: completed item without Sessions → not counted at basis=sessions', () => {
  it('completed book with no sessions → books=0 at basis=sessions', async () => {
    const { agent } = await setup();
    const book = await createItem(agent, 'book');
    await agent.patch(`/api/v1/items/${book.id}`)
      .send({ status: 'completed', completedAt: THIS_MONTH_DATE });

    const res = await agent.get('/api/v1/stats?period=all&basis=sessions');
    expect(res.status).toBe(200);
    expect(res.body.books).toBe(0);
    expect(res.body.total).toBe(0);
  });
});

// ── AC-046 ────────────────────────────────────────────────────────────────────

describe('AC-046: Session on in_progress item → counted at basis=sessions', () => {
  it('in_progress film with a session is counted', async () => {
    const { agent } = await setup();
    const film = await createItem(agent, 'film'); // status=planned by default

    await agent.patch(`/api/v1/items/${film.id}`).send({ status: 'in_progress' });
    await addSession(agent, film.id, THIS_MONTH_DATE);

    const res = await agent.get('/api/v1/stats?period=month&basis=sessions');
    expect(res.status).toBe(200);
    expect(res.body.films).toBe(1);
  });
});

// ── AC-047 ────────────────────────────────────────────────────────────────────

describe('AC-047: invalid basis → 400 INVALID_BASIS', () => {
  it('basis=weekly → 400, code INVALID_BASIS, field basis', async () => {
    const { agent } = await setup();
    const res = await agent.get('/api/v1/stats?period=all&basis=weekly');
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('INVALID_BASIS');
    expect(res.body.field).toBe('basis');
  });
});

// ── AC-048 ────────────────────────────────────────────────────────────────────

describe('AC-048: no sessions in queried period → zeros (basis=sessions)', () => {
  it('sessions exist in LAST_YEAR only → period=month returns 0 at basis=sessions', async () => {
    const { agent } = await setup();
    const book = await createItem(agent, 'book');

    // Session exists, but in LAST_YEAR — not in current month
    await addSession(agent, book.id, LAST_YEAR_DATE);

    // Completed item with completedAt in THIS_MONTH: completedAt-mode would return 1
    const book2 = await createItem(agent, 'book');
    await agent.patch(`/api/v1/items/${book2.id}`)
      .send({ status: 'completed', completedAt: THIS_MONTH_DATE });

    // basis=sessions + period=month: no Nov sessions → 0
    // completedAt + period=month: completed item in Nov → 1
    // Expected: 0 / Actual (completedAt): 1 → FAIL ✓
    const res = await agent.get('/api/v1/stats?period=month&basis=sessions');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ books: 0, series: 0, films: 0, total: 0 });
    expect(res.body.basis).toBe('sessions');
  });
});

// ── AC-049 ────────────────────────────────────────────────────────────────────
// Clock is fixed at 2026-11-07T12:00:00Z via beforeEach(setClock).
// All period filters (month/year) use this clock, not new Date().

describe('AC-049: boundary dates — month attribution (server clock = 2026-11-07)', () => {
  it('session on 2026-11-30 (last day of Nov) → counted in Nov (period=month)', async () => {
    const { agent } = await setup();
    const book = await createItem(agent, 'book');
    await addSession(agent, book.id, MONTH_LAST_DAY); // 2026-11-30

    // basis=sessions: Nov session IS in Nov → books=1
    // completedAt: no completed item → books=0
    // Expected: 1 / Actual (completedAt): 0 → FAIL ✓
    const res = await agent.get('/api/v1/stats?period=month&basis=sessions');
    expect(res.status).toBe(200);
    expect(res.body.books).toBe(1);
  });

  it('session on 2026-12-01 NOT counted in Nov (period=month, clock=2026-11-07)', async () => {
    const { agent } = await setup();
    const book = await createItem(agent, 'book');
    await addSession(agent, book.id, NEXT_MONTH_FIRST); // 2026-12-01

    // Add completed item in Nov → completedAt returns books=1
    const otherBook = await createItem(agent, 'book');
    await agent.patch(`/api/v1/items/${otherBook.id}`)
      .send({ status: 'completed', completedAt: THIS_MONTH_DATE });

    // basis=sessions: Dec session NOT in Nov → 0
    // completedAt: Nov completed item → 1
    // Expected: 0 / Actual (completedAt): 1 → FAIL ✓
    const res = await agent.get('/api/v1/stats?period=month&basis=sessions');
    expect(res.status).toBe(200);
    expect(res.body.books).toBe(0);
  });

  it('session on 2026-12-01 IS counted in Dec (period=month, clock advanced to 2026-12-15)', async () => {
    const { agent } = await setup();
    const book = await createItem(agent, 'book');
    await addSession(agent, book.id, NEXT_MONTH_FIRST); // 2026-12-01

    // Advance clock to December
    setClock(() => new Date('2026-12-15T12:00:00Z'));

    // basis=sessions: Dec session IS in Dec → books=1
    // completedAt: no completed item → books=0
    // Expected: 1 / Actual (completedAt): 0 → FAIL ✓
    const res = await agent.get('/api/v1/stats?period=month&basis=sessions');
    expect(res.status).toBe(200);
    expect(res.body.books).toBe(1);
  });
});

/**
 * Integration tests — Statistics & NFR/QA
 * REQ-F-022 (AC-022), REQ-F-022a (AC-030), REQ-F-021 (AC-021 storage only)
 * REQ-NF-001 (AC-034), REQ-NF-003 (AC-036)
 * ADD-05: stats filtered by Item.completedAt, not Session date
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { v4 as uuidv4 } from 'uuid';
import request from 'supertest';
import Database from 'better-sqlite3';
import { createApp } from '../../src/app';
import { createTestDb } from '../../src/db';

// Dynamic current-date helpers (robust across month boundaries)
const now = new Date();
const THIS_MONTH = `${now.toISOString().slice(0, 7)}-15`;
const LAST_MONTH = (() => {
  const d = new Date(now.getFullYear(), now.getMonth() - 1, 15);
  return d.toISOString().slice(0, 10);
})();
const LAST_YEAR = `${now.getFullYear() - 1}-06-15`;

async function setup() {
  const db = createTestDb();
  const agent = request.agent(createApp(db));
  await agent.post('/api/v1/auth/register')
    .send({ email: 'user@example.com', password: 'password123', nickname: 'User' });
  return { db, agent };
}

async function createCompleted(
  agent: ReturnType<typeof request.agent>,
  type: 'book' | 'series' | 'film',
  completedAt: string | null = THIS_MONTH,
) {
  const body: Record<string, unknown> = { title: `${type} ${Date.now()}`, type, status: 'completed' };
  if (completedAt !== null) body.completedAt = completedAt;
  return (await agent.post('/api/v1/items').send(body)).body;
}

// ── F-021 completedAt storage ─────────────────────────────────────────────────

describe('PATCH /items/:id — completedAt storage  [REQ-F-021]', () => {
  it('AC-021: completedAt value stored and returned unchanged', async () => {
    const { agent } = await setup();
    const item = (await agent.post('/api/v1/items').send({ title: 'Book', type: 'book' })).body;

    const res = await agent.patch(`/api/v1/items/${item.id}`)
      .send({ status: 'completed', completedAt: '2026-11-07' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('completed');
    expect(res.body.completedAt).toBe('2026-11-07');
  });

  it('AC-021: server does NOT auto-fill completedAt when status=completed but no date sent', async () => {
    const { agent } = await setup();
    const item = (await agent.post('/api/v1/items').send({ title: 'Book', type: 'book' })).body;

    const res = await agent.patch(`/api/v1/items/${item.id}`).send({ status: 'completed' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('completed');
    expect(res.body.completedAt).toBeNull();
  });

  it('AC-021: completedAt=null explicitly clears the field', async () => {
    const { agent } = await setup();
    const item = (await agent.post('/api/v1/items')
      .send({ title: 'Book', type: 'book', status: 'completed', completedAt: '2026-11-01' })).body;

    const res = await agent.patch(`/api/v1/items/${item.id}`).send({ completedAt: null });
    expect(res.status).toBe(200);
    expect(res.body.completedAt).toBeNull();
  });
});

// ── F-022 / F-022a Statistics ─────────────────────────────────────────────────

describe('GET /api/v1/stats  [REQ-F-022, REQ-F-022a]', () => {
  it('AC-022/AC-030: period=all → counts completed items by type', async () => {
    const { agent } = await setup();
    await createCompleted(agent, 'book');
    await createCompleted(agent, 'book');
    await createCompleted(agent, 'series');

    const res = await agent.get('/api/v1/stats?period=all');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      period: 'all',
      books: 2,
      series: 1,
      films: 0,
      total: 3,
    });
  });

  it('AC-022: planned items are not counted', async () => {
    const { agent } = await setup();
    await agent.post('/api/v1/items').send({ title: 'Planned', type: 'book', status: 'planned' });

    const res = await agent.get('/api/v1/stats?period=all');
    expect(res.body.books).toBe(0);
    expect(res.body.total).toBe(0);
  });

  it('AC-022: empty catalog → all zeros', async () => {
    const { agent } = await setup();
    const res = await agent.get('/api/v1/stats?period=all');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ books: 0, series: 0, films: 0, total: 0 });
  });

  it('AC-030: period=month → only current month items counted', async () => {
    const { agent } = await setup();
    await createCompleted(agent, 'book', THIS_MONTH);     // in
    await createCompleted(agent, 'film', LAST_MONTH);     // out
    await createCompleted(agent, 'series', LAST_YEAR);    // out

    const res = await agent.get('/api/v1/stats?period=month');
    expect(res.status).toBe(200);
    expect(res.body.books).toBe(1);
    expect(res.body.films).toBe(0);
    expect(res.body.series).toBe(0);
    expect(res.body.total).toBe(1);
  });

  it('AC-030: period=year → only current year items counted', async () => {
    const { agent } = await setup();
    await createCompleted(agent, 'book', THIS_MONTH);     // in (this year)
    await createCompleted(agent, 'film', LAST_MONTH);     // in (this year too)
    await createCompleted(agent, 'series', LAST_YEAR);    // out (last year)

    const res = await agent.get('/api/v1/stats?period=year');
    expect(res.status).toBe(200);
    expect(res.body.books).toBe(1);
    expect(res.body.films).toBe(1);
    expect(res.body.series).toBe(0);
    expect(res.body.total).toBe(2);
  });

  it('ADD-05: stats use completedAt, NOT session date', async () => {
    const { agent } = await setup();

    // Item completed LAST MONTH
    const item = await createCompleted(agent, 'book', LAST_MONTH);

    // Session on this item dated THIS MONTH — must NOT affect month stats
    await agent.post(`/api/v1/items/${item.id}/sessions`)
      .send({ date: THIS_MONTH, rating: 9 });

    const res = await agent.get('/api/v1/stats?period=month');
    expect(res.body.books).toBe(0); // completedAt is last month, so not counted
    expect(res.body.total).toBe(0);
  });

  it('ADD-05: completed item without completedAt not counted in period filters', async () => {
    const { agent } = await setup();
    await createCompleted(agent, 'book', null); // completed but no completedAt

    const monthRes = await agent.get('/api/v1/stats?period=month');
    expect(monthRes.body.books).toBe(0);

    const yearRes = await agent.get('/api/v1/stats?period=year');
    expect(yearRes.body.books).toBe(0);
  });

  it('isolation: user sees only their own stats', async () => {
    const { db, agent } = await setup();
    await createCompleted(agent, 'book');

    const otherAgent = request.agent(createApp(db));
    await otherAgent.post('/api/v1/auth/register')
      .send({ email: 'other@example.com', password: 'password123', nickname: 'Other' });

    const res = await otherAgent.get('/api/v1/stats?period=all');
    expect(res.body.total).toBe(0);
  });

  it('missing period → 400 VALIDATION_ERROR', async () => {
    const { agent } = await setup();
    const res = await agent.get('/api/v1/stats');
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });

  it('invalid period → 400', async () => {
    const { agent } = await setup();
    const res = await agent.get('/api/v1/stats?period=week');
    expect(res.status).toBe(400);
  });

  it('without session → 401', async () => {
    const res = await request(createApp(createTestDb())).get('/api/v1/stats?period=all');
    expect(res.status).toBe(401);
  });
});

// ── NF-001 Performance ────────────────────────────────────────────────────────

describe('Performance  [REQ-NF-001, AC-034]', () => {
  it('AC-034: GET /items with 100 items responds within 500ms', async () => {
    const db = createTestDb();
    const agent = request.agent(createApp(db));
    await agent.post('/api/v1/auth/register')
      .send({ email: 'perf@example.com', password: 'password123', nickname: 'PerfUser' });

    const userId = (db.prepare('SELECT id FROM users LIMIT 1').get() as { id: string }).id;
    const stmt = db.prepare(
      "INSERT INTO items (id, user_id, title, type, status, tags, created_at) VALUES (?, ?, ?, 'book', 'planned', '[]', datetime('now'))",
    );
    for (let i = 0; i < 100; i++) {
      stmt.run(uuidv4(), userId, `Perf Item ${i}`);
    }

    const start = Date.now();
    const res = await agent.get('/api/v1/items');
    const elapsed = Date.now() - start;

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(100);
    expect(elapsed).toBeLessThan(500);
  });

  it('AC-034: GET /stats responds within 500ms', async () => {
    const { agent } = await setup();
    const start = Date.now();
    await agent.get('/api/v1/stats?period=all');
    expect(Date.now() - start).toBeLessThan(500);
  });
});

// ── NF-003 Reliability ────────────────────────────────────────────────────────

describe('Reliability  [REQ-NF-003, AC-036]', () => {
  it('AC-036: failed PATCH with invalid type leaves item data unchanged', async () => {
    const { agent } = await setup();
    const item = (await agent.post('/api/v1/items')
      .send({ title: 'Original', type: 'book', rating: 7, notes: 'unchanged' })).body;

    await agent.patch(`/api/v1/items/${item.id}`).send({ type: 'invalid' });

    const check = (await agent.get(`/api/v1/items/${item.id}`)).body;
    expect(check.title).toBe('Original');
    expect(check.type).toBe('book');
    expect(check.rating).toBe(7);
    expect(check.notes).toBe('unchanged');
  });

  it('AC-036: failed POST (validation) produces no partial item in catalog', async () => {
    const { agent } = await setup();
    await agent.post('/api/v1/items').send({ title: '', type: 'book' }); // 400

    const list = (await agent.get('/api/v1/items')).body;
    expect(list).toHaveLength(0); // no partial item saved
  });
});

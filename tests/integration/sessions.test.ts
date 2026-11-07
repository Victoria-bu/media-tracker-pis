/**
 * Integration tests — Sessions (Repeated Viewings)
 * REQ-F-012 (AC-012), REQ-F-013 (AC-013), REQ-F-014 (AC-014)
 * ADD-04: server-side sort newest→oldest
 * ADD-06: foreign resource → 404
 */
import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import Database from 'better-sqlite3';
import { createApp } from '../../src/app';
import { createTestDb } from '../../src/db';

async function setup() {
  const db = createTestDb();
  const agent = request.agent(createApp(db));
  await agent.post('/api/v1/auth/register')
    .send({ email: 'user@example.com', password: 'password123', nickname: 'User' });
  const item = (await agent.post('/api/v1/items').send({ title: 'Film X', type: 'film' })).body;
  return { db, agent, itemId: item.id };
}

// ── F-012 Create Session ──────────────────────────────────────────────────────

describe('POST /api/v1/items/:id/sessions  [REQ-F-012]', () => {
  it('AC-012 positive: creates session with date/rating/note → 201', async () => {
    const { agent, itemId } = await setup();

    const res = await agent.post(`/api/v1/items/${itemId}/sessions`)
      .send({ date: '2026-11-01', rating: 9, note: 'Great watch' });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      id: expect.any(String),
      itemId,
      date: '2026-11-01',
      rating: 9,
      note: 'Great watch',
    });
  });

  it('AC-012: multiple sessions for same item, each stored separately', async () => {
    const { agent, itemId } = await setup();

    await agent.post(`/api/v1/items/${itemId}/sessions`)
      .send({ date: '2026-11-01', rating: 9 });
    await agent.post(`/api/v1/items/${itemId}/sessions`)
      .send({ date: '2026-11-05', rating: 5, note: "didn't enjoy it the second time" });

    const list = await agent.get(`/api/v1/items/${itemId}/sessions`);
    expect(list.body.total).toBe(2);
    // Both ratings stored independently
    const ratings = list.body.sessions.map((s: any) => s.rating);
    expect(ratings).toContain(9);
    expect(ratings).toContain(5);
  });

  it('missing date → 400', async () => {
    const { agent, itemId } = await setup();
    const res = await agent.post(`/api/v1/items/${itemId}/sessions`).send({ rating: 7 });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });

  it('rating out of range → 400', async () => {
    const { agent, itemId } = await setup();
    const res = await agent.post(`/api/v1/items/${itemId}/sessions`)
      .send({ date: '2026-11-01', rating: 11 });
    expect(res.status).toBe(400);
  });

  it('unknown item → 404', async () => {
    const { agent } = await setup();
    const res = await agent.post('/api/v1/items/00000000-0000-0000-0000-000000000000/sessions')
      .send({ date: '2026-11-01' });
    expect(res.status).toBe(404);
  });

  it('ADD-06: other user item → 404', async () => {
    const { db, itemId } = await setup();
    const other = request.agent(createApp(db));
    await other.post('/api/v1/auth/register')
      .send({ email: 'other@example.com', password: 'password123', nickname: 'Other' });
    const res = await other.post(`/api/v1/items/${itemId}/sessions`).send({ date: '2026-11-01' });
    expect(res.status).toBe(404);
  });

  it('without session → 401', async () => {
    const { itemId } = await setup();
    const res = await request(createApp(createTestDb()))
      .post(`/api/v1/items/${itemId}/sessions`).send({ date: '2026-11-01' });
    expect(res.status).toBe(401);
  });
});

// ── F-013 List Sessions ───────────────────────────────────────────────────────

describe('GET /api/v1/items/:id/sessions  [REQ-F-013, ADD-04]', () => {
  it('AC-013: sessions sorted newest→oldest, total count correct', async () => {
    const { agent, itemId } = await setup();

    await agent.post(`/api/v1/items/${itemId}/sessions`).send({ date: '2026-10-01' });
    await agent.post(`/api/v1/items/${itemId}/sessions`).send({ date: '2026-11-05' });
    await agent.post(`/api/v1/items/${itemId}/sessions`).send({ date: '2026-11-01' });

    const res = await agent.get(`/api/v1/items/${itemId}/sessions`);
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(3);
    const dates = res.body.sessions.map((s: any) => s.date);
    expect(dates[0]).toBe('2026-11-05'); // newest first
    expect(dates[1]).toBe('2026-11-01');
    expect(dates[2]).toBe('2026-10-01'); // oldest last
  });

  it('AC-013: ADD-04 — ordering is server-side regardless of creation order', async () => {
    const { agent, itemId } = await setup();

    await agent.post(`/api/v1/items/${itemId}/sessions`).send({ date: '2026-09-01' });
    await agent.post(`/api/v1/items/${itemId}/sessions`).send({ date: '2026-11-01' });

    const res = await agent.get(`/api/v1/items/${itemId}/sessions`);
    expect(res.body.sessions[0].date).toBe('2026-11-01');
    expect(res.body.sessions[1].date).toBe('2026-09-01');
  });

  it('no sessions → {sessions: [], total: 0}', async () => {
    const { agent, itemId } = await setup();
    const res = await agent.get(`/api/v1/items/${itemId}/sessions`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ sessions: [], total: 0 });
  });

  it('unknown item → 404', async () => {
    const { agent } = await setup();
    const res = await agent.get('/api/v1/items/00000000-0000-0000-0000-000000000000/sessions');
    expect(res.status).toBe(404);
  });

  it('ADD-06: other user item → 404', async () => {
    const { db, itemId } = await setup();
    const other = request.agent(createApp(db));
    await other.post('/api/v1/auth/register')
      .send({ email: 'other@example.com', password: 'password123', nickname: 'Other' });
    const res = await other.get(`/api/v1/items/${itemId}/sessions`);
    expect(res.status).toBe(404);
  });
});

// ── F-014 Edit / Delete Session ───────────────────────────────────────────────

describe('PATCH /api/v1/items/:id/sessions/:sid  [REQ-F-014]', () => {
  it('AC-014: update date, rating, note → 200 + updated session', async () => {
    const { agent, itemId } = await setup();
    const session = (await agent.post(`/api/v1/items/${itemId}/sessions`)
      .send({ date: '2026-11-01', rating: 9, note: 'First watch' })).body;

    const res = await agent.patch(`/api/v1/items/${itemId}/sessions/${session.id}`)
      .send({ date: '2026-11-02', rating: 7, note: 'Updated note' });

    expect(res.status).toBe(200);
    expect(res.body.date).toBe('2026-11-02');
    expect(res.body.rating).toBe(7);
    expect(res.body.note).toBe('Updated note');
  });

  it('AC-014: partial update — untouched fields remain', async () => {
    const { agent, itemId } = await setup();
    const session = (await agent.post(`/api/v1/items/${itemId}/sessions`)
      .send({ date: '2026-11-01', rating: 9, note: 'Keep this' })).body;

    const res = await agent.patch(`/api/v1/items/${itemId}/sessions/${session.id}`)
      .send({ rating: 6 });
    expect(res.status).toBe(200);
    expect(res.body.note).toBe('Keep this');
    expect(res.body.rating).toBe(6);
  });

  it('unknown session → 404', async () => {
    const { agent, itemId } = await setup();
    const res = await agent.patch(
      `/api/v1/items/${itemId}/sessions/00000000-0000-0000-0000-000000000000`,
    ).send({ rating: 5 });
    expect(res.status).toBe(404);
  });

  it('ADD-06: other user → 404', async () => {
    const { db, agent, itemId } = await setup();
    const session = (await agent.post(`/api/v1/items/${itemId}/sessions`)
      .send({ date: '2026-11-01' })).body;

    const other = request.agent(createApp(db));
    await other.post('/api/v1/auth/register')
      .send({ email: 'other@example.com', password: 'password123', nickname: 'Other' });
    const res = await other.patch(`/api/v1/items/${itemId}/sessions/${session.id}`)
      .send({ rating: 1 });
    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/v1/items/:id/sessions/:sid  [REQ-F-014]', () => {
  it('AC-014: delete → 204, session disappears, total decreases', async () => {
    const { agent, itemId } = await setup();
    const s1 = (await agent.post(`/api/v1/items/${itemId}/sessions`).send({ date: '2026-11-01' })).body;
    await agent.post(`/api/v1/items/${itemId}/sessions`).send({ date: '2026-11-02' });

    const del = await agent.delete(`/api/v1/items/${itemId}/sessions/${s1.id}`);
    expect(del.status).toBe(204);

    const list = await agent.get(`/api/v1/items/${itemId}/sessions`);
    expect(list.body.total).toBe(1);
    const ids = list.body.sessions.map((s: any) => s.id);
    expect(ids).not.toContain(s1.id);
  });

  it('unknown session → 404', async () => {
    const { agent, itemId } = await setup();
    const res = await agent.delete(
      `/api/v1/items/${itemId}/sessions/00000000-0000-0000-0000-000000000000`,
    );
    expect(res.status).toBe(404);
  });
});

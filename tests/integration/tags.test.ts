/**
 * Integration tests — Tags
 * REQ-F-010 (AC-010): tag autocomplete list via GET /tags
 */
import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import Database from 'better-sqlite3';
import { createApp } from '../../src/app';
import { createTestDb } from '../../src/db';

describe('GET /api/v1/tags  [REQ-F-010]', () => {
  let db: Database.Database;
  let agent: ReturnType<typeof request.agent>;

  beforeEach(async () => {
    db = createTestDb();
    agent = request.agent(createApp(db));
    await agent.post('/api/v1/auth/register')
      .send({ email: 'user@example.com', password: 'password123', nickname: 'User' });
  });

  it('AC-010: returns sorted deduplicated tag list', async () => {
    await agent.post('/api/v1/items').send({ title: 'A', type: 'book', tags: ['fantasy', 'sci-fi'] });
    await agent.post('/api/v1/items').send({ title: 'B', type: 'film', tags: ['drama', 'fantasy'] });

    const res = await agent.get('/api/v1/tags');
    expect(res.status).toBe(200);
    expect(res.body).toEqual(['drama', 'fantasy', 'sci-fi']); // sorted, deduplicated
  });

  it('AC-010: no items → empty array', async () => {
    const res = await agent.get('/api/v1/tags');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('AC-010: items without tags → empty array', async () => {
    await agent.post('/api/v1/items').send({ title: 'NoTags', type: 'book' });
    const res = await agent.get('/api/v1/tags');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('isolation: user sees only their own tags', async () => {
    await agent.post('/api/v1/items').send({ title: 'Item', type: 'book', tags: ['mytag'] });

    const otherAgent = request.agent(createApp(db));
    await otherAgent.post('/api/v1/auth/register')
      .send({ email: 'other@example.com', password: 'password123', nickname: 'Other' });
    const res = await otherAgent.get('/api/v1/tags');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('without session → 401', async () => {
    const res = await request(createApp(createTestDb())).get('/api/v1/tags');
    expect(res.status).toBe(401);
  });
});

/**
 * Integration tests — Catalog Core
 * REQ-F-004 (AC-004), REQ-F-007 (AC-007), REQ-F-008 (AC-008),
 * REQ-F-009 (AC-009), REQ-F-025 (AC-025), REQ-F-028 (AC-028)
 * REQ-NF-002 (ADD-06): foreign item → 404
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { mkdtempSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import path from 'path';
import Database from 'better-sqlite3';
import { createApp } from '../../src/app';
import { createTestDb } from '../../src/db';

let uploadDir: string;

beforeAll(() => {
  uploadDir = mkdtempSync(path.join(tmpdir(), 'media-tracker-covers-'));
});
afterAll(() => {
  rmSync(uploadDir, { recursive: true, force: true });
});

function buildApp(db: Database.Database) {
  return createApp(db, { uploadDir });
}

async function registerAndLogin(app: express.Application) {
  const agent = request.agent(app);
  await agent.post('/api/v1/auth/register')
    .send({ email: 'user@example.com', password: 'password123', nickname: 'TestUser' });
  return agent;
}

async function registerAndLoginAs(app: express.Application, email: string) {
  const agent = request.agent(app);
  await agent.post('/api/v1/auth/register')
    .send({ email, password: 'password123', nickname: 'OtherUser' });
  return agent;
}

// ── F-007 Create ──────────────────────────────────────────────────────────────

describe('POST /api/v1/items  [REQ-F-007]', () => {
  let db: Database.Database;
  let agent: ReturnType<typeof request.agent>;

  beforeEach(async () => {
    db = createTestDb();
    agent = await registerAndLogin(buildApp(db));
  });

  it('AC-007 positive: title+type → 201 + item with coverUrl=null', async () => {
    const res = await agent.post('/api/v1/items')
      .send({ title: 'Dune', type: 'book' });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      id: expect.any(String),
      title: 'Dune',
      type: 'book',
      status: 'planned',
      tags: [],
      coverUrl: null,
      createdAt: expect.any(String),
    });
  });

  it('AC-007: type-specific fields (book: author, pages)', async () => {
    const res = await agent.post('/api/v1/items')
      .send({ title: 'Book', type: 'book', author: 'Frank Herbert', pages: 412 });

    expect(res.status).toBe(201);
    expect(res.body.author).toBe('Frank Herbert');
    expect(res.body.pages).toBe(412);
  });

  it('AC-007: type-specific fields (film: director, duration)', async () => {
    const res = await agent.post('/api/v1/items')
      .send({ title: 'Interstellar', type: 'film', director: 'Nolan', duration: 169 });

    expect(res.status).toBe(201);
    expect(res.body.director).toBe('Nolan');
    expect(res.body.duration).toBe(169);
  });

  it('AC-007: type-specific fields (series: seasons)', async () => {
    const res = await agent.post('/api/v1/items')
      .send({ title: 'Breaking Bad', type: 'series', seasons: 5 });

    expect(res.status).toBe(201);
    expect(res.body.seasons).toBe(5);
  });

  it('missing title → 400 VALIDATION_ERROR', async () => {
    const res = await agent.post('/api/v1/items').send({ type: 'book' });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });

  it('empty title → 400 VALIDATION_ERROR (minLength:1)', async () => {
    const res = await agent.post('/api/v1/items').send({ title: '', type: 'book' });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });

  it('invalid type → 400 VALIDATION_ERROR', async () => {
    const res = await agent.post('/api/v1/items').send({ title: 'X', type: 'comic' });
    expect(res.status).toBe(400);
  });

  it('invalid status → 400 VALIDATION_ERROR', async () => {
    const res = await agent.post('/api/v1/items').send({ title: 'X', type: 'book', status: 'done' });
    expect(res.status).toBe(400);
  });

  it('rating out of range → 400 VALIDATION_ERROR', async () => {
    const res = await agent.post('/api/v1/items').send({ title: 'X', type: 'book', rating: 11 });
    expect(res.status).toBe(400);
  });

  it('without session → 401', async () => {
    const app = buildApp(createTestDb());
    const res = await request(app).post('/api/v1/items').send({ title: 'X', type: 'book' });
    expect(res.status).toBe(401);
  });
});

// ── F-004 List ────────────────────────────────────────────────────────────────

describe('GET /api/v1/items  [REQ-F-004]', () => {
  let db: Database.Database;
  let agent: ReturnType<typeof request.agent>;

  beforeEach(async () => {
    db = createTestDb();
    agent = await registerAndLogin(buildApp(db));
  });

  it('AC-004: returns all items for current user', async () => {
    await agent.post('/api/v1/items').send({ title: 'Item A', type: 'book' });
    await agent.post('/api/v1/items').send({ title: 'Item B', type: 'film' });

    const res = await agent.get('/api/v1/items');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(2);
    expect(res.body[0]).toMatchObject({ title: expect.any(String), type: expect.any(String), status: expect.any(String) });
  });

  it('AC-004: empty catalog → empty array', async () => {
    const res = await agent.get('/api/v1/items');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('isolation: user sees only their own items', async () => {
    const app = buildApp(db);
    await agent.post('/api/v1/items').send({ title: 'My Item', type: 'book' });

    const other = await registerAndLoginAs(app, 'other@example.com');
    const res = await other.get('/api/v1/items');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(0);
  });

  it('without session → 401', async () => {
    const app = buildApp(createTestDb());
    const res = await request(app).get('/api/v1/items');
    expect(res.status).toBe(401);
  });
});

// ── F-008 Get / Edit ──────────────────────────────────────────────────────────

describe('GET /api/v1/items/:id  [REQ-F-008]', () => {
  let db: Database.Database;
  let agent: ReturnType<typeof request.agent>;

  beforeEach(async () => {
    db = createTestDb();
    agent = await registerAndLogin(buildApp(db));
  });

  it('AC-008: returns item by id', async () => {
    const created = (await agent.post('/api/v1/items').send({ title: 'Dune', type: 'book' })).body;
    const res = await agent.get(`/api/v1/items/${created.id}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(created.id);
    expect(res.body.title).toBe('Dune');
  });

  it('unknown id → 404', async () => {
    const res = await agent.get('/api/v1/items/00000000-0000-0000-0000-000000000000');
    expect(res.status).toBe(404);
  });

  it('ADD-06 / NF-002: other user item → 404', async () => {
    const app = buildApp(db);
    const created = (await agent.post('/api/v1/items').send({ title: 'Secret', type: 'book' })).body;

    const other = await registerAndLoginAs(app, 'other@example.com');
    const res = await other.get(`/api/v1/items/${created.id}`);
    expect(res.status).toBe(404);
  });
});

describe('PATCH /api/v1/items/:id  [REQ-F-008]', () => {
  let db: Database.Database;
  let agent: ReturnType<typeof request.agent>;

  beforeEach(async () => {
    db = createTestDb();
    agent = await registerAndLogin(buildApp(db));
  });

  it('AC-008: update title and rating → 200 + updated item', async () => {
    const created = (await agent.post('/api/v1/items').send({ title: 'Dune', type: 'book' })).body;
    const res = await agent.patch(`/api/v1/items/${created.id}`)
      .send({ title: 'Dune Updated', rating: 9 });

    expect(res.status).toBe(200);
    expect(res.body.title).toBe('Dune Updated');
    expect(res.body.rating).toBe(9);
  });

  it('AC-008: partial update — untouched fields remain', async () => {
    const created = (await agent.post('/api/v1/items')
      .send({ title: 'Dune', type: 'book', rating: 7 })).body;

    const res = await agent.patch(`/api/v1/items/${created.id}`).send({ rating: 8 });
    expect(res.status).toBe(200);
    expect(res.body.title).toBe('Dune');
    expect(res.body.rating).toBe(8);
  });

  it('update tags → tags replaced', async () => {
    const created = (await agent.post('/api/v1/items')
      .send({ title: 'Book', type: 'book', tags: ['a', 'b'] })).body;

    const res = await agent.patch(`/api/v1/items/${created.id}`).send({ tags: ['c'] });
    expect(res.status).toBe(200);
    expect(res.body.tags).toEqual(['c']);
  });

  it('AC-010: tags stored after POST, appear in GET response', async () => {
    const created = (await agent.post('/api/v1/items')
      .send({ title: 'Tagged Book', type: 'book', tags: ['fantasy', 'sci-fi'] })).body;

    expect(created.tags).toEqual(['fantasy', 'sci-fi']);

    const fetched = (await agent.get(`/api/v1/items/${created.id}`)).body;
    expect(fetched.tags).toEqual(['fantasy', 'sci-fi']);
  });

  it('AC-010: removing a tag via PATCH does not affect other attributes', async () => {
    const created = (await agent.post('/api/v1/items')
      .send({ title: 'Multi Tag', type: 'book', rating: 8, notes: 'keep', tags: ['a', 'b', 'c'] })).body;

    const res = await agent.patch(`/api/v1/items/${created.id}`).send({ tags: ['a'] });
    expect(res.status).toBe(200);
    expect(res.body.tags).toEqual(['a']);
    // Other attributes unchanged
    expect(res.body.title).toBe('Multi Tag');
    expect(res.body.rating).toBe(8);
    expect(res.body.notes).toBe('keep');
  });

  it('empty title → 400', async () => {
    const created = (await agent.post('/api/v1/items').send({ title: 'X', type: 'book' })).body;
    const res = await agent.patch(`/api/v1/items/${created.id}`).send({ title: '' });
    expect(res.status).toBe(400);
  });

  it('unknown id → 404', async () => {
    const res = await agent.patch('/api/v1/items/00000000-0000-0000-0000-000000000000')
      .send({ title: 'X' });
    expect(res.status).toBe(404);
  });

  it('ADD-06: other user item → 404', async () => {
    const app = buildApp(db);
    const created = (await agent.post('/api/v1/items').send({ title: 'Mine', type: 'book' })).body;
    const other = await registerAndLoginAs(app, 'other@example.com');
    const res = await other.patch(`/api/v1/items/${created.id}`).send({ title: 'Hijacked' });
    expect(res.status).toBe(404);
  });
});

// ── F-009 Delete ──────────────────────────────────────────────────────────────

describe('DELETE /api/v1/items/:id  [REQ-F-009]', () => {
  let db: Database.Database;
  let agent: ReturnType<typeof request.agent>;

  beforeEach(async () => {
    db = createTestDb();
    agent = await registerAndLogin(buildApp(db));
  });

  it('AC-009: delete → 204, item no longer in catalog', async () => {
    const created = (await agent.post('/api/v1/items').send({ title: 'Dune', type: 'book' })).body;
    const del = await agent.delete(`/api/v1/items/${created.id}`);
    expect(del.status).toBe(204);

    const get = await agent.get(`/api/v1/items/${created.id}`);
    expect(get.status).toBe(404);
  });

  it('AC-009: cascade — item removed from collection_items in DB', async () => {
    const created = (await agent.post('/api/v1/items').send({ title: 'Cascaded', type: 'book' })).body;

    const collId = '11111111-1111-1111-1111-111111111111';
    const userId = db.prepare('SELECT id FROM users LIMIT 1').get() as { id: string };
    db.prepare('INSERT INTO collections (id, user_id, name) VALUES (?, ?, ?)').run(collId, userId.id, 'TestColl');
    db.prepare('INSERT INTO collection_items (collection_id, item_id) VALUES (?, ?)').run(collId, created.id);

    const before = db.prepare('SELECT * FROM collection_items WHERE item_id = ?').all(created.id);
    expect(before).toHaveLength(1);

    await agent.delete(`/api/v1/items/${created.id}`);

    const after = db.prepare('SELECT * FROM collection_items WHERE item_id = ?').all(created.id);
    expect(after).toHaveLength(0);
  });

  it('unknown id → 404', async () => {
    const res = await agent.delete('/api/v1/items/00000000-0000-0000-0000-000000000000');
    expect(res.status).toBe(404);
  });

  it('ADD-06: other user item → 404', async () => {
    const app = buildApp(db);
    const created = (await agent.post('/api/v1/items').send({ title: 'Mine', type: 'book' })).body;
    const other = await registerAndLoginAs(app, 'other@example.com');
    const res = await other.delete(`/api/v1/items/${created.id}`);
    expect(res.status).toBe(404);
  });
});

// ── F-025 / F-028 Cover ───────────────────────────────────────────────────────

describe('POST /api/v1/items/:id/cover  [REQ-F-025, REQ-F-028]', () => {
  let db: Database.Database;
  let agent: ReturnType<typeof request.agent>;
  let itemId: string;

  beforeEach(async () => {
    db = createTestDb();
    agent = await registerAndLogin(buildApp(db));
    const item = (await agent.post('/api/v1/items').send({ title: 'Cover Test', type: 'film' })).body;
    itemId = item.id;
  });

  it('AC-025: upload valid JPEG → 200, coverUrl set', async () => {
    const res = await agent.post(`/api/v1/items/${itemId}/cover`)
      .attach('file', Buffer.from('fake-image-data'), { filename: 'cover.jpg', contentType: 'image/jpeg' });

    expect(res.status).toBe(200);
    expect(typeof res.body.coverUrl).toBe('string');
    expect(res.body.coverUrl).toMatch(/^\/uploads\//);
  });

  it('AC-025: coverUrl is persisted on item', async () => {
    await agent.post(`/api/v1/items/${itemId}/cover`)
      .attach('file', Buffer.from('img'), { filename: 'c.jpg', contentType: 'image/jpeg' });

    const item = (await agent.get(`/api/v1/items/${itemId}`)).body;
    expect(item.coverUrl).toMatch(/^\/uploads\//);
  });

  it('AC-028: unsupported format (PDF) → 400 VALIDATION_ERROR', async () => {
    const res = await agent.post(`/api/v1/items/${itemId}/cover`)
      .attach('file', Buffer.from('pdf'), { filename: 'doc.pdf', contentType: 'application/pdf' });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });

  it('AC-028: file > 5MB → 400 VALIDATION_ERROR', async () => {
    const bigBuffer = Buffer.alloc(6 * 1024 * 1024);
    const res = await agent.post(`/api/v1/items/${itemId}/cover`)
      .attach('file', bigBuffer, { filename: 'big.jpg', contentType: 'image/jpeg' });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });

  it('no file attached → 400', async () => {
    const res = await agent.post(`/api/v1/items/${itemId}/cover`);
    expect(res.status).toBe(400);
  });

  it('unknown item → 404', async () => {
    const res = await agent.post('/api/v1/items/00000000-0000-0000-0000-000000000000/cover')
      .attach('file', Buffer.from('img'), { filename: 'c.jpg', contentType: 'image/jpeg' });
    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/v1/items/:id/cover  [REQ-F-025]', () => {
  let db: Database.Database;
  let agent: ReturnType<typeof request.agent>;
  let itemId: string;

  beforeEach(async () => {
    db = createTestDb();
    agent = await registerAndLogin(buildApp(db));
    const item = (await agent.post('/api/v1/items').send({ title: 'Cover Del', type: 'book' })).body;
    itemId = item.id;
    await agent.post(`/api/v1/items/${itemId}/cover`)
      .attach('file', Buffer.from('img'), { filename: 'c.jpg', contentType: 'image/jpeg' });
  });

  it('AC-025: delete cover → 204, coverUrl back to null', async () => {
    const del = await agent.delete(`/api/v1/items/${itemId}/cover`);
    expect(del.status).toBe(204);

    const item = (await agent.get(`/api/v1/items/${itemId}`)).body;
    expect(item.coverUrl).toBeNull();
  });

  it('unknown item → 404', async () => {
    const res = await agent.delete('/api/v1/items/00000000-0000-0000-0000-000000000000/cover');
    expect(res.status).toBe(404);
  });
});

import express from 'express';

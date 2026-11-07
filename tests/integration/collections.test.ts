/**
 * Integration tests — Collections
 * REQ-F-015 (AC-015), REQ-F-016 (AC-016), REQ-F-017 (AC-017),
 * REQ-F-018 (AC-018), REQ-F-019 (AC-019), REQ-F-020 (AC-020)
 * ADD-03: 409 ITEM_ALREADY_IN_COLLECTION
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
  return { db, agent };
}

async function createItem(agent: ReturnType<typeof request.agent>, title = 'Item A') {
  return (await agent.post('/api/v1/items').send({ title, type: 'book' })).body;
}

async function createCollection(agent: ReturnType<typeof request.agent>, name = 'My Collection') {
  return (await agent.post('/api/v1/collections').send({ name })).body;
}

// ── F-016 Create ──────────────────────────────────────────────────────────────

describe('POST /api/v1/collections  [REQ-F-016]', () => {
  it('AC-016: create → 201 + collection in list', async () => {
    const { agent } = await setup();
    const res = await agent.post('/api/v1/collections').send({ name: 'Favourites' });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ id: expect.any(String), name: 'Favourites' });

    const list = await agent.get('/api/v1/collections');
    expect(list.body.map((c: any) => c.name)).toContain('Favourites');
  });

  it('empty name → 400 (minLength:1)', async () => {
    const { agent } = await setup();
    const res = await agent.post('/api/v1/collections').send({ name: '' });
    expect(res.status).toBe(400);
  });

  it('without session → 401', async () => {
    const res = await request(createApp(createTestDb())).post('/api/v1/collections').send({ name: 'X' });
    expect(res.status).toBe(401);
  });
});

// ── F-020 List / Get ──────────────────────────────────────────────────────────

describe('GET /api/v1/collections  [REQ-F-020]', () => {
  it('AC-020: empty → []', async () => {
    const { agent } = await setup();
    const res = await agent.get('/api/v1/collections');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('AC-020: returns own collections only', async () => {
    const { db, agent } = await setup();
    await agent.post('/api/v1/collections').send({ name: 'Mine' });

    const other = request.agent(createApp(db));
    await other.post('/api/v1/auth/register')
      .send({ email: 'other@example.com', password: 'password123', nickname: 'Other' });
    const res = await other.get('/api/v1/collections');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(0);
  });
});

describe('GET /api/v1/collections/:id  [REQ-F-020]', () => {
  it('AC-020: returns collection with items (title, type, status)', async () => {
    const { agent } = await setup();
    const col = await createCollection(agent);
    const item = await createItem(agent);
    await agent.post(`/api/v1/collections/${col.id}/items`).send({ itemId: item.id });

    const res = await agent.get(`/api/v1/collections/${col.id}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(col.id);
    expect(res.body.items).toHaveLength(1);
    expect(res.body.items[0]).toMatchObject({
      id: item.id,
      title: 'Item A',
      type: 'book',
      status: 'planned',
    });
  });

  it('unknown id → 404', async () => {
    const { agent } = await setup();
    const res = await agent.get('/api/v1/collections/00000000-0000-0000-0000-000000000000');
    expect(res.status).toBe(404);
  });

  it('ADD-06: other user collection → 404', async () => {
    const { db, agent } = await setup();
    const col = await createCollection(agent);

    const other = request.agent(createApp(db));
    await other.post('/api/v1/auth/register')
      .send({ email: 'other@example.com', password: 'password123', nickname: 'Other' });
    const res = await other.get(`/api/v1/collections/${col.id}`);
    expect(res.status).toBe(404);
  });
});

// ── F-017 Rename ──────────────────────────────────────────────────────────────

describe('PATCH /api/v1/collections/:id  [REQ-F-017]', () => {
  it('AC-017: rename → 200 + updated name', async () => {
    const { agent } = await setup();
    const col = await createCollection(agent, 'Old Name');
    const res = await agent.patch(`/api/v1/collections/${col.id}`).send({ name: 'New Name' });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe('New Name');
  });

  it('empty name → 400', async () => {
    const { agent } = await setup();
    const col = await createCollection(agent);
    const res = await agent.patch(`/api/v1/collections/${col.id}`).send({ name: '' });
    expect(res.status).toBe(400);
  });

  it('unknown id → 404', async () => {
    const { agent } = await setup();
    const res = await agent.patch('/api/v1/collections/00000000-0000-0000-0000-000000000000')
      .send({ name: 'X' });
    expect(res.status).toBe(404);
  });
});

// ── F-018 Delete Collection ───────────────────────────────────────────────────

describe('DELETE /api/v1/collections/:id  [REQ-F-018]', () => {
  it('AC-018: delete collection → 204, items still in catalog', async () => {
    const { agent } = await setup();
    const col = await createCollection(agent);
    const item = await createItem(agent);
    await agent.post(`/api/v1/collections/${col.id}/items`).send({ itemId: item.id });

    const del = await agent.delete(`/api/v1/collections/${col.id}`);
    expect(del.status).toBe(204);

    // collection gone
    const list = await agent.get('/api/v1/collections');
    expect(list.body.map((c: any) => c.id)).not.toContain(col.id);

    // item still in catalog
    const itemCheck = await agent.get(`/api/v1/items/${item.id}`);
    expect(itemCheck.status).toBe(200);
  });

  it('unknown id → 404', async () => {
    const { agent } = await setup();
    const res = await agent.delete('/api/v1/collections/00000000-0000-0000-0000-000000000000');
    expect(res.status).toBe(404);
  });
});

// ── F-015 Add Item ────────────────────────────────────────────────────────────

describe('POST /api/v1/collections/:id/items  [REQ-F-015]', () => {
  it('AC-015: item can be in multiple collections simultaneously', async () => {
    const { agent } = await setup();
    const col1 = await createCollection(agent, 'Favourites');
    const col2 = await createCollection(agent, '2026');
    const item = await createItem(agent, 'Book Y');

    await agent.post(`/api/v1/collections/${col1.id}/items`).send({ itemId: item.id });
    await agent.post(`/api/v1/collections/${col2.id}/items`).send({ itemId: item.id });

    const r1 = await agent.get(`/api/v1/collections/${col1.id}`);
    const r2 = await agent.get(`/api/v1/collections/${col2.id}`);
    expect(r1.body.items.map((i: any) => i.id)).toContain(item.id);
    expect(r2.body.items.map((i: any) => i.id)).toContain(item.id);
  });

  it('ADD-03: duplicate → 409 ITEM_ALREADY_IN_COLLECTION', async () => {
    const { agent } = await setup();
    const col = await createCollection(agent);
    const item = await createItem(agent);
    await agent.post(`/api/v1/collections/${col.id}/items`).send({ itemId: item.id });

    const res = await agent.post(`/api/v1/collections/${col.id}/items`).send({ itemId: item.id });
    expect(res.status).toBe(409);
    expect(res.body.code).toBe('ITEM_ALREADY_IN_COLLECTION');
  });

  it('unknown collection → 404', async () => {
    const { agent } = await setup();
    const item = await createItem(agent);
    const res = await agent.post('/api/v1/collections/00000000-0000-0000-0000-000000000000/items')
      .send({ itemId: item.id });
    expect(res.status).toBe(404);
  });

  it('unknown item → 404', async () => {
    const { agent } = await setup();
    const col = await createCollection(agent);
    const res = await agent.post(`/api/v1/collections/${col.id}/items`)
      .send({ itemId: '00000000-0000-0000-0000-000000000000' });
    expect(res.status).toBe(404);
  });

  it('invalid itemId (not uuid) → 400', async () => {
    const { agent } = await setup();
    const col = await createCollection(agent);
    const res = await agent.post(`/api/v1/collections/${col.id}/items`).send({ itemId: 'notauuid' });
    expect(res.status).toBe(400);
  });
});

// ── F-019 Remove Item ─────────────────────────────────────────────────────────

describe('DELETE /api/v1/collections/:id/items/:itemId  [REQ-F-019]', () => {
  it('AC-019: remove from collection — item stays in catalog + other collections', async () => {
    const { agent } = await setup();
    const col1 = await createCollection(agent, 'Favourites');
    const col2 = await createCollection(agent, '2026');
    const item = await createItem(agent, 'Book Y');
    await agent.post(`/api/v1/collections/${col1.id}/items`).send({ itemId: item.id });
    await agent.post(`/api/v1/collections/${col2.id}/items`).send({ itemId: item.id });

    const del = await agent.delete(`/api/v1/collections/${col2.id}/items/${item.id}`);
    expect(del.status).toBe(204);

    // still in col1
    const r1 = await agent.get(`/api/v1/collections/${col1.id}`);
    expect(r1.body.items.map((i: any) => i.id)).toContain(item.id);

    // not in col2
    const r2 = await agent.get(`/api/v1/collections/${col2.id}`);
    expect(r2.body.items.map((i: any) => i.id)).not.toContain(item.id);

    // still in catalog
    const itemCheck = await agent.get(`/api/v1/items/${item.id}`);
    expect(itemCheck.status).toBe(200);
  });

  it('unknown collection/item → 404', async () => {
    const { agent } = await setup();
    const col = await createCollection(agent);
    const res = await agent.delete(
      `/api/v1/collections/${col.id}/items/00000000-0000-0000-0000-000000000000`,
    );
    expect(res.status).toBe(404);
  });
});

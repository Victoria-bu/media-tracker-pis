/**
 * Integration tests — User profile
 * REQ-F-029 (AC-029), REQ-NF-006 (AC-031), REQ-NF-002 (AC-035)
 */
import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import Database from 'better-sqlite3';
import { createApp } from '../../src/app';
import { createTestDb } from '../../src/db';

describe('PATCH /api/v1/users/me  [REQ-F-029]', () => {
  let db: Database.Database;
  let agent: ReturnType<typeof request.agent>;

  beforeEach(async () => {
    db = createTestDb();
    const app = createApp(db);
    agent = request.agent(app);
    await agent
      .post('/api/v1/auth/register')
      .send({ email: 'user@example.com', password: 'password123', nickname: 'OriginalName' });
  });

  it('AC-029 positive: change nickname → 200 + updated user (no password_hash)', async () => {
    const res = await agent.patch('/api/v1/users/me').send({ nickname: 'NewNickname' });

    expect(res.status).toBe(200);
    expect(res.body.nickname).toBe('NewNickname');
    expect(res.body.email).toBe('user@example.com');
    expect(res.body.password_hash).toBeUndefined();
  });

  it('AC-031 / NF-006: nickname 1 char → 400, field=nickname', async () => {
    const res = await agent.patch('/api/v1/users/me').send({ nickname: 'A' });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
    expect(res.body.field).toBe('nickname');
  });

  it('AC-031 / NF-006: nickname 51 chars → 400, field=nickname', async () => {
    const res = await agent.patch('/api/v1/users/me').send({ nickname: 'A'.repeat(51) });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
    expect(res.body.field).toBe('nickname');
  });

  it('boundary: nickname 2 chars → 200', async () => {
    const res = await agent.patch('/api/v1/users/me').send({ nickname: 'AB' });
    expect(res.status).toBe(200);
    expect(res.body.nickname).toBe('AB');
  });

  it('boundary: nickname 50 chars → 200', async () => {
    const res = await agent.patch('/api/v1/users/me').send({ nickname: 'A'.repeat(50) });
    expect(res.status).toBe(200);
  });

  it('AC-035 / NF-002: without session → 401 UNAUTHORIZED', async () => {
    const freshApp = createApp(createTestDb());
    const res = await request(freshApp)
      .patch('/api/v1/users/me')
      .send({ nickname: 'NoSession' });

    expect(res.status).toBe(401);
    expect(res.body.code).toBe('UNAUTHORIZED');
  });

  it('missing nickname field → 400', async () => {
    const res = await agent.patch('/api/v1/users/me').send({});
    expect(res.status).toBe(400);
  });
});

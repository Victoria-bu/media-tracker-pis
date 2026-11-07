/**
 * Integration tests — Authentication & Account
 * REQ-F-001 (AC-001), REQ-F-002 (AC-002), REQ-F-003 (AC-003)
 * REQ-NF-002 (AC-035), REQ-NF-006 (AC-031), REQ-NF-007 (AC-039)
 */
import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import Database from 'better-sqlite3';
import { createApp } from '../../src/app';
import { createTestDb } from '../../src/db';

// ── F-001 Registration ────────────────────────────────────────────────────────

describe('POST /api/v1/auth/register  [REQ-F-001]', () => {
  let db: Database.Database;
  let app: Express.Application;

  beforeEach(() => {
    db = createTestDb();
    app = createApp(db) as Express.Application;
  });

  it('AC-001 positive: valid data → 201 + user object (no password_hash)', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'test@example.com', password: 'password123', nickname: 'TestUser' });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      id: expect.any(String),
      email: 'test@example.com',
      nickname: 'TestUser',
    });
    expect(res.body.password_hash).toBeUndefined();
  });

  it('AC-039 / NF-007: register sets HttpOnly session cookie', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'cookie@example.com', password: 'password123', nickname: 'CookieUser' });

    expect(res.status).toBe(201);
    const setCookie: string[] = res.headers['set-cookie'] ?? [];
    expect(setCookie.length).toBeGreaterThan(0);
    expect(setCookie[0]).toMatch(/HttpOnly/i);
  });

  it('AC-001 negative: duplicate email → 409 EMAIL_TAKEN', async () => {
    await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'dup@example.com', password: 'password123', nickname: 'User1' });

    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'dup@example.com', password: 'pass99999', nickname: 'User2' });

    expect(res.status).toBe(409);
    expect(res.body.code).toBe('EMAIL_TAKEN');
    expect(res.body.field).toBe('email');
  });

  it('AC-031 / NF-006: password < 8 chars → 400, field=password', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'short@example.com', password: 'abc', nickname: 'User' });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
    expect(res.body.field).toBe('password');
  });

  it('AC-031 / NF-006: invalid email format → 400, field=email', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'notanemail', password: 'password123', nickname: 'User' });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
    expect(res.body.field).toBe('email');
  });

  it('AC-031 / NF-006: nickname 1 char (too short) → 400, field=nickname', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'nick@example.com', password: 'password123', nickname: 'A' });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
    expect(res.body.field).toBe('nickname');
  });

  it('AC-031 / NF-006: nickname 51 chars (too long) → 400, field=nickname', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'long@example.com', password: 'password123', nickname: 'A'.repeat(51) });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
    expect(res.body.field).toBe('nickname');
  });

  it('boundary: nickname exactly 2 chars → 201', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'min@example.com', password: 'password123', nickname: 'AB' });
    expect(res.status).toBe(201);
  });

  it('boundary: nickname exactly 50 chars → 201', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'max@example.com', password: 'password123', nickname: 'A'.repeat(50) });
    expect(res.status).toBe(201);
  });

  it('boundary: password exactly 8 chars → 201', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'pwd8@example.com', password: '12345678', nickname: 'PwdUser' });
    expect(res.status).toBe(201);
  });

  it('AC-035 / NF-002: password stored as bcrypt hash, never plain text', async () => {
    await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'bcrypt@example.com', password: 'password123', nickname: 'BcryptUser' });

    const row = db
      .prepare('SELECT password_hash FROM users WHERE email = ?')
      .get('bcrypt@example.com') as { password_hash: string } | undefined;

    expect(row).toBeDefined();
    expect(row!.password_hash).not.toBe('password123');
    expect(row!.password_hash).toMatch(/^\$2[aby]\$/);
  });

  it('missing required fields → 400', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'test@example.com' });
    expect(res.status).toBe(400);
  });
});

// ── F-002 Login ───────────────────────────────────────────────────────────────

describe('POST /api/v1/auth/login  [REQ-F-002]', () => {
  let db: Database.Database;
  let app: Express.Application;

  beforeEach(async () => {
    db = createTestDb();
    app = createApp(db) as Express.Application;
    await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'login@example.com', password: 'password123', nickname: 'LoginUser' });
  });

  it('AC-002 positive: correct credentials → 200 + user object + session cookie', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'login@example.com', password: 'password123' });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ email: 'login@example.com', nickname: 'LoginUser' });
    expect(res.body.password_hash).toBeUndefined();
    expect(res.headers['set-cookie']).toBeDefined();
  });

  it('AC-039 / NF-007: login sets HttpOnly cookie', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'login@example.com', password: 'password123' });

    const setCookie: string[] = res.headers['set-cookie'] ?? [];
    expect(setCookie[0]).toMatch(/HttpOnly/i);
  });

  it('AC-002 negative: wrong password → 401 INVALID_CREDENTIALS', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'login@example.com', password: 'wrongpassword' });

    expect(res.status).toBe(401);
    expect(res.body.code).toBe('INVALID_CREDENTIALS');
  });

  it('AC-002 negative: unknown email → 401 INVALID_CREDENTIALS', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'nobody@example.com', password: 'password123' });

    expect(res.status).toBe(401);
    expect(res.body.code).toBe('INVALID_CREDENTIALS');
  });

  it('missing email/password → 400', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({});
    expect(res.status).toBe(400);
  });
});

// ── F-003 Logout ──────────────────────────────────────────────────────────────

describe('POST /api/v1/auth/logout  [REQ-F-003]', () => {
  let db: Database.Database;
  let app: Express.Application;

  beforeEach(async () => {
    db = createTestDb();
    app = createApp(db) as Express.Application;
    await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'logout@example.com', password: 'password123', nickname: 'LogoutUser' });
  });

  it('AC-003 positive: logout with valid session → 204', async () => {
    const agent = request.agent(app);
    await agent
      .post('/api/v1/auth/login')
      .send({ email: 'logout@example.com', password: 'password123' });

    const res = await agent.post('/api/v1/auth/logout');
    expect(res.status).toBe(204);
  });

  it('AC-003: after logout, protected endpoint returns 401', async () => {
    const agent = request.agent(app);
    await agent
      .post('/api/v1/auth/login')
      .send({ email: 'logout@example.com', password: 'password123' });
    await agent.post('/api/v1/auth/logout');

    const res = await agent.patch('/api/v1/users/me').send({ nickname: 'NewName' });
    expect(res.status).toBe(401);
  });

  it('AC-035 / NF-002: protected endpoint without session → 401 UNAUTHORIZED', async () => {
    const freshApp = createApp(createTestDb()) as Express.Application;
    const res = await request(freshApp)
      .patch('/api/v1/users/me')
      .send({ nickname: 'NoSession' });

    expect(res.status).toBe(401);
    expect(res.body.code).toBe('UNAUTHORIZED');
  });

  it('logout without session → 401', async () => {
    const freshApp = createApp(createTestDb()) as Express.Application;
    const res = await request(freshApp).post('/api/v1/auth/logout');
    expect(res.status).toBe(401);
  });
});

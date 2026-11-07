# Media Tracker — Personal Media Content Tracking API

REST API for tracking books, TV series, and films. Built as part of the
"Information Systems Design" course (SDD + TDD methodology).

**Specification:** `spec/srs.md` v1.3.0 · **API contract:** `spec/openapi.yaml`

---

## Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 22 LTS |
| Language | TypeScript 5 |
| Framework | Express 4 |
| Validation | Zod |
| Database | SQLite via better-sqlite3 |
| Auth | express-session (HTTP-only cookie) |
| Passwords | bcrypt |
| Logging | pino (JSON to stdout) |
| File uploads | multer (cover images) |
| Testing | Vitest + supertest |

---

## Setup

```bash
npm install
```

---

## Run

```bash
# Development (hot reload)
npm run dev

# Production
npm run build
npm start
```

Default port: `3000`. Configurable via `PORT` env var.

---

## Configuration (environment variables)

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3000` | HTTP port |
| `SESSION_SECRET` | `dev-secret-…` | Cookie signing key — **change in production** |
| `DB_PATH` | `./data/media-tracker.db` | SQLite file path |
| `UPLOAD_DIR` | `./data/covers` | Cover image storage directory |
| `BCRYPT_ROUNDS` | `10` | bcrypt cost factor (1 for tests) |

---

## Tests

```bash
npm test          # run all tests + write log to logs/
npx vitest        # watch mode
npx vitest run    # single run, no log
```

Test results are written to `logs/test-log-*.md` after each run.

### Test isolation

Every integration test creates a fresh **in-memory SQLite database**.
No test writes to `./data/`.

---

## API

Base URL: `/api/v1`  
Auth: HTTP-only session cookie set on `POST /auth/register` and `POST /auth/login`

| Endpoint | Description |
|---|---|
| `POST /auth/register` | Register (email, password, nickname) |
| `POST /auth/login` | Log in |
| `POST /auth/logout` | Log out |
| `PATCH /users/me` | Change nickname |
| `GET /items` | List all catalog items |
| `POST /items` | Add item (title, type required) |
| `GET /items/:id` | Get single item |
| `PATCH /items/:id` | Edit item |
| `DELETE /items/:id` | Delete item (cascades from collections) |
| `POST /items/:id/cover` | Upload cover (JPEG/PNG/WebP, ≤5 MB) |
| `DELETE /items/:id/cover` | Remove custom cover |
| `GET /tags` | Autocomplete tag list |
| `GET /items/:id/sessions` | List sessions (newest first) |
| `POST /items/:id/sessions` | Add session |
| `PATCH /items/:id/sessions/:sid` | Edit session |
| `DELETE /items/:id/sessions/:sid` | Delete session |
| `GET /collections` | List collections |
| `POST /collections` | Create collection |
| `GET /collections/:id` | Collection contents |
| `PATCH /collections/:id` | Rename collection |
| `DELETE /collections/:id` | Delete collection |
| `POST /collections/:id/items` | Add item to collection |
| `DELETE /collections/:id/items/:itemId` | Remove item from collection |
| `GET /stats?period=` | Personal statistics (month / year / all) |

Full contract: `spec/openapi.yaml`

---

## Development logs

| File | Description |
|---|---|
| `logs/gate-foundation.md` | G1 decision (Etapes 1–2) |
| `logs/gate-collections.md` | G2 decision (Etapes 3–4) |
| `logs/test-log-*.md` | Per-stage test run reports |
| `logs/tdd-note-etape1.md` | TDD process notes |
| `docs/plan.md` | Implementation plan and Gantt |
| `docs/api-addendum.md` | API behavior not covered by SRS |

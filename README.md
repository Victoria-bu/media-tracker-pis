# Media Tracker — Personal Media Content Tracking API

REST API for tracking books, TV series, and films.
Built as part of the "Information Systems Design" course (SDD + TDD methodology).

**Repository:** https://github.com/Victoria-bu/media-tracker-pis  
**Specification:** `spec/srs.md` v1.3.0 &nbsp;·&nbsp; **API contract:** `spec/openapi.yaml`

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
| Logging | pino (structured JSON to stdout) |
| File uploads | multer (cover images, ≤5 MB) |
| Testing | Vitest + supertest |
| Linting | ESLint + typescript-eslint |

---

## Setup

```bash
git clone <repo>
cd media-tracker-pis
npm install
```

No external services required. SQLite file is created automatically at first start.

---

## Run

### Development

```bash
npm run dev
```

Starts `tsx watch src/server.ts` — hot reload on every file change.
Session cookie works over plain HTTP (`secure: false` without `NODE_ENV=production`).

> **Important:** do NOT set `NODE_ENV=production` for local development.
> With `secure: true`, express-session will not set the cookie over plain HTTP
> and every protected route returns 401.

### Production

```bash
npm run build        # tsc + copies src/db/migrations/ to dist/db/
NODE_ENV=production npm start
```

Production requires HTTPS so session cookies can be sent as `Secure`.
Default port: `3000` (see `PORT` env var below).

---

## Configuration

All settings are read from environment variables at startup (`src/config/env.ts`).
Every variable has a development default; override in production as needed.

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3000` | HTTP listen port |
| `NODE_ENV` | `development` | `production` enables `secure` cookie |
| `SESSION_SECRET` | `dev-secret-change-in-prod` | Cookie signing key — **must change in production** |
| `DB_PATH` | `./data/media-tracker.db` | SQLite file path (created automatically) |
| `UPLOAD_DIR` | `./data/covers` | Cover image storage directory (created automatically) |
| `BCRYPT_ROUNDS` | `10` | bcrypt cost factor (`1` speeds up tests) |

---

## Tests / Development

```bash
npm test            # Vitest run + write log to logs/test-log-*.md
npm run test:watch  # Vitest watch mode
npm run lint        # ESLint — exits non-zero if any problem found
npm run lint:fix    # ESLint — auto-fix safe violations (import type, etc.)
```

Test isolation: every integration test spins up a **fresh in-memory SQLite database**.
No test reads or writes `./data/`.

> **System logging:** pino writes structured JSON to **stdout** (not to files).
> `logs/test-log-*.md` are written by `scripts/write-test-log.js` after each test run —
> they are hand-readable test reports, not runtime logs.

Test results: `logs/test-log-*.md` (committed after each stage).

---

## Project structure

```
src/
├── server.ts            entry point (getDb → createApp → listen)
├── app.ts               Express setup, middleware, routers
├── config/env.ts        environment variables
├── db/                  SQLite singleton, migrations
│   └── migrations/001_init.sql
├── middleware/          auth guard, error handler, request logger
├── routes/              HTTP handlers (thin layer, one file per domain)
├── services/            business logic (no Express imports)
├── repositories/        raw SQL queries (no business logic)
├── validators/          Zod schemas for all request bodies
├── types/               express-session type extensions
└── utils/               errors factory, replaceable clock
spec/
├── srs.md               requirements, glossary, acceptance criteria
├── openapi.yaml         API contract (source of truth for HTTP contract)
├── addendum-07.md       ADD-07: basis=sessions stats mode
└── traceability-matrix.md
docs/
├── api/index.html       Redocly HTML from openapi.yaml  (open in browser)
├── api/code/            TypeDoc HTML for services + utils
├── architecture.md      layers, DB schema, request flow, logging
├── coding-convention.md coding standards (also docs/coding-convention.html)
└── user-guide.md        curl examples for all main scenarios
logs/
├── lint-report-before.md   53 ESLint violations before fixes
├── lint-report-after.md    clean run (0 problems)
└── test-log-*.md           test run reports
```

---

## API summary

Base URL: `/api/v1`
Auth: HTTP-only session cookie set on login.

| Endpoint | Method | Description |
|---|---|---|
| `/auth/register` | POST | Register (email, password, nickname) |
| `/auth/login` | POST | Log in |
| `/auth/logout` | POST | Log out |
| `/users/me` | PATCH | Change nickname |
| `/items` | GET | List catalog |
| `/items` | POST | Add item |
| `/items/:id` | GET | Get item |
| `/items/:id` | PATCH | Edit item |
| `/items/:id` | DELETE | Delete item (cascades from collections) |
| `/items/:id/cover` | POST | Upload cover (JPEG/PNG/WebP, ≤5 MB) |
| `/items/:id/cover` | DELETE | Remove cover |
| `/tags` | GET | Autocomplete tag list |
| `/items/:id/sessions` | GET / POST | List / add sessions |
| `/items/:id/sessions/:sid` | PATCH / DELETE | Edit / delete session |
| `/collections` | GET / POST | List / create collections |
| `/collections/:id` | GET / PATCH / DELETE | Get / rename / delete collection |
| `/collections/:id/items` | POST | Add item to collection |
| `/collections/:id/items/:itemId` | DELETE | Remove item from collection |
| `/stats` | GET | Statistics (`period`: month/year/all; `basis`: completedAt/sessions) |

Full contract: [`spec/openapi.yaml`](spec/openapi.yaml) · rendered: [`docs/api/index.html`](docs/api/index.html)

---

## Development logs

| File | Description |
|---|---|
| `logs/gate-foundation.md` | G1 decision (Etapes 1–2) |
| `logs/gate-collections.md` | G2 decision (Etapes 3–4) |
| `logs/gate-release.md` | Release gate decision |
| `logs/gate-spec-addendum.md` | Spec addendum gate |
| `logs/api-contract-run.md` | Prism proxy validation results (15 requests) |
| `logs/test-log-*.md` | Per-stage test run reports (written by `scripts/write-test-log.js`) |
| `logs/lint-report-*.md` | ESLint before/after report |
| `docs/plan.md` | Implementation plan |
| `docs/api-addendum.md` | API behavior not covered by SRS |
| `docs/architecture.md` | System architecture reference |
| `spec/addendum-07.md` | ADD-07: basis=sessions stats mode specification |

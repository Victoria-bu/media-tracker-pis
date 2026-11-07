CREATE TABLE IF NOT EXISTS users (
  id          TEXT PRIMARY KEY,
  email       TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  nickname    TEXT NOT NULL CHECK(length(nickname) >= 2 AND length(nickname) <= 50),
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS items (
  id           TEXT PRIMARY KEY,
  user_id      TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title        TEXT NOT NULL CHECK(length(title) >= 1),
  type         TEXT NOT NULL CHECK(type IN ('book', 'series', 'film')),
  status       TEXT NOT NULL DEFAULT 'planned'
                    CHECK(status IN ('planned', 'in_progress', 'completed', 'on_hold')),
  rating       INTEGER CHECK(rating IS NULL OR (rating >= 0 AND rating <= 10)),
  notes        TEXT,
  tags         TEXT NOT NULL DEFAULT '[]',
  cover_url    TEXT,
  completed_at TEXT,
  created_at   TEXT NOT NULL DEFAULT (datetime('now')),
  author       TEXT,
  pages        INTEGER,
  seasons      INTEGER,
  director     TEXT,
  duration     INTEGER
);

CREATE TABLE IF NOT EXISTS sessions (
  id      TEXT PRIMARY KEY,
  item_id TEXT NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  date    TEXT NOT NULL,
  rating  INTEGER CHECK(rating IS NULL OR (rating >= 0 AND rating <= 10)),
  note    TEXT
);

CREATE TABLE IF NOT EXISTS collections (
  id      TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name    TEXT NOT NULL CHECK(length(name) >= 1)
);

CREATE TABLE IF NOT EXISTS collection_items (
  collection_id TEXT NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
  item_id       TEXT NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  PRIMARY KEY (collection_id, item_id)
);

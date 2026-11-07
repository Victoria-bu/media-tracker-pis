import Database from 'better-sqlite3';

export interface DbUser {
  id: string;
  email: string;
  password_hash: string;
  nickname: string;
  created_at: string;
}

export interface ApiUser {
  id: string;
  email: string;
  nickname: string;
}

export function findUserByEmail(db: Database.Database, email: string): DbUser | undefined {
  return db.prepare('SELECT * FROM users WHERE email = ?').get(email) as DbUser | undefined;
}

export function findUserById(db: Database.Database, id: string): DbUser | undefined {
  return db.prepare('SELECT * FROM users WHERE id = ?').get(id) as DbUser | undefined;
}

export function createUser(
  db: Database.Database,
  id: string,
  email: string,
  passwordHash: string,
  nickname: string,
): DbUser {
  db.prepare(
    'INSERT INTO users (id, email, password_hash, nickname) VALUES (?, ?, ?, ?)',
  ).run(id, email, passwordHash, nickname);
  return findUserById(db, id)!;
}

export function updateUserNickname(db: Database.Database, id: string, nickname: string): DbUser {
  db.prepare('UPDATE users SET nickname = ? WHERE id = ?').run(nickname, id);
  return findUserById(db, id)!;
}

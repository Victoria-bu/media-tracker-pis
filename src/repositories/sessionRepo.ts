import Database from 'better-sqlite3';
import { CreateSessionData, UpdateSessionData } from '../validators/sessionValidators';

export interface DbSession {
  id: string;
  item_id: string;
  date: string;
  rating: number | null;
  note: string | null;
}

export function getSessionById(db: Database.Database, id: string): DbSession | undefined {
  return db.prepare('SELECT * FROM sessions WHERE id = ?').get(id) as DbSession | undefined;
}

export function getSessionsByItemId(db: Database.Database, itemId: string): DbSession[] {
  return db
    .prepare('SELECT * FROM sessions WHERE item_id = ? ORDER BY date DESC')
    .all(itemId) as DbSession[];
}

export function createSession(
  db: Database.Database,
  id: string,
  itemId: string,
  data: CreateSessionData,
): DbSession {
  db.prepare(
    'INSERT INTO sessions (id, item_id, date, rating, note) VALUES (?, ?, ?, ?, ?)',
  ).run(id, itemId, data.date, data.rating ?? null, data.note ?? null);
  return getSessionById(db, id)!;
}

export function updateSession(
  db: Database.Database,
  id: string,
  data: UpdateSessionData,
): DbSession {
  const fields: string[] = [];
  const values: unknown[] = [];

  if (data.date !== undefined)   { fields.push('date = ?');   values.push(data.date); }
  if (data.rating !== undefined) { fields.push('rating = ?'); values.push(data.rating); }
  if (data.note !== undefined)   { fields.push('note = ?');   values.push(data.note); }

  if (fields.length > 0) {
    values.push(id);
    db.prepare(`UPDATE sessions SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  }
  return getSessionById(db, id)!;
}

export function deleteSession(db: Database.Database, id: string): void {
  db.prepare('DELETE FROM sessions WHERE id = ?').run(id);
}

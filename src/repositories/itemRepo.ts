import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';
import { CreateItemData, UpdateItemData } from '../validators/itemValidators';

export interface DbItem {
  id: string;
  user_id: string;
  title: string;
  type: 'book' | 'series' | 'film';
  status: 'planned' | 'in_progress' | 'completed' | 'on_hold';
  rating: number | null;
  notes: string | null;
  tags: string;
  cover_url: string | null;
  completed_at: string | null;
  created_at: string;
  author: string | null;
  pages: number | null;
  seasons: number | null;
  director: string | null;
  duration: number | null;
}

export function getItemById(db: Database.Database, id: string): DbItem | undefined {
  return db.prepare('SELECT * FROM items WHERE id = ?').get(id) as DbItem | undefined;
}

export function getUserItems(db: Database.Database, userId: string): DbItem[] {
  return db.prepare('SELECT * FROM items WHERE user_id = ? ORDER BY created_at DESC').all(userId) as DbItem[];
}

export function createItem(
  db: Database.Database,
  id: string,
  userId: string,
  data: CreateItemData,
): DbItem {
  db.prepare(`
    INSERT INTO items
      (id, user_id, title, type, status, rating, notes, tags,
       completed_at, author, pages, seasons, director, duration)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id, userId, data.title, data.type,
    data.status ?? 'planned',
    data.rating ?? null,
    data.notes ?? null,
    JSON.stringify(data.tags ?? []),
    data.completedAt ?? null,
    data.author ?? null,
    data.pages ?? null,
    data.seasons ?? null,
    data.director ?? null,
    data.duration ?? null,
  );
  return getItemById(db, id)!;
}

export function updateItem(
  db: Database.Database,
  id: string,
  data: UpdateItemData,
): DbItem {
  const fields: string[] = [];
  const values: unknown[] = [];

  if (data.title !== undefined)        { fields.push('title = ?');        values.push(data.title); }
  if (data.type !== undefined)         { fields.push('type = ?');         values.push(data.type); }
  if (data.status !== undefined)       { fields.push('status = ?');       values.push(data.status); }
  if (data.rating !== undefined)       { fields.push('rating = ?');       values.push(data.rating); }
  if (data.notes !== undefined)        { fields.push('notes = ?');        values.push(data.notes); }
  if (data.tags !== undefined)         { fields.push('tags = ?');         values.push(JSON.stringify(data.tags)); }
  if (data.completedAt !== undefined)  { fields.push('completed_at = ?'); values.push(data.completedAt); }
  if (data.author !== undefined)       { fields.push('author = ?');       values.push(data.author); }
  if (data.pages !== undefined)        { fields.push('pages = ?');        values.push(data.pages); }
  if (data.seasons !== undefined)      { fields.push('seasons = ?');      values.push(data.seasons); }
  if (data.director !== undefined)     { fields.push('director = ?');     values.push(data.director); }
  if (data.duration !== undefined)     { fields.push('duration = ?');     values.push(data.duration); }

  if (fields.length > 0) {
    values.push(id);
    db.prepare(`UPDATE items SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  }
  return getItemById(db, id)!;
}

export function deleteItem(db: Database.Database, id: string): void {
  db.prepare('DELETE FROM items WHERE id = ?').run(id);
}

export function setCoverUrl(db: Database.Database, id: string, coverUrl: string): void {
  db.prepare('UPDATE items SET cover_url = ? WHERE id = ?').run(coverUrl, id);
}

export function clearCoverUrl(db: Database.Database, id: string): void {
  db.prepare('UPDATE items SET cover_url = NULL WHERE id = ?').run(id);
}

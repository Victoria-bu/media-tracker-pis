import type Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';
import * as sessionRepo from '../repositories/sessionRepo';
import * as itemRepo from '../repositories/itemRepo';
import type { DbSession } from '../repositories/sessionRepo';
import type { CreateSessionData, UpdateSessionData } from '../validators/sessionValidators';
import { notFound } from '../utils/errors';

export type { AppError } from '../utils/errors';

export interface ApiSession {
  id: string;
  itemId: string;
  date: string;
  rating: number | null;
  note: string | null;
}

function toApi(s: DbSession): ApiSession {
  return { id: s.id, itemId: s.item_id, date: s.date, rating: s.rating, note: s.note };
}

function assertItemOwner(db: Database.Database, itemId: string, userId: string): void {
  const item = itemRepo.getItemById(db, itemId);
  if (!item || item.user_id !== userId) throw notFound();
}

function assertSessionOwner(
  db: Database.Database,
  sessionId: string,
  userId: string,
): DbSession {
  const session = sessionRepo.getSessionById(db, sessionId);
  if (!session) throw notFound();
  assertItemOwner(db, session.item_id, userId);
  return session;
}

/**
 * Returns all sessions for a catalog item, sorted by date descending.
 * @param itemId  ID of the parent catalog item.
 * @throws {AppError} 404 NOT_FOUND if the item does not exist or belongs to another user.
 */
export function listSessions(
  db: Database.Database,
  itemId: string,
  userId: string,
): { sessions: ApiSession[]; total: number } {
  assertItemOwner(db, itemId, userId);
  const sessions = sessionRepo.getSessionsByItemId(db, itemId).map(toApi);
  return { sessions, total: sessions.length };
}

/**
 * Records a new viewing/reading session for a catalog item.
 * Each session stores an independent date, rating (0–10) and note.
 * Multiple sessions per item are allowed; they do not affect `item.rating` directly.
 * @throws {AppError} 404 NOT_FOUND if the item does not exist or belongs to another user.
 */
export function createSession(
  db: Database.Database,
  itemId: string,
  userId: string,
  data: CreateSessionData,
): ApiSession {
  assertItemOwner(db, itemId, userId);
  const id = uuidv4();
  return toApi(sessionRepo.createSession(db, id, itemId, data));
}

/**
 * Applies a partial update to an existing session.
 * The `itemId` parameter is verified to match the session's parent item
 * (prevents cross-item session manipulation via URL manipulation).
 * @throws {AppError} 404 NOT_FOUND if the session or item does not exist / belong to user.
 */
export function updateSession(
  db: Database.Database,
  itemId: string,
  sessionId: string,
  userId: string,
  data: UpdateSessionData,
): ApiSession {
  const session = assertSessionOwner(db, sessionId, userId);
  if (session.item_id !== itemId) throw notFound();
  return toApi(sessionRepo.updateSession(db, sessionId, data));
}

/**
 * Permanently deletes a session record.
 * The parent catalog item and other sessions are unaffected.
 * @throws {AppError} 404 NOT_FOUND if the session or item does not exist / belong to user.
 */
export function deleteSession(
  db: Database.Database,
  itemId: string,
  sessionId: string,
  userId: string,
): void {
  const session = assertSessionOwner(db, sessionId, userId);
  if (session.item_id !== itemId) throw notFound();
  sessionRepo.deleteSession(db, sessionId);
}

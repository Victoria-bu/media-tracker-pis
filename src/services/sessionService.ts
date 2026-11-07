import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';
import * as sessionRepo from '../repositories/sessionRepo';
import * as itemRepo from '../repositories/itemRepo';
import { DbSession } from '../repositories/sessionRepo';
import { CreateSessionData, UpdateSessionData } from '../validators/sessionValidators';

export interface ApiSession {
  id: string;
  itemId: string;
  date: string;
  rating: number | null;
  note: string | null;
}

export interface AppError extends Error {
  code: string;
  status: number;
}

function toApi(s: DbSession): ApiSession {
  return { id: s.id, itemId: s.item_id, date: s.date, rating: s.rating, note: s.note };
}

function notFound(): AppError {
  const err = new Error('Resource not found') as AppError;
  err.code = 'NOT_FOUND';
  err.status = 404;
  return err;
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

export function listSessions(
  db: Database.Database,
  itemId: string,
  userId: string,
): { sessions: ApiSession[]; total: number } {
  assertItemOwner(db, itemId, userId);
  const sessions = sessionRepo.getSessionsByItemId(db, itemId).map(toApi);
  return { sessions, total: sessions.length };
}

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

import Database from 'better-sqlite3';
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

export function listSessions(
  _db: Database.Database,
  _itemId: string,
  _userId: string,
): { sessions: ApiSession[]; total: number } {
  throw new Error('Not implemented');
}

export function createSession(
  _db: Database.Database,
  _itemId: string,
  _userId: string,
  _data: CreateSessionData,
): ApiSession {
  throw new Error('Not implemented');
}

export function updateSession(
  _db: Database.Database,
  _itemId: string,
  _sessionId: string,
  _userId: string,
  _data: UpdateSessionData,
): ApiSession {
  throw new Error('Not implemented');
}

export function deleteSession(
  _db: Database.Database,
  _itemId: string,
  _sessionId: string,
  _userId: string,
): void {
  throw new Error('Not implemented');
}

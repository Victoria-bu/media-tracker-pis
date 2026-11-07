import Database from 'better-sqlite3';
import { CreateSessionData, UpdateSessionData } from '../validators/sessionValidators';

export interface DbSession {
  id: string;
  item_id: string;
  date: string;
  rating: number | null;
  note: string | null;
}

export function getSessionById(_db: Database.Database, _id: string): DbSession | undefined {
  throw new Error('Not implemented');
}

export function getSessionsByItemId(_db: Database.Database, _itemId: string): DbSession[] {
  throw new Error('Not implemented');
}

export function createSession(
  _db: Database.Database,
  _id: string,
  _itemId: string,
  _data: CreateSessionData,
): DbSession {
  throw new Error('Not implemented');
}

export function updateSession(
  _db: Database.Database,
  _id: string,
  _data: UpdateSessionData,
): DbSession {
  throw new Error('Not implemented');
}

export function deleteSession(_db: Database.Database, _id: string): void {
  throw new Error('Not implemented');
}

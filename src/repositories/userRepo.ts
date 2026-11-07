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

export function findUserByEmail(_db: Database.Database, _email: string): DbUser | undefined {
  throw new Error('Not implemented');
}

export function findUserById(_db: Database.Database, _id: string): DbUser | undefined {
  throw new Error('Not implemented');
}

export function createUser(
  _db: Database.Database,
  _id: string,
  _email: string,
  _passwordHash: string,
  _nickname: string,
): DbUser {
  throw new Error('Not implemented');
}

export function updateUserNickname(
  _db: Database.Database,
  _id: string,
  _nickname: string,
): DbUser {
  throw new Error('Not implemented');
}

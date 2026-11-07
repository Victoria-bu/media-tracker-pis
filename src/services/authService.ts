import Database from 'better-sqlite3';
import { ApiUser } from '../repositories/userRepo';

export interface AppError extends Error {
  code: string;
  status: number;
  field?: string;
}

export async function register(
  _db: Database.Database,
  _email: string,
  _password: string,
  _nickname: string,
): Promise<ApiUser> {
  throw new Error('Not implemented');
}

export async function login(
  _db: Database.Database,
  _email: string,
  _password: string,
): Promise<ApiUser> {
  throw new Error('Not implemented');
}

export function updateNickname(
  _db: Database.Database,
  _userId: string,
  _nickname: string,
): ApiUser {
  throw new Error('Not implemented');
}

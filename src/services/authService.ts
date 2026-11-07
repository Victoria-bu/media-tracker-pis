import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import Database from 'better-sqlite3';
import * as userRepo from '../repositories/userRepo';
import { ApiUser } from '../repositories/userRepo';
import { ENV } from '../config/env';

export interface AppError extends Error {
  code: string;
  status: number;
  field?: string;
}

function makeError(code: string, message: string, status: number, field?: string): AppError {
  const err = new Error(message) as AppError;
  err.code = code;
  err.status = status;
  if (field) err.field = field;
  return err;
}

export async function register(
  db: Database.Database,
  email: string,
  password: string,
  nickname: string,
): Promise<ApiUser> {
  const existing = userRepo.findUserByEmail(db, email);
  if (existing) {
    throw makeError('EMAIL_TAKEN', 'Обліковий запис з цією адресою вже існує', 409, 'email');
  }
  const passwordHash = await bcrypt.hash(password, ENV.BCRYPT_ROUNDS);
  const id = uuidv4();
  const user = userRepo.createUser(db, id, email, passwordHash, nickname);
  return { id: user.id, email: user.email, nickname: user.nickname };
}

export async function login(
  db: Database.Database,
  email: string,
  password: string,
): Promise<ApiUser> {
  const user = userRepo.findUserByEmail(db, email);
  if (!user) throw makeError('INVALID_CREDENTIALS', 'Невірний email або пароль', 401);
  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) throw makeError('INVALID_CREDENTIALS', 'Невірний email або пароль', 401);
  return { id: user.id, email: user.email, nickname: user.nickname };
}

export function updateNickname(
  db: Database.Database,
  userId: string,
  nickname: string,
): ApiUser {
  const user = userRepo.updateUserNickname(db, userId, nickname);
  return { id: user.id, email: user.email, nickname: user.nickname };
}

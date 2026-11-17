import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import type Database from 'better-sqlite3';
import * as userRepo from '../repositories/userRepo';
import type { ApiUser } from '../repositories/userRepo';
import { ENV } from '../config/env';
import { makeError } from '../utils/errors';

export type { AppError } from '../utils/errors';

/**
 * Registers a new user account.
 * Password is hashed with bcrypt before storage; the plain-text password is never persisted.
 * @throws {AppError} 409 EMAIL_TAKEN if the email address is already registered.
 */
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

/**
 * Authenticates a user by email and password.
 * Returns a minimal user object; session management is the caller's responsibility.
 * @throws {AppError} 401 INVALID_CREDENTIALS if the email is not found or the password is wrong.
 *   Both cases return the same error code to prevent email enumeration.
 */
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

/**
 * Updates the display nickname for an authenticated user.
 * Email and password are not affected.
 */
export function updateNickname(
  db: Database.Database,
  userId: string,
  nickname: string,
): ApiUser {
  const user = userRepo.updateUserNickname(db, userId, nickname);
  return { id: user.id, email: user.email, nickname: user.nickname };
}

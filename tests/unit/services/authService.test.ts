/**
 * Unit tests — authService
 * REQ-NF-002 (AC-035): password never plain text, bcrypt hash
 * Uses mocked userRepo — no real DB.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as userRepo from '../../../src/repositories/userRepo';
import * as authService from '../../../src/services/authService';

vi.mock('../../../src/repositories/userRepo');

const mockUser = {
  id: 'user-uuid',
  email: 'test@example.com',
  nickname: 'TestUser',
  password_hash: '$2b$01$placeholder',
  created_at: '2026-11-01T00:00:00',
};

describe('authService.register  [REQ-F-001, NF-002]', () => {
  beforeEach(() => { vi.resetAllMocks(); });

  it('stores bcrypt hash — never plain-text password', async () => {
    vi.mocked(userRepo.findUserByEmail).mockReturnValue(undefined);
    vi.mocked(userRepo.createUser).mockReturnValue(mockUser);

    await authService.register({} as any, 'test@example.com', 'password123', 'TestUser');

    expect(userRepo.createUser).toHaveBeenCalledOnce();
    const [, , , passwordHash] = vi.mocked(userRepo.createUser).mock.calls[0];
    expect(passwordHash).not.toBe('password123');
    expect(passwordHash).toMatch(/^\$2[aby]\$/);
  });

  it('returns ApiUser without password_hash', async () => {
    vi.mocked(userRepo.findUserByEmail).mockReturnValue(undefined);
    vi.mocked(userRepo.createUser).mockReturnValue(mockUser);

    const result = await authService.register(
      {} as any, 'test@example.com', 'password123', 'TestUser',
    );

    expect(result).toEqual({ id: 'user-uuid', email: 'test@example.com', nickname: 'TestUser' });
    expect((result as any).password_hash).toBeUndefined();
  });

  it('throws EMAIL_TAKEN (409) when email already exists', async () => {
    vi.mocked(userRepo.findUserByEmail).mockReturnValue(mockUser);

    await expect(
      authService.register({} as any, 'test@example.com', 'pwd', 'User'),
    ).rejects.toMatchObject({ code: 'EMAIL_TAKEN', status: 409, field: 'email' });
  });
});

describe('authService.login  [REQ-F-002, NF-002]', () => {
  beforeEach(() => { vi.resetAllMocks(); });

  it('throws INVALID_CREDENTIALS (401) for unknown email', async () => {
    vi.mocked(userRepo.findUserByEmail).mockReturnValue(undefined);

    await expect(
      authService.login({} as any, 'nobody@example.com', 'password123'),
    ).rejects.toMatchObject({ code: 'INVALID_CREDENTIALS', status: 401 });
  });

  it('throws INVALID_CREDENTIALS (401) for wrong password', async () => {
    vi.mocked(userRepo.findUserByEmail).mockReturnValue({
      ...mockUser,
      password_hash: '$2b$01$invalidhashfortest',
    });

    await expect(
      authService.login({} as any, 'test@example.com', 'wrongpassword'),
    ).rejects.toMatchObject({ code: 'INVALID_CREDENTIALS', status: 401 });
  });
});
